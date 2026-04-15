import sequelize from "../config/db.js";
import { UserRoleRepository } from "../repositories/user-role.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/AppError.js";

const userRoleRepo = new UserRoleRepository();
const userRepo = new UserRepository();

export class UserRoleService {
  async assignRoleToUser(payload) {
    const {
      userId,
      roleId,
      tenantId,
      academicYearId = null,
      assignedById = null,
    } = payload;

    // Validate user exists
    await userRepo.findById(userId, tenantId);

    const userRole = await userRoleRepo.assignRoleToUser(
      userId,
      roleId,
      academicYearId,
      assignedById,
    );

    return this.formatUserRoleResponse(userRole);
  }

  async assignMultipleRolesToUser(payload) {
    const {
      userId,
      roleIds,
      tenantId,
      academicYearId = null,
      assignedById = null,
    } = payload;

    // Validate user exists
    await userRepo.findById(userId, tenantId);

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new AppError("roleIds must be a non-empty array", 400);
    }

    const transaction = await sequelize.transaction();

    try {
      // In the service — pass transaction
      const userRoles = await userRoleRepo.bulkAssignRoles(
        userId,
        roleIds,
        academicYearId,
        assignedById,
        { transaction }, // ✅
      );

      await transaction.commit();
      return userRoles.map((ur) => this.formatUserRoleResponse(ur));
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  async revokeRoleFromUser(payload) {
    const { userId, roleId, tenantId, academicYearId = null } = payload;

    // Validate user exists
    await userRepo.findById(userId, tenantId);

    await userRoleRepo.revokeRoleFromUser(userId, roleId, academicYearId);
  }

  async revokeMultipleRolesFromUser(payload) {
    const { userId, roleIds, tenantId } = payload;

    // Validate user exists
    await userRepo.findById(userId, tenantId);

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new AppError("roleIds must be a non-empty array", 400);
    }

    await userRoleRepo.bulkRevokeRoles(userId, roleIds);
  }

  async getUserRoles(userId, tenantId, filter = {}) {
    // Validate user exists
    await userRepo.findById(userId, tenantId);

    const userRoles = await userRoleRepo.findByUserId(userId, filter);
    return userRoles.map((ur) => this.formatUserRoleResponse(ur));
  }

  async getRoleUsers(roleId, filter = {}) {
    const userRoles = await userRoleRepo.findByRoleId(roleId, filter);
    return userRoles.map((ur) => this.formatUserRoleResponse(ur));
  }

  async getUserRoleById(userRoleId) {
    const userRole = await userRoleRepo.model.findByPk(userRoleId, {
      include: [
        {
          association: "role",
          attributes: ["id", "name", "roleType", "description"],
        },
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          association: "assignedBy",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    if (!userRole) {
      throw new AppError("User role assignment not found", 404);
    }

    return this.formatUserRoleResponse(userRole);
  }

  async updateRoleExpiry(userRoleId, expiresAt) {
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      throw new AppError("Expiration date must be in the future", 400);
    }

    const userRole = await userRoleRepo.updateRoleExpiry(userRoleId, expiresAt);
    return this.formatUserRoleResponse(userRole);
  }

  async getExpiredRoles(filter = {}) {
    const expiredRoles = await userRoleRepo.findExpiredRoles(filter);
    return expiredRoles.map((ur) => this.formatUserRoleResponse(ur));
  }

  formatUserRoleResponse(userRole) {
    return {
      id: userRole.id,
      userId: userRole.userId,
      roleId: userRole.roleId,
      academicYearId: userRole.academicYearId,
      assignedById: userRole.assignedById,
      assignedAt: userRole.assignedAt,
      expiresAt: userRole.expiresAt,
      role: userRole.role,
      user: userRole.user,
      assignedBy: userRole.assignedBy,
    };
  }
}
