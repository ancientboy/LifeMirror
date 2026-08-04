import type { InteractionMode, TrustEvaluation } from "../runtime/types.js";

type CounterMap = Record<string, number>;

export class RuntimeMetrics {
  readonly startedAt = new Date();
  private readonly counters: CounterMap = {};
  private requestDurationMs = 0;
  private requestDurationCount = 0;

  increment(name: string, labels: Record<string, string> = {}) {
    const suffix = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join(",");
    const key = suffix ? `${name}{${suffix}}` : name;
    this.counters[key] = (this.counters[key] ?? 0) + 1;
  }

  observeRequest(durationMs: number, method: string, route: string, statusCode: number) {
    this.increment("http_requests_total", { method, route, status: String(statusCode) });
    this.requestDurationMs += durationMs;
    this.requestDurationCount += 1;
  }

  recordRuntime(mode: InteractionMode, durationMs: number, evaluation: TrustEvaluation) {
    this.increment("mirror_runtime_total", { mode, level: evaluation.level });
    for (const flag of evaluation.flags) this.increment("mirror_evaluation_flags_total", { flag });
    this.increment("mirror_runtime_latency_bucket_total", { mode, le: durationBucket(durationMs) });
  }

  snapshot() {
    return {
      startedAt: this.startedAt.toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1_000),
      counters: { ...this.counters },
      requestLatency: {
        count: this.requestDurationCount,
        averageMs: this.requestDurationCount === 0 ? 0 : Math.round((this.requestDurationMs / this.requestDurationCount) * 100) / 100,
      },
    };
  }
}

function durationBucket(durationMs: number) {
  if (durationMs <= 500) return "500";
  if (durationMs <= 1_000) return "1000";
  if (durationMs <= 3_000) return "3000";
  if (durationMs <= 10_000) return "10000";
  return "+Inf";
}
