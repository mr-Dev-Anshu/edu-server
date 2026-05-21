import sequelize from "../../config/db.js";
import { GradeScale, GradeScaleRule } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";
import { AppError } from "../../utils/AppError.js";

const gradeScaleIncludes = [
  {
    model: GradeScaleRule,
    as: "rules",
    attributes: ["id", "gradeLabel", "minPercentage", "maxPercentage", "gradePoint"],
    order: [["minPercentage", "ASC"]],
  },
];

export class GradeScaleRepository extends BaseRepository {
  constructor() {
    super(GradeScale);
  }

  async findByName(name, tenantId) {
    return await this.model.findOne({ where: { name, tenantId } });
  }

  async findDefault(tenantId) {
    return await this.model.findOne({
      where: { tenantId, isDefault: true },
      include: gradeScaleIncludes,
    });
  }

  async findByIdPopulated(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: gradeScaleIncludes,
    });
  }

  async setDefault(id, tenantId) {
    return await sequelize.transaction(async (transaction) => {
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
      include: gradeScaleIncludes,
      distinct: true,
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