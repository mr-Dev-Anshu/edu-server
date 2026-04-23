import { FeeHead } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";
import { Op } from "sequelize";

export class FeeHeadRepository extends BaseRepository {
  constructor() {
    super(FeeHead);
  }

  async findByName(name, tenantId) {
    return await this.model.findOne({ where: { name: name.trim(), tenantId } });
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

    return {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  }

  async search(tenantId, searchTerm) {
    return await this.model.findAll({
      where: {
        tenantId,
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      order: [["createdAt", "DESC"]],
    });
  }
}
