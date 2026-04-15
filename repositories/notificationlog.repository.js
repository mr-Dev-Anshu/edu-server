import { NotificationLog } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { AppError } from "../utils/AppError.js";

export class NotificationLogRepository extends BaseRepository {
  constructor() {
    super(NotificationLog);
  }

  async findByRecipient(recipientId, tenantId) {
    return await this.model.findAll({ where: { recipientId, tenantId } });
  }

  async findByStatus(status, tenantId) {
    return await this.model.findAll({ where: { status, tenantId } });
  }

  async findByChannel(channel, tenantId) {
    return await this.model.findAll({ where: { channel, tenantId } });
  }

  async markAsSent(id, tenantId) {
    const record = await this.model.findOne({ where: { id, tenantId } });
    if (!record) throw new AppError("Notification log not found", 404);

    if (record.status === "sent") {
      throw new AppError("Notification is already marked as sent", 400);
    }

    return await record.update({ status: "sent", sentAt: new Date() });
  }
}