import type { InteractionMode, ModeDecision } from "./types.js";

const MODE_SIGNALS: Record<Exclude<InteractionMode, "casual">, RegExp[]> = {
  review: [/复盘|回顾|总结|这一周|这个月|weekly review|monthly review/i],
  deep: [/深入|深度|系统分析|为什么总是|反复出现|根本原因|deep analysis/i],
  reflection: [/反思|梳理情绪|我在逃避|我真正重视|帮我想清楚|reflect/i],
  exploration: [/探索|有哪些可能|换个角度|假如|灵感|brainstorm|explore/i],
};

export function routeInteractionMode(input: { text: string; requestedMode?: InteractionMode }): ModeDecision {
  if (input.requestedMode) return { mode: input.requestedMode, confidence: 1, reasons: ["user_requested"], source: "explicit" };
  const normalized = input.text.trim();
  for (const mode of ["review", "deep", "reflection", "exploration"] as const) {
    const signal = MODE_SIGNALS[mode].find((pattern) => pattern.test(normalized));
    if (signal) return { mode, confidence: 0.82, reasons: [`matched_${mode}_signal`], source: "deterministic" };
  }
  return { mode: "casual", confidence: normalized ? 0.68 : 0.5, reasons: [normalized ? "no_specialized_signal" : "empty_input"], source: "fallback" };
}
