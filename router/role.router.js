import express from "express";
import { RoleController } from "../controllers/role.controller.js";
import { createRoleValidator } from "../middlewares/validators/role.validator.js";

const router = express.Router();
const ctrl = new RoleController();

// Create new role
router.route("/").post(createRoleValidator, ctrl.create);

// Get all roles
router.route("/").get(ctrl.getAll);

// Get role by ID
router.route("/:id").get(ctrl.getById);

// Update role
router.route("/:id").put(ctrl.update);

// Get permissions by role
router.route("/:id/permissions").get(ctrl.getPermissions);

// Update role permissions
router.route("/:id/permissions").put(ctrl.updatePermissions);

export default router;
