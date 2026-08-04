# PHASE-006 Production Verification

Run this checklist against a staging database copied from the production schema before a production rollout.

## Migration rehearsal

1. Back up the target database and record the restore point.
2. Run `npm run db:migrate:status`; investigate `unknown` migrations before continuing.
3. Run `npm run db:migrate` against staging.
4. Run `npm run db:migrate:status` again and require `status: current` with no pending or unknown files.
5. Verify migrations `005_review_and_proactive_reflection.sql` and `006_runtime_trace.sql` are listed as applied.

## Runtime smoke test

1. Verify `/health/ready` reports a connected database and the intended LLM provider.
2. Generate and save one `reflection` response and one `deep` response.
3. Reload both saved reflections and confirm their `interactionMode` and `runtimeTrace` remain available.
4. Confirm the deep response exposes evidence boundaries and a counter-signal when the evidence conflicts.
5. Check `/health/metrics` with the configured `x-metrics-token` for both modes, provider requests, latency buckets, and any evaluation flags.

## Proactive reflection

1. Turn proactive reflection off and confirm `/api/v1/proactive-reflections/next` does not suggest a review.
2. Turn it on and verify weekly/monthly cadence and cooldown decisions.
3. Record suggested, opened, and dismissed delivery outcomes.
4. Check `/health/metrics` for decision and delivery counters.

Do not mark PHASE-006 production-complete until the smoke test uses the real production provider and the selected delivery channel has been exercised end to end.
