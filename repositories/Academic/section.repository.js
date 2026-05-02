import { Op } from "sequelize";
import { AcademicYear, Class, Section } from "../../models/index.js";
import { BaseRepository } from "../base.repository.js";

export class SectionRepository extends BaseRepository {
  constructor() {
    super(Section);
  }

  // Duplicate check (active records only, case-insensitive)
  async findDuplicate(name, classId, academicYearId, tenantId) {
    return await this.model.findOne({
      where: {
        name: {
          [Op.iLike]: name.trim(),
        },
        classId,
        academicYearId,
        tenantId,
        deletedAt: null,
      },
    });
  }

  // Find sections by class
  async findByClass(classId, tenantId) {
    return await this.model.findAll({
      where: { classId, tenantId, deletedAt: null },
      order: [["name", "ASC"]],
    });
  }

  // Find sections by academic year
  async findByAcademicYear(academicYearId, tenantId) {
    return await this.model.findAll({
      where: { academicYearId, tenantId, deletedAt: null },
      order: [["name", "ASC"]],
    });
  }

  // Pagination + filters
  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...filters,
    };

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      order: [["name", "ASC"]],
      include: [
        {
          model: Class,
          as: "class",
          attributes: ["id", "name", "numericLevel"],
        },
        {
          model: AcademicYear,
          as: "academicYear",
          attributes: ["id", "name", "isCurrent"],
        },
      ],
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: rows,
    };
  }

  // Get single section with full details
  async findWithDetails(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId, deletedAt: null },
      include: [
        {
          model: Class,
          as: "class",
          attributes: ["id", "name", "numericLevel"],
        },
        {
          model: AcademicYear,
          as: "academicYear",
          attributes: ["id", "name", "isCurrent"],
        },
      ],
    });
  }

  // Search section by name
  async searchByName(keyword, tenantId) {
    return await this.model.findAll({
      where: {
        tenantId,
        deletedAt: null,
        name: {
          [Op.iLike]: `%${keyword}%`,
        },
      },
      order: [["name", "ASC"]],
    });
  }
}