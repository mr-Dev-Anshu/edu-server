import { WebhookEndpointService } from "../services/webhook-endpoint.service.js";
import { BaseController } from "./base.controller.js";
import { catchAsync } from "../utils/catchAsync.js";

const webhookService = new WebhookEndpointService();

export class WebhookEndpointController extends BaseController {
  constructor() {
    super(webhookService);
  }

  create = catchAsync(async (req, res) => {
    const data = await webhookService.createWebhook({
      ...req.body,
      tenantId: req.tenantId,
    });
    res.status(201).json({ success: true, data });
  });

  getAll = catchAsync(async (req, res) => {
    const data = await webhookService.getAllWebhooks(req.tenantId, req.query);
    res.status(200).json({ success: true, results: data.length, data });
  });

  getOne = catchAsync(async (req, res) => {
    const data = await webhookService.getWebhookById(
      req.params.id,
      req.tenantId,
    );
    res.status(200).json({ success: true, data });
  });

  update = catchAsync(async (req, res) => {
    const data = await webhookService.updateWebhook(
      req.params.id,
      req.tenantId,
      req.body,
    );
    res.status(200).json({ success: true, data });
  });

  delete = catchAsync(async (req, res) => {
    await webhookService.deleteWebhook(req.params.id, req.tenantId);
    res
      .status(200)
      .json({
        success: true,
        message: "Webhook endpoint deleted successfully",
      });
  });
}
