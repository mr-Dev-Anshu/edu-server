import "dotenv/config";
import sequelize from "../config/db.js";

const dropRoleTypeUniqueIndex = async () => {
  try {
    await sequelize.authenticate();

    const [indexes] = await sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'roles'
        AND indexname = 'roles_tenant_id_slug'
    `);

    if (!indexes.length) {
      console.log("No roleType unique index found on roles.");
      return 0;
    }

    await sequelize.query(`DROP INDEX IF EXISTS public.roles_tenant_id_slug`);
    console.log("Dropped unique index public.roles_tenant_id_slug.");
    return 0;
  } catch (error) {
    console.error("Dropping roleType unique index failed:", error);
    return 1;
  } finally {
    await sequelize.close();
  }
};

const exitCode = await dropRoleTypeUniqueIndex();
process.exit(exitCode);
