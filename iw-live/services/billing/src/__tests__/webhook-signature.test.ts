import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import app from "../index";

// Mock fetch so Supabase calls in /v1/billing/webhooks/* succeed (no real network)
let fetchMock: ReturnType<typeof vi.fn>;
function okResponse(body = "") {
  return { ok: true, text: async () => body, json: async () => (body ? JSON.parse(body) : null) };
}
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function env() {
  return {
    DB: {} as D1Database,
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_KEY: "service-key",
    STRIPE_SECRET_KEY: "sk_test",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    RAZORPAY_KEY_ID: "rzp_test",
    RAZORPAY_KEY_SECRET: "rzp_secret",
    RAZORPAY_WEBHOOK_SECRET: "rzp_whsec_test",
    ENVIRONMENT: "test",
  };
}

describe("billing webhook signature verification", () => {
  it("accepts valid Stripe webhook signature", async () => {
    const payload = JSON.stringify({
      type: "invoice.paid",
      data: { object: { id: "in_test_1" } },
    });
    const ts = String(Math.floor(Date.now() / 1000));
    const v1 = await hmacHex(env().STRIPE_WEBHOOK_SECRET, `${ts}.${payload}`);

    const req = new Request("http://localhost/webhooks/stripe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": `t=${ts},v1=${v1}`,
      },
      body: payload,
    });

    const res = await app.fetch(req, env() as any, {} as ExecutionContext);
    expect(res.status).toBe(200);
  });

  it("rejects invalid Stripe webhook signature", async () => {
    const payload = JSON.stringify({
      type: "invoice.paid",
      data: { object: { id: "in_test_2" } },
    });
    const ts = String(Math.floor(Date.now() / 1000));

    const req = new Request("http://localhost/webhooks/stripe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": `t=${ts},v1=deadbeef`,
      },
      body: payload,
    });

    const res = await app.fetch(req, env() as any, {} as ExecutionContext);
    expect(res.status).toBe(401);
  });

  it("rejects expired Stripe webhook timestamp", async () => {
    const payload = JSON.stringify({
      type: "invoice.paid",
      data: { object: { id: "in_test_3" } },
    });
    const ts = String(Math.floor(Date.now() / 1000) - 600);
    const v1 = await hmacHex(env().STRIPE_WEBHOOK_SECRET, `${ts}.${payload}`);

    const req = new Request("http://localhost/webhooks/stripe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": `t=${ts},v1=${v1}`,
      },
      body: payload,
    });

    const res = await app.fetch(req, env() as any, {} as ExecutionContext);
    expect(res.status).toBe(400);
  });

  it("accepts valid Razorpay webhook signature", async () => {
    const payload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_1", order_id: "order_1", notes: {} } } },
    });
    const signature = await hmacHex(env().RAZORPAY_WEBHOOK_SECRET!, payload);

    const req = new Request("http://localhost/webhooks/razorpay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signature,
      },
      body: payload,
    });

    const res = await app.fetch(req, env() as any, {} as ExecutionContext);
    expect(res.status).toBe(200);
  });

  it("rejects invalid Razorpay webhook signature", async () => {
    const payload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_2", order_id: "order_2", notes: {} } } },
    });

    const req = new Request("http://localhost/webhooks/razorpay", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": "deadbeef",
      },
      body: payload,
    });

    const res = await app.fetch(req, env() as any, {} as ExecutionContext);
    expect(res.status).toBe(401);
  });

  it("blocks duplicate Stripe webhook replay on billing endpoint", async () => {
    // Supabase: getPaymentTransactionStatus (GET), PATCH, hasActiveTenantSubscription (GET), POST
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // payment_transactions query
      .mockResolvedValueOnce(okResponse()) // PATCH payment_transactions
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // tenant_subscriptions query
      .mockResolvedValueOnce(okResponse()); // POST tenant_subscriptions
    const eventId = `evt_replay_${Date.now()}`;
    const payload = JSON.stringify({
      id: eventId,
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_replay_1",
          metadata: { tenant_id: "tenant_1", sku_id: "sku_1" },
        },
      },
    });
    const ts = String(Math.floor(Date.now() / 1000));
    const v1 = await hmacHex(env().STRIPE_WEBHOOK_SECRET, `${ts}.${payload}`);
    const headers = {
      "content-type": "application/json",
      "stripe-signature": `t=${ts},v1=${v1}`,
    };

    const firstReq = new Request("http://localhost/v1/billing/webhooks/stripe", {
      method: "POST",
      headers,
      body: payload,
    });
    const firstRes = await app.fetch(firstReq, env() as any, {} as ExecutionContext);
    expect(firstRes.status).toBe(200);

    const secondReq = new Request("http://localhost/v1/billing/webhooks/stripe", {
      method: "POST",
      headers,
      body: payload,
    });
    const secondRes = await app.fetch(secondReq, env() as any, {} as ExecutionContext);
    expect(secondRes.status).toBe(200);
    const secondBody = (await secondRes.json()) as { received?: boolean; duplicate?: boolean };
    expect(secondBody.received).toBe(true);
    expect(secondBody.duplicate).toBe(true);
  });

  it("blocks duplicate Stripe webhook replay on legacy endpoint", async () => {
    const eventId = `evt_legacy_replay_${Date.now()}`;
    const payload = JSON.stringify({
      id: eventId,
      type: "invoice.paid",
      data: { object: { id: "in_legacy_1" } },
    });
    const ts = String(Math.floor(Date.now() / 1000));
    const v1 = await hmacHex(env().STRIPE_WEBHOOK_SECRET, `${ts}.${payload}`);
    const headers = {
      "content-type": "application/json",
      "stripe-signature": `t=${ts},v1=${v1}`,
    };

    const firstReq = new Request("http://localhost/webhooks/stripe", {
      method: "POST",
      headers,
      body: payload,
    });
    const firstRes = await app.fetch(firstReq, env() as any, {} as ExecutionContext);
    expect(firstRes.status).toBe(200);

    const secondReq = new Request("http://localhost/webhooks/stripe", {
      method: "POST",
      headers,
      body: payload,
    });
    const secondRes = await app.fetch(secondReq, env() as any, {} as ExecutionContext);
    expect(secondRes.status).toBe(200);
    const secondBody = (await secondRes.json()) as { received?: boolean; duplicate?: boolean };
    expect(secondBody.received).toBe(true);
    expect(secondBody.duplicate).toBe(true);
  });

  it("blocks duplicate Razorpay webhook replay on billing endpoint", async () => {
    // Supabase: getPaymentTransactionStatus (GET), PATCH, hasActiveTenantSubscription (GET), POST
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce(okResponse())
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce(okResponse());
    const paymentId = `pay_replay_${Date.now()}`;
    const payload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: "order_replay_1",
            notes: { tenant_id: "t1", sku_id: "s1" },
          },
        },
      },
    });
    const signature = await hmacHex(env().RAZORPAY_WEBHOOK_SECRET!, payload);
    const headers = {
      "content-type": "application/json",
      "x-razorpay-signature": signature,
    };

    const firstReq = new Request("http://localhost/v1/billing/webhooks/razorpay", {
      method: "POST",
      headers,
      body: payload,
    });
    const firstRes = await app.fetch(firstReq, env() as any, {} as ExecutionContext);
    expect(firstRes.status).toBe(200);

    const secondReq = new Request("http://localhost/v1/billing/webhooks/razorpay", {
      method: "POST",
      headers,
      body: payload,
    });
    const secondRes = await app.fetch(secondReq, env() as any, {} as ExecutionContext);
    expect(secondRes.status).toBe(200);
    const secondBody = (await secondRes.json()) as { received?: boolean; duplicate?: boolean };
    expect(secondBody.received).toBe(true);
    expect(secondBody.duplicate).toBe(true);
  });

  it("blocks duplicate Razorpay webhook replay on legacy endpoint", async () => {
    const paymentId = `pay_legacy_replay_${Date.now()}`;
    const payload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: paymentId, order_id: "order_legacy_1", notes: {} } } },
    });
    const signature = await hmacHex(env().RAZORPAY_WEBHOOK_SECRET!, payload);
    const headers = {
      "content-type": "application/json",
      "x-razorpay-signature": signature,
    };

    const firstReq = new Request("http://localhost/webhooks/razorpay", {
      method: "POST",
      headers,
      body: payload,
    });
    const firstRes = await app.fetch(firstReq, env() as any, {} as ExecutionContext);
    expect(firstRes.status).toBe(200);

    const secondReq = new Request("http://localhost/webhooks/razorpay", {
      method: "POST",
      headers,
      body: payload,
    });
    const secondRes = await app.fetch(secondReq, env() as any, {} as ExecutionContext);
    expect(secondRes.status).toBe(200);
    const secondBody = (await secondRes.json()) as { received?: boolean; duplicate?: boolean };
    expect(secondBody.received).toBe(true);
    expect(secondBody.duplicate).toBe(true);
  });
});
