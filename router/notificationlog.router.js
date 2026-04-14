import { Router } from "express";
import { NotificationLogController } from "../controllers/notificationlog.controller.js";

const router = Router();
const ctrl = new NotificationLogController();

router.get("/", ctrl.getAll);
router.get("/recipient/:recipientId", ctrl.getByRecipient);
router.get("/status/:status", ctrl.getByStatus);
router.get("/channel/:channel", ctrl.getByChannel);
router.get("/:id", ctrl.getOne);
router.post("/", ctrl.create);
router.patch("/:id", ctrl.markAsSent);

export default router;