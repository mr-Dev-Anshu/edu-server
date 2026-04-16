import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant, tenantIndex } from "../withTenant.js";

export const StaffAttendance = sequelize.define(
  "StaffAttendance",
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
    date: { type: DataTypes.DATEONLY, allowNull: false },
    inTime: { type: DataTypes.TIME, allowNull: true },
    outTime: { type: DataTypes.TIME, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        "present",
        "absent",
        "half_day",
        "on_leave",
        "holiday",
      ),
      allowNull: false,
    },
    isLate: { type: DataTypes.BOOLEAN, defaultValue: false },
    workingHours: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    source: {
      type: DataTypes.ENUM("biometric", "manual", "regularized"),
      defaultValue: "biometric",
    },
    biometricRawData: { type: DataTypes.JSONB, defaultValue: [] },
    regularizedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    regularizationReason: { type: DataTypes.TEXT, allowNull: true },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "staff_attendance",
    // indexes: [
    //   { unique: true, fields: ["tenant_id", "staff_id", "date"] },
    //   ...tenantIndex(["staff_id", "date"]),
    //   ...tenantIndex(["date", "status"]),
    // ],
  },
);
