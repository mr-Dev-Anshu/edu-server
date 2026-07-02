import { Op } from "sequelize";
import { Announcement } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class AnnouncementRepository extends BaseRepository {
  constructor() {
    super(Announcement);
  }

  async findByIdWithRelations(id, tenantId) {
    return await this.findById(id, tenantId);
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const where = {
      tenantId,
      ...filters,
    };

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
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  async searchByTitle(tenantId, title, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await this.model.findAndCountAll({
      where: {
        tenantId,
        title: {
          [Op.iLike]: `%${title}%`,
        },
      },
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  async findActiveAnnouncements(tenantId) {
    return await this.model.findAll({
      where: {
        tenantId,
        isActive: true,
      },
      order: [["createdAt", "DESC"]],
    });
  }

  async findByPriority(priority, tenantId) {
    return await this.model.findAll({
      where: {
        tenantId,
        priority,
      },
      order: [["createdAt", "DESC"]],
    });
  }
}
