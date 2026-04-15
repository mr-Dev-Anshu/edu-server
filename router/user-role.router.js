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
import { identifyUser } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new UserRoleController();

// ✅ Static and specific routes FIRST
router.route("/assign").post(identifyUser, assignRoleValidator, ctrl.assignRole);
router.route("/assign-multiple").post(requireTenantId, assignMultipleRolesValidator, ctrl.assignMultipleRoles);
router.route("/revoke").post(requireTenantId, revokeRoleValidator, ctrl.revokeRole);
router.route("/revoke-multiple").post(requireTenantId, revokeMultipleRolesValidator, ctrl.revokeMultipleRoles);
router.route("/expired/list").get(ctrl.getExpired);
router.route("/user/:userId").get(requireTenantId, ctrl.getUserRoles);
router.route("/role/:roleId").get(ctrl.getRoleUsers);

// ✅ Dynamic routes LAST
router.route("/:id").get(ctrl.getById);
router.route("/:id/expiry").put(updateRoleExpiryValidator, ctrl.updateExpiry);

export default router;
