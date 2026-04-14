import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "roles", key: "id" },
      onDelete: "CASCADE",
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "permissions", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    timestamps: false,
    underscored: true,
    tableName: "role_permissions",
    // indexes: [
    //   { unique: true, fields: ["role_id", "permission_id"] },
    //   { fields: ["role_id"] },
    // ],
  }
);

export default RolePermission;
