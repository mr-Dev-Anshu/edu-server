import { Op } from "sequelize";
import { Student, User, StudentSectionEnrollment, Tenant, Section, AcademicYear, Class, Guardian, StudentGuardianMap } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class StudentRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  async findByUserId(userId, tenantId) {
    return await this.model.findOne({
      where: { userId, tenantId },
    });
  }

  async findByAdmissionNumber(admissionNumber, tenantId) {
    return await this.model.findOne({
      where: { admissionNumber, tenantId },
    });
  }

  async findWithPagination(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const where = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.admissionNumber) {
      where.admissionNumber = filters.admissionNumber;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.name) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.name}%` } },
        { middleName: { [Op.iLike]: `%${filters.name}%` } },
        { lastName: { [Op.iLike]: `%${filters.name}%` } },
      ];
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      distinct: true,
      order: [["createdAt", "DESC"]],
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
        {
          model: Student,
          as: "sibling",
          attributes: ["id", "firstName", "lastName", "rollNumber"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName", "email", "phone"],
            },
          ],
        },
        {
          model: Guardian,
          as: "guardians",
          attributes: ["id", "userId", "relation", "phone", "occupation", "isPrimaryContact"],
          through: { attributes: ["id", "relationType", "isPrimary", "canPickup"] },
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName", "email", "phone"],
            },
          ],
        },
        {
          model: StudentSectionEnrollment,
          as: "enrollments",
          separate: true,
          order: [["isCurrent", "DESC"], ["createdAt", "DESC"]],
          attributes: ["id", "sectionId", "academicYearId", "rollNumber", "enrollmentStatus", "isCurrent", "createdAt"],
          include: [
            {
              model: Section,
              as: "section",
              attributes: ["id", "name", "capacity"],
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
              attributes: ["id", "name", "isCurrent"],
            },
          ],
        },
        {
          association: "guardians",
          through: { attributes: ["relationType", "isPrimary", "canPickup"] },
          attributes: ["id", "tenantId", "userId", "relation", "phone", "occupation", "isPrimaryContact", "createdAt", "updatedAt"],
          include: [
            {
              association: "user",
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
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

  async findWithDetails(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
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
        {
          model: Student,
          as: "sibling",
          attributes: ["id", "firstName", "lastName", "rollNumber"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName", "email", "phone"],
            },
          ],
        },
        {
          model: StudentSectionEnrollment,
          as: "enrollments",
          separate: true,
          order: [["isCurrent", "DESC"], ["createdAt", "DESC"]],
          attributes: ["id", "sectionId", "academicYearId", "rollNumber", "enrollmentStatus", "isCurrent", "createdAt"],
          include: [
            {
              model: Section,
              as: "section",
              attributes: ["id", "name", "capacity"],
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
              attributes: ["id", "name", "isCurrent"],
            },
          ],
        },
        {
          association: "guardians",
          through: { attributes: ["relationType", "isPrimary", "canPickup"] },
          attributes: ["id", "tenantId", "userId", "relation", "phone", "occupation", "isPrimaryContact", "createdAt", "updatedAt"],
          include: [
            {
              association: "user",
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
        },
      ],
    });
  }
}