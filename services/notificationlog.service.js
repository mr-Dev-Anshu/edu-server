import { NotificationLogRepository } from "../repositories/notificationlog.repository.js";
import { BaseService } from "./base.service.js";

const notificationLogRepo = new NotificationLogRepository();
export class NotificationLogService extends BaseService {
  constructor() {
    super(notificationLogRepo);
  }

  async getByRecipient(recipientId, tenantId) {
    return await notificationLogRepo.findByRecipient(recipientId, tenantId);
  }

  async getByStatus(status, tenantId) {
    return await notificationLogRepo.findByStatus(status, tenantId);
  }

  async getByChannel(channel, tenantId) {
    return await notificationLogRepo.findByChannel(channel, tenantId);
  }

  async markAsSent(id, tenantId) {
    return await notificationLogRepo.markAsSent(id, tenantId);
  }
}