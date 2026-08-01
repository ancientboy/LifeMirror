export type LlmRole = "system" | "user" | "assistant";

export type LlmMessage = {
  role: LlmRole;
  content: string;
};

export type LlmGenerateRequest = {
  messages: LlmMessage[];
  temperature?: number;
  maxOutputTokens?: number;
};

export type LlmGenerateResult = {
  text: string;
  model: string;
  provider: string;
  requestId?: string;
};

export interface LlmProvider {
  readonly name: string;
  generate(request: LlmGenerateRequest): Promise<LlmGenerateResult>;
}
