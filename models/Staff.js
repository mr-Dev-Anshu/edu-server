import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "./withTenant.js";

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
      type: DataTypes.ENUM("Teacher", "Librarian", "AdmissionHead", "Accountant", "Other"),
      allowNull: false,
    },
    designation: { type: DataTypes.STRING(150), allowNull: true },
    department: { type: DataTypes.STRING(150), allowNull: true },
    joiningDate: { type: DataTypes.DATEONLY, allowNull: false },
    employmentStatus: {
      type: DataTypes.ENUM(
        "probation",
        "confirmed",
        "notice_period",
        "resigned",
        "terminated",
      ),
      defaultValue: "probation",
    },
    panNumber: { type: DataTypes.STRING(255), allowNull: true },
    bankName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    bankBranch: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    bankAccountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ifscCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[A-Z]{4}0[A-Z0-9]{6}$/,
      },
    },
    accountHolderName: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    basicSalary: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
    },
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
  },
);
