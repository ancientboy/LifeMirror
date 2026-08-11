import assert from "node:assert/strict";
import test from "node:test";
import { operationalAlerts } from "./release-alerts.js";

test("release alerts only consume aggregate operational data", () => {
  const alerts = operationalAlerts([
    { operation: "chat", outcome: "succeeded", total: 9, averageLatencyMs: 2_000, estimatedCostMicrousd: 2_000_000 },
    { operation: "chat", outcome: "failed", total: 1, averageLatencyMs: 20_000, estimatedCostMicrousd: 0 },
  ], { failureRate: .1, latencyMs: 3_000, costMicrousd: 1_000_000 });
  assert.deepEqual(alerts.map((item) => item.kind), ["llm_failure_rate", "llm_latency", "llm_cost"]);
  assert.equal(alerts[0]?.value, .1);
  assert.equal(alerts.every((item) => "operation" in item && !Object.keys(item).some((key) => /prompt|content|user|person/i.test(key))), true);
});

test("healthy aggregate data produces no release alert", () => {
  assert.deepEqual(operationalAlerts([{ operation: "daily_guidance", outcome: "succeeded", total: 4, averageLatencyMs: 850, estimatedCostMicrousd: 18_000 }]), []);
});
