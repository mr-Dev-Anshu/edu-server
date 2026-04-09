import sequelize from '../config/db.js';
import '../models/index.js';

const sync = async () => {
  try {
    console.log("🔄 Force syncing database...");
    await sequelize.sync({ alter: false });
    console.log("✅ Database structure updated.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  }
};

sync();