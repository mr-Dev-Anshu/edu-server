import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "../utils/model-helper.js";

export const Staff = sequelize.define(
  "Staff",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    employeeCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    staffType: {
      type: DataTypes.ENUM("teaching", "non_teaching", "contractual", "visiting"),
      allowNull: false,
    },
    designation: { type: DataTypes.STRING(150), allowNull: true },
    department: { type: DataTypes.STRING(150), allowNull: true },
    joiningDate: { type: DataTypes.DATEONLY, allowNull: false },
    employmentStatus: {
      type: DataTypes.ENUM("probation", "confirmed", "notice_period", "resigned", "terminated"),
      defaultValue: "probation",
    },
    panNumber: { type: DataTypes.STRING(255), allowNull: true },
    bankAccountNumber: { type: DataTypes.STRING(255), allowNull: true },
  }),
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: "staff",
    // indexes: [
    //   { unique: true, fields: ["tenant_id", "employee_code"] },
    //   { fields: ["tenant_id", "staff_type"] },
    // ],
  }
);