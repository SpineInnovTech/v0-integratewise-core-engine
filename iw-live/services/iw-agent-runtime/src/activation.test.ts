/**
 * Property 6 — Twin activation is threshold-gated (spine-hydration-lifecycle R12).
 * Uses node:test (this service has no vitest); run: node --test src/activation.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateActivation, DEFAULT_ACTIVATION_THRESHOLDS } from "./activation.ts";

test("inactive when memories below threshold", () => {
  const a = evaluateActivation({ totalMemories: 0 });
  assert.equal(a.active, false);
  assert.ok(a.reasons.length > 0);
});

test("inactive just below the memory threshold", () => {
  const a = evaluateActivation({ totalMemories: DEFAULT_ACTIVATION_THRESHOLDS.minMemories - 1 });
  assert.equal(a.active, false);
});

test("active at/above all thresholds", () => {
  const a = evaluateActivation({ totalMemories: DEFAULT_ACTIVATION_THRESHOLDS.minMemories });
  assert.equal(a.active, true);
  assert.equal(a.reasons.length, 0);
});

test("respects requireCreamy", () => {
  const thresholds = { minMemories: 0, minSignals: 0, requireCreamy: true };
  assert.equal(
    evaluateActivation({ totalMemories: 5, creamyComplete: false }, thresholds).active,
    false
  );
  assert.equal(
    evaluateActivation({ totalMemories: 5, creamyComplete: true }, thresholds).active,
    true
  );
});

test("respects identity-configurable thresholds (minSignals)", () => {
  const thresholds = { minMemories: 1, minSignals: 3, requireCreamy: false };
  assert.equal(
    evaluateActivation({ totalMemories: 5, signalsAvailable: 1 }, thresholds).active,
    false
  );
  assert.equal(
    evaluateActivation({ totalMemories: 5, signalsAvailable: 3 }, thresholds).active,
    true
  );
});

test("activates because continuity exists, not onboarding completion", () => {
  const a = evaluateActivation({ totalMemories: 10 });
  assert.equal(a.active, true);
});
