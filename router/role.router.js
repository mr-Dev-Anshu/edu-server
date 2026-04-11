import express from "express";
import { RoleController } from "../controllers/role.controller.js";
import { createRoleValidator } from "../middlewares/validators/role.validator.js";
import { requireTenantId } from "../middlewares/tenant.middleware.js";

const router = express.Router();
const ctrl = new RoleController();

router.route("/").post(requireTenantId, createRoleValidator, ctrl.create);

export default router;
