import { DataTypes } from "sequelize";

export const withTenant = (fields) => ({
  ...fields,
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "tenant_id",
  },
});