import { UserService } from "../services/user.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  getTokenCookieClearOptions,
  getTokenCookieName,
  getTokenCookieOptions,
  getRefreshTokenCookieName,
  getRefreshTokenCookieOptions,
  getRefreshTokenCookieClearOptions,
} from "../utils/cookie.js";

const userService = new UserService();

export class UserController {
  create = catchAsync(async (req, res) => {
    const data = await userService.createUser({ ...req.body, tenantId: req.tenantId });
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await userService.getAllUsers(req.tenantId, filter);
    res.status(200).json({ success: true, data });
  });

  getById = catchAsync(async (req, res) => {
    const data = await userService.getUserById(req.params.id, req.tenantId);
    res.status(200).json({ success: true, data });
  });

  getByType = catchAsync(async (req, res) => {
    const { userType } = req.params;
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await userService.getUsersByType(userType, req.tenantId, filter);
    res.status(200).json({ success: true, data });
  });

  getActive = catchAsync(async (req, res) => {
    const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
    const data = await userService.getActiveUsers(req.tenantId, filter);
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await userService.updateUser(req.params.id, req.tenantId, req.body);
    res.status(200).json({ success: true, data });
  });

  updateStatus = catchAsync(async (req, res) => {
    const { status } = req.body;
    const data = await userService.updateUserStatus(req.params.id, req.tenantId, status);
    res.status(200).json({ success: true, data });
  });

  verifyEmail = catchAsync(async (req, res) => {
    const data = await userService.verifyUserEmail(req.params.id, req.tenantId);
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data,
    });
  });

  delete = catchAsync(async (req, res) => {
    await userService.deleteUser(req.params.id, req.tenantId);
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  });

  restore = catchAsync(async (req, res) => {
    const data = await userService.restoreUser(req.params.id, req.tenantId);
    res.status(200).json({
      success: true,
      message: "User restored successfully",
      data,
    });
  });

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const data = await userService.loginByEmail(email, password);

    res.cookie(getTokenCookieName(), data.token, getTokenCookieOptions());
    res.cookie(getRefreshTokenCookieName(), data.refreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  });

  logout = catchAsync(async (req, res) => {
    // Clear refresh token in DB
    await userService.clearRefreshToken(req.user.id);

    res.clearCookie(getTokenCookieName(), getTokenCookieClearOptions());
    res.clearCookie(getRefreshTokenCookieName(), getRefreshTokenCookieClearOptions());

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  });

  refreshToken = catchAsync(async (req, res) => {
    const refreshToken = req.cookies[getRefreshTokenCookieName()];
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const data = await userService.refreshAccessToken(refreshToken);

    res.cookie(getTokenCookieName(), data.token, getTokenCookieOptions());

    res.status(200).json({
      success: true,
      message: "Token refreshed",
      data,
    });
  });
}
