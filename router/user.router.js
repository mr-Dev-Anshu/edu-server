import express from "express";
import { UserController } from "../controllers/user.controller.js";
import {
  createUserValidator,
  updateUserValidator,
  updateUserStatusValidator,
  assignUserRolesValidator,
  removeUserRolesValidator,
} from "../middlewares/validators/user.validator.js";
import { requireTenantId } from "../middlewares/tenant.middleware.js";

const router = express.Router();
const ctrl = new UserController();

// Create new user
router.route("/").post(createUserValidator, ctrl.create);

// Get all users
router.route("/").get(requireTenantId, ctrl.getAll);

// Get active users
router.route("/active").get(requireTenantId, ctrl.getActive);

// Get user by ID
router.route("/:id").get(requireTenantId, ctrl.getById);

// Update user
router.route("/:id").put(requireTenantId, updateUserValidator, ctrl.update);

// Delete user (soft delete)
router.route("/:id").delete(requireTenantId, ctrl.delete);

// Restore user
router.route("/:id/restore").post(requireTenantId, ctrl.restore);

// Update user status
router.route("/:id/status").put(requireTenantId, updateUserStatusValidator, ctrl.updateStatus);

// Verify email
router.route("/:id/verify-email").post(requireTenantId, ctrl.verifyEmail);

// Get users by type
router.route("/type/:userType").get(requireTenantId, ctrl.getByType);

// Assign roles to user
router.route("/:id/roles").post(requireTenantId, assignUserRolesValidator, ctrl.assignRoles);

// Remove roles from user
router.route("/:id/roles").delete(requireTenantId, removeUserRolesValidator, ctrl.removeRoles);

export default router;
