import { Op } from "sequelize";
import { GradeScaleRule } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";

export class GradeScaleRuleRepository extends BaseRepository {
  constructor() {
    super(GradeScaleRule);
  }

  async createMany(records, options = {}) {
    const opts = { ...(options || {}), returning: true };
    return await this.model.bulkCreate(records, opts);
  }

  async findByGradeScale(gradeScaleId, tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    return await this.model.findAll({
      where: { gradeScaleId, tenantId },
      order: [["minPercentage", "ASC"]],
      ...queryOptions,
    });
  }

  async findOverlappingRule(
    gradeScaleId,
    minPercentage,
    maxPercentage,
    tenantId,
    excludeId = null,
    options = {}
  ) {
    const where = {
      gradeScaleId,
      tenantId,
      [Op.or]: [
        {
          minPercentage: { [Op.lt]: maxPercentage },
          maxPercentage: { [Op.gt]: minPercentage },
        },
      ],
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return await this.model.findOne({ where, ...options });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      order: [["minPercentage", "ASC"]],
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  async findOverlappingRules(gradeScaleId, normalizedRules, tenantId, options = {}) {
    const conditions = normalizedRules.map((r) => ({
      minPercentage: { [Op.lt]: r.max },
      maxPercentage: { [Op.gt]: r.min },
    }));

    return await this.model.findAll({
      where: {
        gradeScaleId,
        tenantId,
        [Op.or]: conditions,
      },
      ...options,
    });
  }

  async updateMany(updates, tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    const results = [];

    for (const item of updates) {
      const [count, rows] = await this.model.update(item.data, {
        where: { id: item.id, tenantId },
        returning: true,
        ...queryOptions,
      });

      if (count > 0 && rows) results.push(rows[0]);
    }

    return results;
  }

  async deleteMany(ids, tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    return await this.model.destroy({
      where: { id: { [Op.in]: ids }, tenantId },
      ...queryOptions,
    });
  }
}