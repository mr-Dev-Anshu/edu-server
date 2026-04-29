import { Guardian } from "../models/index.js";
import {StudentGuardianMap} from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class GuardianRepository extends BaseRepository {
  constructor() {
    super(Guardian);
  }

  async findByPhone(phone, tenantId) {
    return await this.model.findOne({
      where: { phone, tenantId },
    });
  }

  async findByEmail(email, tenantId) {
    const normalizedEmail = email?.toLowerCase().trim();
    return await this.model.findOne({
      where: { tenantId },
      include: [
        {
          association: "user",
          where: { email: normalizedEmail },
          required: true,
          attributes: { exclude: ["password"] },
        },
      ],
    });
  }

  async attachStudents(
    studentIds,
    guardianId,
    tenantId,
    { relationType, isPrimary, canPickup },
    options = {},
  ) {
    if (!studentIds.length) {
      return [];
    }

    return await StudentGuardianMap.bulkCreate(
      studentIds.map((studentId) => ({
        studentId,
        guardianId,
        tenantId,
        relationType,
        canPickup,
        isPrimary,
      })),
      options,
    );
  }
  async findByStudentId(studentId, tenantId) {
    return await this.model.findAll({
      where: { tenantId },
      include: [
        {
          model: StudentGuardianMap,
          as: "studentMappings",
          where: { studentId, tenantId },
          required: true,
          attributes: ["relationType", "isPrimary", "canPickup"],
        },
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "email", "phone"],
        },
      ],
    });
  }
}
