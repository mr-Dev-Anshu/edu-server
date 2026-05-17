import express from "express";
import { RoleController } from "../controllers/role.controller.js";
import { createRoleValidator } from "../middlewares/validators/role.validator.js";
import { checkPermission, identifyUser } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new RoleController();

// Create new role
router.route("/")
  .post(identifyUser, checkPermission("create:roles"), createRoleValidator, ctrl.create)
  .get(identifyUser, checkPermission("read:roles"), ctrl.getAll);

// Assign permissions to a role
router.post("/:id/assign-permissions", 
  identifyUser, 
  checkPermission("update:roles"), 
  ctrl.assignPermission
);

// Get role by ID
router.route("/:id")
  .get(identifyUser, checkPermission("read:roles"), ctrl.getById)  
  .put(identifyUser, checkPermission("update:roles"), ctrl.update)  

// Get permissions by role
router.route("/:id/permissions")
  .get(identifyUser, checkPermission("read:roles"), ctrl.getPermissions)  
  .put(identifyUser, checkPermission("update:roles"), ctrl.updatePermissions);

export default router;