import { getHexagramNumber, HEXAGRAM_NAMES, TRIGRAMS } from "./catalog.js";
import { analyzeTraditional, enrichLines, hexagramBody, palaceFor, voidBranches } from "./traditional-analysis.js";
import type { CoinToss, HexagramIdentity, LiuyaoAnalysisContext, LiuyaoCastingLine, LiuyaoEvidence, LiuyaoJudgmentPackage, LiuyaoResult, Polarity } from "./types.js";

function identityFromPolarities(polarities: Polarity[]): HexagramIdentity {
  const bits = polarities.map((polarity) => polarity === "yang" ? "1" : "0").join("");
  const lowerTrigram = TRIGRAMS[bits.slice(0, 3)];
  const upperTrigram = TRIGRAMS[bits.slice(3, 6)];
  if (!lowerTrigram || !upperTrigram) throw new Error("A hexagram requires six valid lines");

  const number = getHexagramNumber(upperTrigram.bits, lowerTrigram.bits);
  return {
    number,
    name: HEXAGRAM_NAMES.get(number)!,
    symbol: String.fromCodePoint(0x4dbf + number),
    upperTrigram,
    lowerTrigram,
  };
}

export function calculateLiuyao(tosses: readonly CoinToss[], analysisContext?: LiuyaoAnalysisContext): LiuyaoResult {
  if (tosses.length !== 6) throw new Error("Exactly six coin tosses are required");

  const baseLines: LiuyaoCastingLine[] = tosses.map((coins, index) => {
    if (coins.length !== 3 || coins.some((coin) => coin !== 2 && coin !== 3)) {
      throw new Error(`Toss ${index + 1} must contain exactly three coin values`);
    }

    const value = coins.reduce<number>((sum, coin) => sum + coin, 0) as 6 | 7 | 8 | 9;
    const polarity: Polarity = value === 6 || value === 8 ? "yin" : "yang";
    const moving = value === 6 || value === 9;
    return {
      position: index + 1,
      coins: [...coins] as CoinToss,
      value,
      polarity,
      moving,
      changedPolarity: moving ? (polarity === "yin" ? "yang" : "yin") : polarity,
    };
  });

  const originalHexagram = identityFromPolarities(baseLines.map((line) => line.polarity));
  const changedHexagram = identityFromPolarities(baseLines.map((line) => line.changedPolarity));
  const palace = palaceFor(baseLines.map((line) => line.polarity));
  const originalLines = enrichLines(baseLines, originalHexagram.lowerTrigram.key, originalHexagram.upperTrigram.key, palace, analysisContext);
  const changedLines = enrichLines(
    baseLines.map((line) => ({ ...line, polarity: line.changedPolarity })),
    changedHexagram.lowerTrigram.key,
    changedHexagram.upperTrigram.key,
    palace,
    analysisContext,
  );
  const lines = originalLines.map((line, index) => ({
    ...line,
    changedBranch: line.moving ? changedLines[index].branch : null,
    changedElement: line.moving ? changedLines[index].element : null,
  }));
  const movingLines = lines.filter((line) => line.moving).map((line) => line.position);
  const { analysis, evidence } = analyzeTraditional(lines, palace, analysisContext);
  const judgment = buildJudgmentPackage(lines, palace, analysisContext, analysis, evidence);

  return {
    method: "three_coins",
    lines,
    movingLines,
    originalHexagram,
    changedHexagram,
    divination: { originalHexagram, changedHexagram, movingLines },
    structure: {
      ...palace,
      hexagramBody: hexagramBody(lines, palace),
      sixRelations: lines.map((line) => line.relation),
      elements: lines.map((line) => line.element),
      voidBranches: analysisContext ? voidBranches(analysisContext.dayStem, analysisContext.dayBranch) : null,
    },
    analysis,
    evidence: judgment.keyEvidence.length ? collectEvidence(lines, palace, analysisContext, evidence) : evidence,
    judgment,
  };
}

