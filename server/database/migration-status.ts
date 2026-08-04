import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config.js";
import { createDatabase } from "./pool.js";

const migrationsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");
const config = loadConfig();
const database = createDatabase(config.DATABASE_URL);

try {
  const expected = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();
  const table = await database.query<{ exists: boolean }>("SELECT to_regclass('public.schema_migrations') IS NOT NULL AS exists");
  const applied = table.rows[0]?.exists
    ? (await database.query<{ version: string }>("SELECT version FROM schema_migrations ORDER BY version")).rows.map((row) => row.version)
    : [];
  const pending = expected.filter((version) => !applied.includes(version));
  const unknown = applied.filter((version) => !expected.includes(version));

  console.log(JSON.stringify({ status: pending.length === 0 && unknown.length === 0 ? "current" : "attention_required", expected, applied, pending, unknown }, null, 2));
  if (unknown.length > 0) process.exitCode = 2;
} finally {
  await database.end();
}
