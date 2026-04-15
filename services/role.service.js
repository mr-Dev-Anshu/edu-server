import sequelize from "../config/db.js";
import { PermissionRepository } from "../repositories/permission.repository.js";
import { RoleRepository } from "../repositories/role.repository.js";
import { AppError } from "../utils/AppError.js";
import { RolePermission } from "../models/index.js"; 

const roleRepo = new RoleRepository();
const permissionRepo = new PermissionRepository();

const normalizeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

export class RoleService {
  async createRole(payload) {
    const slug = normalizeSlug(payload.slug || payload.name);
    const tenantId = payload.tenantId?.trim() || null;
    const permissionIds = [...new Set(payload.permissionIds || [])];

    // const existingRole = await roleRepo.findBySlug(slug, tenantId);
    // if (existingRole) {
    //   throw new AppError("Role slug already exists for this tenant scope", 400);
    // }

    const permissions = permissionIds.length ? await permissionRepo.findByIds(permissionIds) : [];
    if (permissions.length !== permissionIds.length) {
      throw new AppError("One or more permissionIds are invalid", 400);
    }

    const transaction = await sequelize.transaction();

    try {
      const role = await roleRepo.create(
        {
          name: payload.name.trim(),
          slug,
          description: payload.description?.trim() || null,
          isSystem: payload.isSystem ?? false,
          hierarchyLevel: payload.hierarchyLevel ?? 10,
          tenantId,
          customFields: payload.customFields || {},
          metadata: payload.metadata || {},
        },
        { transaction }
      );

      await roleRepo.attachPermissions(role.id, permissionIds, { transaction });
      await transaction.commit();

      return this.formatRoleResponse(role, permissions);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  async getAllRoles(tenantId, filter = {}) {
    const roles = await roleRepo.findAll(tenantId, filter, [
      {
        association: "permissions",
        attributes: ["id", "name", "action", "resource", "module", "description"],
        through: { attributes: [] },
      },
    ]);
    return roles.map((role) => this.formatRoleResponse(role, role.permissions || []));
  }

  async getRoleById(roleId, tenantId) {
    const role = await roleRepo.findById(roleId, tenantId, [
      {
        association: "permissions",
        attributes: ["id", "name", "action", "resource", "module", "description"],
        through: { attributes: [] },
      },
    ]);
    return this.formatRoleResponse(role, role.permissions || []);
  }

  async getPermissionsByRole(roleId, tenantId) {
    const role = await roleRepo.findById(roleId, tenantId, [
      {
        association: "permissions",
        attributes: ["id", "name", "action", "resource", "module", "description"],
        through: { attributes: [] },
      },
    ]);
    return role.permissions || [];
  }

  async updateRole(roleId, tenantId, payload) {
    const role = await roleRepo.findById(roleId, tenantId);

    if (payload.slug && payload.slug !== role.slug) {
      const slug = normalizeSlug(payload.slug);
      const existingRole = await roleRepo.findBySlug(slug, tenantId);
      // if (existingRole && existingRole.id !== roleId) {
      //   throw new AppError("Role slug already exists for this tenant scope", 400);
      // }
      payload.slug = slug;
    }

    const updateData = {
      name: payload.name?.trim() || role.name,
      description: payload.description?.trim() || role.description,
      hierarchyLevel: payload.hierarchyLevel ?? role.hierarchyLevel,
      customFields: payload.customFields || role.customFields,
      metadata: payload.metadata || role.metadata,
    };

    if (payload.slug) {
      updateData.slug = payload.slug;
    }

    await roleRepo.update(roleId, tenantId, updateData);
    return this.getRoleById(roleId, tenantId);
  }

  async updateRolePermissions(roleId, tenantId, permissionIds) {
    const role = await roleRepo.findById(roleId, tenantId);

    if (role.isSystem) {
      throw new AppError("Cannot modify permissions for system roles", 400);
    }

    // Validate permission IDs
    const uniquePermissionIds = [...new Set(permissionIds || [])];
    if (uniquePermissionIds.length) {
      const permissions = await permissionRepo.findByIds(uniquePermissionIds);
      if (permissions.length !== uniquePermissionIds.length) {
        throw new AppError("One or more permissionIds are invalid", 400);
      }
    }

    const transaction = await sequelize.transaction();
    try {
      // Remove existing permissions
      await RolePermission.destroy(
        { where: { roleId } },
        { transaction }
      );

      // Attach new permissions if any
      if (uniquePermissionIds.length) {
        await roleRepo.attachPermissions(roleId, uniquePermissionIds, { transaction });
      }

      await transaction.commit();
      return this.getRoleById(roleId, tenantId);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  formatRoleResponse(role, permissions) {
    return {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      hierarchyLevel: role.hierarchyLevel,
      customFields: role.customFields,
      metadata: role.metadata,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: permissions.map((permission) => ({
        id: permission.id,
        name: permission.name,
        action: permission.action,
        resource: permission.resource,
        module: permission.module,
        description: permission.description,
      })),
    };
  }
}
