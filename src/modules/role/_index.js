import { RoleRepository } from './role.repository.js';
import { PermissionRepository } from '../permission/permission.repository.js';
import { RoleService } from './role.service.js';
import { RoleController } from './role.controller.js';

export const initRoleModule = () => {
  const roleRepository = new RoleRepository();
  const permissionRepository = new PermissionRepository();

  const roleService = new RoleService({
    roleRepository,
    permissionRepository,
  });

  const roleController = new RoleController({
    roleService,
  });

  return {
    roleController,
  };
};
