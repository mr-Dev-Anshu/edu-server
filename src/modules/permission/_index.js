import { PermissionRepository } from './permission.repository.js';
import { PermissionService } from './permission.service.js';
import { PermissionController } from './permission.controller.js';

export const initPermissionModule = () => {
  const permissionRepository = new PermissionRepository();

  const permissionService = new PermissionService({
    permissionRepository,
  });

  const permissionController = new PermissionController({
    permissionService,
  });

  return {
    permissionController,
  };
};
