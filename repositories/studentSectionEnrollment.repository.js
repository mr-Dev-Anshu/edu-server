import { Op } from "sequelize";
import {
  StudentSectionEnrollment,
  Student,
  Section,
  AcademicYear,
  User,
  Class,
  Tenant
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
          attributes: ["id", "admissionNumber", "firstName", "middleName", "lastName", "userId"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName", "email", "phone"],
            },
          ],
        },
        {
          model: Section,
          as: "section",
          attributes: ["id", "name", "capacity", "classId", "academicYearId"],
          include: [
            {
              model: Class,
              as: "class",
              attributes: ["id", "name", "numericLevel"],
            },
          ],
        },
        {
          model: AcademicYear,
          as: "academicYear",
          attributes: ["id", "name", "isCurrent", "startDate", "endDate"],
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
          attributes: ["id", "admissionNumber", "firstName", "middleName", "lastName", "userId", "tenantId"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName", "email", "phone", "status"],
            },
            {
              model: Tenant,
              as: "organization",
              attributes: ["id", "name", "organizationType", "officialEmail", "subdomain"],
            },
          ],
        },
        {
          model: Section,
          as: "section",
          attributes: ["id", "name", "capacity", "classId", "academicYearId"],
          include: [
            {
              model: Class,
              as: "class",
              attributes: ["id", "name", "numericLevel"],
            },
          ],
        },
        {
          model: AcademicYear,
          as: "academicYear",
          attributes: ["id", "name", "isCurrent", "startDate", "endDate"],
        },
      ],
    });
  }
}