function collectEvidence(
  lines: LiuyaoResult["lines"],
  palace: ReturnType<typeof palaceFor>,
  context: LiuyaoAnalysisContext | undefined,
  primaryEvidence: LiuyaoEvidence[],
) {
  if (!context?.intents?.length) return primaryEvidence;
  if (context.intents.length === 1) return primaryEvidence.map((item) => ({ ...item, intentId: context.intents![0].id }));
  const primaryIntent = context.intents[0];
  const collected = primaryEvidence.map((item) => ({
    ...item,
    id: `${primaryIntent.id}:${item.id ?? item.rule}`,
    intentId: primaryIntent.id,
  }));
  for (const intent of context.intents.slice(1)) {
    const result = analyzeTraditional(lines, palace, {
      ...context,
      topic: intent.topic,
      usefulGod: intent.usefulGod,
      scenario: intent.scenario,
      scenarioFocus: intent.scenarioFocus,
      intents: undefined,
    });
    collected.push(...result.evidence.map((item) => ({ ...item, id: `${intent.id}:${item.id ?? item.rule}`, intentId: intent.id })));
  }
  return collected;
}

function buildJudgmentPackage(
  lines: LiuyaoResult["lines"],
  palace: ReturnType<typeof palaceFor>,
  context: LiuyaoAnalysisContext | undefined,
  primaryAnalysis: LiuyaoResult["analysis"],
  primaryEvidence: LiuyaoEvidence[],
): LiuyaoJudgmentPackage {
  if (!context) return {
    verdicts: [{ intentId: "unknown", label: "当前问题", topic: "self", direction: "undetermined", confidence: 1, shortReason: "缺少主题和历法上下文" }],
    keyEvidence: primaryEvidence,
    limitations: ["缺少所测主题、月建和日辰，未运行完整六爻分析。"],
    tone: "grounded",
  };
  const intents = context.intents?.length
    ? context.intents
    : [{
      id: context.topic,
      label: "当前问题",
      topic: context.topic,
      priority: 1,
      ...(context.usefulGod ? { usefulGod: context.usefulGod } : {}),
      ...(context.scenario ? { scenario: context.scenario } : {}),
      ...(context.scenarioFocus ? { scenarioFocus: context.scenarioFocus } : {}),
    }];
  const analyses = intents.map((intent, index) => {
    if (index === 0 && intent.topic === context.topic) return { intent, analysis: primaryAnalysis, evidence: primaryEvidence };
    const calculated = analyzeTraditional(lines, palace, {
      ...context,
      topic: intent.topic,
      usefulGod: intent.usefulGod,
      scenario: intent.scenario,
      scenarioFocus: intent.scenarioFocus,
      intents: undefined,
    });
    return { intent, ...calculated };
  });
  const allEvidence = analyses.flatMap(({ intent, evidence }) => evidence.map((item) => ({
    ...item,
    id: `${intent.id}:${item.id ?? item.rule}`,
    intentId: intent.id,
  })));
  const focusByIntent = new Map(analyses.map(({ intent }) => [intent.id, intent.scenarioFocus]));
  const focusMultiplier = (item: LiuyaoEvidence) => {
    const focus = item.intentId ? focusByIntent.get(item.intentId) : undefined;
    if (focus === "investment_short_term") {
      if (/return_|transforms_|void|month_break|siblings_divide|investment_risk/.test(item.rule)) return 1.25;
      if (item.rule === "month_strength") return 0.8;
    }
    if (focus === "investment_long_term") {
      if (/month_strength|source_god|avoid_god|transforms_(progress|retreat)/.test(item.rule)) return 1.25;
      if (/^day_|hidden_movement|day_break/.test(item.rule)) return 0.75;
    }
    return 1;
  };
  const evidenceWeight = (item: LiuyaoEvidence) => Math.abs(item.strength ?? 0) * item.confidence * focusMultiplier(item);
  const compareEvidence = (a: LiuyaoEvidence, b: LiuyaoEvidence) =>
    evidenceWeight(b) - evidenceWeight(a)
    || b.confidence - a.confidence
    || a.rule.localeCompare(b.rule)
    || (a.line ?? 0) - (b.line ?? 0);
  const uniqueForIntent = (items: LiuyaoEvidence[]) => {
    const seen = new Set<string>();
    return [...items].sort(compareEvidence).filter((item) => {
      const key = `${item.intentId}:${item.rule}:${item.line ?? "all"}:${item.effect}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const rankedByIntent = analyses.map(({ intent }) => uniqueForIntent(allEvidence.filter((item) =>
    item.intentId === intent.id && item.effect !== "neutral" && item.rule !== "useful_god_by_topic",
  )));
  // Reserve evidence space for every intent first, so a secondary question cannot be crowded out by
  // several strong factors from the primary one.
  const keyEvidence: LiuyaoEvidence[] = [];
  for (let rank = 0; rank < 2 && keyEvidence.length < 6; rank += 1) {
    for (const items of rankedByIntent) {
      if (items[rank] && keyEvidence.length < 6) keyEvidence.push(items[rank]);
    }
  }
  const remaining = rankedByIntent.flatMap((items) => items.slice(2)).sort(compareEvidence);
  for (const item of remaining) if (keyEvidence.length < 6) keyEvidence.push(item);
  if (!keyEvidence.length) keyEvidence.push(...allEvidence.sort(compareEvidence).slice(0, 6));
  return {
    verdicts: analyses.map(({ intent, analysis, evidence }) => {
      const scoped = uniqueForIntent(evidence.map((item) => ({ ...item, intentId: intent.id })));
      const supportive = scoped.filter((item) => item.effect === "support" && (item.strength ?? 0) > 0).sort(compareEvidence);
      const obstructive = scoped.filter((item) => item.effect === "obstruct" && (item.strength ?? 0) < 0).sort(compareEvidence);
      const supportScore = supportive.reduce((sum, item) => sum + evidenceWeight(item), 0);
      const obstructionScore = obstructive.reduce((sum, item) => sum + evidenceWeight(item), 0);
      const total = supportScore + obstructionScore;
      const dominance = total ? Math.abs(supportScore - obstructionScore) / total : 0;
      const conflict = supportScore > 0 && obstructionScore > 0 && dominance < 0.45;
      const balance = total === 0 ? "insufficient" as const : conflict ? "conflicted" as const : supportScore > obstructionScore ? "supporting" as const : "opposing" as const;
      const direction = analysis.tendency === "undetermined" || total === 0
        ? analysis.tendency
        : conflict ? "mixed" as const
        : supportScore > obstructionScore ? "favorable" as const : "unfavorable" as const;
      const leading = supportScore >= obstructionScore ? supportive[0] : obstructive[0];
      const counter = supportScore >= obstructionScore ? obstructive[0] : supportive[0];
      const decisive = [leading, ...(counter ? [counter] : [])].filter((item): item is LiuyaoEvidence => Boolean(item));
      const uncertaintyPenalty = analysis.uncertainty === "high" ? 0.12 : 0;
      const hiddenPenalty = analysis.usefulGod?.hidden ? 0.08 : 0;
      const conflictPenalty = conflict ? 0.08 : 0;
      const confidence = total === 0
        ? 0.35
        : Math.max(0.36, Math.min(0.88, 0.5 + dominance * 0.28 + Math.min(0.1, total * 0.025) - uncertaintyPenalty - hiddenPenalty - conflictPenalty));
      const shortReason = leading
        ? `${leading.technicalText ?? leading.conclusion}${counter ? `；但${counter.technicalText ?? counter.conclusion}` : ""}`
        : "当前没有足够的方向性证据";
      return {
        intentId: intent.id,
        label: intent.label,
        topic: intent.topic,
        direction,
        confidence: Number(confidence.toFixed(2)),
        shortReason,
        evidenceBalance: balance,
        supportScore: Number(supportScore.toFixed(2)),
        obstructionScore: Number(obstructionScore.toFixed(2)),
        decisiveEvidenceIds: decisive.map((item) => `${intent.id}:${item.id ?? item.rule}`),
      };
    }),
    keyEvidence,
    limitations: [
      "六爻结论是传统规则下的方向性判断，不是事件保证。",
      "应期只保留候选触发条件与日期窗口，不承诺事件会在该日发生。",
      ...(intents.some((intent) => intent.topic === "health") ? ["健康占中的病象与恢复因素不能替代症状评估、检查或医疗建议。"] : []),
      ...(intents.some((intent) => intent.scenario === "investment") ? ["投资占只提供传统规则下的风险与条件线索，不能替代资产核验、风险承受评估或持牌财务建议。"] : []),
      ...(context.calendarBoundary ? ["起卦时间接近节气换月边界，月建需按当地精确交节时刻复核。"] : []),
    ],
    tone: context.tone ?? "grounded",
  };
}
