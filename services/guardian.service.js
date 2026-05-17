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
let studentGuardianMapService = null;

export class GuardianService extends BaseService {
  constructor() {
    super(guardianRepo);
  }

  getStudentGuardianMapService() {
    if (!studentGuardianMapService) {
      // Lazy load to avoid circular imports
      const { default: StudentGuardianMapService } = require("./studentGuardianMap.service.js");
      studentGuardianMapService = new StudentGuardianMapService();
    }
    return studentGuardianMapService;
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
    const existingGuardian = await guardianRepo.findByEmail(email, tenantId);
    if (existingGuardian) {
      const guardianData = existingGuardian.get ? existingGuardian.get({ plain: true }) : existingGuardian;

      const shouldUpdateGuardian =
        payload.firstName !== undefined ||
        payload.lastName !== undefined ||
        payload.phone !== undefined ||
        payload.relation !== undefined ||
        payload.relationType !== undefined ||
        payload.occupation !== undefined ||
        payload.isPrimaryContact !== undefined;

      if (shouldUpdateGuardian) {
        await this.updateGuardian(guardianData.id, tenantId, payload, options);
        return await guardianRepo.findById(guardianData.id, tenantId, options);
      }

      return guardianData;
    }
    return await this.createGuardian(tenantId, payload, options);
  }

  async updateGuardian(guardianId, tenantId, payload, options = {}) {
    const guardian = await guardianRepo.findById(guardianId, tenantId, options);
    const userPayload = {};
    const guardianPayload = {};

    if (payload.email !== undefined) userPayload.email = payload.email;
    if (payload.firstName !== undefined) userPayload.firstName = payload.firstName;
    if (payload.lastName !== undefined) userPayload.lastName = payload.lastName;
    if (payload.phone !== undefined) userPayload.phone = payload.phone;

    if (payload.relation !== undefined) {
      guardianPayload.relation = payload.relation;
    } else if (payload.relationType !== undefined) {
      guardianPayload.relation = payload.relationType;
    }

    if (payload.occupation !== undefined) guardianPayload.occupation = payload.occupation;
    if (payload.isPrimaryContact !== undefined) guardianPayload.isPrimaryContact = payload.isPrimaryContact;

    if (Object.keys(userPayload).length > 0) {
      await userService.updateUser(guardian.userId, tenantId, userPayload, options);
    }

    if (Object.keys(guardianPayload).length > 0) {
      await guardianRepo.update(guardianId, tenantId, guardianPayload, options);
    }

    return await guardianRepo.findById(guardianId, tenantId, options);
  }

  async createGuardian(tenantId, payload, options = {}) {
    const { email, password, firstName, lastName, relation, phone, occupation, isPrimaryContact, requestedBy } = payload;
    const effectiveRelation = relation ?? payload.relationType ?? "other";
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
          relation: effectiveRelation,
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

  formatGuardianResponse(guardian) {
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
    };
  }

  async getByStudent(studentId, tenantId) {
    const sgmService = this.getStudentGuardianMapService();
    return await sgmService.getStudentMappingsFormatted(studentId, tenantId);
  }
}