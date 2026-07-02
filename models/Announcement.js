import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "./withTenant.js";

export const Announcement = sequelize.define(
  "Announcement",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      defaultValue: "medium",
    },

    targetAudience: {
      type: DataTypes.ENUM("students", "teachers", "parents", "staff", "all"),
      defaultValue: "all",
    },

    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "announcements",
  },
);
