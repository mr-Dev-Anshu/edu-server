import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "./withTenant.js";

const TeacherSubjectAssignment = sequelize.define(
  "TeacherSubjectAssignment",
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
      onDelete: "CASCADE",
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "subjects", key: "id" },
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
    isPrimaryTeacher: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, 
    }
  }),
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: "teacher_subject_assignments",
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "staff_id", "subject_id", "section_id", "academic_year_id"],
        where: { deleted_at: null },
        name: "uq_teacher_assignment_business_key",
      },
      {
        fields: ["tenant_id", "subject_id", "section_id", "academic_year_id"],
        name: "idx_teacher_assignment_composite",
      },
    ],
  }
);

export default TeacherSubjectAssignment;