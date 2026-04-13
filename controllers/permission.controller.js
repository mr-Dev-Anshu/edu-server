import { PermissionService } from "../services/permission.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const permissionService = new PermissionService();

export class PermissionController {
  create = catchAsync(async (req, res) => {
    const data = await permissionService.createPermission(req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const data = await permissionService.getAllPermissions();
    res.status(200).json({ success: true, data });
  });
}
