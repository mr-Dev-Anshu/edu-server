import { WebhookEndpointRepository } from "../repositories/webhook-endpoint.repository.js";
import { BaseService } from "./base.service.js";
import { AppError } from "../utils/AppError.js";

const webhookRepo = new WebhookEndpointRepository();

export class WebhookEndpointService extends BaseService {
  constructor() {
    super(webhookRepo);
  }

  async createWebhook(payload) {
    const webhook = await webhookRepo.create({
      url: payload.url.trim(),
      secretHash: payload.secretHash.trim(),
      isActive: payload.isActive ?? true,
      tenantId: payload.tenantId,
    });
    return this.formatResponse(webhook);
  }

  async updateWebhook(id, tenantId, payload) {
    const updateData = {};
    if (payload.url !== undefined) updateData.url = payload.url.trim();
    if (payload.secretHash !== undefined)
      updateData.secretHash = payload.secretHash.trim();
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

    const webhook = await webhookRepo.update(id, tenantId, updateData);
    return this.formatResponse(webhook);
  }

  async getAllWebhooks(tenantId, filter = {}) {
    const webhooks = await webhookRepo.findAll(tenantId, filter);
    return webhooks.map((w) => this.formatResponse(w));
  }

  async getWebhookById(id, tenantId) {
    const webhook = await webhookRepo.findById(id, tenantId);
    return this.formatResponse(webhook);
  }

  async deleteWebhook(id, tenantId) {
    try {
      await webhookRepo.delete(id, tenantId);
      return { message: "Webhook endpoint deleted successfully" };
    } catch (error) {
      if (error.statusCode === 404 || error.message.includes("not found")) {
        throw new AppError("Webhook endpoint not found", 404);
      }
      throw error;
    }
  }


  formatResponse(webhook) {
    return {
      id: webhook.id,
      tenantId: webhook.tenantId,
      url: webhook.url,
      secretHash: webhook.secretHash,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    };
  }
}
