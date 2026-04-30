// import sequelize from "../config/db.js";
// import "../models/index.js";

// const run = async () => {
//   const transaction = await sequelize.transaction();
//   try {
//     await sequelize.query(
//       `ALTER TABLE "products"
//        ADD COLUMN IF NOT EXISTS "tenant_id" UUID`,
//       { transaction },
//     );

//     await sequelize.query(
//       `ALTER TABLE "products"
//        ADD COLUMN IF NOT EXISTS "custom_fields" JSONB DEFAULT '{}'::jsonb`,
//       { transaction },
//     );

//     await sequelize.query(
//       `ALTER TABLE "products"
//        ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb`,
//       { transaction },
//     );

//     const [tenantColumnRows] = await sequelize.query(
//       `SELECT udt_name
//        FROM information_schema.columns
//        WHERE table_schema = 'public'
//          AND table_name = 'products'
//          AND column_name = 'tenant_id'`,
//       { transaction },
//     );

//     const tenantColumnType = tenantColumnRows[0]?.udt_name || null;
//     if (tenantColumnType && tenantColumnType !== "uuid") {
//       await sequelize.query(
//         `ALTER TABLE "products"
//          DROP CONSTRAINT IF EXISTS "products_tenant_id_fkey"`,
//         { transaction },
//       );

//       await sequelize.query(
//         `ALTER TABLE "products"
//          DROP COLUMN "tenant_id"`,
//         { transaction },
//       );

//       await sequelize.query(
//         `ALTER TABLE "products"
//          ADD COLUMN "tenant_id" UUID`,
//         { transaction },
//       );
//     }

//     await sequelize.query(
//       `DO $$
//        BEGIN
//          IF NOT EXISTS (
//            SELECT 1
//            FROM information_schema.table_constraints
//            WHERE table_schema = 'public'
//              AND table_name = 'products'
//              AND constraint_name = 'products_tenant_id_fkey'
//          ) THEN
//            ALTER TABLE "products"
//            ADD CONSTRAINT "products_tenant_id_fkey"
//            FOREIGN KEY ("tenant_id")
//            REFERENCES "tenants"("id")
//            ON UPDATE CASCADE
//            ON DELETE SET NULL;
//          END IF;
//        END $$;`,
//       { transaction },
//     );

//     await transaction.commit();
//     console.log("Product table schema fixed successfully.");
//     process.exit(0);
//   } catch (error) {
//     if (!transaction.finished) {
//       await transaction.rollback();
//     }
//     console.error("Product table schema fix failed:", error.message);
//     process.exit(1);
//   } finally {
//     await sequelize.close();
//   }
// };

// run();
