import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Standalone scripts (ingest, enrich, embed, eval) run outside Next.js, which
// normally loads .env.local itself. This is a no-op there since Next already
// sets these before any app code runs, and it's a no-op in production where
// there's no .env.local file.
config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
