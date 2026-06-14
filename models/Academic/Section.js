import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant } from "../withTenant.js";

export const Section = sequelize.define(
  "Section",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "classes", key: "id" },
      onDelete: "CASCADE",
    },
    academicYearId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "academic_years", key: "id" },
      onDelete: "CASCADE",
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 40,
    },
    classTeacherId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "sections",
    indexes: [
      { fields: ["tenant_id", "class_id", "academic_year_id"] },
    ],
  }
);