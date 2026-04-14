import { NotificationLogService } from "../services/notificationlog.service.js";
import { BaseController } from "./base.controller.js";
import { catchAsync } from "../utils/catchAsync.js";

const notificationLogService = new NotificationLogService();

export class NotificationLogController extends BaseController {
  constructor() {
    super(notificationLogService);
  }

  getByRecipient = catchAsync(async (req, res) => {
    const data = await notificationLogService.getByRecipient(
      req.params.recipientId,
      req.tenantId
    );
    res.status(200).json({ success: true, results: data.length, data });
  });

  getByStatus = catchAsync(async (req, res) => {
    const data = await notificationLogService.getByStatus(
      req.params.status,
      req.tenantId
    );
    res.status(200).json({ success: true, results: data.length, data });
  });

  getByChannel = catchAsync(async (req, res) => {
    const data = await notificationLogService.getByChannel(
      req.params.channel,
      req.tenantId
    );
    res.status(200).json({ success: true, results: data.length, data });
  });

  markAsSent = catchAsync(async (req, res) => {
    const data = await notificationLogService.markAsSent(
      req.params.id,
      req.tenantId
    );
    res.status(200).json({ success: true, data });
  });
}