export type MirrorKind = "tarot" | "bazi" | "astrology" | "daily";

export type JudgmentFact = { id: string; label: string; text: string };
export type JudgmentFactPack = { version: 1; kind: MirrorKind; boundary: string; facts: JudgmentFact[]; sourceLabels: string[] };

const boundaries: Record<MirrorKind, string> = {
  tarot: "牌面、牌阵位置与正逆位是本次唯一的象征事实；不得把它写成确定的未来或用户经历。",
  bazi: "四柱、五行与结构关系是传统历法的计算结果；不得把它写成确定的人生结论。",
  astrology: "行星、宫位与相位是星历计算结果；不得把它写成确定的未来或用户经历。",
  daily: "只可引用本次实际计算出的个人底图、当日变量与用户主动保存的近期记录。",
};

export function buildJudgmentFactPack(kind: Exclude<MirrorKind, "daily">, facts: string): JudgmentFactPack {
  const lines = facts.split(/\n+/u).map((item) => item.replace(/^[-•\s]+/u, "").trim()).filter((item) => item.length >= 4).slice(0, 12);
  const label = kind === "tarot" ? "牌面事实" : kind === "bazi" ? "命盘事实" : "星盘事实";
  return { version: 1, kind, boundary: boundaries[kind], facts: (lines.length ? lines : [facts.trim()]).filter(Boolean).map((text, index) => ({ id: `fact_${index + 1}`, label, text: text.slice(0, 600) })), sourceLabels: [label] };
}

export function isJudgmentFactPack(value: unknown): value is JudgmentFactPack {
  if (!value || typeof value !== "object") return false;
  const pack = value as Partial<JudgmentFactPack>;
  return pack.version === 1 && ["tarot", "bazi", "astrology", "daily"].includes(pack.kind ?? "") && typeof pack.boundary === "string" && Array.isArray(pack.facts) && pack.facts.length > 0 && pack.facts.length <= 16 && pack.facts.every((fact) => fact && typeof fact.id === "string" && typeof fact.label === "string" && typeof fact.text === "string") && Array.isArray(pack.sourceLabels);
}

export function formatJudgmentFactPack(pack: JudgmentFactPack) { return pack.facts.map((fact) => `- [${fact.id}] ${fact.label}：${fact.text}`).join("\n"); }
export function hasOnlyKnownFactIds(value: unknown, pack: JudgmentFactPack) {
  const ids = Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  const allowed = new Set(pack.facts.map((fact) => fact.id));
  return ids.length > 0 && ids.length === (Array.isArray(value) ? value.length : 0) && ids.every((id) => allowed.has(id));
}
