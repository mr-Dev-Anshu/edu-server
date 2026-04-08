import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const NotificationLog = sequelize.define('NotificationLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false, references: { model: 'tenants', key: 'id' } },
  channel: { type: DataTypes.ENUM('sms', 'email', 'push', 'whatsapp'), allowNull: false },
  recipientId: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM('queued', 'sent', 'delivered', 'failed'), defaultValue: 'queued' },
  sentAt: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true, underscored: true, tableName: 'notification_logs',
  indexes: [{ fields: ['tenant_id', 'channel', 'status'] }]
});