import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant } from "../withTenant.js";

 const Subject = sequelize.define(
  "Subject",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "classes", key: "id" },
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    subjectType: {
      type: DataTypes.ENUM("theory", "practical", "co_curricular", "language"),
      defaultValue: "theory",
    },
    isElective: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    weeklyPeriods: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "subjects",
    indexes: [
      { fields: ["tenant_id", "class_id"] },
      { fields: ["tenant_id", "code"] },
    ],
  }
);

export default Subject ; 
