import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "./withTenant.js";

export const Attendance = sequelize.define(
  "Attendance",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "students", key: "id" },
    },
    sectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "sections", key: "id" },
      onDelete: "CASCADE",
    },
    academicYearId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "academic_years", key: "id" },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("present", "absent", "late", "half_day", "on_leave", "holiday"),
      allowNull: false,
    },
    inTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    outTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    markedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    markedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isCorrected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    correctedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    correctionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notificationSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "attendance",
    validate: {
      checkTimes() {
        if (this.inTime && this.outTime && this.outTime <= this.inTime) {
          throw new Error("Out-time must be later than in-time.");
        }
      }
    },
    // indexes: [
    //   { unique: true, fields: ["tenant_id", "student_id", "date"] },
    //   { fields: ["tenant_id", "section_id", "date"] },
    //   { fields: ["tenant_id", "academic_year_id"] },
    //   { fields: ["tenant_id", "date", "status"] },
    // ],
  }
);