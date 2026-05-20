import sequelize from "../config/db.js";
import { StudentGuardianMapRepository } from "../repositories/studentGuardianMap.repository.js";
import { GuardianRepository } from "../repositories/guardian.repository.js";
import { StudentRepository } from "../repositories/student.repository.js";
import { AppError } from "../utils/AppError.js";
import { GuardianService } from "./guardian.service.js";

const sgmRepo = new StudentGuardianMapRepository();
const guardianRepo = new GuardianRepository();
const studentRepo = new StudentRepository();
const guardianService = new GuardianService();

const buildMappingPayload = (guardian, includeDefaults = false) => {
  const payload = {};

  const relationType = normalizeRelationType(guardian);
  if (includeDefaults || guardian.relationType !== undefined || guardian.relation !== undefined) {
    payload.relationType = relationType;
  }

  if (includeDefaults || guardian.isPrimary !== undefined) {
    payload.isPrimary = guardian.isPrimary ?? false;
  }

  if (includeDefaults || guardian.canPickup !== undefined) {
    payload.canPickup = guardian.canPickup ?? true;
  }

  return payload;
};

const normalizeRelationType = (guardian) =>
  guardian.relationType ??
  (guardian.relation === "father" || guardian.relation === "mother" || guardian.relation === "guardian"
    ? guardian.relation
    : "other");

export class StudentGuardianMapService {
  async attachStudents(guardianId, tenantId, payload, options = {}) {
    const { studentIds, relationType, isPrimary, canPickup } = payload;

    if (!studentIds?.length) {
      throw new AppError("studentIds are required", 400);
    }

    const rows = studentIds.map((studentId) => ({
      studentId,
      guardianId,
      tenantId,
      relationType,
      isPrimary: isPrimary ?? false,
      canPickup: canPickup ?? true,
    }));

    return await sgmRepo.addMappings(rows, options);
  }

  // Sync the student's guardians list: add, update, remove as needed
  async syncStudentGuardians(studentId, tenantId, newGuardians = [], options = {}) {
    let transaction = options.transaction;
    let localTransaction = false;

    if (!transaction) {
      transaction = await sequelize.transaction();
      localTransaction = true;
    }

    try {
      // Ensure student exists
      await studentRepo.findById(studentId, tenantId, { transaction });

      const existingMappings = await sgmRepo.getStudentMappings(studentId, tenantId, { transaction });
      const existingGuardianIds = existingMappings.map((m) => m.guardianId);

      const incomingGuardianIds = [];

      for (const g of newGuardians) {
        let guardianId = g.id;

        if (guardianId) {
          // existing guardian -> update guardian fields if provided
          await guardianService.updateGuardian(guardianId, tenantId, g, { transaction });
        } else {
          // new guardian -> create or reuse by email
          const resolvedGuardian = await guardianService.resolveGuardian(
            tenantId,
            {
              email: g.email,
              password: g.password,
              firstName: g.firstName,
              lastName: g.lastName,
              relation: g.relation,
              relationType: g.relationType,
              phone: g.phone,
              occupation: g.occupation,
              isPrimaryContact: g.isPrimaryContact,
              requestedBy: options.requestedBy,
            },
            { transaction },
          );
          guardianId = resolvedGuardian.id;
        }

        incomingGuardianIds.push(guardianId);

        if (existingGuardianIds.includes(guardianId)) {
          const mappingPayload = buildMappingPayload(g);
          if (Object.keys(mappingPayload).length > 0) {
            await sgmRepo.updateMapping(studentId, guardianId, tenantId, mappingPayload, { transaction });
          }
        } else {
          const mappingPayload = buildMappingPayload(g, true);
          await sgmRepo.addMapping(studentId, guardianId, tenantId, mappingPayload, { transaction });
        }
      }

      // Remove mappings that are not present in incoming list
      const toRemove = existingGuardianIds.filter((id) => !incomingGuardianIds.includes(id));
      if (toRemove.length > 0) {
        for (const gid of toRemove) {
          await sgmRepo.removeMapping(studentId, gid, tenantId, { transaction });
        }

        // Delete orphaned guardians (if they are not attached to any other student)
        const orphaned = await guardianRepo.findOrphanedGuardians(toRemove, tenantId, { transaction });
        if (orphaned.length > 0) {
          await guardianRepo.deleteMultiple(orphaned, tenantId, { transaction });
        }
      }

      if (localTransaction) await transaction.commit();

      return await this.getStudentMappingsFormatted(studentId, tenantId, { transaction });
    } catch (error) {
      if (localTransaction && !transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  async removeGuardianFromStudent(studentId, guardianId, tenantId, options = {}) {
    const result = await sgmRepo.removeMapping(studentId, guardianId, tenantId, options);
    // If guardian now orphaned, delete
    const mappingCount = await guardianRepo.countStudentMappings(guardianId, tenantId);
    if (mappingCount === 0) {
      await guardianRepo.deleteMultiple([guardianId], tenantId, options);
    }
    return result;
  }

  async getStudentMappingsFormatted(studentId, tenantId, options = {}) {
    const guardians = await guardianRepo.findByStudentId(studentId, tenantId, options);
    if (!guardians.length) return [];

    return guardians.map((g) => {
      const guardianData = g.get ? g.get({ plain: true }) : g;
      return {
        id: guardianData.id,
        tenantId: guardianData.tenantId,
        userId: guardianData.userId,
        relation: guardianData.relation,
        phone: guardianData.phone,
        occupation: guardianData.occupation,
        isPrimaryContact: guardianData.isPrimaryContact,
        relationType: guardianData.studentMappings?.[0]?.relationType,
        isPrimary: guardianData.studentMappings?.[0]?.isPrimary,
        canPickup: guardianData.studentMappings?.[0]?.canPickup,
        firstName: guardianData.user?.firstName,
        lastName: guardianData.user?.lastName,
        email: guardianData.user?.email,
        createdAt: guardianData.createdAt,
        updatedAt: guardianData.updatedAt,
      };
    });
  }
}

export default StudentGuardianMapService;
