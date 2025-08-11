import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Ensure pgcrypto extension for gen_random_uuid()
(async () => {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
  } catch (err) {
    console.warn('Warning: failed to ensure pgcrypto extension:', err);
  }
})();