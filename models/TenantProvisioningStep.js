import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const TenantProvisioningStep = sequelize.define(
  "TenantProvisioningStep",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "tenants", key: "id" },
    },
    stepKey: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [["schema_created", "seeded", "dns_provisioned"]],
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attemptCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastAttemptAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    errorDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "tenant_provisioning_steps",
    // indexes: [
    //   { unique: true, fields: ["tenant_id", "step_key"] },
    //   { fields: ["tenant_id"] },
    //   { fields: ["status"] },
    // ],
  }
);

export default TenantProvisioningStep;
