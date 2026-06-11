import sequelize from "../../config/db.js";
import { GradeScale, GradeScaleRule } from "../../models/index.js";

import { BaseRepository } from "../base.repository.js";
import { AppError } from "../../utils/AppError.js";

export class GradeScaleRepository extends BaseRepository {
  constructor() {
    super(GradeScale);
  }

  async findByName(name, tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    return await this.model.findOne({ where: { name, tenantId }, ...queryOptions });
  }

  async findDefault(tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    return await this.model.findOne({ where: { tenantId, isDefault: true }, ...queryOptions });
  }

  async setDefault(id, tenantId, options = {}) {
    const queryOptions = Array.isArray(options) ? { include: options } : options;
    const transaction = queryOptions.transaction;

    if (transaction) {
      await this.model.update(
        { isDefault: false },
        { where: { tenantId, isDefault: true }, transaction }
      );

      const [updatedCount] = await this.model.update(
        { isDefault: true },
        { where: { id, tenantId }, transaction }
      );

      if (updatedCount === 0) {
        throw new AppError("Grade scale could not be set as default", 500);
      }

      return updatedCount;
    }

    return await sequelize.transaction(async (localTransaction) => {
      await this.model.update(
        { isDefault: false },
        { where: { tenantId, isDefault: true }, transaction: localTransaction }
      );

      const [updatedCount] = await this.model.update(
        { isDefault: true },
        { where: { id, tenantId }, transaction: localTransaction }
      );

      if (updatedCount === 0) {
        throw new AppError("Grade scale could not be set as default", 500);
      }

      return updatedCount;
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const where = { tenantId, ...filters };

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const data = rows;

    if (data && data.length) {
      const ids = data.map((r) => r.id);
      const rules = await GradeScaleRule.findAll({
        where: { gradeScaleId: ids, tenantId },
        order: [["minPercentage", "ASC"]],
      });

      const rulesByScale = rules.reduce((acc, r) => {
        const key = String(r.gradeScaleId);
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
      }, {});

      // attach to each row
      for (const row of data) {
        const key = String(row.id);
        // attach as plain array of rule instances (calling get not required here)
        row.dataValues = row.dataValues || {};
        row.dataValues.gradeScaleRules = rulesByScale[key] || [];
      }
    }

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data,
    };
  }
}