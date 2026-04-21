import "dotenv/config";
import sequelize from "../config/db.js";

const tableName = "roles";

const migrateRoleColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    await sequelize.authenticate();

    const tableDefinition = await queryInterface.describeTable(tableName);
    const hasSlug = "slug" in tableDefinition;
    const hasRoleType = "role_type" in tableDefinition;

    if (!hasSlug && hasRoleType) {
      console.log("roles.role_type already exists and slug is already removed.");
      return 0;
    }

    if (hasSlug && !hasRoleType) {
      await queryInterface.renameColumn(tableName, "slug", "role_type");
      console.log("Renamed roles.slug to roles.role_type.");
      return 0;
    }

    if (hasSlug && hasRoleType) {
      await sequelize.transaction(async (transaction) => {
        await sequelize.query(
          `
            UPDATE roles
            SET role_type = slug
            WHERE role_type IS NULL
          `,
          { transaction },
        );

        await queryInterface.removeColumn(tableName, "slug", { transaction });
      });

      console.log("Copied any missing values to roles.role_type and removed roles.slug.");
      return 0;
    }

    console.log("No role column changes were needed.");
    return 0;
  } catch (error) {
    console.error("Role column migration failed:", error);
    return 1;
  } finally {
    await sequelize.close();
  }
};

const exitCode = await migrateRoleColumn();
process.exit(exitCode);
