import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { withTenant } from "../utils/model-helper.js";

const Role = sequelize.define(
  "Role",
  withTenant({
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    /**
     * Hierarchy Level: 0 (Super Admin) -> 10 (Student/Guest)
     * This prevents a 'Teacher' from deleting a 'Principal'
     */
    hierarchyLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
  }),
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: "roles",
    indexes: [
      { unique: true, fields: ["tenant_id", "slug"] },
      { fields: ["tenant_id"] },
    ],
  }
);

/**
 *ARCHITECTURAL OVERRIDE
 * Roles can be Global (System Roles) or Tenant-Specific.
 */
Role.getAttributes().tenantId.allowNull = true;
Role.refreshAttributes();

export default Role;