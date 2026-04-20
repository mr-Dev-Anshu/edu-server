import { UserRoleService } from "../services/user-role.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const userRoleService = new UserRoleService();

export class UserRoleController {
  assignRole = catchAsync(async (req, res) => {
    const data = await userRoleService.assignRoleToUser({
      ...req.body,
      tenantId: req.tenantId,
    });
    res.status(201).json({
      success: true,
      message: "Role assigned successfully",
      data,
    });
  });

  // ❌ DEPRECATED: Users can only have one role
  // assignMultipleRoles = catchAsync(async (req, res) => {
  //   const data = await userRoleService.assignMultipleRolesToUser({
  //     ...req.body,
  //     tenantId: req.tenantId,
  //   });
  //   res.status(201).json({
  //     success: true,
  //     message: "Roles assigned successfully",
  //     data,
  //   });
  // });

  revokeRole = catchAsync(async (req, res) => {
    await userRoleService.revokeRoleFromUser({ ...req.body, tenantId: req.tenantId });
    res.status(200).json({
      success: true,
      message: "Role revoked successfully",
    });
  });

  // ❌ DEPRECATED: Users can only have one role
  // revokeMultipleRoles = catchAsync(async (req, res) => {
  //   await userRoleService.revokeMultipleRolesFromUser({
  //     ...req.body,
  //     tenantId: req.tenantId,
  //   });
  //   res.status(200).json({
  //     success: true,
  //     message: "Roles revoked successfully",
  //   });
  // });

  getUserRoles = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await userRoleService.getUserRoles(userId, req.tenantId, filter);
    res.status(200).json({ success: true, data });
  });

  getRoleUsers = catchAsync(async (req, res) => {
    const { roleId } = req.params;
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await userRoleService.getRoleUsers(roleId, filter);
    res.status(200).json({ success: true, data });
  });

  getById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const data = await userRoleService.getUserRoleById(id);
    res.status(200).json({ success: true, data });
  });

  updateExpiry = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { expiresAt } = req.body;
    const data = await userRoleService.updateRoleExpiry(id, expiresAt);
    res.status(200).json({
      success: true,
      message: "Role expiry updated successfully",
      data,
    });
  });

  getExpired = catchAsync(async (req, res) => {
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await userRoleService.getExpiredRoles(filter);
    res.status(200).json({ success: true, data });
  });
}
