import { Op } from "sequelize";
import {
  StudentSectionEnrollment,
  Student,
  Section,
  AcademicYear
} from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class StudentSectionEnrollmentRepository extends BaseRepository {
  constructor() {
    super(StudentSectionEnrollment);
  }

  // Check existing enrollment (UNIQUE RULE)
  async findByStudentAndYear(studentId, academicYearId, tenantId) {
    return await this.model.findOne({
      where: {
        studentId,
        academicYearId,
        tenantId,
      },
    });
  }

  // Find by student
  async findByStudent(studentId, tenantId) {
    return await this.model.findAll({
      where: { studentId, tenantId },
      order: [["createdAt", "DESC"]],
    });
  }

  // Find by section
  async findBySection(sectionId, tenantId) {
    return await this.model.findAll({
      where: { sectionId, tenantId },
    });
  }

  async countBySection(sectionId, tenantId) {
    return await this.model.count({
      where: { sectionId, tenantId },
    });
  }

  // Used by class/section listing endpoints to avoid N+1 enrollment count queries.
  async countBySectionIds(tenantId, sectionIds = [], academicYearId = null) {
    const uniqueSectionIds = [...new Set(sectionIds.filter(Boolean))];

    if (uniqueSectionIds.length === 0) {
      return [];
    }

    const where = {
      tenantId,
      sectionId: { [Op.in]: uniqueSectionIds },
    };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const rows = await this.model.findAll({
      attributes: [
        "sectionId",
        [this.model.sequelize.fn("COUNT", this.model.sequelize.col("id")), "count"],
      ],
      where,
      group: ["sectionId"],
      raw: true,
    });

    return rows.map((row) => ({
      sectionId: row.sectionId,
      count: Number(row.count) || 0,
    }));
  }

  // Pagination + relations
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
      include: [
        {
          model: Student,
          as: "student",
        },
        {
          model: Section,
          as: "section",
        },
        {
          model: AcademicYear,
          as: "academicYear",
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

  // Get single enrollment with details
  async findWithDetails(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        {
          model: Student,
          as: "student",
        },
        {
          model: Section,
          as: "section",
        },
        {
          model: AcademicYear,
          as: "academicYear",
        },
      ],
    });
  }
}