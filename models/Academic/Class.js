import sequelize from "../../config/db";
import { withTenant } from "../withTenant";

export const Class = sequelize.define(
  "Class",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    numericLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "classes",
    indexes: [
      { unique: true, fields: ["tenant_id", "name"] },
      { fields: ["tenant_id", "numeric_level"] },
    ],
  }
);