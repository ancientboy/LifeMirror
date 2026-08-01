import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config.js";
import { createDatabase } from "./pool.js";

const migrationsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");
const config = loadConfig();
const database = createDatabase(config.DATABASE_URL);

try {
  await database.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      const applied = await client.query("SELECT 1 FROM schema_migrations WHERE version = $1", [file]);
      if (applied.rowCount === 0) {
        await client.query(await readFile(path.join(migrationsDirectory, file), "utf8"));
        await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [file]);
        console.log(`Applied migration ${file}`);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await database.end();
}
