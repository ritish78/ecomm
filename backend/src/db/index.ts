import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { POSTGRES_DATA_URL } from "../config";

const { Pool } = pkg;

const pool: pkg.Pool = new Pool({ connectionString: POSTGRES_DATA_URL });

pool.on("connect", () => {
  console.log("Connected to Postgres!");
});

pool.on("release", () => {
  console.log("Released from pool!");
});

const db = drizzle(pool, { logger: true });

export default db;
