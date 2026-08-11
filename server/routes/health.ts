import type { FastifyInstance } from "fastify";
import type { Database } from "../database/pool.js";
import type { LlmProvider } from "../llm/types.js";
import type { RuntimeMetrics } from "../observability/metrics.js";
import type { AppConfig } from "../config.js";

export async function registerHealthRoutes(
  app: FastifyInstance,
  dependencies: { database: Database; llm: LlmProvider; metrics?: RuntimeMetrics; config?: AppConfig },
) {
  app.get("/health/live", async () => ({
    status: "ok",
    service: "life-mirror-api",
    phase: "PHASE-011-019",
    sourceCommit: dependencies.config?.SOURCE_COMMIT ?? "unknown",
  }));

  app.get("/health/metrics", async (request, reply) => {
    const token = dependencies.config?.METRICS_TOKEN;
    if (token && request.headers["x-metrics-token"] !== token) return reply.code(401).send({ error: "metrics_authentication_required" });
    return { status: "ok", metrics: dependencies.metrics?.snapshot() };
  });

  app.get("/health/ready", async (_request, reply) => {
    try {
      await dependencies.database.query("SELECT 1");
      return { status: "ready", database: "connected", llmProvider: dependencies.llm.name };
    } catch {
      return reply.code(503).send({ status: "not_ready", database: "unavailable" });
    }
  });
}
