import { UserRole } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { AppError } from "../utils/AppError.js";
import { Op } from "sequelize";

export class UserRoleRepository extends BaseRepository {
  constructor() {
    super(UserRole);
  }

  async findByUserId(userId, filter = {}) {
    return await this.model.findAll({
      where: { ...filter, userId },
      include: [
        {
          association: "role",
          attributes: ["id", "name", "slug", "description"],
        },
        {
          association: "assignedBy",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });
  }

  async findByRoleId(roleId, filter = {}) {
    return await this.model.findAll({
      where: { ...filter, roleId },
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "email", "userType"],
        },
      ],
    });
  }

  async findByUserAndRole(userId, roleId) {
    return await this.model.findOne({
      where: { userId, roleId },
    });
  }

  async findByUserRoleAndAcademicYear(userId, roleId, academicYearId) {
    return await this.model.findOne({
      where: { userId, roleId, academicYearId },
    });
  }

  async findExpiredRoles(filter = {}) {
    return await this.model.findAll({
      where: {
        ...filter,
        expiresAt: { [Op.lt]: new Date() }, // ✅ expiresAt < now = expired
      },
    });
  }

  async assignRoleToUser(
    userId,
    roleId,
    academicYearId = null,
    assignedById = null,
    options = {},
  ) {
    const existing = await this.findByUserRoleAndAcademicYear(
      userId,
      roleId,
      academicYearId,
    );
    if (existing) {
      throw new AppError(
        "User already has this role for the specified academic year",
        409,
      );
    }
    return await this.model.create(
      {
        userId,
        roleId,
        academicYearId,
        assignedById,
        assignedAt: new Date(),
      },
      options,
    );
  }

  async revokeRoleFromUser(userId, roleId, academicYearId = null) {
    const where = { userId, roleId };
    if (academicYearId) where.academicYearId = academicYearId;

    const result = await this.model.destroy({ where });
    if (result === 0) {
      throw new AppError("User role assignment not found", 404);
    }
    return result;
  }

  async updateRoleExpiry(userRoleId, expiresAt) {
    const userRole = await this.model.findByPk(userRoleId);
    if (!userRole) {
      throw new AppError("User role assignment not found", 404);
    }
    return await userRole.update({ expiresAt });
  }

  async bulkAssignRoles(
    userId,
    roleIds,
    academicYearId = null,
    assignedById = null,
    options = {},
  ) {
    const assignments = roleIds.map((roleId) => ({
      userId,
      roleId,
      academicYearId,
      assignedById,
      assignedAt: new Date(),
    }));
    return await this.model.bulkCreate(assignments, {
      ignoreDuplicates: true,
      ...options, // ✅ transaction flows in here
    });
  }

  async bulkRevokeRoles(userId, roleIds) {
    return await this.model.destroy({
      where: {
        userId,
        roleId: roleIds,
      },
    });
  }
}
