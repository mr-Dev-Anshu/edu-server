import { Op } from "sequelize";
import { Section } from "../../models/Academic/Section.js";
import { Class } from "../../models/Academic/Class.js";
import { AcademicYear } from "../../models/Academic/AcademicYear.js";
import { BaseRepository } from "../base.repository.js";

export class SectionRepository extends BaseRepository {
  constructor() {
    super(Section);
  }

  // 🔥 Duplicate check (based on UNIQUE INDEX)
  async findDuplicate(name, classId, academicYearId, tenantId) {
    return await this.model.findOne({
      where: {
        name,
        classId,
        academicYearId,
        tenantId,
      },
    });
  }

  // 🔍 Find sections by class
  async findByClass(classId, tenantId) {
    return await this.model.findAll({
      where: { classId, tenantId },
      order: [["name", "ASC"]],
    });
  }

  // 🔍 Find sections by academic year
  async findByAcademicYear(academicYearId, tenantId) {
    return await this.model.findAll({
      where: { academicYearId, tenantId },
      order: [["name", "ASC"]],
    });
  }

  // 📄 Pagination + filters
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
      order: [["name", "ASC"]],
      include: [
        {
          model: Class,
          as: "class",
          attributes: ["id", "name", "numericLevel"],
        },
        {
          model: AcademicYear,
          as: "academicYear", // ✅ FIXED alias
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

  // 🔗 Get single section with full details
  async findWithDetails(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        {
          model: Class,
          as: "class",
          attributes: ["id", "name", "numericLevel"],
        },
        {
          model: AcademicYear,
          as: "academicYear", // ✅ FIXED alias
          attributes: ["id", "name", "isCurrent"],
        },
      ],
    });
  }

  // 🔍 Search section by name
  async searchByName(keyword, tenantId) {
    return await this.model.findAll({
      where: {
        tenantId,
        name: {
          [Op.iLike]: `%${keyword}%`,
        },
      },
      order: [["name", "ASC"]],
    });
  }
}