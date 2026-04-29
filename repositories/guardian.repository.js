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

  async attachStudents(
    studentIds,
    guardianId,
    tenantId,
    { relationType, isPrimary, canPickup },
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
        },
      ],
    });
  }
}
