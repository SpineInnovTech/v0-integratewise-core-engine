/**
 * IntegrateWise Webhook Ingress Worker
 * Cloudflare Worker for receiving webhooks from multiple providers
 */

export interface Env {
  NEON_CONNECTION_STRING: string;
  RAZORPAY_WEBHOOK_SECRET: string;
  STRIPE_ENDPOINT_SECRET: string;
  GITHUB_WEBHOOK_SECRET: string;
  VERCEL_WEBHOOK_SECRET: string;
  AI_RELAY_SECRET: string;
  CODA_API_TOKEN: string;
  // New webhook secrets
  HUBSPOT_CLIENT_SECRET: string;
  LINKEDIN_CLIENT_SECRET: string;
  CANVA_WEBHOOK_SECRET: string;
  SALESFORCE_SECURITY_TOKEN: string;
  PIPEDRIVE_WEBHOOK_TOKEN: string;
  META_VERIFY_TOKEN: string;
  WHATSAPP_VERIFY_TOKEN: string;
  // Triage
  TRIAGE_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  FIRESTORE_PROJECT_ID: string;
  FIRESTORE_SERVICE_ACCOUNT_TOKEN: string; // short-lived GCP token, refreshed externally
  ENVIRONMENT: string;
}

// ============================================================================
// TRIAGE — Continuity Ingestion Protocol
// POST /triage
// All governed continuity producers call this endpoint.
// ============================================================================

type ContinuityType =
  | "doctrine"
  | "architecture"
  | "workflow"
  | "campaign"
  | "entity_update"
  | "escalation"
  | "approval"
  | "insight"
  | "continuity_gap"
  | "deployment"
  | "governance_event"
  | "unknown";

type GovernanceState =
  | "proposed"
  | "triaged"
  | "linked"
  | "governed"
  | "approved"
  | "live"
  | "projected"
  | "archived";

type Scope = "canonical" | "marketing" | "brand" | "ops" | "demo";

type ContinuitySource =
  | "manus"
  | "spark"
  | "hermes"
  | "gmail"
  | "slack"
  | "n8n"
  | "ops_board"
  | "manual"
  | "unknown";

interface TriagePayload {
  // Required by caller
  source: ContinuitySource;
  content: string; // The raw content / event description

  // Optional hints — triage will classify if omitted
  continuity_type?: ContinuityType;
  scope?: Scope;
  entity_refs?: string[];
  relationships?: string[];
  lineage?: string[];
  continuity_weight?: number; // 1-10
  metadata?: Record<string, unknown>;
}

interface ContinuityObject {
  id: string;
  continuity_type: ContinuityType;
  scope: Scope;
  governance_state: GovernanceState;
  source: ContinuitySource;
  continuity_weight: number;
  content: string;
  entity_refs: string[];
  relationships: string[];
  lineage: string[];
  metadata: Record<string, unknown>;
  hitl_required: boolean;
  hitl_reason?: string;
  created_at: string;
  updated_at: string;
}

// Classification: detect continuity_type from content signals
function classifyContinuityType(content: string, hint?: ContinuityType): ContinuityType {
  if (hint && hint !== "unknown") return hint;
  const c = content.toLowerCase();
  if (c.includes("doctrine") || c.includes("principle") || c.includes("rule")) return "doctrine";
  if (
    c.includes("architecture") ||
    c.includes("infrastructure") ||
    c.includes("worker") ||
    c.includes("deploy")
  )
    return "architecture";
  if (c.includes("workflow") || c.includes("process") || c.includes("sop")) return "workflow";
  if (
    c.includes("campaign") ||
    c.includes("gtm") ||
    c.includes("launch") ||
    c.includes("marketing")
  )
    return "campaign";
  if (c.includes("insight") || c.includes("synthesis") || c.includes("analysis")) return "insight";
  if (c.includes("blocker") || c.includes("escalat") || c.includes("risk") || c.includes("urgent"))
    return "escalation";
  if (
    c.includes("approval") ||
    c.includes("approve") ||
    c.includes("review") ||
    c.includes("pending")
  )
    return "approval";
  if (c.includes("gap") || c.includes("missing") || c.includes("unresolved"))
    return "continuity_gap";
  if (c.includes("deploy") || c.includes("release") || c.includes("version") || c.includes("ship"))
    return "deployment";
  if (c.includes("governance") || c.includes("policy") || c.includes("audit"))
    return "governance_event";
  if (c.includes("entity") || c.includes("account") || c.includes("contact") || c.includes("lead"))
    return "entity_update";
  return "unknown";
}

