export type OperationalSample = {
  operation: string;
  outcome: string;
  total: number | string;
  averageLatencyMs: number | string;
  estimatedCostMicrousd: number | string;
};

export type OperationalAlert = {
  kind: "llm_failure_rate" | "llm_latency" | "llm_cost";
  operation: string;
  severity: "warning" | "critical";
  value: number;
  threshold: number;
};

export type OperationalAlertPolicy = {
  failureRate: number;
  latencyMs: number;
  costMicrousd: number;
};

export const defaultOperationalAlertPolicy: OperationalAlertPolicy = {
  // A response should normally succeed on primary or configured fallback.
  failureRate: 0.1,
  latencyMs: 12_000,
  costMicrousd: 5_000_000,
};

/**
 * Derives release signals from already-aggregated D1 audit rows.  It never
 * accepts account, prompt, output, person, or request identifiers.
 */
export function operationalAlerts(rows: OperationalSample[], policy: OperationalAlertPolicy = defaultOperationalAlertPolicy): OperationalAlert[] {
  const grouped = new Map<string, { total: number; failed: number; weightedLatency: number; cost: number }>();
  for (const row of rows) {
    const operation = String(row.operation || "unknown").slice(0, 80);
    const total = Math.max(0, Number(row.total) || 0);
    if (!total) continue;
    const current = grouped.get(operation) ?? { total: 0, failed: 0, weightedLatency: 0, cost: 0 };
    current.total += total;
    if (row.outcome !== "succeeded") current.failed += total;
    current.weightedLatency += Math.max(0, Number(row.averageLatencyMs) || 0) * total;
    current.cost += Math.max(0, Number(row.estimatedCostMicrousd) || 0);
    grouped.set(operation, current);
  }
  const alerts: OperationalAlert[] = [];
  for (const [operation, item] of grouped) {
    const failureRate = item.failed / item.total;
    const latencyMs = item.weightedLatency / item.total;
    if (failureRate >= policy.failureRate) alerts.push({ kind: "llm_failure_rate", operation, severity: failureRate >= policy.failureRate * 2 ? "critical" : "warning", value: failureRate, threshold: policy.failureRate });
    if (latencyMs >= policy.latencyMs) alerts.push({ kind: "llm_latency", operation, severity: latencyMs >= policy.latencyMs * 2 ? "critical" : "warning", value: Math.round(latencyMs), threshold: policy.latencyMs });
    if (item.cost >= policy.costMicrousd) alerts.push({ kind: "llm_cost", operation, severity: item.cost >= policy.costMicrousd * 2 ? "critical" : "warning", value: item.cost, threshold: policy.costMicrousd });
  }
  return alerts;
}
