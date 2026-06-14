import express from "express";
import { PermissionController } from "../controllers/permission.controller.js";
import { createPermissionValidator } from "../middlewares/validators/permission.validator.js";
import { checkPermission, identifyUser } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new PermissionController();

router.route("/")
  .post(identifyUser, checkPermission("create:permission"), createPermissionValidator, ctrl.create)
  .get(identifyUser, checkPermission("read:permission"), ctrl.getAll); 

export default router;
