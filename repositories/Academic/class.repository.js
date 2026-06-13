import { Op } from "sequelize";
import "../../models/index.js";
import {Class, Section, AcademicYear, User} from "../../models/index.js";
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

    const { search, ...restFilters } = filters;
    const keyword = String(search ?? "").trim();

    const where = {
      tenantId,
      ...restFilters,
    };

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
        ...(Number.isInteger(Number(keyword)) ? [{ numericLevel: Number(keyword) }] : []),
      ];
    }

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
          include: [
            {
              model: AcademicYear,
              as: "academicYear",
              attributes: ["id", "name", "startDate", "endDate", "isCurrent", "isLocked"],
            },
            {
              model: User,
              as: "classTeacher",
              attributes: ["id", "firstName", "lastName", "email", "phone", "status"],
              required: false,
            },
          ],
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

  // ===== NEW METHOD: Get classes with sections filtered by academic year + search + pagination =====
  async findWithSectionsFiltered(tenantId, options = {}) {
    const {
      search = "",
      academicYearId = null,
      page = 1,
      limit = 10,
      numericLevelSearch = null,
    } = options;

    const offset = (page - 1) * limit;

    // Base where clause for classes
    const classWhere = { tenantId };

    // Build search condition for classes
    if (search || numericLevelSearch) {
      const searchConditions = [];

      if (search) {
        searchConditions.push(
          { name: { [Op.iLike]: `%${search.trim()}%` } },
          { description: { [Op.iLike]: `%${search.trim()}%` } },
          // If search term is numeric, also try numericLevel
          ...(Number.isInteger(Number(search.trim()))
            ? [{ numericLevel: Number(search.trim()) }]
            : [])
        );
      }

      if (numericLevelSearch !== null && Number.isInteger(numericLevelSearch)) {
        searchConditions.push({ numericLevel: numericLevelSearch });
      }

      if (searchConditions.length > 0) {
        classWhere[Op.or] = searchConditions;
      }
    }

    // Section filter where clause
    const sectionWhere = { tenantId };
    if (academicYearId) {
      sectionWhere.academicYearId = academicYearId;
    }

    // Query: Get classes matching filters, with their sections for the specified academic year
    const { count, rows } = await this.model.findAndCountAll({
      where: classWhere,
      include: [
        {
          model: Section,
          as: "sections",
          attributes: ["id", "name", "capacity", "classTeacherId", "academicYearId", "tenantId", "createdAt", "updatedAt"],
          where: sectionWhere,
          required: false, // LEFT JOIN - keep classes even if they have no sections for this year
          separate: true, // Fetch sections separately to avoid pagination issues
          include: [
            {
              model: AcademicYear,
              as: "academicYear",
              attributes: ["id", "name", "startDate", "endDate", "isCurrent", "isLocked"],
            },
            {
              model: User,
              as: "classTeacher",
              attributes: ["id", "firstName", "lastName", "email", "phone", "status"],
              required: false,
            },
          ],
        },
      ],
      offset,
      limit,
      distinct: true, // Count distinct classes, not rows
      order: [["numericLevel", "ASC"]],
      subQuery: false, // Avoid nested select issues
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