// Scope inference
function inferScope(source: ContinuitySource, type: ContinuityType, hint?: Scope): Scope {
  if (hint) return hint;
  if (source === "manus") return "marketing";
  if (type === "doctrine" || type === "architecture") return "canonical";
  if (type === "campaign") return "marketing";
  if (type === "deployment" || type === "governance_event") return "ops";
  return "ops";
}

// HITL required rules
function requiresHITL(
  type: ContinuityType,
  scope: Scope,
  source: ContinuitySource
): { required: boolean; reason?: string } {
  if (scope === "canonical")
    return { required: true, reason: "canonical scope always requires approval" };
  if (type === "doctrine")
    return { required: true, reason: "doctrine changes require founder approval" };
  if (type === "approval")
    return { required: true, reason: "approval objects are governance records" };
  if (source === "manus" && scope === "marketing")
    return { required: true, reason: "manus marketing output requires review before promotion" };
  if (type === "unknown")
    return { required: true, reason: "unknown continuity type — classify before promoting" };
  return { required: false };
}

// Continuity weight scoring
function scoreContinuityWeight(type: ContinuityType, scope: Scope): number {
  const typeWeight: Record<ContinuityType, number> = {
    doctrine: 10,
    architecture: 9,
    governance_event: 8,
    approval: 8,
    escalation: 8,
    continuity_gap: 7,
    workflow: 6,
    deployment: 6,
    entity_update: 5,
    insight: 5,
    campaign: 4,
    unknown: 3,
  };
  const scopeBonus: Record<Scope, number> = {
    canonical: 2,
    ops: 1,
    brand: 1,
    marketing: 0,
    demo: -1,
  };
  return Math.min(10, (typeWeight[type] || 3) + (scopeBonus[scope] || 0));
}

// Persist to Neon (primary) — continuity_objects table
async function persistContinuityObject(
  obj: ContinuityObject,
  connectionString: string
): Promise<void> {
  const url = new URL(connectionString);
  const apiUrl = `https://${url.hostname}/sql`;

  const query = `
    INSERT INTO continuity_objects (
      id, continuity_type, scope, governance_state, source,
      continuity_weight, content, entity_refs, relationships,
      lineage, metadata, hitl_required, hitl_reason,
      created_at, updated_at
    ) VALUES (
      $1::uuid, $2, $3, $4, $5,
      $6, $7, $8::jsonb, $9::jsonb,
      $10::jsonb, $11::jsonb, $12, $13,
      $14::timestamptz, $15::timestamptz
    )
    ON CONFLICT (id) DO NOTHING
  `;

  const params = [
    obj.id,
    obj.continuity_type,
    obj.scope,
    obj.governance_state,
    obj.source,
    obj.continuity_weight,
    obj.content,
    JSON.stringify(obj.entity_refs),
    JSON.stringify(obj.relationships),
    JSON.stringify(obj.lineage),
    JSON.stringify(obj.metadata),
    obj.hitl_required,
    obj.hitl_reason || null,
    obj.created_at,
    obj.updated_at,
  ];

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Neon-Connection-String": connectionString },
    body: JSON.stringify({ query, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neon write failed: ${res.status} — ${text}`);
  }
}

// Fan-out to Firestore (ops runtime layer) — best effort, non-blocking
async function fanOutToFirestore(
  obj: ContinuityObject,
  projectId: string,
  token: string
): Promise<void> {
  if (!projectId || !token) return;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/continuity_objects`;
  const fields: Record<string, unknown> = {};
  const toField = (v: unknown) => {
    if (typeof v === "string") return { stringValue: v };
    if (typeof v === "number") return { integerValue: String(v) };
    if (typeof v === "boolean") return { booleanValue: v };
    return { stringValue: JSON.stringify(v) };
  };
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      fields[k] = { arrayValue: { values: v.map((i) => ({ stringValue: String(i) })) } };
    } else if (v !== null && typeof v === "object") {
      fields[k] = { stringValue: JSON.stringify(v) };
    } else {
      fields[k] = toField(v);
    }
  }
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields }),
  }).catch((e) => console.warn("[triage] Firestore fan-out failed:", e));
}

