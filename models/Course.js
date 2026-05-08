import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // ✅ fixed

export const Course = sequelize.define("Course", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
  },

  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});