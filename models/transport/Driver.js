import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant } from "../withTenant.js";

export const Driver = sequelize.define(
  "Driver",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    licenseNumber: { type: DataTypes.STRING(50), allowNull: false },
    licenseExpiryDate: { type: DataTypes.DATEONLY, allowNull: false },
    bloodGroup: {
      type: DataTypes.ENUM("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "drivers",
  }
);
