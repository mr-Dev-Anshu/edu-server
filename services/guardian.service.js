import { GuardianRepository } from "../repositories/guardian.repository.js";
import { BaseService } from "./base.service.js";
import { AppError } from "../utils/AppError.js";
import { UserService } from "./user.service.js";
import { UserRoleService } from "./user-role.service.js";
import { RoleService } from "./role.service.js";
import sequelize from "../config/db.js";

const guardianRepo = new GuardianRepository();
const userService = new UserService();
const userRoleService = new UserRoleService();
const roleService = new RoleService();

export class GuardianService extends BaseService {
  constructor() {
    super(guardianRepo);
  }
 
  async createGuardian(tenantId, payload){
    const {
      email, password, firstName, lastName,
      relation,phone,occupation,isPrimaryContact
    } = payload

   const existingGuardian = await guardianRepo.findByPhone(
      phone,
      tenantId,
    );
    if (existingGuardian) {
      throw new AppError("Guardian already exists", 400);
    }

    const transaction = await sequelize.transaction();
    try {
          const user = await userService.createUser(
            {
              email,
              password,
              firstName,
              lastName,
              tenantId,
              status: "active",
              emailVerified: true,
            },
            { transaction },
          );
    
          const roles = await roleService.getAllRoles(tenantId, {
            slug: "student",
          });
          const guardianRole = roles[0];
    
          if (!guardianRole) {
            throw new AppError(
              "Guardian (Portal) role not found for this tenant",
              404,
            );
          }
           await userRoleService.assignRoleToUser(
        {
          userId: user.id,
          roleId: guardianRole.id,
          tenantId,
          assignedById: requestedBy,
        },
        { transaction },
      );

      const guardian = await guardianRepo.create(
        {
          ...payload,
          tenantId,
          userId: user.id,
          admissionNumber: admissionNumber.trim(),
        },
        { transaction },
      );

      await transaction.commit();
      return this.formatGuardianResponse(guardian);
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
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

  formatGuardianResponse(guardian){
    return {
      id: guardian.id,
      tenantId: guardian.tenantId,
      userId: guardian.userId,
      relation: guardian.relation,
      phone: guardian.phone,
      occupation: guardian.occupation,
      isPrimaryContact: guardian.isPrimaryContact,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    }
  }
}