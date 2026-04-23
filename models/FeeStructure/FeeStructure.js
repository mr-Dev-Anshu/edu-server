import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant } from "../withTenant.js";

export const FeeStructure = sequelize.define(
  "FeeStructure",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    academicYearId: {
      type: DataTypes.UUID,
      references: { model: "academic_years", key: "id" },
    },
    classId: {
      type: DataTypes.UUID,
      references: { model: "classes", key: "id" },
      allowNull: true, 
    },
    name: { type: DataTypes.STRING, allowNull: false },
  }),
  { tableName: "fee_structures", underscored: true },
);
