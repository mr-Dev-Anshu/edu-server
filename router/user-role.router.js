import express from "express";
import { UserRoleController } from "../controllers/user-role.controller.js";
import {
  assignRoleValidator,
  assignMultipleRolesValidator,
  revokeRoleValidator,
  revokeMultipleRolesValidator,
  updateRoleExpiryValidator,
} from "../middlewares/validators/user-role.validator.js";
import { checkPermission, identifyUser } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new UserRoleController();

// ✅ Static and specific routes FIRST
router.route("/assign").post(identifyUser, checkPermission("assign:create"),assignRoleValidator, ctrl.assignRole);
// ❌ DEPRECATED: Users can only have one role
// router.route("/assign-multiple").post(identifyUser, checkPermission("assign:role"), assignMultipleRolesValidator, ctrl.assignMultipleRoles);
router.route("/revoke").post(identifyUser, checkPermission("assign:role"), revokeRoleValidator, ctrl.revokeRole);
// ❌ DEPRECATED: Users can only have one role
// router.route("/revoke-multiple").post(identifyUser, checkPermission("assign:role"), revokeMultipleRolesValidator, ctrl.revokeMultipleRoles);
router.route("/expired/list").get(ctrl.getExpired);
router.route("/user/:userId").get(identifyUser, ctrl.getUserRoles);
router.route("/role/:roleId").get(ctrl.getRoleUsers);

// ✅ Dynamic routes LAST
router.route("/:id").get(ctrl.getById);
router.route("/:id/expiry").put(updateRoleExpiryValidator, ctrl.updateExpiry);

export default router;
