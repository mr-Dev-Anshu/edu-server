import express from "express";
import { UserRoleController } from "../controllers/user-role.controller.js";
import {
  assignRoleValidator,
  assignMultipleRolesValidator,
  revokeRoleValidator,
  revokeMultipleRolesValidator,
  updateRoleExpiryValidator,
} from "../middlewares/validators/user-role.validator.js";
import { requireTenantId } from "../middlewares/tenant.middleware.js";

const router = express.Router();
const ctrl = new UserRoleController();

// Assign single role to user
router.route("/assign").post(requireTenantId, assignRoleValidator, ctrl.assignRole);

// Assign multiple roles to user
router.route("/assign-multiple").post(requireTenantId, assignMultipleRolesValidator, ctrl.assignMultipleRoles);

// Revoke single role from user
router.route("/revoke").post(requireTenantId, revokeRoleValidator, ctrl.revokeRole);

// Revoke multiple roles from user
router.route("/revoke-multiple").post(requireTenantId, revokeMultipleRolesValidator, ctrl.revokeMultipleRoles);

// Get user role by ID
router.route("/:id").get(ctrl.getById);

// Update role expiry
router.route("/:id/expiry").put(updateRoleExpiryValidator, ctrl.updateExpiry);

// Get all roles for a user
router.route("/user/:userId").get(requireTenantId, ctrl.getUserRoles);

// Get all users with a specific role
router.route("/role/:roleId").get(ctrl.getRoleUsers);

// Get expired roles
router.route("/expired/list").get(ctrl.getExpired);

export default router;
