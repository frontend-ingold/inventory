import { Pool } from "pg";
import { env } from "./env.js";

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  return pool;
}
