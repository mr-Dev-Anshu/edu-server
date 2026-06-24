import express from "express";
import { WebhookEndpointController } from "../controllers/webhook-endpoint.controller.js";
import {
  createWebhookEndpointValidator,
  updateWebhookEndpointValidator,
} from "../middlewares/validators/webhook-endpoint.validator.js";
import {
  identifyUser,
  checkPermission,
} from "../middlewares/security/index.js";
import { validateUUID } from "../middlewares/validators/uuid.validator.js";

const router = express.Router();
const ctrl = new WebhookEndpointController();

router
  .route("/")
  .post(identifyUser, createWebhookEndpointValidator, ctrl.create)
  .get(identifyUser, ctrl.getAll);

router
  .route("/:id")
  .get(identifyUser, validateUUID("id"), ctrl.getOne)
  .patch(
    identifyUser,
    validateUUID("id"),
    updateWebhookEndpointValidator,
    ctrl.update,
  )
  .delete(identifyUser, validateUUID("id"), ctrl.delete);

export default router;
