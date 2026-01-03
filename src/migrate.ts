import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { env } from "./env.js";

const { Client } = pg;

export async function runMigrations() {
  const client = new Client({ connectionString: env.databaseUrl });
  await client.connect();

  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await client.query(sql);
  }

  await client.end();
}

