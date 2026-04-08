import { GuardianRepository } from "../repositories/guardian.repository.js";
import { BaseService } from "./base.service.js";
import { AppError } from "../utils/AppError.js";

const guardianRepo = new GuardianRepository();

export class GuardianService extends BaseService {
  constructor() {
    super(guardianRepo);
  }

  async attachStudents(guardianId, tenantId, payload) {
    const { studentIds, relationType, isPrimary, canPickup } = payload;
    if (!studentIds?.length) throw new AppError("studentIds are required", 400);

    return await guardianRepo.attachStudents(
      studentIds,
      guardianId,
      tenantId,
      {
        relationType,
        isPrimary: isPrimary ?? false,
        canPickup: canPickup ?? true,
      }
    );
  }

  async getByStudent(studentId, tenantId) {
    const guardians = await guardianRepo.findByStudentId(studentId, tenantId);
    if (!guardians.length) throw new AppError("No guardians found for this student", 404);
    return guardians;
  }
}