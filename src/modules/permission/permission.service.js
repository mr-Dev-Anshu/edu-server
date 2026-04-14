import { AppError } from '../../utils/AppError.js';

const normalizeSegment = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const buildPermissionName = (action, resource) => `${action}:${resource}`;

export class PermissionService {
  constructor({ permissionRepository }) {
    this.permissionRepo = permissionRepository;
  }

  async createPermission(payload) {
    const action = normalizeSegment(payload.action);
    const resource = normalizeSegment(payload.resource);
    const module = normalizeSegment(payload.module);

    const explicitName = String(payload.name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9:]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const name = explicitName || buildPermissionName(action, resource);

    const existingPermission = await this.permissionRepo.findByName(name);

    if (existingPermission) {
      throw new AppError('Permission name already exists', 400);
    }

    const permission = await this.permissionRepo.create({
      name,
      action,
      resource,
      module,
      description: payload.description?.trim() || null,
    });

    return {
      id: permission.id,
      name: permission.name,
      action: permission.action,
      resource: permission.resource,
      module: permission.module,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}
