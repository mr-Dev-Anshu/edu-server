import express from "express";
import { UserController } from "../controllers/user.controller.js";
import {
  createUserValidator,
  updateUserValidator,
  updateUserStatusValidator,
  assignUserRolesValidator,
  removeUserRolesValidator,
} from "../middlewares/validators/user.validator.js";

const router = express.Router();
const ctrl = new UserController();

// Create new user
router.route("/").post(createUserValidator, ctrl.create);

// Get all users
router.route("/").get(ctrl.getAll);

// Get active users
router.route("/active").get(ctrl.getActive);

// Get user by ID
router.route("/:id").get(ctrl.getById);

// Update user
router.route("/:id").put(updateUserValidator, ctrl.update);

// Delete user (soft delete)
router.route("/:id").delete(ctrl.delete);

// Restore user
router.route("/:id/restore").post(ctrl.restore);

// Update user status
router.route("/:id/status").put(updateUserStatusValidator, ctrl.updateStatus);

// Verify email
router.route("/:id/verify-email").post(ctrl.verifyEmail);

// Get users by type
router.route("/type/:userType").get(ctrl.getByType);

// Assign roles to user
router.route("/:id/roles").post(assignUserRolesValidator, ctrl.assignRoles);

// Remove roles from user
router.route("/:id/roles").delete(removeUserRolesValidator, ctrl.removeRoles);

export default router;
