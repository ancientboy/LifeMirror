import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import type { AppConfig } from "./config.js";
import type { Database } from "./database/pool.js";
import type { LlmProvider } from "./llm/types.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerDailyMirrorRoutes } from "./routes/daily-mirror.js";
import { registerMemoryRoutes } from "./routes/memories.js";
import { registerReviewRoutes } from "./routes/reviews.js";
import { registerContextRoutes } from "./routes/context.js";
import { registerPersonMirrorRoutes } from "./routes/person-mirror.js";
import { RuntimeMetrics } from "./observability/metrics.js";

export type AppDependencies = {
  config: AppConfig;
  database: Database;
  llm: LlmProvider;
  metrics?: RuntimeMetrics;
};

export async function buildApp(dependencies: AppDependencies) {
  dependencies.metrics ??= new RuntimeMetrics();
  const app = Fastify({
    logger: dependencies.config.NODE_ENV !== "test",
    bodyLimit: 64 * 1024,
    trustProxy: true,
  });

  await app.register(cors, {
    origin: dependencies.config.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (origin && origin !== dependencies.config.WEB_ORIGIN) {
      return reply.code(403).send({ error: "origin_not_allowed" });
    }

    if (origin) {
      reply.header("access-control-allow-origin", dependencies.config.WEB_ORIGIN);
      reply.header("access-control-allow-credentials", "true");
      reply.header("vary", "Origin");
    }
  });

  app.addHook("onResponse", async (request, reply) => {
    const route = request.routeOptions.url ?? "unmatched";
    dependencies.metrics?.observeRequest(reply.elapsedTime, request.method, route, reply.statusCode);
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "request failed");
    return reply.code(500).send({ error: "internal_server_error" });
  });

  await registerHealthRoutes(app, dependencies);
  await registerAuthRoutes(app, dependencies);
  await registerDailyMirrorRoutes(app, dependencies);
  await registerMemoryRoutes(app, dependencies);
  await registerContextRoutes(app, dependencies);
  await registerPersonMirrorRoutes(app, dependencies);
  await registerReviewRoutes(app, dependencies);

  return app;
}
