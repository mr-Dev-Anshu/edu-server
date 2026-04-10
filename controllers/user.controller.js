import { UserService } from "../services/user.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const userService = new UserService();

export class UserController {
  create = catchAsync(async (req, res) => {
    const data = await userService.createUser(req.body);
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await userService.getAllUsers(tenantId, filter);
    res.status(200).json({ success: true, data });
  });

  getById = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const data = await userService.getUserById(req.params.id, tenantId);
    res.status(200).json({ success: true, data });
  });

  getByType = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const { userType } = req.params;
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await userService.getUsersByType(userType, tenantId, filter);
    res.status(200).json({ success: true, data });
  });

  getActive = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await userService.getActiveUsers(tenantId, filter);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const data = await userService.updateUser(req.params.id, tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  updateStatus = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const { status } = req.body;
    const data = await userService.updateUserStatus(req.params.id, tenantId, status);
    res.status(200).json({ success: true, data });
  });

  verifyEmail = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const data = await userService.verifyUserEmail(req.params.id, tenantId);
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data,
    });
  });

  delete = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    await userService.deleteUser(req.params.id, tenantId);
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  });

  restore = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const data = await userService.restoreUser(req.params.id, tenantId);
    res.status(200).json({
      success: true,
      message: "User restored successfully",
      data,
    });
  });

  assignRoles = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const { roles } = req.body;
    const data = await userService.assignRolesWithUsers(
      req.params.id,
      tenantId,
      roles
    );
    res.status(200).json({
      success: true,
      message: "Roles assigned successfully",
      data,
    });
  });

  removeRoles = catchAsync(async (req, res) => {
    const tenantId = req.body.tenantId || req.query.tenantId;
    const { roleIds } = req.body;
    await userService.removeRolesFromUser(req.params.id, tenantId, roleIds);
    res.status(200).json({
      success: true,
      message: "Roles removed successfully",
    });
  });
}
