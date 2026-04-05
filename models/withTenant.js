import { DataTypes } from "sequelize";

export const withTenant = (schema) => {
  return {
    ...schema,
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "tenants",
        key: "id",
      },
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
