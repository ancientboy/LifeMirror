import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().max(65_535).default(8787),
  WEB_ORIGIN: z.string().url().default("http://localhost:4173"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_COOKIE_NAME: z.string().min(1).default("life_mirror_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().max(365).default(30),
  SESSION_COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("strict"),
  REFLECTION_TOKEN_SECRET: z.string().min(32).default("development-only-reflection-secret"),
  LLM_PROVIDER: z.enum(["disabled", "openai-compatible"]).default("disabled"),
  LLM_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
});

export type AppConfig = z.infer<typeof environmentSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(environment);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
  }

  if (parsed.data.LLM_PROVIDER === "openai-compatible") {
    if (!parsed.data.LLM_API_KEY || !parsed.data.LLM_MODEL) {
      throw new Error("LLM_API_KEY and LLM_MODEL are required for openai-compatible provider");
    }
  }

  if (parsed.data.NODE_ENV === "production" && parsed.data.REFLECTION_TOKEN_SECRET === "development-only-reflection-secret") {
    throw new Error("REFLECTION_TOKEN_SECRET must be changed in production");
  }

  return parsed.data;
}
