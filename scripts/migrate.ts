import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

async function main() {
  const client = new Client({ connectionString: requiredEnv("DATABASE_URL") });
  await client.connect();

  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await client.query(sql);
    // eslint-disable-next-line no-console
    console.log(`Applied ${file}`);
  }

  await client.end();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

