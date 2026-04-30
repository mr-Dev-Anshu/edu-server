import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "../utils/withTenant.js";

export const Course = sequelize.define(
  "Course",
  withTenant({
    // PRIMARY KEY — unique id har course ka
    id: {
      type: DataTypes.UUID,        // UUID — "abc123-xyz" jaisa id
      defaultValue: DataTypes.UUIDV4, // automatically generate hoga
      primaryKey: true,
    },

    // Course ka naam
    name: {
      type: DataTypes.STRING,
      allowNull: false,            // required field
    },

    // Course ki description
    description: {
      type: DataTypes.TEXT,        // long text ke liye
    },
  }),
  {
    tableName: "courses",          // PostgreSQL mein table name
  }
);