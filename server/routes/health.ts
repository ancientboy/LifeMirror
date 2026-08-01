import type { FastifyInstance } from "fastify";
import type { Database } from "../database/pool.js";
import type { LlmProvider } from "../llm/types.js";

export async function registerHealthRoutes(
  app: FastifyInstance,
  dependencies: { database: Database; llm: LlmProvider },
) {
  app.get("/health/live", async () => ({
    status: "ok",
    service: "life-mirror-api",
    phase: "PHASE-001",
  }));

  app.get("/health/ready", async (_request, reply) => {
    try {
      await dependencies.database.query("SELECT 1");
      return { status: "ready", database: "connected", llmProvider: dependencies.llm.name };
    } catch {
      return reply.code(503).send({ status: "not_ready", database: "unavailable" });
    }
  });
}