// Main triage handler
async function handleTriage(request: Request, env: Env): Promise<Response> {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  // Auth — HMAC or shared secret header
  const authHeader = request.headers.get("x-triage-secret") || request.headers.get("authorization");
  if (env.TRIAGE_WEBHOOK_SECRET) {
    const provided = authHeader?.replace("Bearer ", "") || "";
    if (!timingSafeEqual(provided, env.TRIAGE_WEBHOOK_SECRET)) {
      return json({ error: "Unauthorized" }, 401);
    }
  }

  let raw: TriagePayload;
  try {
    raw = (await request.json()) as TriagePayload;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!raw.source || !raw.content) {
    return json({ error: "source and content are required fields" }, 400);
  }

  // Classify
  const continuity_type = classifyContinuityType(raw.content, raw.continuity_type);
  const scope = inferScope(raw.source, continuity_type, raw.scope);
  const { required: hitl_required, reason: hitl_reason } = requiresHITL(
    continuity_type,
    scope,
    raw.source
  );
  const continuity_weight = raw.continuity_weight ?? scoreContinuityWeight(continuity_type, scope);

  // Lifecycle: unknown type stays proposed, others advance to triaged
  const governance_state: GovernanceState = continuity_type === "unknown" ? "proposed" : "triaged";

  const now = new Date().toISOString();
  const obj: ContinuityObject = {
    id: crypto.randomUUID(),
    continuity_type,
    scope,
    governance_state,
    source: raw.source,
    continuity_weight,
    content: raw.content,
    entity_refs: raw.entity_refs ?? [],
    relationships: raw.relationships ?? [],
    lineage: raw.lineage ?? [],
    metadata: raw.metadata ?? {},
    hitl_required,
    hitl_reason,
    created_at: now,
    updated_at: now,
  };

  // Persist to Neon
  if (env.NEON_CONNECTION_STRING) {
    try {
      await persistContinuityObject(obj, env.NEON_CONNECTION_STRING);
    } catch (e) {
      console.error("[triage] Neon write failed:", e);
      return json({ error: "Persistence failed", detail: String(e) }, 500);
    }
  }

  // Fan-out to Firestore (non-blocking)
  if (env.FIRESTORE_PROJECT_ID) {
    void fanOutToFirestore(obj, env.FIRESTORE_PROJECT_ID, env.FIRESTORE_SERVICE_ACCOUNT_TOKEN);
  }

  console.log(
    `[triage] ${obj.id} | ${obj.continuity_type} | ${obj.scope} | ${obj.governance_state} | hitl=${obj.hitl_required} | src=${obj.source}`
  );

  return json({
    status: "triaged",
    id: obj.id,
    continuity_type: obj.continuity_type,
    scope: obj.scope,
    governance_state: obj.governance_state,
    continuity_weight: obj.continuity_weight,
    hitl_required: obj.hitl_required,
    hitl_reason: obj.hitl_reason,
  });
}

interface WebhookEvent {
  id: string;
  provider: string;
  event_type: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  received_at: string;
  dedupe_hash: string;
  raw_body: string;
  signature_valid: boolean;
  tenant_id?: string; // Tenant ID resolved from request
}

type Provider =
  | "razorpay"
  | "stripe"
  | "github"
  | "vercel"
  | "todoist"
  | "notion"
  | "ai_relay"
  | "hubspot"
  | "linkedin"
  | "canva"
  | "salesforce"
  | "pipedrive"
  | "google_ads"
  | "meta"
  | "whatsapp";

// Crypto utilities
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const keyBuffer = new TextEncoder().encode(key);
  const msgBuffer = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msgBuffer);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Signature verification
async function verifyRazorpay(body: string, sig: string | null, secret: string): Promise<boolean> {
  if (!sig || !secret) return !secret; // Pass if no secret configured
  return timingSafeEqual(sig, await hmacSha256(secret, body));
}

async function verifyStripe(body: string, sig: string | null, secret: string): Promise<boolean> {
  if (!sig || !secret) return !secret;
  const parts = sig.split(",");
  const t = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1 = parts.find((p) => p.startsWith("v1="))?.slice(3);
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - parseInt(t)) > 300) return false;
  return timingSafeEqual(v1, await hmacSha256(secret, `${t}.${body}`));
}

