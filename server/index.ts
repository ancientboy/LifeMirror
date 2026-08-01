import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createDatabase } from "./database/pool.js";
import { createLlmProvider } from "./llm/provider.js";

const config = loadConfig();
const database = createDatabase(config.DATABASE_URL);
const llm = createLlmProvider(config);
const app = await buildApp({ config, database, llm });

async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  await app.close();
  await database.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

await app.listen({ host: config.API_HOST, port: config.API_PORT });
