/**
 * IntegrateWise - View Projection API
 *
 * Unified read layer that composes hydrated snapshots from:
 * - Spine (Truth)
 * - Store (Context/Documents)
 * - Knowledge (Semantic)
 * - IQ Hub (Memory/Sessions)
 *
 * Serves L1 views efficiently with caching.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

// =============================================================================
// TYPES
// =============================================================================

interface Env {
  DB: D1Database;
  VIEW_CACHE: KVNamespace;
  SPINE: Fetcher;
  STORE: Fetcher;
  KNOWLEDGE: Fetcher;
  IQ_HUB: Fetcher;
  TENANTS: Fetcher;
  THINK: Fetcher;
  /** Optional: for Entity 360 tenant scoping (Spine-only hardening). When set, account-360 only fetches entity types allowed for tenant's domains. */
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface ViewContext {
  tenant_id: string;
  user_id: string;
  workspace_id?: string;
  scope: "personal" | "csm" | "tam" | "business";
  role: string;
}

// View types matching the Feature Bag modules
type ViewType =
  | "home"
  | "today"
  | "projects"
  | "tasks"
  | "accounts"
  | "contacts"
  | "meetings"
  | "pipeline"
  | "knowledge"
  | "signals"
  | "account-360";

// =============================================================================
// SCHEMAS
// =============================================================================

const ViewRequestSchema = z.object({
  view_id: z.string(),
  context: z.object({
    tenant_id: z.string(),
    user_id: z.string(),
    workspace_id: z.string().optional(),
    scope: z.enum(["personal", "csm", "tam", "business"]).default("personal"),
    role: z.string().default("practitioner"),
  }),
  filters: z.record(z.string(), z.unknown()).optional(),
  pagination: z
    .object({
      page: z.number().default(1),
      limit: z.number().default(50),
    })
    .optional(),
});

// =============================================================================
// APP SETUP
// =============================================================================

const app = new Hono<{ Bindings: Env }>();

// CORS for all origins (adjust in production)
app.use("*", cors());

// Health check
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "integratewise-views",
    description: "View Projection API - Unified read layer for L1 views",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// =============================================================================
// VIEW ENDPOINTS
// =============================================================================

/**
 * GET /view/:view_id
 * Get a hydrated view snapshot
 */
app.get("/view/:view_id", async (c) => {
  const viewId = c.req.param("view_id") as ViewType;
  const tenantId = c.req.header("x-tenant-id");
  const userId = c.req.header("x-user-id");
  const scope = c.req.header("x-scope") || "personal";

  if (!tenantId || !userId) {
    return c.json({ error: "Missing tenant_id or user_id headers" }, 400);
  }

  const context: ViewContext = {
    tenant_id: tenantId,
    user_id: userId,
    scope: scope as ViewContext["scope"],
    role: c.req.header("x-role") || "practitioner",
  };

  try {
    // Check cache first
    const cacheKey = `view:${viewId}:${tenantId}:${userId}:${scope}`;
    const cached = await c.env.VIEW_CACHE.get(cacheKey, "json");

    if (cached) {
      return c.json({
        ...cached,
        _cached: true,
        _cache_time: new Date().toISOString(),
      });
    }

    // Build the view
    const view = await buildView(c.env, viewId, context);

    // Cache for 60 seconds (adjust based on view type)
    await c.env.VIEW_CACHE.put(cacheKey, JSON.stringify(view), { expirationTtl: 60 });

    return c.json(view);
  } catch (error) {
    console.error(`Error building view ${viewId}:`, error);
    return c.json({ error: "Failed to build view", details: String(error) }, 500);
  }
});

/**
 * POST /view/:view_id
 * Get a view with custom filters and pagination
 */
app.post("/view/:view_id", async (c) => {
  const viewId = c.req.param("view_id") as ViewType;

  try {
    const body = await c.req.json();
    const parsed = ViewRequestSchema.parse({ view_id: viewId, ...body });

    const view = await buildView(c.env, viewId, parsed.context, parsed.filters, parsed.pagination);
    return c.json(view);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request", details: error.issues }, 400);
    }
    console.error(`Error building view ${viewId}:`, error);
    return c.json({ error: "Failed to build view", details: String(error) }, 500);
  }
});

