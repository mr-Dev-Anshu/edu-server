import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "../utils/model-helper.js";

export const Guardian = sequelize.define(
  "Guardian",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    relation: {
      type: DataTypes.ENUM("father", "mother", "guardian", "grandparent", "sibling", "other"),
      allowNull: false,
    },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    occupation: { type: DataTypes.STRING(150), allowNull: true },
    isPrimaryContact: { type: DataTypes.BOOLEAN, defaultValue: true },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "guardians",
    indexes: [
      { fields: ["tenant_id", "phone"] },
    ],
  }
);