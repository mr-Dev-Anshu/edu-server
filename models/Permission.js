export const Permission = sequelize.define(
  "Permission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // action:resource format — e.g. 'read:students', 'write:fees', 'delete:exams'
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    action: {
      // 'create' | 'read' | 'update' | 'delete' | 'manage'
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    resource: {
      // 'students' | 'fees' | 'exams' | 'staff' | 'reports' | etc.
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    module: {
      // which feature module this permission belongs to
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: "permissions",
    indexes: [
      { unique: true, fields: ["name"] },
      { fields: ["module"] },
      { fields: ["resource"] },
    ],
  }
);