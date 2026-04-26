export const FeeHead = sequelize.define(
  "FeeHead",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false }, 
    description: { type: DataTypes.STRING },
  }),
  { tableName: "fee_heads", underscored: true },
);