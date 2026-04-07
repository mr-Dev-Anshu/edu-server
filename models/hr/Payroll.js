import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant, tenantIndex } from "../../utils/withTenant.js";
export const LeaveType = sequelize.define(
  "LeaveType",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(10), allowNull: false },
    annualQuota: { type: DataTypes.DECIMAL(5, 1), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "leave_types",
    indexes: [...tenantIndex(["code"], { unique: true })],
  },
);

export const LeaveApplication = sequelize.define(
  "LeaveApplication",
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
    leaveTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "leave_types", key: "id" },
    },
    fromDate: { type: DataTypes.DATEONLY, allowNull: false },
    toDate: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "canceled"),
      defaultValue: "pending",
    },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "leave_applications",
    indexes: [...tenantIndex(["staff_id", "status"])],
  },
);
