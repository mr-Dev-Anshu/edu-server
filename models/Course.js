import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "./withTenant.js";

const Course = sequelize.define(
  "Course",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }),
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: "courses",
  }
);

export default Course;