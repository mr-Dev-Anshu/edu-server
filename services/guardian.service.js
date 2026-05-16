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

  async resolveGuardianRole(tenantId) {
    const roles = await roleService.getAllRoles(tenantId, { slug: "student" });
    if (!roles[0]) {
      throw new AppError("Student (Portal) role not found for this tenant", 404);
    }
    return roles[0];
  }
  async resolveGuardian(tenantId, payload, options = {}) {
    const { email } = payload;
    
    // Check if guardian with same email already exists (reuse case)
    const existingGuardian = await guardianRepo.findByEmail(email, tenantId);
    if (existingGuardian) {
      // Already exists - convert to plain object and return for reuse
      const guardianData = existingGuardian.get ? existingGuardian.get({ plain: true }) : existingGuardian;
      return guardianData;
    }

    // Doesn't exist - create new guardian
    return await this.createGuardian(tenantId, payload, options);
  } 
  async createGuardian(tenantId, payload, options = {}){
    const {
      email,
      password,
      firstName,
      lastName,
      relation,
      phone,
      occupation,
      isPrimaryContact,
      requestedBy,
    } = payload

    let transaction = options.transaction;
    let localTransaction = false;

    if (!transaction) {
      transaction = await sequelize.transaction();
      localTransaction = true;
    }

    try {
          const user = await userService.createUser(
            {
              email,
              password,
              firstName,
              lastName,
              phone,
              tenantId,
              status: "active",
              emailVerified: true,
            },
            { transaction },
          );
    
          const guardianRole = await this.resolveGuardianRole(tenantId);
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
          tenantId,
          userId: user.id,
          relation,
          phone,
          occupation,
          isPrimaryContact,
        },
        { transaction },
      );

      if (localTransaction) {
        await transaction.commit();
      }
      const guardianData = guardian.get ? guardian.get({ plain: true }) : guardian;
      return this.formatGuardianResponse(guardianData);
    } catch (error) {
      if (localTransaction && !transaction.finished) await transaction.rollback();
      throw error;
    }
  }
  async attachStudents(guardianId, tenantId, payload, options = {}) {
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
      },
      options,
    );
  }

  async getByStudent(studentId, tenantId) {
    const guardians = await guardianRepo.findByStudentId(studentId, tenantId);
    if (!guardians.length) throw new AppError("No guardians found for this student", 404);
    
    return guardians.map(g => {
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

  formatGuardianResponse(guardian){
    return {
      id: guardian.id,
      tenantId: guardian.tenantId,
      userId: guardian.userId,
      relation: guardian.relation,
      phone: guardian.phone,
      occupation: guardian.occupation,
      isPrimaryContact: guardian.isPrimaryContact,
      createdAt: guardian.createdAt,
      updatedAt: guardian.updatedAt,
    }
  }
}