import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "../utils/model-helper.js";

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
    underscored: true,
    tableName: "teacher_subject_assignments",
    indexes: [
    
    ],
  }
);

export default TeacherSubjectAssignment;