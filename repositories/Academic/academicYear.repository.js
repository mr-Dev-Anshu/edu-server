import { Op } from "sequelize";
import { sequelize, AcademicYear } from "../../models/index.js";
import { AppError } from "../../utils/AppError.js";
import { BaseRepository } from "../base.repository.js";

export class AcademicYearRepository extends BaseRepository {
  constructor() {
    super(AcademicYear);
  }

  async findByName(name, tenantId) {
    return await this.model.findOne({ where: { name, tenantId } });
  }

  async findCurrentYear(tenantId) {
    return await this.model.findOne({
      where: { tenantId, isCurrent: true },
    });
  }

  async findYearsByDateRange(startDate, endDate, tenantId) {
    return await this.model.findAll({
      where: {
        tenantId,
        [Op.and]: [
          { startDate: { [Op.lte]: endDate } },
          { endDate: { [Op.gte]: startDate } },
        ],
      },
      order: [["startDate", "ASC"]],
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { search, ...restFilters } = filters;
    const keyword = String(search ?? "").trim();

    const where = { tenantId, ...restFilters };

    if (keyword) {
      where.name = { [Op.iLike]: `%${keyword}%` };
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      order: [["startDate", "DESC"]],
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  async updateCurrentYear(newCurrentId, tenantId) {
    return await sequelize.transaction(async (transaction) => {
      await this.model.update(
        { isCurrent: false },
        {
          where: { tenantId, isCurrent: true },
          transaction,
        }
      );

      const [updatedCount] = await this.model.update(
        { isCurrent: true },
        {
          where: { id: newCurrentId, tenantId },
          transaction,
        }
      );

      if (updatedCount === 0) {
        throw new AppError("Academic year could not be set as current", 500);
      }

      return updatedCount;
    });
  }

  async lockYear(id, tenantId) {
    return await this.model.update(
      { isLocked: true },
      { where: { id, tenantId } }
    );
  }

  async unlockYear(id, tenantId) {
    return await this.model.update(
      { isLocked: false },
      { where: { id, tenantId } }
    );
  }
}
