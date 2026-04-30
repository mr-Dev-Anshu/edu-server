import { DataTypes } from "sequelize";


export const withTenant = (schema, options = { isGlobal: false }) => {
  return {
    ...schema,
    tenantId: {
      type: DataTypes.UUID,
      allowNull: options.isGlobal,
      allowNull:false,
      references: {
        model: "tenants",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    customFields: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  };
};