/**
 * POST /view/invalidate
 * Invalidate cached views for a tenant
 */
app.post("/view/invalidate", async (c) => {
  const tenantId = c.req.header("x-tenant-id");

  if (!tenantId) {
    return c.json({ error: "Missing tenant_id header" }, 400);
  }

  try {
    const body = await c.req.json();
    const viewIds = body.view_ids as string[] | undefined;

    // In production, use KV list + delete pattern
    // For now, just log the invalidation request
    console.log(`Invalidating views for tenant ${tenantId}:`, viewIds || "all");

    return c.json({ status: "invalidated", tenant_id: tenantId, view_ids: viewIds });
  } catch (error) {
    return c.json({ error: "Failed to invalidate cache" }, 500);
  }
});

// =============================================================================
// VIEW BUILDERS
// =============================================================================

async function buildView(
  env: Env,
  viewId: ViewType,
  context: ViewContext,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<Record<string, unknown>> {
  switch (viewId) {
    case "home":
      return buildHomeView(env, context);
    case "today":
      return buildTodayView(env, context);
    case "projects":
      return buildProjectsView(env, context, filters, pagination);
    case "tasks":
      return buildTasksView(env, context, filters, pagination);
    case "accounts":
      return buildAccountsView(env, context, filters, pagination);
    case "contacts":
      return buildContactsView(env, context, filters, pagination);
    case "meetings":
      return buildMeetingsView(env, context, filters, pagination);
    case "pipeline":
      return buildPipelineView(env, context, filters, pagination);
    case "knowledge":
      return buildKnowledgeView(env, context, filters, pagination);
    case "signals":
      return buildSignalsView(env, context, filters, pagination);
    case "account-360":
      return buildAccount360View(env, context, filters);
    default:
      return { error: `Unknown view: ${viewId}` };
  }
}

// -----------------------------------------------------------------------------
// Home View (Fixed Skeleton Blocks)
// -----------------------------------------------------------------------------
async function buildHomeView(env: Env, context: ViewContext): Promise<Record<string, unknown>> {
  const [todayData, signals, queue, knowledge] = await Promise.all([
    fetchTodayData(env, context),
    fetchTopSignals(env, context, 5),
    fetchWorkQueue(env, context, 5),
    fetchRecentKnowledge(env, context, 5),
  ]);

  return {
    view_id: "home",
    context,
    generated_at: new Date().toISOString(),
    blocks: {
      today_strip: {
        meetings_count: todayData.meetings?.length || 0,
        tasks_due_count: todayData.tasks_due?.length || 0,
        follow_ups_count: todayData.follow_ups?.length || 0,
        meetings: todayData.meetings?.slice(0, 3) || [],
      },
      signal_feed: {
        count: signals.length,
        signals,
      },
      work_queue: {
        count: queue.length,
        items: queue,
      },
      recent_knowledge: {
        count: knowledge.length,
        items: knowledge,
      },
      connect_next: {
        missing_tools: await getMissingTools(env, context.tenant_id),
        suggestion: "Connect your CRM for richer insights",
      },
    },
  };
}

// -----------------------------------------------------------------------------
// Today View
// -----------------------------------------------------------------------------
async function buildTodayView(env: Env, context: ViewContext): Promise<Record<string, unknown>> {
  const todayData = await fetchTodayData(env, context);

  return {
    view_id: "today",
    context,
    generated_at: new Date().toISOString(),
    sections: {
      calendar: todayData.meetings || [],
      tasks_due: todayData.tasks_due || [],
      follow_ups: todayData.follow_ups || [],
      signals: await fetchTopSignals(env, context, 10),
    },
  };
}

// -----------------------------------------------------------------------------
// Projects View
// -----------------------------------------------------------------------------
async function buildProjectsView(
  env: Env,
  context: ViewContext,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<Record<string, unknown>> {
  const projects = await fetchFromSpine(env, context, "projects", filters, pagination);

  return {
    view_id: "projects",
    context,
    generated_at: new Date().toISOString(),
    data: projects,
    total: projects.total || 0,
    page: pagination?.page || 1,
    limit: pagination?.limit || 50,
  };
}

// -----------------------------------------------------------------------------
// Tasks View
// -----------------------------------------------------------------------------
async function buildTasksView(
  env: Env,
  context: ViewContext,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<Record<string, unknown>> {
  const tasks = await fetchFromSpine(env, context, "tasks", filters, pagination);

  return {
    view_id: "tasks",
    context,
    generated_at: new Date().toISOString(),
    data: tasks,
    total: tasks.total || 0,
    page: pagination?.page || 1,
    limit: pagination?.limit || 50,
  };
}

// -----------------------------------------------------------------------------
// Accounts View
// -----------------------------------------------------------------------------
async function buildAccountsView(
  env: Env,
  context: ViewContext,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<Record<string, unknown>> {
  const accounts = await fetchFromSpine(env, context, "accounts", filters, pagination);

  // Enrich with health scores from Think service
  const enrichedAccounts = await enrichAccountsWithHealth(env, context, accounts.items || []);

  return {
    view_id: "accounts",
    context,
    generated_at: new Date().toISOString(),
    data: {
      items: enrichedAccounts,
      total: accounts.total || 0,
    },
    page: pagination?.page || 1,
    limit: pagination?.limit || 50,
    summary: {
      total_accounts: accounts.total || 0,
      at_risk_count: enrichedAccounts.filter(
        (a: any) => a.health_status === "at_risk" || a.health_status === "critical"
      ).length,
      champion_count: enrichedAccounts.filter((a: any) => a.health_status === "champion").length,
    },
  };
}

// -----------------------------------------------------------------------------
// Contacts View
// -----------------------------------------------------------------------------
async function buildContactsView(
  env: Env,
  context: ViewContext,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<Record<string, unknown>> {
  const contacts = await fetchFromSpine(env, context, "contacts", filters, pagination);

  return {
    view_id: "contacts",
    context,
    generated_at: new Date().toISOString(),
    data: contacts,
    total: contacts.total || 0,
    page: pagination?.page || 1,
    limit: pagination?.limit || 50,
  };
}

// -----------------------------------------------------------------------------
// Meetings View
// -----------------------------------------------------------------------------
async function buildMeetingsView(
  env: Env,
  context: ViewContext,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<Record<string, unknown>> {
  const meetings = await fetchFromSpine(env, context, "meetings", filters, pagination);

  return {
    view_id: "meetings",
    context,
    generated_at: new Date().toISOString(),
    data: meetings,
    total: meetings.total || 0,
    page: pagination?.page || 1,
    limit: pagination?.limit || 50,
  };
}

// -----------------------------------------------------------------------------
// Pipeline View
// -----------------------------------------------------------------------------
async function buildPipelineView(
  env: Env,
  context: ViewContext,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<Record<string, unknown>> {
  const deals = await fetchFromSpine(env, context, "deals", filters, pagination);

  // Group by stage
  const stages = groupByStage(deals.items || []);

  return {
    view_id: "pipeline",
    context,
    generated_at: new Date().toISOString(),
    stages,
    total_value: calculateTotalValue(deals.items || []),
    total_deals: deals.total || 0,
  };
}

// -----------------------------------------------------------------------------
// Knowledge View
// -----------------------------------------------------------------------------
async function buildKnowledgeView(
  env: Env,
  context: ViewContext,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<Record<string, unknown>> {
  const [topics, documents, sessions] = await Promise.all([
    fetchFromKnowledge(env, context, "topics", filters, pagination),
    fetchFromStore(env, context, "documents", filters, pagination),
    fetchFromIQHub(env, context, "sessions", filters, pagination),
  ]);

  return {
    view_id: "knowledge",
    context,
    generated_at: new Date().toISOString(),
    topics: topics.items || [],
    documents: documents.items || [],
    recent_sessions: sessions.items || [],
  };
}

// -----------------------------------------------------------------------------
// Signals View
// -----------------------------------------------------------------------------
async function buildSignalsView(
  env: Env,
  context: ViewContext,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<Record<string, unknown>> {
  const signals = await fetchFromThink(env, context, "signals", filters, pagination);
  const situations = await fetchFromThink(env, context, "situations", filters, pagination);

  return {
    view_id: "signals",
    context,
    generated_at: new Date().toISOString(),
    signals: signals.items || [],
    situations: situations.items || [],
    total_signals: signals.total || 0,
    total_situations: situations.total || 0,
  };
}

/** Entity types used by account-360, by tenant domain (Spine-only hardening). */
const DOMAIN_TO_ACCOUNT360_ENTITY_TYPES: Record<string, string[]> = {
  SALES: ["accounts", "contacts", "deals"],
  CSM: ["accounts", "contacts", "deals", "tickets", "events"],
  CUSTOMER_SUCCESS: ["accounts", "contacts", "deals", "tickets", "events"],
  SUPPORT: ["tickets", "events"],
  SERVICE: ["tickets", "events"],
  ENGINEERING: ["events"],
  PRODUCT_ENGINEERING: ["events"],
  FINANCE: ["accounts", "deals"],
  PROJECTS: ["accounts", "contacts"],
  BIZOPS: ["accounts", "contacts", "deals", "tickets", "events"],
};

/** Tenant domain → config key (align with BFF TENANT_DOMAIN_TO_READINESS_KEY for Entity 360). */
const TENANT_DOMAIN_TO_ACCOUNT360_KEY: Record<string, string> = {
  CSM: "CUSTOMER_SUCCESS",
  ENGINEERING: "PRODUCT_ENGINEERING",
  SUPPORT: "SERVICE",
  PROJECTS: "BIZOPS",
};

/** Resolve tenant Spine config and return allowed account-360 entity types. Returns null = allow all (no config or no Supabase). */
async function getTenantAllowedAccount360EntityTypes(
  env: Env,
  tenantId: string
): Promise<Set<string> | null> {
  if (!tenantId) return null;
  try {
    const { getTenantSpineConfigJson } = await import("./tenant-spine-config");
    const config = await getTenantSpineConfigJson(env, tenantId);
    const domains = config.domains ?? [];
    if (!domains.length) return null;
    const allowed = new Set<string>();
    for (const d of domains) {
      const key = TENANT_DOMAIN_TO_ACCOUNT360_KEY[d] ?? d;
      const types = DOMAIN_TO_ACCOUNT360_ENTITY_TYPES[key] ?? DOMAIN_TO_ACCOUNT360_ENTITY_TYPES[d];
      if (types) for (const t of types) allowed.add(t);
    }
    return allowed.size > 0 ? allowed : null;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Account 360 View (Detailed single account)
// -----------------------------------------------------------------------------
async function buildAccount360View(
  env: Env,
  context: ViewContext,
  filters?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const accountId = filters?.account_id as string;

  if (!accountId) {
    return { error: "account_id filter required for account-360 view" };
  }

  const allowed = await getTenantAllowedAccount360EntityTypes(env, context.tenant_id);
  const allow = (entityType: string) => !allowed || allowed.has(entityType);

  // §17.1: Gate Knowledge UI (IQ Hub sessions) by link_knowledge_ui_to_entity360
  const linkKnowledgeUI =
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? await (
          await import("./tenant-spine-config")
        ).getTenantLinkKnowledgeToEntity360(env, context.tenant_id)
      : true;

  const [account, contacts, deals, tickets, events, sessions, signals] = await Promise.all([
    allow("accounts")
      ? fetchFromSpine(env, context, "accounts", { id: accountId })
      : { items: [], total: 0 },
    allow("contacts")
      ? fetchFromSpine(env, context, "contacts", { organization_id: accountId })
      : { items: [], total: 0 },
    allow("deals")
      ? fetchFromSpine(env, context, "deals", { organization_id: accountId })
      : { items: [], total: 0 },
    allow("tickets")
      ? fetchFromSpine(env, context, "tickets", { organization_id: accountId })
      : { items: [], total: 0 },
    allow("events")
      ? fetchFromSpine(env, context, "events", { organization_id: accountId })
      : { items: [], total: 0 },
    linkKnowledgeUI
      ? fetchFromIQHub(env, context, "sessions", { organization_id: accountId })
      : { items: [], total: 0 },
    fetchFromThink(env, context, "signals", { organization_id: accountId }),
  ]);

  return {
    view_id: "account-360",
    context,
    generated_at: new Date().toISOString(),
    organization: account.items?.[0] || null,
    key_contacts: contacts.items || [],
    active_deals: deals.items || [],
    open_tickets: tickets.items?.filter((t: any) => t.status !== "closed") || [],
    recent_events: events.items?.slice(0, 10) || [],
    recent_sessions: sessions.items?.slice(0, 5) || [],
    risk_signals:
      signals.items?.filter((s: any) => s.severity === "high" || s.severity === "critical") || [],
  };
}

// =============================================================================
// SERVICE FETCHERS
// =============================================================================

async function fetchFromSpine(
  env: Env,
  context: ViewContext,
  entityType: string,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<any> {
  try {
    const url = new URL(`/v1/spine/entities`, "http://spine");
    url.searchParams.set("type", entityType);
    url.searchParams.set("category", context.scope);
    if (pagination) {
      url.searchParams.set("page", String(pagination.page));
      url.searchParams.set("limit", String(pagination.limit));
    }
    if (filters) {
      url.searchParams.set("filters", JSON.stringify(filters));
    }

    const response = await env.SPINE.fetch(url.toString(), {
      headers: {
        "x-tenant-id": context.tenant_id,
        "x-user-id": context.user_id,
      },
    });

    if (!response.ok) {
      console.error(`Spine fetch failed: ${response.status}`);
      return { items: [], total: 0 };
    }

    return await response.json();
  } catch (error) {
    console.error("Spine fetch error:", error);
    return { items: [], total: 0 };
  }
}

async function fetchFromStore(
  env: Env,
  context: ViewContext,
  entityType: string,
  _filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<any> {
  try {
    const url = new URL(`/store/${entityType}`, "http://store");
    if (pagination) {
      url.searchParams.set("page", String(pagination.page));
      url.searchParams.set("limit", String(pagination.limit));
    }

    const response = await env.STORE.fetch(url.toString(), {
      headers: {
        "x-tenant-id": context.tenant_id,
        "x-user-id": context.user_id,
      },
    });

    if (!response.ok) return { items: [], total: 0 };
    return await response.json();
  } catch (error) {
    console.error("Store fetch error:", error);
    return { items: [], total: 0 };
  }
}

async function fetchFromKnowledge(
  env: Env,
  context: ViewContext,
  entityType: string,
  _filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<any> {
  try {
    const url = new URL(`/knowledge/${entityType}`, "http://knowledge");
    if (pagination) {
      url.searchParams.set("page", String(pagination.page));
      url.searchParams.set("limit", String(pagination.limit));
    }

    const response = await env.KNOWLEDGE.fetch(url.toString(), {
      headers: {
        "x-tenant-id": context.tenant_id,
        "x-user-id": context.user_id,
      },
    });

    if (!response.ok) return { items: [], total: 0 };
    return await response.json();
  } catch (error) {
    console.error("Knowledge fetch error:", error);
    return { items: [], total: 0 };
  }
}

async function fetchFromIQHub(
  env: Env,
  context: ViewContext,
  entityType: string,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<any> {
  try {
    const url = new URL(`/iq/${entityType}`, "http://iq-hub");
    if (filters?.organization_id) {
      url.searchParams.set("organization_id", String(filters.organization_id));
    }
    if (pagination) {
      url.searchParams.set("page", String(pagination.page));
      url.searchParams.set("limit", String(pagination.limit));
    }

    const response = await env.IQ_HUB.fetch(url.toString(), {
      headers: {
        "x-tenant-id": context.tenant_id,
        "x-user-id": context.user_id,
      },
    });

    if (!response.ok) return { items: [], total: 0 };
    return await response.json();
  } catch (error) {
    console.error("IQ Hub fetch error:", error);
    return { items: [], total: 0 };
  }
}

async function fetchFromThink(
  env: Env,
  context: ViewContext,
  entityType: string,
  filters?: Record<string, unknown>,
  pagination?: { page: number; limit: number }
): Promise<any> {
  try {
    const url = new URL(`/v1/${entityType}`, "http://think");
    if (filters?.organization_id) {
      url.searchParams.set("organization_id", String(filters.organization_id));
    }
    if (pagination) {
      url.searchParams.set("page", String(pagination.page));
      url.searchParams.set("limit", String(pagination.limit));
    }

    const response = await env.THINK.fetch(url.toString(), {
      headers: {
        "x-tenant-id": context.tenant_id,
        "x-user-id": context.user_id,
      },
    });

    if (!response.ok) return { items: [], total: 0 };
    return await response.json();
  } catch (error) {
    console.error("Think fetch error:", error);
    return { items: [], total: 0 };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function fetchTodayData(env: Env, context: ViewContext): Promise<any> {
  const today = new Date().toISOString().split("T")[0];
  const [meetings, tasks, followUps] = await Promise.all([
    fetchFromSpine(env, context, "meetings", { date: today }),
    fetchFromSpine(env, context, "tasks", { due_date: today }),
    fetchFromThink(env, context, "proposals", { status: "pending" }, { page: 1, limit: 10 }),
  ]);

  return {
    meetings: meetings.items || [],
    tasks_due: tasks.items || [],
    follow_ups: followUps.items || [],
  };
}

async function fetchTopSignals(env: Env, context: ViewContext, limit: number): Promise<any[]> {
  const signals = await fetchFromThink(env, context, "signals", {}, { page: 1, limit });
  return signals.items || [];
}

async function fetchWorkQueue(env: Env, context: ViewContext, limit: number): Promise<any[]> {
  const [tasks, approvals] = await Promise.all([
    fetchFromSpine(
      env,
      context,
      "tasks",
      { assigned_to: context.user_id, status: "pending" },
      { page: 1, limit }
    ),
    fetchFromSpine(
      env,
      context,
      "approvals",
      { approver_id: context.user_id, status: "pending" },
      { page: 1, limit }
    ),
  ]);

  const queue = [
    ...(tasks.items || []).map((t: any) => ({ type: "task", ...t })),
    ...(approvals.items || []).map((a: any) => ({ type: "approval", ...a })),
  ];

  return queue.slice(0, limit);
}

async function fetchRecentKnowledge(env: Env, context: ViewContext, limit: number): Promise<any[]> {
  const [docs, sessions] = await Promise.all([
    fetchFromStore(env, context, "documents", {}, { page: 1, limit }),
    fetchFromIQHub(env, context, "sessions", {}, { page: 1, limit }),
  ]);

  const knowledge = [
    ...(docs.items || []).map((d: any) => ({ type: "document", ...d })),
    ...(sessions.items || []).map((s: any) => ({ type: "session", ...s })),
  ];

  return knowledge
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, limit);
}

async function getMissingTools(env: Env, tenantId: string): Promise<string[]> {
  try {
    const tenantRes = await env.TENANTS.fetch(new Request(`http://tenants/v1/tenant/${tenantId}`));

    if (!tenantRes.ok) {
      console.error("Failed to fetch tenant data:", tenantRes.status);
      return [];
    }

    const tenantData = (await tenantRes.json()) as Record<string, any>;
    const connectedTools = tenantData.connected_tools || [];

    // Return tools that are not connected
    const allTools = ["crm", "support", "calendar", "email", "analytics"];
    return allTools.filter((tool) => !connectedTools.includes(tool));
  } catch (error) {
    console.error("Error fetching missing tools:", error);
    return [];
  }
}

async function enrichAccountsWithHealth(
  env: Env,
  context: ViewContext,
  accounts: any[]
): Promise<any[]> {
  try {
    // Batch fetch health scores from Think service for all accounts
    const healthRes = await env.THINK.fetch(
      new Request(`http://think/v1/signals/health?tenant_id=${context.tenant_id}`)
    );

    if (!healthRes.ok) {
      console.error("Failed to fetch health scores:", healthRes.status);
      return accounts;
    }

    const healthData = (await healthRes.json()) as Record<string, any>;
    const healthScores = new Map(
      (healthData.items || []).map((item: any) => [item.account_id, item])
    );

    // Enrich accounts with health information
    return accounts.map((account: any) => ({
      ...account,
      health_status: (healthScores.get(account.id) as any)?.status || "unknown",
      health_score: (healthScores.get(account.id) as any)?.score || 0,
    }));
  } catch (error) {
    console.error("Error enriching accounts with health:", error);
    return accounts;
  }
}

function groupByStage(deals: any[]): Record<string, any[]> {
  return deals.reduce(
    (acc, deal) => {
      const stage = deal.stage || "unknown";
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(deal);
      return acc;
    },
    {} as Record<string, any[]>
  );
}

function calculateTotalValue(deals: any[]): number {
  return deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
}

// =============================================================================
// EXPORT
// =============================================================================

export default app;
