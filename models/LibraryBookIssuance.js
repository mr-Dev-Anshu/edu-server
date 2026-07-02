import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "./withTenant.js";

export const LibraryBookIssuance = sequelize.define(
  "LibraryBookIssuance",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bookAuthor: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isbn: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    issuedToId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    issuedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    returnDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("issued", "returned", "overdue", "lost"),
      defaultValue: "issued",
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }),
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: "library_book_issuances",
  }
);
