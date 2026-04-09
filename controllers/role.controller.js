import { RoleService } from "../services/role.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const roleService = new RoleService();

export class RoleController {
  create = catchAsync(async (req, res) => {
    const data = await roleService.createRole(req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const data = await roleService.getAllRoles(tenantId);
    res.status(200).json({ success: true, data });
  });

  getById = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const data = await roleService.getRoleById(req.params.id, tenantId);
    res.status(200).json({ success: true, data });
  });

  getPermissions = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const data = await roleService.getPermissionsByRole(req.params.id, tenantId);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const data = await roleService.updateRole(req.params.id, tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  updatePermissions = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const data = await roleService.updateRolePermissions(
      req.params.id,
      tenantId,
      req.body.permissionIds || []
    );
    res.status(200).json({ success: true, data });
  });
}
