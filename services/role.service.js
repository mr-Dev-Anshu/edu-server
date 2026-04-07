import sequelize from "../config/db.js";
import { PermissionRepository } from "../repositories/permission.repository.js";
import { RoleRepository } from "../repositories/role.repository.js";
import { AppError } from "../utils/AppError.js";

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

    const existingRole = await roleRepo.findBySlug(slug, tenantId);
    if (existingRole) {
      throw new AppError("Role slug already exists for this tenant scope", 400);
    }

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
