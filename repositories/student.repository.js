import { Op } from "sequelize";
import { Student, User, StudentSectionEnrollment, Tenant, Section, AcademicYear, Class, Guardian, StudentGuardianMap } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

// Common includes used for fetching full student details
const STUDENT_DETAILS_INCLUDES = [
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
];

export class StudentRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  // Helper: Build name search clause
  buildNameSearchClause(searchTerm) {
    return [
      { firstName: { [Op.iLike]: `%${searchTerm}%` } },
      { middleName: { [Op.iLike]: `%${searchTerm}%` } },
      { lastName: { [Op.iLike]: `%${searchTerm}%` } },
    ];
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
      where[Op.or] = this.buildNameSearchClause(filters.name);
    }

      const { count, rows } = await this.model.findAndCountAll({
        where,
        offset,
        limit,
        distinct: true,
        order: [["createdAt", "DESC"]],
        include: STUDENT_DETAILS_INCLUDES,
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
        include: STUDENT_DETAILS_INCLUDES,
    });
  }

  // Get Students NOT assigned to any section
  async findUnassignedStudents(tenantId, filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const where = { tenantId };
    const include = STUDENT_DETAILS_INCLUDES.map((item) => ({
      ...item,
      required: false,
    }));

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.name) {
      where[Op.or] = this.buildNameSearchClause(filters.name);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      const searchClause = [
        ...this.buildNameSearchClause(filters.search),
        { admissionNumber: { [Op.iLike]: searchTerm } },
        { "$user.email$": { [Op.iLike]: searchTerm } },
      ];

      where[Op.or] = where[Op.or] ? [...where[Op.or], ...searchClause] : searchClause;
    }

    const { count, rows } = await this.model.findAndCountAll({
      where,
      offset,
      limit,
      distinct: true,
      order: [["createdAt", "DESC"]],
      include,
      subQuery: false,
    });

    // Filter students who have NO current enrollment (unassigned)
    const unassignedStudents = rows.filter((student) => {
      const enrollments = student.enrollments || [];
      return !enrollments.some(e => e.isCurrent === true);
    });

    return {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      data: unassignedStudents,
    };
  }
}