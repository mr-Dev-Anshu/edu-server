import express from "express";
import { PermissionController } from "../controllers/permission.controller.js";
import { createPermissionValidator } from "../middlewares/validators/permission.validator.js";

const router = express.Router();
const ctrl = new PermissionController();

router.route("/")
  .post(createPermissionValidator, ctrl.create)
  .get(ctrl.getAll); 

export default router;
