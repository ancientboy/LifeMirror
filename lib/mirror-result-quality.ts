export type MirrorShareCards = {
  warm: string;
  roast: string;
  witty: string;
};

export type MirrorResultCandidate = {
  headline: string;
  interpretation: string;
  action: string;
  reflectionQuestion: string;
  shareCards: MirrorShareCards;
};

const forbidden = /翻译(?:一下|成人话)?|人话(?:版)?|基础规则|拾光\s*AI|模型|系统提示/u;

function normalized(value: string) {
  return value.replace(/[，。！？、\s]/gu, "");
}

function overlap(left: string, right: string) {
  const grams = (text: string) => new Set(Array.from({ length: Math.max(0, text.length - 1) }, (_, index) => text.slice(index, index + 2)));
  const a = grams(normalized(left));
  const b = grams(normalized(right));
  const common = [...a].filter((item) => b.has(item)).length;
  return common / Math.max(1, Math.min(a.size, b.size));
}

/**
 * Keeps the API and the result UI aligned: a response is either a complete,
 * clearly separated Shiguang result, or it is shown as the labelled basic
 * reading.  Do not silently repair a model response here.
 */
export function mirrorResultQualityError(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "result_not_object";
  const result = value as Partial<MirrorResultCandidate>;
  for (const field of ["headline", "interpretation", "action", "reflectionQuestion"] as const) {
    const text = result[field];
    if (typeof text !== "string" || text.trim().length < 8) return `invalid_${field}`;
    if (forbidden.test(text)) return `internal_${field}`;
  }
  const cards = result.shareCards;
  if (!cards || typeof cards !== "object") return "missing_share_cards";
  for (const field of ["warm", "roast", "witty"] as const) {
    const text = cards[field];
    if (typeof text !== "string" || text.trim().length < 12 || text.trim().length > 30) return `invalid_share_${field}`;
    if (forbidden.test(text)) return `internal_share_${field}`;
  }
  if (/(?:对照|回应|发给|\bTA\b)/u.test(cards.warm)) return "wrong_scene_warm";
  if (!/(?:你|我们|回应|说清|沉默|一起)/u.test(cards.roast)) return "wrong_scene_roast";
  if (!/(?:你|对照|也看看|一起)/u.test(cards.witty)) return "wrong_scene_witty";
  const lines = [cards.warm, cards.roast, cards.witty];
  if (overlap(lines[0], lines[1]) >= 0.72 || overlap(lines[0], lines[2]) >= 0.72 || overlap(lines[1], lines[2]) >= 0.72) return "duplicate_share_cards";
  return null;
}

export function isCompleteMirrorResult(value: unknown): value is MirrorResultCandidate {
  return mirrorResultQualityError(value) === null;
}
