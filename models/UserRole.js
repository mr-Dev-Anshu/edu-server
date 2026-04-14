import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const UserRole = sequelize.define(
  "UserRole",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "roles", key: "id" },
      onDelete: "CASCADE",
    },
    academicYearId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "academic_years", key: "id" },
    },
    assignedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    underscored: true,
    tableName: "user_roles",
    // indexes: [
    //   { unique: true, fields: ["user_id", "role_id", "academic_year_id"] },
    //   { fields: ["user_id"] },
    //   { fields: ["role_id"] },
    // ],
  }
);

export default UserRole;
