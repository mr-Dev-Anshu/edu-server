import express from "express";
import { BiometricPunchController } from "../controllers/biometric-punch.controller.js";
import {
  createBiometricPunchValidator,
  updateBiometricPunchValidator,
  bulkCreateBiometricPunchValidator,
} from "../middlewares/validators/biometric-punch.validator.js";
import { identifyUser, checkPermission } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new BiometricPunchController();

router.post("/bulk", identifyUser, checkPermission("create:biometric_punches"), bulkCreateBiometricPunchValidator, ctrl.bulkCreate);

router.route("/")
  .post(identifyUser, checkPermission("create:biometric_punches"), createBiometricPunchValidator, ctrl.create)
  .get(identifyUser, checkPermission("read:biometric_punches"), ctrl.getAll);

router.route("/:id")
  .get(identifyUser, checkPermission("read:biometric_punches"), ctrl.getOne)
  .patch(identifyUser, checkPermission("update:biometric_punches"), updateBiometricPunchValidator, ctrl.update)
  .delete(identifyUser, checkPermission("delete:biometric_punches"), ctrl.delete);

export default router;
