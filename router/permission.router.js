import express from "express";
import { PermissionController } from "../controllers/permission.controller.js";
import { createPermissionValidator } from "../middlewares/validators/permission.validator.js";

const router = express.Router();
const ctrl = new PermissionController();

// Create new permission
router.route("/").post(createPermissionValidator, ctrl.create);

// Get all permissions
router.route("/").get(ctrl.getAll);

export default router;
