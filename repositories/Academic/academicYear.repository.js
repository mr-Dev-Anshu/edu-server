import { Op } from "sequelize";
import { AcademicYear } from "../../models/index.js";
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
    const where = { tenantId, ...filters };

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
    // Remove current flag from all years for this tenant
    await this.model.update(
      { isCurrent: false },
      { where: { tenantId, isCurrent: true } }
    );

    // Set new current year
    return await this.model.update(
      { isCurrent: true },
      { where: { id: newCurrentId, tenantId } }
    );
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
