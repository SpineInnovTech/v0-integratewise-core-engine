/**
 * Suite 5 — Outcome Ingestion
 *
 * Verifies outcome API behavior, idempotency, and memory promotion.
 * Constitutional Law 2 (governance staging) + Law 7 (loop stages 5-6).
 */

import { test, expect } from "@playwright/test";

test.describe("Outcome Ingestion", () => {
  test("outcome is stored and enters staging", async ({ request }) => {
    const response = await request.post("/api/v1/handoff/outcome", {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
      data: {
        handoff_id: process.env.AWAITING_PACKAGE_ID,
        status: "success",
        evidence: [{ kind: "api_response", details: { status: 200 } }],
        source: "test-agent",
        idempotency_key: `idem-outcome-${Date.now()}`,
        occurred_at: new Date().toISOString(),
      },
    });
    expect([200, 202]).toContain(response.status());
    const body = await response.json();
    expect(body.package_state).toBeDefined();
  });

  test("memory promotion proposal is generated", async ({ request }) => {
    const response = await request.post("/api/v1/handoff/outcome", {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
      data: {
        handoff_id: process.env.AWAITING_PACKAGE_ID_2,
        status: "success",
        evidence: [{ kind: "confirmation", details: { ref: "INV-001" } }],
        source: "test-agent",
        idempotency_key: `idem-promo-${Date.now()}`,
        occurred_at: new Date().toISOString(),
      },
    });
    const body = await response.json();
    expect(body.memory_proposal_id).toBeDefined();
  });

  test("duplicate outcome is rejected (idempotency)", async ({ request }) => {
    const idempotencyKey = `idem-dup-${Date.now()}`;

    // First submission
    await request.post("/api/v1/handoff/outcome", {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
      data: {
        handoff_id: process.env.AWAITING_PACKAGE_ID_3,
        status: "success",
        evidence: [],
        source: "test-agent",
        idempotency_key: idempotencyKey,
        occurred_at: new Date().toISOString(),
      },
    });

    // Second submission with same key — should not cause duplicate transition
    const response = await request.post("/api/v1/handoff/outcome", {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
      data: {
        handoff_id: process.env.AWAITING_PACKAGE_ID_3,
        status: "success",
        evidence: [],
        source: "test-agent",
        idempotency_key: idempotencyKey,
        occurred_at: new Date().toISOString(),
      },
    });
    expect(response.status()).toBe(200); // Idempotent — returns current state
  });
});
