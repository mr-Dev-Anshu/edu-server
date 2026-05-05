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
    paranoid: true,
    underscored: true,
    tableName: "subjects",
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "class_id", "code"],
        where: { deleted_at: null },
        name: "uq_subject_tenant_class_code",
      },
      {
        fields: ["tenant_id", "class_id"],
        name: "idx_subject_tenant_class",
      },
      {
        fields: ["tenant_id", "code"],
        name: "idx_subject_tenant_code",
      },
    ],
  }
);

export default Subject ; 
