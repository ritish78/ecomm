import { migrate } from "drizzle-orm/node-postgres/migrator";
import db from ".";

(async function migrateSchema() {
  try {
    console.log("Migration Started!");
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migration Finished!");
  } catch (error) {
    console.error("Error occured durring migration!", error);
    process.exit(1);
  }
})();
