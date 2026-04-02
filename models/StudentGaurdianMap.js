import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "../utils/model-helper.js";

const StudentGuardianMap = sequelize.define(
  "StudentGuardianMap",
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
    guardianId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "guardians", key: "id" },
      onDelete: "CASCADE",
    },
    relationType: {
      type: DataTypes.ENUM("father", "mother", "guardian", "other"),
      allowNull: false,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    canPickup: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "student_guardian_maps",
    indexes: [
      { unique: true, fields: ["tenant_id", "student_id", "guardian_id"] },
      { fields: ["tenant_id", "guardian_id"] },
    ],
  }
);

export default StudentGuardianMap;