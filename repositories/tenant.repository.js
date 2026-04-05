import { Op, QueryTypes } from "sequelize";
import sequelize from "../config/db.js";
import Tenant from "../models/Tenant.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import TenantProvisioningStep from "../models/TenantProvisioningStep.js";
import { AppError } from "../utils/AppError.js";
import { BaseRepository } from "./base.repository.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TenantRepository extends BaseRepository {
  constructor() {
    super(Tenant);
  }

  async findById(id, options = {}) {
    const tenant = await this.model.findByPk(id, options);
    if (!tenant) throw new AppError("Organization not found", 404);
    return tenant;
  }

  async findByOfficialEmail(officialEmail) {
    return await this.model.findOne({ where: { officialEmail } });
  }

  async findBySubdomain(subdomain) {
    return await this.model.findOne({ where: { subdomain } });
  }

  async findPlan(planIdentifier) {
    const normalizedPlanIdentifier = String(planIdentifier).trim();

    if (!normalizedPlanIdentifier) {
      return null;
    }

    if (UUID_REGEX.test(normalizedPlanIdentifier)) {
      return await Plan.findOne({
        where: {
          [Op.or]: [{ id: normalizedPlanIdentifier }, { slug: normalizedPlanIdentifier }],
        },
      });
    }

    return await Plan.findOne({
      where: {
        slug: normalizedPlanIdentifier,
      },
    });
  }

  async createSubscription(payload, options = {}) {
    return await Subscription.create(payload, options);
  }

  async findLatestSubscription(tenantId) {
    return await Subscription.findOne({
      where: { tenantId },
      order: [["createdAt", "DESC"]],
    });
  }

  async findPlanById(planId) {
    return await Plan.findByPk(planId);
  }

  async createProvisioningSteps(stepPayloads, options = {}) {
    return await TenantProvisioningStep.bulkCreate(stepPayloads, options);
  }

  async findProvisioningSteps(tenantId) {
    return await TenantProvisioningStep.findAll({
      where: { tenantId },
      order: [["createdAt", "ASC"]],
    });
  }

  async findProvisioningStep(tenantId, stepKey) {
    return await TenantProvisioningStep.findOne({ where: { tenantId, stepKey } });
  }

  async upsertProvisioningStep(stepPayload) {
    return await TenantProvisioningStep.upsert(stepPayload);
  }

  async updateProvisioningStep(tenantId, stepKey, changes) {
    const step = await this.findProvisioningStep(tenantId, stepKey);
    if (!step) throw new AppError(`Provisioning step ${stepKey} not found`, 404);
    return await step.update(changes);
  }

  async tableExists(tableName) {
    const [result] = await sequelize.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = :tableName
        ) AS "exists"
      `,
      {
        replacements: { tableName },
        type: QueryTypes.SELECT,
      }
    );

    return Boolean(result?.exists);
  }

  async tableHasColumn(tableName, columnName) {
    const [result] = await sequelize.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = :tableName
            AND column_name = :columnName
        ) AS "exists"
      `,
      {
        replacements: { tableName, columnName },
        type: QueryTypes.SELECT,
      }
    );

    return Boolean(result?.exists);
  }

  async listWithMetrics(filters = {}) {
    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 20);
    const offset = (page - 1) * limit;

    const hasSubscriptions =
      (await this.tableExists("subscriptions")) &&
      (await this.tableHasColumn("subscriptions", "tenant_id")) &&
      (await this.tableHasColumn("subscriptions", "plan_id"));
    const hasPlans = await this.tableExists("plans");
    const hasStudents =
      (await this.tableExists("students")) &&
      (await this.tableHasColumn("students", "tenant_id"));
    const hasUsers =
      (await this.tableExists("users")) &&
      (await this.tableHasColumn("users", "tenant_id")) &&
      (await this.tableHasColumn("users", "last_login_at"));

    const whereClauses = ["t.deleted_at IS NULL"];
    const replacements = { limit, offset };

    if (filters.id) {
      whereClauses.push("t.id = :tenantId");
      replacements.tenantId = filters.id;
    }

    if (filters.status) {
      whereClauses.push("t.status = :status");
      replacements.status = filters.status;
    }

    if (filters.organizationType) {
      whereClauses.push("t.organization_type = :organizationType");
      replacements.organizationType = filters.organizationType;
    }

    if (filters.search) {
      whereClauses.push("(t.name ILIKE :search OR t.subdomain ILIKE :search OR t.official_email ILIKE :search)");
      replacements.search = `%${filters.search}%`;
    }

    const planJoins =
      hasSubscriptions && hasPlans
        ? `
          LEFT JOIN LATERAL (
            SELECT s.plan_id
            FROM subscriptions s
            WHERE s.tenant_id = t.id AND s.deleted_at IS NULL
            ORDER BY
              CASE
                WHEN s.status IN ('active', 'trialing', 'past_due') THEN 0
                ELSE 1
              END,
              s.created_at DESC
            LIMIT 1
          ) latest_subscription ON TRUE
          LEFT JOIN plans p ON p.id = latest_subscription.plan_id
        `
        : "";

    if (filters.plan && hasSubscriptions && hasPlans) {
      const normalizedPlanIdentifier = String(filters.plan).trim();
      replacements.planIdentifier = normalizedPlanIdentifier;

      if (UUID_REGEX.test(normalizedPlanIdentifier)) {
        whereClauses.push("(p.id = CAST(:planIdentifier AS UUID) OR p.slug = :planIdentifier)");
      } else {
        whereClauses.push("p.slug = :planIdentifier");
      }
    }

    const studentMetricsJoin = hasStudents
      ? `
        LEFT JOIN (
          SELECT tenant_id, COUNT(*)::int AS student_count
          FROM students
          WHERE deleted_at IS NULL
          GROUP BY tenant_id
        ) student_counts ON student_counts.tenant_id = t.id
      `
      : "";

    const lastActiveJoin = hasUsers
      ? `
        LEFT JOIN (
          SELECT tenant_id, MAX(last_login_at) AS last_active_date
          FROM users
          WHERE deleted_at IS NULL
          GROUP BY tenant_id
        ) user_activity ON user_activity.tenant_id = t.id
      `
      : "";

    const rows = await sequelize.query(
      `
        SELECT
          t.id,
          t.name,
          t.organization_type AS "organizationType",
          t.official_email AS "officialEmail",
          t.subdomain,
          t.portal_url AS "portalUrl",
          t.status,
          ${hasSubscriptions && hasPlans ? `p.id AS "planId", p.name AS "planName", p.slug AS "planSlug",` : `NULL AS "planId", NULL AS "planName", NULL AS "planSlug",`}
          ${hasStudents ? `COALESCE(student_counts.student_count, 0)` : `0`} AS "studentCount",
          ${hasUsers ? `user_activity.last_active_date` : `NULL`} AS "lastActiveDate",
          COUNT(*) OVER()::int AS "totalCount"
        FROM tenants t
        ${planJoins}
        ${studentMetricsJoin}
        ${lastActiveJoin}
        WHERE ${whereClauses.join(" AND ")}
        ORDER BY t.created_at DESC
        LIMIT :limit OFFSET :offset
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    );

    const total = rows[0]?.totalCount || 0;

    return {
      data: rows.map(({ totalCount, ...row }) => row),
      meta: {
        page,
        limit,
        total,
        totalPages: total ? Math.ceil(total / limit) : 0,
      },
    };
  }
}
