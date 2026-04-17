import { Router } from "express";
import { NotificationLogController } from "../controllers/notificationlog.controller.js";
import {
  createNotificationLogValidator,
  getByStatusValidator,
  getByChannelValidator,
  getByRecipientValidator,
  markAsSentValidator,
} from "../middlewares/validators/notificationlog.validator.js";
import { identifyUser } from "../middlewares/security/index.js";

const router = Router();
const ctrl = new NotificationLogController();

router.get("/",identifyUser, ctrl.getAll);
router.get("/recipient/:recipientId",identifyUser, getByRecipientValidator, ctrl.getByRecipient);
router.get("/status/:status",identifyUser, getByStatusValidator, ctrl.getByStatus);
router.get("/channel/:channel",identifyUser, getByChannelValidator, ctrl.getByChannel);
router.get("/:id",identifyUser, ctrl.getOne);
router.post("/",identifyUser, createNotificationLogValidator, ctrl.create);
router.patch("/:id",identifyUser, markAsSentValidator, ctrl.markAsSent);

export default router;