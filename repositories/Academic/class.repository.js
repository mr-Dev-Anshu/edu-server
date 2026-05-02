import { Op } from "sequelize";
import "../../models/index.js";
import {Class, Section} from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";


export class ClassRepository extends BaseRepository {
  constructor() {
    super(Class);
  }

  // Find class by name (for duplicate check among active records only) - case-insensitive
  async findByName(name, tenantId) {
    return await this.model.findOne({
      where: { 
        tenantId,
        name: {
          [Op.iLike]: name.trim(),
        },
      },
    });
  }

  // Find by numeric level (e.g., Class 1, 2, 3...)
  async findByNumericLevel(numericLevel, tenantId) {
    return await this.model.findAll({
      where: { numericLevel, tenantId },
      order: [["numericLevel", "ASC"]],
    });
  }

  // Pagination + Filters
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
      order: [["numericLevel", "ASC"]],
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  // Get classes with sections (relation include)
  async findWithSections(tenantId) {
    return await this.model.findAll({
      where: { tenantId },
      include: [
        {
          model: Section,
          as: "sections",
        },
      ],
      order: [["numericLevel", "ASC"]],
    });
  }

  // Search by name
  async searchByName(keyword, tenantId) {
    return await this.model.findAll({
      where: {
        tenantId,
        name: {
          [Op.iLike]: `%${keyword}%`,
        },
      },
      order: [["numericLevel", "ASC"]],
    });
  }
}