async function verifyGithub(body: string, sig: string | null, secret: string): Promise<boolean> {
  if (!sig || !secret) return !secret;
  if (!sig.startsWith("sha256=")) return false;
  return timingSafeEqual(sig.slice(7), await hmacSha256(secret, body));
}

async function verifyVercel(body: string, sig: string | null, secret: string): Promise<boolean> {
  if (!sig || !secret) return !secret;
  const keyBuffer = new TextEncoder().encode(secret);
  const msgBuffer = new TextEncoder().encode(body);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const expected = await crypto.subtle.sign("HMAC", cryptoKey, msgBuffer);
  const expectedHex = Array.from(new Uint8Array(expected))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(sig, expectedHex);
}

// HubSpot uses clientSecret + body for v1 signatures
async function verifyHubSpot(body: string, sig: string | null, secret: string): Promise<boolean> {
  if (!sig || !secret) return !secret;
  const expected = await sha256(secret + body);
  return timingSafeEqual(sig, expected);
}

// Canva uses HMAC-SHA256
async function verifyCanva(body: string, sig: string | null, secret: string): Promise<boolean> {
  if (!sig || !secret) return !secret;
  return timingSafeEqual(sig, await hmacSha256(secret, body));
}

// Database - using Neon HTTP API
async function persistEvent(
  event: WebhookEvent,
  connectionString: string
): Promise<{ inserted: boolean; duplicate: boolean }> {
  // Parse connection string
  const url = new URL(connectionString);
  const host = url.hostname;
  const database = url.pathname.slice(1);
  const user = url.username;
  const password = url.password;

  const apiUrl = `https://${host}/sql`;

  // Include tenant_id if available
  const hasTenantId = event.tenant_id != null;
  const query = hasTenantId
    ? `
      INSERT INTO events_log (id, provider, event_type, payload, headers, received_at, dedupe_hash, raw_body, signature_valid, tenant_id)
      VALUES ($1::uuid, $2, $3, $4::jsonb, $5::jsonb, $6::timestamptz, $7, $8, $9, $10::uuid)
      ON CONFLICT (dedupe_hash) DO NOTHING
      RETURNING id
    `
    : `
      INSERT INTO events_log (id, provider, event_type, payload, headers, received_at, dedupe_hash, raw_body, signature_valid)
      VALUES ($1::uuid, $2, $3, $4::jsonb, $5::jsonb, $6::timestamptz, $7, $8, $9)
      ON CONFLICT (dedupe_hash) DO NOTHING
      RETURNING id
    `;

  const params = [
    event.id,
    event.provider,
    event.event_type,
    JSON.stringify(event.payload),
    JSON.stringify(event.headers),
    event.received_at,
    event.dedupe_hash,
    event.raw_body,
    event.signature_valid,
  ];

  if (hasTenantId) {
    params.push(event.tenant_id!);
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": connectionString,
    },
    body: JSON.stringify({
      query,
      params,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Database error: ${response.status} - ${text}`);
  }

  const result = (await response.json()) as { rows: unknown[] };
  return {
    inserted: result.rows && result.rows.length > 0,
    duplicate: !result.rows || result.rows.length === 0,
  };
}

function extractHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  [
    "content-type",
    "user-agent",
    "x-request-id",
    "x-razorpay-signature",
    "stripe-signature",
    "x-hub-signature-256",
    "x-github-event",
    "x-vercel-signature",
    "x-hubspot-signature",
    "x-hubspot-signature-v3",
    "x-canva-signature",
    "x-linkedin-signature",
    "x-pipedrive-signature",
  ].forEach((k) => {
    const v = headers.get(k);
    if (v) result[k] = v;
  });
  return result;
}

function getEventType(
  provider: Provider,
  payload: Record<string, unknown>,
  headers: Headers
): string {
  switch (provider) {
    case "razorpay":
      return String(payload.event || "unknown");
    case "stripe":
      return String(payload.type || "unknown");
    case "github":
      return headers.get("x-github-event") || "unknown";
    case "vercel":
      return String(payload.type || "unknown");
    case "todoist":
      return String(payload.event_name || "unknown");
    case "notion":
      return String(payload.type || "unknown");
    case "ai_relay":
      return String(payload.event || "unknown");
    // New providers
    case "hubspot":
      return String((payload as any).subscriptionType || (payload as any).eventType || "webhook");
    case "linkedin":
      return String((payload as any).eventType || (payload as any).type || "lead");
    case "canva":
      return String((payload as any).type || "design_export");
    case "salesforce":
      return String((payload as any).attributes?.type || (payload as any).type || "record");
    case "pipedrive":
      return String((payload as any).event || (payload as any).meta?.action || "deal");
    case "google_ads":
      return String(
        (payload as any).event_type || (payload as any).conversion_action || "conversion"
      );
    case "meta":
      return String((payload as any).object || "event");
    case "whatsapp":
      return "message";
    default:
      return "unknown";
  }
}

// Main handler
async function handleWebhook(request: Request, env: Env, provider: Provider): Promise<Response> {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  try {
    // Resolve tenant context from request
    const tenantResult = await resolveTenantForWorker(request, {
      defaultTenantId: undefined, // Don't use default for webhooks - require explicit tenant
      requireTenant: false, // Allow webhooks without tenant for backward compatibility
      debug: env.ENVIRONMENT === "development", // Enable debug in dev
    });

    const tenantContext: TenantContext | null = tenantResult.context;
    const tenantId = tenantContext?.tenantId;

    // Log tenant resolution result
    if (!tenantResult.success && tenantResult.error) {
      console.warn(`[Webhook ${provider}] Tenant resolution failed: ${tenantResult.error}`);
    }

    if (tenantId) {
      console.log(`[Tenant: ${tenantId}] Processing webhook from ${provider}`);
    }

    const body = await request.text();
    const headers = request.headers;

    // Get secret and signature
    let secret = "";
    let sig: string | null = null;
    let verify: (b: string, s: string | null, k: string) => Promise<boolean>;

    switch (provider) {
      case "razorpay":
        secret = env.RAZORPAY_WEBHOOK_SECRET || "";
        sig = headers.get("x-razorpay-signature");
        verify = verifyRazorpay;
        break;
      case "stripe":
        secret = env.STRIPE_ENDPOINT_SECRET || "";
        sig = headers.get("stripe-signature");
        verify = verifyStripe;
        break;
      case "github":
        secret = env.GITHUB_WEBHOOK_SECRET || "";
        sig = headers.get("x-hub-signature-256");
        verify = verifyGithub;
        break;
      case "vercel":
        secret = env.VERCEL_WEBHOOK_SECRET || "";
        sig = headers.get("x-vercel-signature");
        verify = verifyVercel;
        break;
      case "todoist":
      case "notion":
        verify = async () => true;
        break;
      case "ai_relay":
        secret = env.AI_RELAY_SECRET || "";
        sig = headers.get("x-ai-relay-signature");
        verify = verifyRazorpay; // Same HMAC-SHA256
        break;
      // New providers
      case "hubspot":
        secret = env.HUBSPOT_CLIENT_SECRET || "";
        sig = headers.get("x-hubspot-signature") || headers.get("x-hubspot-signature-v3");
        verify = verifyHubSpot;
        break;
      case "linkedin":
        verify = async () => true; // LinkedIn uses OAuth, verify via API
        break;
      case "canva":
        secret = env.CANVA_WEBHOOK_SECRET || "";
        sig = headers.get("x-canva-signature");
        verify = verifyCanva;
        break;
      case "salesforce":
        verify = async () => true; // Salesforce uses outbound messages
        break;
      case "pipedrive":
        secret = env.PIPEDRIVE_WEBHOOK_TOKEN || "";
        sig = headers.get("x-pipedrive-signature");
        verify = verifyRazorpay; // HMAC-SHA256
        break;
      case "google_ads":
        verify = async () => true; // Google Ads uses OAuth
        break;
      case "meta":
      case "whatsapp":
        verify = async () => true; // Meta/WhatsApp verify via challenge
        break;
    }

    // Verify
    const valid = await verify!(body, sig, secret);
    if (!valid && secret) {
      return json({ error: "Invalid signature" }, 401);
    }

    // Parse
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    // Build event
    const eventId = crypto.randomUUID();
    const dedupeHash = await sha256(`${provider}:${body}`);
    const eventType = getEventType(provider, payload, headers);

    const event: WebhookEvent = {
      id: eventId,
      provider,
      event_type: eventType,
      payload,
      headers: extractHeaders(headers),
      received_at: new Date().toISOString(),
      dedupe_hash: dedupeHash,
      raw_body: body,
      signature_valid: valid,
      tenant_id: tenantId || undefined, // Include tenant ID if resolved
    };

    // Persist
    if (env.NEON_CONNECTION_STRING) {
      const { duplicate } = await persistEvent(event, env.NEON_CONNECTION_STRING);
      if (duplicate) {
        return json({ status: "duplicate", dedupe_hash: dedupeHash });
      }
    }

    console.log(
      `Event: ${provider}/${eventType} - ${eventId}${tenantId ? ` [Tenant: ${tenantId}]` : ""}`
    );
    return json({
      status: "received",
      event_id: eventId,
      provider,
      event_type: eventType,
      tenant_id: tenantId || undefined,
    });
  } catch (error) {
    console.error(`Error ${provider}:`, error);
    return json({ error: "Internal error", message: String(error) }, 500);
  }
}

// Router
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    // Health check
    if (path === "/health" || path === "/") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "integratewise-webhooks",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          db_configured: !!env.NEON_CONNECTION_STRING,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // All webhook routes
    const routes: Record<string, Provider> = {
      "/webhooks/razorpay": "razorpay",
      "/webhooks/stripe": "stripe",
      "/webhooks/github": "github",
      "/webhooks/vercel": "vercel",
      "/webhooks/todoist": "todoist",
      "/webhooks/notion": "notion",
      "/webhooks/ai-relay": "ai_relay",
      // New providers
      "/webhooks/hubspot": "hubspot",
      "/webhooks/linkedin": "linkedin",
      "/webhooks/canva": "canva",
      "/webhooks/salesforce": "salesforce",
      "/webhooks/pipedrive": "pipedrive",
      "/webhooks/google-ads": "google_ads",
      "/webhooks/meta": "meta",
      "/webhooks/whatsapp": "whatsapp",
    };

    // Meta/WhatsApp GET for verification challenge
    if (request.method === "GET" && (path === "/webhooks/meta" || path === "/webhooks/whatsapp")) {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      const expectedToken =
        path === "/webhooks/meta" ? env.META_VERIFY_TOKEN : env.WHATSAPP_VERIFY_TOKEN;

      if (mode === "subscribe" && token === expectedToken) {
        return new Response(challenge || "", { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // Triage — continuity ingestion protocol
    if (path === "/triage") {
      if (request.method === "POST") {
        return handleTriage(request, env);
      }
      // GET /triage — schema introspection for callers
      if (request.method === "GET") {
        return new Response(
          JSON.stringify({
            endpoint: "/triage",
            method: "POST",
            auth: "x-triage-secret header (or Authorization: Bearer <secret>)",
            required_fields: {
              source: "manus|spark|hermes|gmail|slack|n8n|ops_board|manual|unknown",
              content: "string",
            },
            optional_fields: {
              continuity_type:
                "doctrine|architecture|workflow|campaign|entity_update|escalation|approval|insight|continuity_gap|deployment|governance_event|unknown",
              scope: "canonical|marketing|brand|ops|demo",
              entity_refs: "string[]",
              relationships: "string[]",
              lineage: "string[]",
              continuity_weight: "number 1-10",
              metadata: "object",
            },
            lifecycle: [
              "proposed",
              "triaged",
              "linked",
              "governed",
              "approved",
              "live",
              "projected",
              "archived",
            ],
            response: {
              status: "triaged",
              id: "uuid",
              continuity_type: "string",
              scope: "string",
              governance_state: "string",
              continuity_weight: "number",
              hitl_required: "boolean",
              hitl_reason: "string|undefined",
            },
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // POST webhook routes
    if (request.method === "POST") {
      const provider = routes[path];
      if (provider) {
        return handleWebhook(request, env, provider);
      }
    }

    return new Response(
      JSON.stringify({
        error: "Not found",
        providers: Object.keys(routes).map((r) => r.replace("/webhooks/", "")),
        routes: ["/health", ...Object.keys(routes)],
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  },
};
