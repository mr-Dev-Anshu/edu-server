import express from "express";
import { RoleController } from "../controllers/role.controller.js";
import { createRoleValidator } from "../middlewares/validators/role.validator.js";
import { requireTenantId } from "../middlewares/tenant.middleware.js";
import { checkPermission, identifyUser } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new RoleController();

// Create new role
router.route("/").post( identifyUser ,  createRoleValidator, ctrl.create);

// Get all roles
router.route("/").get(requireTenantId, ctrl.getAll);

// Get role by ID
router.route("/:id").get(requireTenantId, ctrl.getById);

// Update role
router.route("/:id").put(requireTenantId, ctrl.update);

// Get permissions by role
router.route("/:id/permissions").get(requireTenantId, ctrl.getPermissions);

// Update role permissions
router.route("/:id/permissions").put(requireTenantId, ctrl.updatePermissions);

export default router;
