import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "./withTenant.js";

const StudentSectionEnrollment = sequelize.define(
  "StudentSectionEnrollment",
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
      onDelete: "CASCADE",
    },
    sectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "sections", key: "id" },
    },
    academicYearId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "academic_years", key: "id" },
    },
    rollNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    isCurrent: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    enrollmentStatus: {
      type: DataTypes.ENUM("regular", "repeater", "promoted", "detained"),
      defaultValue: "regular",
    }
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "student_section_enrollments",
    // indexes: [
    // ],
  }
);

export default StudentSectionEnrollment;