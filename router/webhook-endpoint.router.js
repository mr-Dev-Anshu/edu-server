import express from "express";
import { WebhookEndpointController } from "../controllers/webhook-endpoint.controller.js";
import {
  createWebhookEndpointValidator,
  updateWebhookEndpointValidator,
} from "../middlewares/validators/webhook-endpoint.validator.js";
import { identifyUser, checkPermission } from "../middlewares/security/index.js";

const router = express.Router();
const ctrl = new WebhookEndpointController();

router.route("/")
  .post(identifyUser, checkPermission("create:webhook_endpoints"), createWebhookEndpointValidator, ctrl.create)
  .get(identifyUser, checkPermission("read:webhook_endpoints"), ctrl.getAll);

router.route("/:id")
  .get(identifyUser, checkPermission("read:webhook_endpoints"), ctrl.getOne)
  .patch(identifyUser, checkPermission("update:webhook_endpoints"), updateWebhookEndpointValidator, ctrl.update)
  .delete(identifyUser, checkPermission("delete:webhook_endpoints"), ctrl.delete);

export default router;
