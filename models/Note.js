import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Note = sequelize.define(
  "Note",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { len: [1, 255] },
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    paranoid: false,
    underscored: true,
    tableName: "notes",
  }
);

export default Note;