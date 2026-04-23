import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant } from "../withTenant.js";

export const FeeStructureItem = sequelize.define(
  "FeeStructureItem",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    feeStructureId: {
      type: DataTypes.UUID,
      references: { model: "fee_structures", key: "id" },
    },
    feeHeadId: {
      type: DataTypes.UUID,
      references: { model: "fee_heads", key: "id" },
    },
    amountRaw: { type: DataTypes.BIGINT, allowNull: false },
    isOptional: { type: DataTypes.BOOLEAN, defaultValue: false },
  }),
  { tableName: "fee_structure_items", underscored: true },
);
