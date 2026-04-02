import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "../utils/model-helper.js";

/**
 * We wrap the custom User fields with the withTenant helper.
 * This automatically adds tenantId, customFields, and metadata.
 */
const User = sequelize.define(
  "User",
  withTenant({
    // --- Authentication ---
    cognitoSub: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      index: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    
    // --- Profile ---
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // --- RBAC & Logic ---
    userType: {
      type: DataTypes.ENUM(
        "super_admin",   
        "org_admin",     
        "staff",         
        "teacher",       
        "student",       
        "parent",        
        "vendor"         
      ),
      allowNull: false,
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
    twoFactorEnabled: {
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
        notifications: { email: true, sms: true, push: true },
        language: "en",
        theme: "system",
      },
    },
  }),
  {
    timestamps: true,
    paranoid: true, 
    underscored: true,
    tableName: "users",
    indexes: [
      { unique: true, fields: ["tenant_id", "email"] },
      { fields: ["tenant_id"] },
      { fields: ["cognito_sub"] },
      { fields: ["user_type"] },
      { fields: ["status"] },
    ],
  }
);


/**
 *  ARCHITECTURAL OVERRIDE: Global Super Admin Support
 * * By default, 'withTenant' forces a strict tenantId (allowNull: false).
 * However, 'Super Admins' are platform-level users who do not belong 
 * to a specific school/college (tenantId = NULL). 
 * * We use getAttributes() to relax this constraint specifically for the User model.
 */

User.getAttributes().tenantId.allowNull = true;
User.refreshAttributes();

export default User;