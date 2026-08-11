import assert from "node:assert/strict";
import test from "node:test";
import { GOLDEN_EVALUATION_SUITE, GOLDEN_EVALUATION_VERSION, validateGoldenEvaluation } from "./golden-gate.js";

test("versioned golden evaluation is a complete, privacy-safe release gate", () => {
  const result = validateGoldenEvaluation(GOLDEN_EVALUATION_SUITE);
  assert.equal(result.passed, true, result.failures.join(", "));
  assert.equal(result.version, GOLDEN_EVALUATION_VERSION);
});

test("golden gate rejects missing scenarios and customer-content-shaped fixtures", () => {
  const missing = validateGoldenEvaluation(GOLDEN_EVALUATION_SUITE.slice(1));
  assert.equal(missing.passed, false);
  assert.ok(missing.failures.includes("missing:recall_relevance"));
  const unsafe = validateGoldenEvaluation([{ ...GOLDEN_EVALUATION_SUITE[0], input: { content: "do not put customer text here" } }, ...GOLDEN_EVALUATION_SUITE.slice(1)]);
  assert.equal(unsafe.passed, false);
  assert.ok(unsafe.failures.some((item) => item.startsWith("privacy_key:recall_relevance:content")));
});
