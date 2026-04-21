import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "./withTenant.js";

const User = sequelize.define(
  "User",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false, 
    },
    cognitoSub: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    
    // --- Profile ---
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("active", "inactive", "suspended", "pending_verification"),
      defaultValue: "pending_verification",
    },

    // --- Security & Preferences ---
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        language: "en",
        theme: "system",
      },
    },
  }, { isGlobal: true }), 
  {
    timestamps: true,
    paranoid: true, 
    underscored: true,
    tableName: "users",
    // indexes: [
    //   { unique: true, fields: [ "email"] },
    //   { fields: ["user_type"] },
    // ],
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    scopes: {
      withPassword: { attributes: {} }
    }
  }
);

export default User;