import express from "express";
import { RoleController } from "../controllers/role.controller.js";
import { createRoleValidator } from "../middlewares/validators/role.validator.js";

const router = express.Router();
const ctrl = new RoleController();

router.route("/").post(createRoleValidator, ctrl.create);

export default router;
