import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant, tenantIndex } from "../withTenant.js";
export const Notice = sequelize.define("Notice", withTenant({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(300), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM("draft", "published", "expired"), defaultValue: "draft" },
  createdById: { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" } },
}), { timestamps: true, underscored: true, tableName: "notices" });
