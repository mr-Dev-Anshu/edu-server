import { RoleService } from "../services/role.service.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

const roleService = new RoleService();

export class RoleController {
  create = catchAsync(async (req, res) => {
    const data = await roleService.createRole({
      ...req.body,
      tenantId: req.tenantId,
    });
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const data = await roleService.getAllRoles(req.tenantId);
    res.status(200).json({ success: true, data });
  });

  //assign permission
  assignPermission = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { permissionIds } = req.body;

    // Validate input
    if (!permissionIds || !Array.isArray(permissionIds)) {
      throw new AppError("permissionIds must be an array", 400);
    }

    const data = await roleService.assignPermissionsToRole(
      id,
      req.tenantId,
      permissionIds,
    );

    res.status(200).json({
      success: true,
      message: "Permissions assigned successfully",
      data,
    });
  });

  getById = catchAsync(async (req, res) => {
    const data = await roleService.getRoleById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  getPermissions = catchAsync(async (req, res) => {
    const data = await roleService.getPermissionsByRole(
      req.params.id,
      req.tenantId,
    );
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await roleService.updateRole(
      req.params.id,
      req.tenantId,
      req.body,
    );
    res.status(200).json({ success: true, data });
  });

  updatePermissions = catchAsync(async (req, res) => {
    const data = await roleService.updateRolePermissions(
      req.params.id,
      req.tenantId,
      req.body.permissionIds || [],
    );
    res.status(200).json({ success: true, data });
  });
}
