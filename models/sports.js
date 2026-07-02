import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Sport = sequelize.define(
  "Sport",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    eventDate: {
      type: DataTypes.DATEONLY,
    },
    location: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM("Upcoming", "Ongoing", "Completed"),
      defaultValue: "Upcoming",
    },
  },
  {
    tableName: "sports",
    timestamps: true,
  },
);

export default Sport;
