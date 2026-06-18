import express from "express";
import { BiometricPunchController } from "../controllers/biometric-punch.controller.js";
import {
  createBiometricPunchValidator,
  updateBiometricPunchValidator,
  bulkCreateBiometricPunchValidator,
} from "../middlewares/validators/biometric-punch.validator.js";
import {
  identifyUser,
  checkPermission,
} from "../middlewares/security/index.js";
import { validateUUID } from "../middlewares/validators/uuid.validator.js";

const router = express.Router();
const ctrl = new BiometricPunchController();

router.post(
  "/bulk",
  identifyUser,
  bulkCreateBiometricPunchValidator,
  ctrl.bulkCreate,
);

router
  .route("/")
  .post(identifyUser, createBiometricPunchValidator, ctrl.create)
  .get(identifyUser, ctrl.getAll);

router
  .route("/:id")
  .get(identifyUser, validateUUID("id"), ctrl.getOne)
  .patch(
    identifyUser,
    validateUUID("id"),
    updateBiometricPunchValidator,
    ctrl.update,
  )
  .delete(identifyUser, ctrl.delete);

export default router;
