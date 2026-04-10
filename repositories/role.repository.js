import { Role } from "../models/index.js";
import { RolePermission } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

export class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  async findBySlug(slug, tenantId = null) {
    return await this.model.findOne({
      where: {
        slug,
        tenantId,
      },
    });
  }

  async attachPermissions(roleId, permissionIds, options = {}) {
    if (!permissionIds.length) {
      return [];
    }

    return await RolePermission.bulkCreate(
      permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      options
    );
  }
}
