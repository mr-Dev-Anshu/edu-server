import { Op } from "sequelize";
import { Student, User, StudentSectionEnrollment } from "../models/index.js";
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
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
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
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: StudentSectionEnrollment,
          attributes: ["id", "sectionId", "academicYearId", "rollNumber", "enrollmentStatus", "isCurrent", "createdAt"],
        },
      ],
    });
  }
}