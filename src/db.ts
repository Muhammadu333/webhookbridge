import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

function shouldUseSsl(databaseUrl: string): boolean {
  if (/sslmode=require/i.test(databaseUrl)) return true;
  if ((process.env.PGSSLMODE ?? "").toLowerCase() === "require") return true;
  // Render Postgres commonly expects SSL; enable it in hosted environments.
  if (process.env.RENDER_SERVICE_ID) return true;
  if (process.env.RENDER) return true;
  return false;
}

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: shouldUseSsl(env.databaseUrl) ? { rejectUnauthorized: false } : undefined
});
