/**
 * Suite 4 — Handoff Package Lifecycle
 *
 * Verifies the state machine transitions via API.
 * Constitutional Law 2 + Law 7 (Continuity Loop stages 2-6).
 */

import { test, expect } from "@playwright/test";

test.describe("Handoff Package Lifecycle", () => {
  let packageId: string;

  test("create handoff package in PROPOSED state", async ({ request }) => {
    const response = await request.post("/api/v1/handoff/create", {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
      data: {
        action: { kind: "update_status", target: "hubspot.deal", params: { status: "won" } },
        evidence: [{ fact_id: "fact-001", confidence: 0.92 }],
        success_criteria: [{ id: "sc-1", description: "Deal marked won", verifiable: true }],
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    packageId = body.package_id;
    expect(body.state).toBe("PROPOSED");
  });

  test("PROPOSED → APPROVED (governance approval)", async ({ request }) => {
    const response = await request.post(`/api/v1/handoff/${packageId}/approve`, {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.state).toBe("APPROVED");
  });

  test("PROPOSED → EXECUTING is BLOCKED (must go through APPROVED)", async ({ request }) => {
    // Create a fresh package to test invalid transition
    const create = await request.post("/api/v1/handoff/create", {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
      data: {
        action: { kind: "test", target: "test.target", params: {} },
        evidence: [],
        success_criteria: [],
      },
    });
    const { package_id } = await create.json();

    // Try to skip governance
    const response = await request.post(`/api/v1/handoff/${package_id}/transition`, {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
      data: { to_state: "EXECUTING", actor: "test", reason: "skip governance" },
    });
    expect(response.status()).toBe(409);
  });

  test("APPROVED → EXECUTING → AWAITING_OUTCOME", async ({ request }) => {
    // Dispatch (APPROVED → EXECUTING)
    const dispatch = await request.post(`/api/v1/handoff/${packageId}/dispatch`, {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
      data: { adapter: "json", target: { mode: "download" } },
    });
    expect(dispatch.status()).toBe(200);

    // Verify state
    const state = await request.get(`/api/v1/handoff/${packageId}/state`, {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
    });
    const body = await state.json();
    expect(["EXECUTING", "AWAITING_OUTCOME"]).toContain(body.current_state);
  });

  test("AWAITING_OUTCOME → COMPLETED (outcome ingested)", async ({ request }) => {
    const response = await request.post("/api/v1/handoff/outcome", {
      headers: { Authorization: `Bearer ${process.env.TENANT_A_JWT}` },
      data: {
        handoff_id: packageId,
        status: "success",
        evidence: [{ kind: "screenshot", url: "https://proof.example.com/1.png" }],
        source: "playwright-test-agent",
        idempotency_key: `idem-${packageId}-${Date.now()}`,
        occurred_at: new Date().toISOString(),
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.package_state).toBe("COMPLETED");
  });
});
