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

// ✅ Static routes FIRST
router.route("/").get(requireTenantId, ctrl.getAll);
router.route("/").post(createUserValidator, ctrl.create);
router.route("/active").get(requireTenantId, ctrl.getActive);
router.route("/type/:userType").get(requireTenantId, ctrl.getByType);

// ✅ Dynamic routes LAST
router.route("/:id").get(requireTenantId, ctrl.getById);
router.route("/:id").put(requireTenantId, updateUserValidator, ctrl.update);
router.route("/:id").delete(requireTenantId, ctrl.delete);
router.route("/:id/restore").post(requireTenantId, ctrl.restore);
router.route("/:id/status").put(requireTenantId, updateUserStatusValidator, ctrl.updateStatus);
router.route("/:id/verify-email").post(requireTenantId, ctrl.verifyEmail);
router.route("/:id/roles").post(requireTenantId, assignUserRolesValidator, ctrl.assignRoles);
router.route("/:id/roles").delete(requireTenantId, removeUserRolesValidator, ctrl.removeRoles);

export default router;
