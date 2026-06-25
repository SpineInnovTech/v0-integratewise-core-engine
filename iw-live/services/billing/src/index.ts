/**
 * IntegrateWise Billing Service
 * Cloudflare Worker entry point
 *
 * Handles subscription management, usage tracking, and Stripe/RazorPay integration
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { PLANS } from "./billing-service";

interface Env {
  DB: D1Database;
  // v3.6: D1 is edge cache only. Supabase PostgreSQL is SINGLE SOURCE OF TRUTH
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  WEBHOOK_REPLAY?: KVNamespace;
  WEBHOOK_REPLAY_TTL_SECONDS?: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  ENVIRONMENT: string;
}

interface SKUCheckoutRequest {
  sku_id: string;
  gateway: "stripe" | "razorpay";
  success_url?: string;
  cancel_url?: string;
}

interface StripeSession {
  id: string;
  url: string;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

const localWebhookReplayCache = new Map<string, number>();
const WEBHOOK_REPLAY_TTL_SECONDS = 24 * 60 * 60;
const MAX_LOCAL_REPLAY_KEYS = 5000;

// ============================================================================
// v3.6: Supabase REST API Helpers
// ============================================================================

function buildPostgrestQuery(filters: Record<string, string>, extra?: string): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    params.set(key, value);
  }
  if (extra) {
    for (const part of extra.split("&")) {
      const [k, ...rest] = part.split("=");
      if (k) params.set(k, rest.join("="));
    }
  }
  return params.toString();
}

async function supabaseQuery(
  url: string,
  key: string,
  table: string,
  query: string
): Promise<any[]> {
  try {
    const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function supabaseMutate(
  url: string,
  key: string,
  table: string,
  method: string,
  body?: any,
  query?: string
): Promise<any> {
  const endpoint = query ? `${url}/rest/v1/${table}?${query}` : `${url}/rest/v1/${table}`;
  const res = await fetch(endpoint, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(
      `Supabase mutation failed (${table}, ${method}, ${res.status}): ${message || "unknown error"}`
    );
  }

  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

async function getPaymentTransactionStatus(
  env: Env,
  gateway: "stripe" | "razorpay",
  gatewaySessionId: string
): Promise<string | null> {
  const rows = await supabaseQuery(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY,
    "payment_transactions",
    buildPostgrestQuery({
      gateway: `eq.${encodeURIComponent(gateway)}`,
      gateway_session_id: `eq.${encodeURIComponent(gatewaySessionId)}`,
      limit: "1",
    })
  );
  return rows?.[0]?.status || null;
}

async function hasActiveTenantSubscription(
  env: Env,
  tenantId: string,
  skuId: string
): Promise<boolean> {
  const rows = await supabaseQuery(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY,
    "tenant_subscriptions",
    buildPostgrestQuery({
      tenant_id: `eq.${encodeURIComponent(tenantId)}`,
      sku_id: `eq.${encodeURIComponent(skuId)}`,
      status: "in.(active,trial)",
      limit: "1",
    })
  );
  return Boolean(rows?.length);
}

function normalizeReplayKeyPart(value: unknown): string {
  return String(value || "").trim();
}

function stableStringHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function buildWebhookReplayKey(
  provider: "stripe" | "razorpay",
  event: any,
  rawBody: string
): string {
  if (provider === "stripe") {
    const eventId = normalizeReplayKeyPart(event?.id);
    if (eventId) return `stripe:${eventId}`;
    const checkoutSessionId = normalizeReplayKeyPart(event?.data?.object?.id);
    if (checkoutSessionId) return `stripe:session:${checkoutSessionId}`;
  } else {
    const eventName = normalizeReplayKeyPart(event?.event);
    const paymentId = normalizeReplayKeyPart(event?.payload?.payment?.entity?.id);
    if (eventName && paymentId) return `razorpay:${eventName}:${paymentId}`;
    const orderId = normalizeReplayKeyPart(event?.payload?.payment?.entity?.order_id);
    if (eventName && orderId) return `razorpay:${eventName}:order:${orderId}`;
  }

  // Last-resort deterministic replay key when payload misses canonical IDs.
  return `${provider}:fallback:${stableStringHash(rawBody)}`;
}

async function acquireWebhookReplayLock(
  env: Env,
  key: string,
  ttlSeconds = WEBHOOK_REPLAY_TTL_SECONDS
): Promise<boolean> {
  const parsedTtl = Number(env.WEBHOOK_REPLAY_TTL_SECONDS || "");
  const resolvedTtl = Number.isFinite(parsedTtl) && parsedTtl > 0 ? parsedTtl : ttlSeconds;
  const now = Date.now();
  if (localWebhookReplayCache.size > MAX_LOCAL_REPLAY_KEYS) {
    for (const [cachedKey, expiry] of localWebhookReplayCache) {
      if (expiry <= now) {
        localWebhookReplayCache.delete(cachedKey);
      }
    }
  }
  const existingLocalExpiry = localWebhookReplayCache.get(key);
  if (existingLocalExpiry && existingLocalExpiry > now) {
    return false;
  }

  if (env.WEBHOOK_REPLAY) {
    const exists = await env.WEBHOOK_REPLAY.get(key);
    if (exists) {
      return false;
    }
    await env.WEBHOOK_REPLAY.put(key, String(now), { expirationTtl: resolvedTtl });
  }

  localWebhookReplayCache.set(key, now + resolvedTtl * 1000);
  return true;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const left = (a || "").trim().toLowerCase();
  const right = (b || "").trim().toLowerCase();
  if (!left || !right || left.length !== right.length) return false;

  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

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

function parseStripeSignatureHeader(header: string): { timestamp?: string; signatures: string[] } {
  const parsed: { timestamp?: string; signatures: string[] } = { signatures: [] };
  for (const part of header.split(",")) {
    const [key, value] = part.trim().split("=");
    if (!key || !value) continue;
    if (key === "t") parsed.timestamp = value;
    if (key === "v1") parsed.signatures.push(value);
  }
  return parsed;
}

async function verifyStripeWebhookSignature(
  body: string,
  signatureHeader: string,
  secret: string
): Promise<{ valid: boolean; error?: string; status?: number }> {
  const parsed = parseStripeSignatureHeader(signatureHeader);
  const ts = Number(parsed.timestamp);
  if (!Number.isFinite(ts) || !parsed.signatures.length) {
    return { valid: false, error: "Invalid signature format", status: 400 };
  }

  // Reject timestamps older/newer than 5 minutes (replay protection).
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) {
    return { valid: false, error: "Webhook timestamp expired", status: 400 };
  }

  const expected = await hmacHex(secret, `${parsed.timestamp}.${body}`);
  const isValid = parsed.signatures.some((candidate) => timingSafeEqualHex(expected, candidate));
  return isValid
    ? { valid: true }
    : { valid: false, error: "Invalid webhook signature", status: 401 };
}

async function verifyRazorpayWebhookSignature(
  body: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  const expected = await hmacHex(secret, body);
  return timingSafeEqualHex(expected, signatureHeader);
}

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use(
  "*",
  cors({
    origin: ["https://integratewise.ai", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Tenant-ID",
      "stripe-signature",
      "x-razorpay-signature",
    ],
  })
);

// Health check
app.get("/", (c) =>
  c.json({
    service: "integratewise-billing",
    status: "healthy",
    version: "1.0.0",
    environment: c.env.ENVIRONMENT,
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

// ============================================================================
// PLANS
// ============================================================================

app.get("/v1/plans", (c) => {
  return c.json({ plans: PLANS.filter((p) => p.isActive) });
});

app.get("/v1/plans/:planId", (c) => {
  const plan = PLANS.find((p) => p.id === c.req.param("planId"));
  if (!plan) {
    return c.json({ error: "Plan not found" }, 404);
  }
  return c.json({ plan });
});

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

app.get("/v1/subscriptions/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");

  try {
    // v3.6: Query Supabase (SINGLE SOURCE OF TRUTH)
    const results = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "subscriptions",
      `tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=1`
    );

    const result = results?.[0];
    if (!result) {
      // Return free plan by default
      return c.json({
        subscription: {
          tenantId,
          planId: "free",
          status: "active",
          billingInterval: "monthly",
          plan: PLANS.find((p) => p.id === "free"),
        },
      });
    }

    const plan = PLANS.find((p) => p.id === result.plan_id);
    return c.json({ subscription: { ...result, plan } });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return c.json({ error: "Failed to fetch subscription" }, 500);
  }
});

app.post("/v1/subscriptions", async (c) => {
  const body = await c.req.json();
  const { tenantId, planId, billingInterval, stripeCustomerId, stripeSubscriptionId } = body;

  if (!tenantId || !planId) {
    return c.json({ error: "tenantId and planId are required" }, 400);
  }

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) {
    return c.json({ error: "Invalid plan" }, 400);
  }

  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // v3.6: Insert to Supabase (SINGLE SOURCE OF TRUTH)
    await supabaseMutate(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY, "subscriptions", "POST", {
      id,
      tenant_id: tenantId,
      plan_id: planId,
      status: "active",
      billing_interval: billingInterval || "monthly",
      current_period_start: now,
      current_period_end: periodEnd,
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: stripeSubscriptionId || null,
      created_at: now,
      updated_at: now,
    });

    return c.json(
      {
        subscription: { id, tenantId, planId, status: "active", plan },
        message: "Subscription created",
      },
      201
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return c.json({ error: "Failed to create subscription" }, 500);
  }
});

app.put("/v1/subscriptions/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");
  const body = await c.req.json();
  const { planId, status, cancelAtPeriodEnd } = body;

  try {
    const updateData: Record<string, any> = {};

    if (planId) updateData.plan_id = planId;
    if (status) updateData.status = status;
    if (cancelAtPeriodEnd !== undefined) {
      updateData.cancel_at_period_end = cancelAtPeriodEnd ? true : false;
    }

    updateData.updated_at = new Date().toISOString();

    // v3.6: Update Supabase (SINGLE SOURCE OF TRUTH)
    await supabaseMutate(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "subscriptions",
      "PATCH",
      updateData,
      `tenant_id=eq.${encodeURIComponent(tenantId)}`
    );

    return c.json({ message: "Subscription updated" });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return c.json({ error: "Failed to update subscription" }, 500);
  }
});

// ============================================================================
// USAGE TRACKING
// ============================================================================

app.post("/v1/usage", async (c) => {
  const body = await c.req.json();
  const { tenantId, metricKey, quantity, metadata } = body;

  if (!tenantId || !metricKey || quantity === undefined) {
    return c.json({ error: "tenantId, metricKey, and quantity are required" }, 400);
  }

  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // v3.6: Insert to Supabase (SINGLE SOURCE OF TRUTH)
    await supabaseMutate(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY, "usage_records", "POST", {
      id,
      tenant_id: tenantId,
      metric_key: metricKey,
      quantity,
      metadata: metadata || {},
      timestamp: now,
    });

    return c.json({ id, message: "Usage recorded" }, 201);
  } catch (error) {
    console.error("Error recording usage:", error);
    return c.json({ error: "Failed to record usage" }, 500);
  }
});

app.get("/v1/usage/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");
  const metricKey = c.req.query("metric");
  const startDate =
    c.req.query("start") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = c.req.query("end") || new Date().toISOString();

  try {
    // v3.6: Query Supabase (SINGLE SOURCE OF TRUTH)
    let queryStr = `tenant_id=eq.${encodeURIComponent(tenantId)}&timestamp=gte.${encodeURIComponent(startDate)}&timestamp=lte.${encodeURIComponent(endDate)}`;
    if (metricKey) {
      queryStr += `&metric_key=eq.${encodeURIComponent(metricKey)}`;
    }

    const results = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "usage_records",
      queryStr
    );

    // Group by metric_key and sum quantities
    const usage: Record<string, { total: number; count: number }> = {};
    for (const row of results) {
      if (!usage[row.metric_key]) {
        usage[row.metric_key] = { total: 0, count: 0 };
      }
      usage[row.metric_key].total += row.quantity || 0;
      usage[row.metric_key].count += 1;
    }

    return c.json({
      usage: Object.entries(usage).map(([key, val]) => ({
        metric_key: key,
        total: val.total,
        count: val.count,
      })),
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return c.json({ error: "Failed to fetch usage" }, 500);
  }
});

// ============================================================================
// INVOICES
// ============================================================================

app.get("/v1/invoices/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");
  const limit = parseInt(c.req.query("limit") || "10");

  try {
    // v3.6: Query Supabase (SINGLE SOURCE OF TRUTH)
    const invoices = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "invoices",
      `tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=${encodeURIComponent(String(limit))}`
    );

    return c.json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return c.json({ error: "Failed to fetch invoices" }, 500);
  }
});

// ============================================================================
// STRIPE WEBHOOKS
// ============================================================================

app.post("/webhooks/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  const body = await c.req.text();

  if (!signature || !c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: "Missing signature or secret" }, 400);
  }

  const verification = await verifyStripeWebhookSignature(
    body,
    signature,
    c.env.STRIPE_WEBHOOK_SECRET
  );
  if (!verification.valid) {
    const statusCode = verification.status === 400 ? 400 : 401;
    return c.json({ error: verification.error || "Invalid webhook signature" }, statusCode);
  }

  try {
    const event = JSON.parse(body);
    const replayKey = buildWebhookReplayKey("stripe", event, body);
    const replayAllowed = await acquireWebhookReplayLock(c.env, replayKey);
    if (!replayAllowed) {
      console.log("Stripe webhook replay blocked", { replayKey });
      return c.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        // Handle subscription changes
        console.log("Subscription event:", event.type);
        break;

      case "invoice.paid":
        // Record invoice
        console.log("Invoice paid:", event.data.object.id);
        break;

      case "invoice.payment_failed":
        // Handle failed payment
        console.log("Payment failed:", event.data.object.id);
        break;
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

// ============================================================================
// RAZORPAY WEBHOOKS
// ============================================================================

app.post("/webhooks/razorpay", async (c) => {
  const signature = c.req.header("x-razorpay-signature");
  const body = await c.req.text();

  if (!signature || !c.env.RAZORPAY_WEBHOOK_SECRET) {
    return c.json({ error: "Missing signature or secret" }, 400);
  }

  const valid = await verifyRazorpayWebhookSignature(
    body,
    signature,
    c.env.RAZORPAY_WEBHOOK_SECRET
  );
  if (!valid) {
    return c.json({ error: "Invalid webhook signature" }, 401);
  }

  try {
    const event = JSON.parse(body);
    const replayKey = buildWebhookReplayKey("razorpay", event, body);
    const replayAllowed = await acquireWebhookReplayLock(c.env, replayKey);
    if (!replayAllowed) {
      console.log("Razorpay webhook replay blocked", { replayKey });
      return c.json({ received: true, duplicate: true });
    }

    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged":
        console.log("RazorPay subscription event:", event.event);
        break;

      case "payment.captured":
        console.log("RazorPay payment captured:", event.payload.payment.entity.id);
        break;
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("RazorPay webhook error:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

// ============================================================================
// ENTITLEMENTS CHECK
// ============================================================================

app.get("/v1/entitlements/:tenantId", async (c) => {
  const tenantId = c.req.param("tenantId");

  try {
    // Try Schema A first (subscriptions table)
    let subscriptions = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "subscriptions",
      `tenant_id=eq.${encodeURIComponent(tenantId)}&status=eq.active&limit=1`
    );

    let subscription = subscriptions?.[0];

    // Fallback to Schema B (tenant_subscriptions — written by webhooks)
    if (!subscription) {
      const tenantSubs = await supabaseQuery(
        c.env.SUPABASE_URL,
        c.env.SUPABASE_SERVICE_KEY,
        "tenant_subscriptions",
        `tenant_id=eq.${encodeURIComponent(tenantId)}&status=eq.active&limit=1`
      );
      if (tenantSubs?.[0]) {
        // Normalize Schema B fields to Schema A shape
        subscription = {
          plan_id: tenantSubs[0].sku_id || tenantSubs[0].plan_id || "free",
          status: tenantSubs[0].status,
        };
      }
    }

    const planId = subscription?.plan_id || "free";
    const plan = PLANS.find((p) => p.id === planId) || PLANS[0];

    // Get current usage from Supabase
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const usageRecords = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "usage_records",
      `tenant_id=eq.${encodeURIComponent(tenantId)}&timestamp=gte.${encodeURIComponent(thirtyDaysAgo)}`
    );

    const usage: Record<string, number> = {};
    for (const row of usageRecords) {
      if (!usage[row.metric_key]) {
        usage[row.metric_key] = 0;
      }
      usage[row.metric_key] += row.quantity || 0;
    }

    // Calculate remaining
    const entitlements = {
      plan: plan.id,
      planName: plan.name,
      limits: plan.limits,
      usage,
      remaining: {
        apiCallsPerMonth: plan.limits.apiCallsPerMonth - (usage.api_calls || 0),
        aiQueriesPerMonth: plan.limits.aiQueriesPerMonth - (usage.ai_queries || 0),
        users: plan.limits.users,
        integrations: plan.limits.integrations,
        storageGb: plan.limits.storageGb - (usage.storage_bytes || 0) / 1024 / 1024 / 1024,
      },
      features: plan.features.filter((f) => f.included).map((f) => f.key),
    };

    return c.json({ entitlements });
  } catch (error) {
    console.error("Error fetching entitlements:", error);
    return c.json({ error: "Failed to fetch entitlements" }, 500);
  }
});

// ============================================================================
// SKU & PRODUCT MANAGEMENT
// ============================================================================

app.get("/v1/billing/plans", async (c) => {
  try {
    // v3.6: Query Supabase (SINGLE SOURCE OF TRUTH)
    const plans = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "product_skus",
      "status=eq.active&order=sort_order.asc"
    );

    return c.json({ plans: plans || [] });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return c.json({ error: "Failed to fetch plans" }, 500);
  }
});

// ============================================================================
// CHECKOUT & PAYMENT GATEWAY
// ============================================================================

app.post("/v1/billing/checkout", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";
  const body = (await c.req.json()) as SKUCheckoutRequest;
  const { sku_id, gateway, success_url, cancel_url } = body;

  if (!sku_id || !gateway) {
    return c.json({ error: "sku_id and gateway required" }, 400);
  }

  try {
    // v3.6: Look up SKU from Supabase (SINGLE SOURCE OF TRUTH)
    const skus = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "product_skus",
      `id=eq.${encodeURIComponent(sku_id)}&status=eq.active&limit=1`
    );

    const sku = skus?.[0] as any;
    if (!sku) {
      return c.json({ error: "SKU not found" }, 404);
    }

    if (gateway === "stripe" && c.env.STRIPE_SECRET_KEY) {
      // Create Stripe Checkout Session
      const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          mode: sku.billing_type === "recurring" ? "subscription" : "payment",
          "line_items[0][price]": sku.stripe_price_id || "",
          "line_items[0][quantity]": "1",
          success_url:
            success_url ||
            "https://integratewise.ai/app?billing=success&session_id={CHECKOUT_SESSION_ID}",
          cancel_url: cancel_url || "https://integratewise.ai/app?billing=cancel",
          client_reference_id: tenantId,
          "metadata[tenant_id]": tenantId,
          "metadata[sku_id]": sku_id,
        }),
      });

      const sessionData = (await stripeResponse.json()) as StripeSession;

      // v3.6: Record transaction in Supabase (SINGLE SOURCE OF TRUTH)
      const txId = crypto.randomUUID();
      await supabaseMutate(
        c.env.SUPABASE_URL,
        c.env.SUPABASE_SERVICE_KEY,
        "payment_transactions",
        "POST",
        {
          id: txId,
          tenant_id: tenantId,
          sku_id,
          gateway: "stripe",
          gateway_session_id: sessionData.id,
          amount_cents: sku.price_cents,
          currency: sku.currency || "usd",
          status: "pending",
          created_at: new Date().toISOString(),
        }
      );

      return c.json({ checkout_url: sessionData.url, session_id: sessionData.id });
    } else if (gateway === "razorpay" && c.env.RAZORPAY_KEY_ID) {
      // Create Razorpay Order
      const auth = btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`);
      const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: sku.price_cents,
          currency: sku.currency?.toUpperCase() || "INR",
          receipt: `iw_${tenantId}_${sku_id}`,
          notes: { tenant_id: tenantId, sku_id },
        }),
      });

      const orderData = (await orderResponse.json()) as RazorpayOrder;

      // v3.6: Record transaction in Supabase (SINGLE SOURCE OF TRUTH)
      const txId = crypto.randomUUID();
      await supabaseMutate(
        c.env.SUPABASE_URL,
        c.env.SUPABASE_SERVICE_KEY,
        "payment_transactions",
        "POST",
        {
          id: txId,
          tenant_id: tenantId,
          sku_id,
          gateway: "razorpay",
          gateway_session_id: orderData.id,
          amount_cents: sku.price_cents,
          currency: sku.currency || "inr",
          status: "pending",
          created_at: new Date().toISOString(),
        }
      );

      return c.json({
        order_id: orderData.id,
        key_id: c.env.RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
      });
    }

    return c.json({ error: `Gateway ${gateway} not configured` }, 400);
  } catch (error) {
    console.error("Error creating checkout:", error);
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
});

app.get("/v1/billing/subscription", async (c) => {
  const tenantId = c.req.header("x-tenant-id") || "";

  try {
    // v3.6: Query Supabase (SINGLE SOURCE OF TRUTH)
    const subscriptions = await supabaseQuery(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      "tenant_subscriptions",
      `tenant_id=eq.${encodeURIComponent(tenantId)}&status=in.(active,trial)&order=activated_at.desc`
    );

    return c.json({ subscriptions: subscriptions || [] });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return c.json({ error: "Failed to fetch subscriptions" }, 500);
  }
});

// ============================================================================
// STRIPE WEBHOOK HANDLER
// ============================================================================

app.post("/v1/billing/webhooks/stripe", async (c) => {
  try {
    const rawBody = await c.req.text();
    const signature = c.req.header("stripe-signature");

    if (!signature || !c.env.STRIPE_WEBHOOK_SECRET) {
      return c.json({ error: "Missing signature or secret" }, 400);
    }

    const verification = await verifyStripeWebhookSignature(
      rawBody,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET
    );
    if (!verification.valid) {
      const statusCode = verification.status === 400 ? 400 : 401;
      return c.json({ error: verification.error || "Invalid webhook signature" }, statusCode);
    }

    const event = JSON.parse(rawBody);
    const replayKey = buildWebhookReplayKey("stripe", event, rawBody);
    const replayAllowed = await acquireWebhookReplayLock(c.env, replayKey);
    if (!replayAllowed) {
      console.log("Stripe webhook replay blocked", { replayKey });
      return c.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const sessionId = String(session.id || "");
        const alreadyCompleted = sessionId
          ? (await getPaymentTransactionStatus(c.env, "stripe", sessionId)) === "completed"
          : false;

        // v3.6: Update transaction status in Supabase (SINGLE SOURCE OF TRUTH)
        await supabaseMutate(
          c.env.SUPABASE_URL,
          c.env.SUPABASE_SERVICE_KEY,
          "payment_transactions",
          "PATCH",
          {
            status: "completed",
            updated_at: new Date().toISOString(),
          },
          `gateway_session_id=eq.${encodeURIComponent(sessionId)}`
        );

        if (alreadyCompleted) {
          console.log(
            "Stripe webhook duplicate delivery; transaction already completed:",
            sessionId
          );
          break;
        }

        // Activate subscription
        const tenantId = session.metadata?.tenant_id || session.client_reference_id;
        const skuId = session.metadata?.sku_id;

        if (tenantId && skuId) {
          const existingActive = await hasActiveTenantSubscription(
            c.env,
            String(tenantId),
            String(skuId)
          );
          if (!existingActive) {
            const subId = crypto.randomUUID();
            const now = new Date().toISOString();
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            await supabaseMutate(
              c.env.SUPABASE_URL,
              c.env.SUPABASE_SERVICE_KEY,
              "tenant_subscriptions",
              "POST",
              {
                id: subId,
                tenant_id: tenantId,
                sku_id: skuId,
                status: "active",
                activated_at: now,
                expires_at: expiresAt,
              }
            );
          } else {
            console.log("Stripe webhook duplicate subscription activation skipped", {
              tenantId,
              skuId,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const tenantId = invoice.metadata?.tenant_id;

        if (tenantId) {
          // v3.6: Update subscription status in Supabase (SINGLE SOURCE OF TRUTH)
          await supabaseMutate(
            c.env.SUPABASE_URL,
            c.env.SUPABASE_SERVICE_KEY,
            "tenant_subscriptions",
            "PATCH",
            { status: "past_due" },
            `tenant_id=eq.${encodeURIComponent(tenantId)}&status=eq.active`
          );
        }
        break;
      }
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

// ============================================================================
// RAZORPAY WEBHOOK HANDLER
// ============================================================================

app.post("/v1/billing/webhooks/razorpay", async (c) => {
  try {
    const rawBody = await c.req.text();
    const signature = c.req.header("x-razorpay-signature");

    if (!signature || !c.env.RAZORPAY_WEBHOOK_SECRET) {
      return c.json({ error: "Missing signature or secret" }, 400);
    }

    const valid = await verifyRazorpayWebhookSignature(
      rawBody,
      signature,
      c.env.RAZORPAY_WEBHOOK_SECRET
    );
    if (!valid) {
      return c.json({ error: "Invalid webhook signature" }, 401);
    }

    const event = JSON.parse(rawBody);
    const replayKey = buildWebhookReplayKey("razorpay", event, rawBody);
    const replayAllowed = await acquireWebhookReplayLock(c.env, replayKey);
    if (!replayAllowed) {
      console.log("Razorpay webhook replay blocked", { replayKey });
      return c.json({ received: true, duplicate: true });
    }

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity as any;
      const orderId = String(payment.order_id || "");
      const alreadyCompleted = orderId
        ? (await getPaymentTransactionStatus(c.env, "razorpay", orderId)) === "completed"
        : false;

      // v3.6: Update transaction status in Supabase (SINGLE SOURCE OF TRUTH)
      await supabaseMutate(
        c.env.SUPABASE_URL,
        c.env.SUPABASE_SERVICE_KEY,
        "payment_transactions",
        "PATCH",
        {
          status: "completed",
          updated_at: new Date().toISOString(),
        },
        `gateway_session_id=eq.${encodeURIComponent(orderId)}`
      );

      if (alreadyCompleted) {
        console.log("Razorpay webhook duplicate delivery; transaction already completed:", orderId);
        return c.json({ received: true });
      }

      // Activate subscription
      const notes = payment.notes || {};
      if (notes.tenant_id && notes.sku_id) {
        const tenantId = String(notes.tenant_id);
        const skuId = String(notes.sku_id);
        const existingActive = await hasActiveTenantSubscription(c.env, tenantId, skuId);
        if (!existingActive) {
          const subId = crypto.randomUUID();
          const now = new Date().toISOString();
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          await supabaseMutate(
            c.env.SUPABASE_URL,
            c.env.SUPABASE_SERVICE_KEY,
            "tenant_subscriptions",
            "POST",
            {
              id: subId,
              tenant_id: tenantId,
              sku_id: skuId,
              status: "active",
              activated_at: now,
              expires_at: expiresAt,
            }
          );
        } else {
          console.log("Razorpay webhook duplicate subscription activation skipped", {
            tenantId,
            skuId,
          });
        }
      }
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

export default app;
