import { NotificationLogService } from "../services/notificationlog.service.js";
import { BaseController } from "./base.controller.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";

const notificationLogService = new NotificationLogService();

export class NotificationLogController extends BaseController {
  constructor() {
    super(notificationLogService);
  }

  getByRecipient = catchAsync(async (req, res) => {
    const { recipientId } = req.params;
    if (!recipientId) throw new AppError("recipientId param is required", 400);

    const data = await notificationLogService.getByRecipient(
      recipientId,
      req.tenantId
    );
    res.status(200).json({ success: true, results: data.length, data });
  });

  getByStatus = catchAsync(async (req, res) => {
    const { status } = req.params;
    if (!status) throw new AppError("status param is required", 400);

    const data = await notificationLogService.getByStatus(
      status,
      req.tenantId
    );
    res.status(200).json({ success: true, results: data.length, data });
  });

  getByChannel = catchAsync(async (req, res) => {
    const { channel } = req.params;
    if (!channel) throw new AppError("channel param is required", 400);

    const data = await notificationLogService.getByChannel(
      channel,
      req.tenantId
    );
    res.status(200).json({ success: true, results: data.length, data });
  });

  markAsSent = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new AppError("id param is required", 400);

    const data = await notificationLogService.markAsSent(id, req.tenantId);
    res.status(200).json({ success: true, data });
  });
}