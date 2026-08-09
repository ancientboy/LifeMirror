export type RelationshipOutcome = "smooth" | "mixed" | "rough";

export type RelationshipFeedbackEvidence = {
  personId: string;
  status: "awaiting_action" | "reported";
  actionTaken?: boolean;
  outcome?: RelationshipOutcome;
};

export type RelationshipCalibration = {
  completedActions: number;
  outcomeCounts: Record<RelationshipOutcome, number>;
  summary?: string;
  nextPractice?: string;
};

export type RelationshipLoopMetrics = {
  rehearsalsStarted: number;
  awaitingFeedback: number;
  feedbackReported: number;
  actionsTaken: number;
  actionRate: number;
  feedbackCompletionRate: number;
  repeatPracticePeople: number;
};

export type RelationshipArchiveEvidence = {
  id?: string;
  situation?: string;
  outcome: RelationshipOutcome;
  reflection?: string;
  reportedAt?: string;
};

export type RelationshipArchive = {
  personId: string;
  awaitingFeedback: number;
  verifiedInteractions: RelationshipArchiveEvidence[];
  summary: string;
  visibleAdjustment: string;
};

const emptyOutcomes = (): Record<RelationshipOutcome, number> => ({ smooth: 0, mixed: 0, rough: 0 });

/** Only user-reported interactions may shape the next rehearsal; this never models TA's intent or personality. */
export function buildRelationshipCalibration(personId: string, loops: RelationshipFeedbackEvidence[]): RelationshipCalibration {
  const completed = loops.filter((loop) => loop.personId === personId && loop.status === "reported" && loop.actionTaken && loop.outcome);
  const outcomeCounts = emptyOutcomes();
  completed.forEach((loop) => { if (loop.outcome) outcomeCounts[loop.outcome] += 1; });
  if (!completed.length) return { completedActions: 0, outcomeCounts };
  if (outcomeCounts.smooth > 0 && outcomeCounts.smooth >= outcomeCounts.rough) return { completedActions: completed.length, outcomeCounts, summary: `你已经记录过 ${completed.length} 次把话带回现实的尝试，其中有 ${outcomeCounts.smooth} 次相对顺利。`, nextPractice: "下一次可以继续从具体感受开始，再提出一个小而明确的请求；这只是对你过往记录的整理，不是对 TA 的定论。" };
  if (outcomeCounts.rough > 0) return { completedActions: completed.length, outcomeCounts, summary: `你已经记录过 ${completed.length} 次现实尝试，其中有 ${outcomeCounts.rough} 次并不顺利。`, nextPractice: "下次先把目标缩小到一句开场或一个边界；先让自己安全、清楚地表达，不急着把一次谈话变成最终结论。" };
  return { completedActions: completed.length, outcomeCounts, summary: `你已经记录过 ${completed.length} 次把话带回现实的尝试，结果有来有回。`, nextPractice: "下次先确认彼此听到的重点，再决定是否继续深入；它只是在帮助你选择更稳的沟通节奏。" };
}

export function calculateRelationshipLoopMetrics(loops: RelationshipFeedbackEvidence[]): RelationshipLoopMetrics {
  const rehearsalsStarted = loops.length;
  const awaitingFeedback = loops.filter((loop) => loop.status === "awaiting_action").length;
  const feedbackReported = loops.filter((loop) => loop.status === "reported").length;
  const actionsTaken = loops.filter((loop) => loop.status === "reported" && loop.actionTaken).length;
  const personCounts = new Map<string, number>();
  loops.forEach((loop) => personCounts.set(loop.personId, (personCounts.get(loop.personId) ?? 0) + 1));
  return { rehearsalsStarted, awaitingFeedback, feedbackReported, actionsTaken, actionRate: rehearsalsStarted ? actionsTaken / rehearsalsStarted : 0, feedbackCompletionRate: rehearsalsStarted ? feedbackReported / rehearsalsStarted : 0, repeatPracticePeople: [...personCounts.values()].filter((count) => count >= 2).length };
}

/** Builds a user-facing archive from only user-confirmed actions, never TA's motives or personality. */
export function buildRelationshipArchive(personId: string, loops: Array<RelationshipFeedbackEvidence & Partial<RelationshipArchiveEvidence>>): RelationshipArchive {
  const related = loops.filter((loop) => loop.personId === personId);
  const awaitingFeedback = related.filter((loop) => loop.status === "awaiting_action").length;
  const verifiedInteractions = related
    .filter((loop): loop is RelationshipFeedbackEvidence & RelationshipArchiveEvidence => loop.status === "reported" && loop.actionTaken === true && Boolean(loop.outcome))
    .sort((left, right) => (right.reportedAt ?? "").localeCompare(left.reportedAt ?? ""))
    .slice(0, 3)
    .map((loop) => ({ id: loop.id, situation: loop.situation, outcome: loop.outcome, reflection: loop.reflection, reportedAt: loop.reportedAt }));
  const calibration = buildRelationshipCalibration(personId, related);

  if (!verifiedInteractions.length) return {
    personId, awaitingFeedback, verifiedInteractions,
    summary: awaitingFeedback ? `有 ${awaitingFeedback} 次演练正在等你带回现实结果。` : "还没有已确认的现实互动；这份档案会从你主动带回的反馈开始。",
    visibleAdjustment: "还不急着给这段关系下结论。下一次演练先从一个具体场景和一个小请求开始。",
  };

  const latest = verifiedInteractions[0];
  const latestLabel = ({ smooth: "相对顺利", mixed: "有来有回", rough: "并不顺利" } as Record<RelationshipOutcome, string>)[latest.outcome];
  return {
    personId, awaitingFeedback, verifiedInteractions,
    summary: `你已确认 ${verifiedInteractions.length} 次现实互动；最近一次关于“${latest.situation ?? "这件事"}”的反馈是${latestLabel}。`,
    visibleAdjustment: calibration.nextPractice ?? "这份调整只整理你的过去反馈；下次仍以你当下的安全感和真实需要为先。",
  };
}
