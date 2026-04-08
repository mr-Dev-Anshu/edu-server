import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "./withTenant.js";

export const AttendancePeriod = sequelize.define(
  "AttendancePeriod",
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
    timetableSlotId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "timetable_slots", key: "id" },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("present", "absent", "late"),
      allowNull: false,
    },
    markedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "attendance_periods",
    indexes: [
      /**
       * Principal's Optimization: 
       * Prevents a student from having two attendance records for the same lecture/slot on the same day.
       */
      { 
        unique: true, 
        fields: ["tenant_id", "student_id", "timetable_slot_id", "date"],
        name: "unique_student_period_attendance" 
      },
      // Fast lookup for a student's daily period-wise summary
      { fields: ["tenant_id", "student_id", "date"] },
      // Fast lookup for the teacher/admin to see who marked it
      { fields: ["tenant_id", "timetable_slot_id", "date"] },
    ],
  }
);

export default AttendancePeriod;