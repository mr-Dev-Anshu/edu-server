import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { withTenant, tenantIndex } from "../../utils/withTenant.js";
export const Vehicle = sequelize.define(
  "Vehicle",
  withTenant({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    registrationNumber: { type: DataTypes.STRING(50), allowNull: false },
    vehicleType: {
      type: DataTypes.ENUM("bus", "van", "auto", "cab"),
      allowNull: false,
    },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
  }),
  {
    timestamps: true,
    underscored: true,
    tableName: "vehicles",
    indexes: [...tenantIndex(["registration_number"], { unique: true })],
  },
);
