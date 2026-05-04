import { Op } from "sequelize";
import { GradeScaleRule } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";

export class GradeScaleRuleRepository extends BaseRepository {
  constructor() {
    super(GradeScaleRule);
  }

  async findByGradeScale(gradeScaleId, tenantId) {
    return await this.model.findAll({
      where: { gradeScaleId, tenantId },
      order: [["minPercentage", "ASC"]],
    });
  }

  async findOverlappingRule(gradeScaleId, minPercentage, maxPercentage, tenantId, excludeId = null) {
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
    return await this.model.findOne({ where });
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
}