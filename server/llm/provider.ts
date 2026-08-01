import type { AppConfig } from "../config.js";
import { OpenAiCompatibleProvider } from "./providers/openai-compatible.js";
import type { LlmGenerateRequest, LlmGenerateResult, LlmProvider } from "./types.js";

class DisabledLlmProvider implements LlmProvider {
  readonly name = "disabled";

  async generate(_request: LlmGenerateRequest): Promise<LlmGenerateResult> {
    throw new Error("LLM provider is disabled");
  }
}

export function createLlmProvider(config: AppConfig): LlmProvider {
  if (config.LLM_PROVIDER === "disabled") return new DisabledLlmProvider();

  return new OpenAiCompatibleProvider({
    apiKey: config.LLM_API_KEY!,
    baseUrl: config.LLM_BASE_URL,
    model: config.LLM_MODEL!,
  });
}
