import type { LlmGenerateRequest, LlmGenerateResult, LlmProvider } from "../types.js";

type ProviderOptions = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

type ChatCompletionResponse = {
  id?: string;
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name = "openai-compatible";

  constructor(private readonly options: ProviderOptions) {}

  async generate(request: LlmGenerateRequest): Promise<LlmGenerateResult> {
    const response = await fetch(`${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.options.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxOutputTokens,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    const payload = (await response.json()) as ChatCompletionResponse;
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `LLM request failed with status ${response.status}`);
    }

    const text = payload.choices?.[0]?.message?.content;
    if (!text) throw new Error("LLM provider returned an empty response");

    return {
      text,
      model: payload.model ?? this.options.model,
      provider: this.name,
      requestId: payload.id,
    };
  }
}
