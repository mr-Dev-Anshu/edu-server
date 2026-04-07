import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant, tenantIndex } from "../../utils/withTenant.js";

export const AdmissionLead = sequelize.define(
  "AdmissionLead",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    academicYearId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "academic_years", key: "id" },
    },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100), allowNull: false },
    guardianName: { type: DataTypes.STRING(200), allowNull: false },
    guardianPhone: { type: DataTypes.STRING(20), allowNull: false },
    guardianEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    status: {
      type: DataTypes.ENUM(
        "new",
        "contacted",
        "document_submitted",
        "under_review",
        "approved",
        "enrolled",
        "rejected",
      ),
      defaultValue: "new",
    },
    assignedToId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    convertedStudentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "students", key: "id" },
    },
    documents: { type: DataTypes.JSONB, defaultValue: [] },
    statusHistory: { type: DataTypes.JSONB, defaultValue: [] },
  }),
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: "admission_leads",
    indexes: [...tenantIndex(["status"]), ...tenantIndex(["guardian_phone"])],
  },
);
