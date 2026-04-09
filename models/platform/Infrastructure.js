import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant } from "../../utils/withTenant.js";

export const WebhookEndpoint = sequelize.define(
  "WebhookEndpoint",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    url: { type: DataTypes.STRING(2048), allowNull: false },
    secretHash: { type: DataTypes.STRING(255), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }),
  { timestamps: true, underscored: true, tableName: "webhook_endpoints" },
);

export const BiometricPunch = sequelize.define(
  "BiometricPunch",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    staffId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "staff", key: "id" },
    },
    punchTime: { type: DataTypes.DATE, allowNull: false },
    isProcessed: { type: DataTypes.BOOLEAN, defaultValue: false },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "biometric_punches",
    // indexes: [
    //   { unique: true, fields: ["tenant_id", "staff_id", "punch_time"] },
    // ],
  },
);
