import { NotificationLog } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";

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
    const record = await this.findById(id, tenantId);
    return await record.update({ status: "sent", sentAt: new Date() });
  }
}