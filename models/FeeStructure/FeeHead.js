import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant } from "../withTenant.js";

export const FeeHead = sequelize.define(
  "FeeHead",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false }, 
    description: { type: DataTypes.STRING },
  }),
  { tableName: "fee_heads", underscored: true, paranoid: true },
);