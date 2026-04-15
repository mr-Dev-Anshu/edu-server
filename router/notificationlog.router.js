import { Router } from "express";
import { NotificationLogController } from "../controllers/notificationlog.controller.js";
import {
  createNotificationLogValidator,
  getByStatusValidator,
  getByChannelValidator,
  getByRecipientValidator,
  markAsSentValidator,
} from "../middlewares/validators/notificationlog.validator.js";

const router = Router();
const ctrl = new NotificationLogController();

router.get("/", ctrl.getAll);
router.get("/recipient/:recipientId", getByRecipientValidator, ctrl.getByRecipient);
router.get("/status/:status", getByStatusValidator, ctrl.getByStatus);
router.get("/channel/:channel", getByChannelValidator, ctrl.getByChannel);
router.get("/:id", ctrl.getOne);
router.post("/", createNotificationLogValidator, ctrl.create);
router.patch("/:id", markAsSentValidator, ctrl.markAsSent);

export default router;