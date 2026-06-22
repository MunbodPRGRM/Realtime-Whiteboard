import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

/**
 * Reuse a single Pool across hot reloads in development. Without this,
 * Next.js' fast refresh would open a new pool on every change and quickly
 * exhaust Postgres connections.
 */
const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });
