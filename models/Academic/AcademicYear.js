import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant } from "../withTenant.js";



export const AcademicYear = sequelize.define(
  "AcademicYear",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    isCurrent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "academic_years",
    // indexes: [
    //   { unique: true, fields: ["tenant_id", "name"] },
    //   { fields: ["tenant_id", "is_current"] },
    //   { unique: true, fields: ["tenant_id"], where: { is_current: true } },
    // ],
  }
);