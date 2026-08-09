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
