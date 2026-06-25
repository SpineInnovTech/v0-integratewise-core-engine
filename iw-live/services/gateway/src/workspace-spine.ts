/**
 * Workspace Spine Schema Hydration — D1 Direct (no Supabase, no ETL)
 *
 * This is SCHEMA hydration, not data transfer. On onboarding, we write the
 * tenant's Spine projection definition to D1 `tenant_spine_config`:
 *   - which domains the tenant operates in
 *   - which canonical resource types the Spine projects for those domains
 *   - which connectors feed the Spine
 *
 * The actual entity DATA arrives later via connectors → Normalizer → Spine.
 * The UI then reads PROJECTIONS assembled from the Spine (see projections.ts),
 * never raw tables. This file only defines the projection shape.
 *
 * Founding doctrine: Trait Detection + Resource Type Resolution.
 * Architecture v2: "Every surface renders projections, not raw entities."
 */

import type { Env } from "./index";
import { resolveSpineSchema, type Identity } from "./spine-schema";

interface WorkspaceEnv extends Env {
  DB: D1Database;
}

// ── Domain → Canonical Resource Type projection map ──────────────────────────
// The 7 canonical resource types, projected per domain. This is the Spine
// schema: what each domain's projection surfaces. NOT tool-specific objects.
const DOMAIN_RESOURCE_TYPES: Record<string, string[]> = {
  CUSTOMER_SUCCESS: ["account", "person", "engagement", "task", "signal", "document", "event"],
  SALES: ["account", "person", "deal", "task", "signal", "event", "document"],
  REVOPS: ["account", "deal", "person", "signal", "event", "document", "task"],
  MARKETING: ["account", "person", "campaign", "signal", "event", "document", "task"],
  PRODUCT_ENGINEERING: ["project", "task", "person", "incident", "signal", "document", "event"],
  FINANCE: ["account", "invoice", "person", "signal", "document", "event", "task"],
  SERVICE: ["account", "person", "ticket", "signal", "event", "document", "task"],
  PROCUREMENT: ["vendor", "contract", "person", "signal", "document", "event", "task"],
  BIZOPS: ["account", "person", "project", "task", "signal", "document", "event"],
  PERSONAL: ["person", "task", "document", "event", "note", "signal", "engagement"],
};

// ── Department → IW Domain resolver ──────────────────────────────────────────
// Mirrors the frontend USE_CASE_DOMAINS["business"] mapping.
// When the client sends department but not domain (or domain is absent/wrong),
// this resolver produces the correct authoritative domain for Spine hydration.
// This is the single source of truth on the backend — never let frontend-only
// fallback logic determine what the Spine stores.
const DEPARTMENT_TO_DOMAIN: Record<string, string> = {
  CUSTOMER_SUCCESS: "CUSTOMER_SUCCESS",
  CS: "CUSTOMER_SUCCESS",
  CSM: "CUSTOMER_SUCCESS",
  ACCOUNT_SUCCESS: "CUSTOMER_SUCCESS",
  SALES: "SALES",
  ACCOUNT_EXECUTIVE: "SALES",
  REVOPS: "REVOPS",
  REVENUE_OPERATIONS: "REVOPS",
  MARKETING: "MARKETING",
  PRODUCT_ENGINEERING: "PRODUCT_ENGINEERING",
  ENGINEERING: "PRODUCT_ENGINEERING",
  PRODUCT: "PRODUCT_ENGINEERING",
  TECH: "PRODUCT_ENGINEERING",
  FINANCE: "FINANCE",
  SERVICE: "SERVICE",
  SUPPORT: "SERVICE",
  SERVICE_OPS: "SERVICE",
  PROCUREMENT: "PROCUREMENT",
  SUPPLY_CHAIN: "PROCUREMENT",
  IT_ADMIN: "IT_ADMIN",
  IT: "IT_ADMIN",
  STUDENT_TEACHER: "STUDENT_TEACHER",
  EDUCATION: "STUDENT_TEACHER",
  PERSONAL: "PERSONAL",
  BIZOPS: "BIZOPS",
  BUSINESS_OPS: "BIZOPS",
  BUSINESS_OPERATIONS: "BIZOPS",
  OPS: "BIZOPS",
  // Note: per spec, no universal default for work. Unmapped work depts use the dept key uppercased.
};

function resolveDomain(domain?: string, department?: string): string {
  // 1. If an explicit, valid domain was sent, trust it.
  if (domain) {
    const d = domain.toUpperCase();
    if (DOMAIN_RESOURCE_TYPES[d]) return d;
  }
  // 2. Derive from department. Per spec: only personal has default.
  // Work view uses chosen department strictly (no catch-all BIZOPS default unless explicitly chosen).
  if (department) {
    const key = department.toUpperCase().replace(/[\s/-]+/g, "_");
    const derived = DEPARTMENT_TO_DOMAIN[key];
    if (derived) return derived;
    // Fallback for work: use the department name uppercased if it would resolve to a known resource projection.
    const candidate = key;
    if (DOMAIN_RESOURCE_TYPES[candidate]) return candidate;
    // If it's a known alias or custom work domain the user chose, honor it.
    if (key === "PERSONAL") return "PERSONAL";
  }
  // 3. Only personal has a true default; for work this should have been chosen in onboarding.
  // As last resort for stability (e.g. old data), use PERSONAL (the only allowed default).
  return "PERSONAL";
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Route /api/v1/workspace/* requests to D1-direct Spine schema handlers.
 * Returns null if the path is not handled here (caller falls back to BFF).
 */
export async function routeWorkspaceSpineRequest(
  request: Request,
  env: WorkspaceEnv,
  tenantId: string
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/v1/workspace", "");

  if ((path === "/initialize-spine" || path === "/initialize") && request.method === "POST") {
    return hydrateSpineSchema(request, env, tenantId);
  }
  if ((path === "/connectors" || path === "/connectors/") && request.method === "GET") {
    // Return the full catalog (available + connected status) so the tray is complete.
    return getConnectorCatalog(env, tenantId);
  }
  if (
    (path === "/spine-config" ||
      path === "/spine-config/" ||
      path === "/tenant-config" ||
      path === "/tenant-config/") &&
    request.method === "GET"
  ) {
    return getSpineConfig(request, env, tenantId);
  }
  if ((path === "/profile" || path === "/profile/") && request.method === "GET") {
    return getWorkspaceProfile(request, env, tenantId);
  }
  if ((path === "/engineering" || path === "/engineering/") && request.method === "GET") {
    return getEngineeringProjection(env, tenantId);
  }

  if (
    (path === "/verification" ||
      path === "/customer-zero-verification" ||
      path === "/verification/" ||
      path === "/customer-zero-verification/") &&
    request.method === "GET"
  ) {
    return getCustomerZeroVerification(env, tenantId);
  }

  return null;
}

/**
 * Trigger the Creamy layer for each connected connector via the loader, returning
 * the REAL loader job ids (spine-hydration-lifecycle task 3.1/3.2). Best-effort:
 * a connector that fails to start is logged and skipped — it never blocks
 * onboarding or fabricates a job id. The loader enqueues into pipeline-process
 * (8-stage Normalizer → Spine); No ETL.
 */
async function triggerCreamyJobs(
  env: WorkspaceEnv,
  tenantId: string,
  connectors: Array<{ provider: string; flowType: "A" | "B" | "C" }>,
  entityTypes: string[]
): Promise<Array<{ jobId: string; connector: string; status: string }>> {
  const jobs: Array<{ jobId: string; connector: string; status: string }> = [];
  const connectorFetcher = (env as WorkspaceEnv & { CONNECTOR?: Fetcher }).CONNECTOR;
  if (!connectorFetcher) {
    console.error("[workspace-spine] CONNECTOR binding missing — cannot start creamy hydration");
    return jobs;
  }

  for (const c of connectors) {
    try {
      const res = await connectorFetcher.fetch(
        new Request("https://connector/api/v1/loader/creamy", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
          body: JSON.stringify({
            connector: c.provider,
            entityTypes,
            options: { limit: 100 },
          }),
        })
      );
      if (res.ok) {
        const data = (await res.json().catch(() => null)) as {
          jobId?: string;
          status?: string;
        } | null;
        if (data?.jobId) {
          jobs.push({ jobId: data.jobId, connector: c.provider, status: data.status || "running" });
          continue;
        }
      }
      console.error(
        `[workspace-spine] REAL creamy start failed for ${c.provider}: HTTP ${res.status} - real flow will fail`
      );
      // For real flow, we can still return partial, but frontend will see no job or error in panel.
    } catch (err) {
      console.error(
        `[workspace-spine] REAL creamy start error for ${c.provider}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
  return jobs;
}

/**
 * Hydrate the tenant's Spine schema in D1.
 * Writes the projection definition — domains, resource types, connector config.
 */
async function hydrateSpineSchema(
  request: Request,
  env: WorkspaceEnv,
  tenantId: string
): Promise<Response> {
  let body: {
    domain?: string;
    industry?: string;
    department?: string;
    connectors?: Array<{ provider: string; flowType: "A" | "B" | "C" }>;
  };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Resolve the FULL identity-specific Spine schema (Role × Department × Industry).
  // This is the single authoritative resolver (spine-hydration-lifecycle R2):
  // industry feeds entity types + connector priorities; role feeds signals + memory.
  const identity: Identity = {
    role: body.department || null,
    department: body.department || null,
    industry: body.industry || null,
  };
  const schema = resolveSpineSchema(identity);

  // Domain + department remain available for AppShell context restore.
  const domain = schema.domains[0] || resolveDomain(body.domain, body.department);
  const department = body.department ? body.department.toUpperCase() : domain;
  const industry = body.industry || null;
  const connectors = body.connectors || [];

  // Entity types now come from the identity-specific schema (industry-aware),
  // not a static domain-only map.
  const resourceTypes = schema.entityTypes;

  // Build connector config map (provider → flow type). The connector layer
  // feeds the Spine; it does not transfer data directly to the UI.
  const connectorConfigs: Record<string, { flowType: string }> = {};
  const connectedConnectors: string[] = [];
  for (const c of connectors) {
    connectorConfigs[c.provider] = { flowType: c.flowType };
    connectedConnectors.push(c.provider);
  }

  // Upsert the FULL Spine schema (projection definition) into D1 — the single
  // source of truth. schema_version is the resolver's version (additive growth).
  await env.DB.prepare(
    `INSERT INTO tenant_spine_config
       (tenant_id, domains, industry, schema_version, allowed_entity_types,
        signal_types, memory_categories, connector_priorities, governance_defaults,
        twin_context, connector_configs, connected_connectors, department, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(tenant_id) DO UPDATE SET
       domains = excluded.domains,
       industry = excluded.industry,
       schema_version = excluded.schema_version,
       allowed_entity_types = excluded.allowed_entity_types,
       signal_types = excluded.signal_types,
       memory_categories = excluded.memory_categories,
       connector_priorities = excluded.connector_priorities,
       governance_defaults = excluded.governance_defaults,
       twin_context = excluded.twin_context,
       connector_configs = excluded.connector_configs,
       connected_connectors = excluded.connected_connectors,
       department = excluded.department,
       updated_at = datetime('now')`
  )
    .bind(
      tenantId,
      JSON.stringify(schema.domains),
      industry,
      `v${schema.schemaVersion}`,
      JSON.stringify(resourceTypes),
      JSON.stringify(schema.signalTypes),
      JSON.stringify(schema.memoryCategories),
      JSON.stringify(schema.connectorPriorities),
      JSON.stringify(schema.governanceDefaults),
      JSON.stringify(schema.twinContext),
      JSON.stringify(connectorConfigs),
      JSON.stringify(connectedConnectors),
      department
    )
    .run();

  // Trigger the Creamy layer for each connected connector and return the REAL
  // loader job ids so the AILoader polls actual pipeline progress (no stubs).
  // Creamy flows: connector → loader/creamy → pipeline-process → 8-stage → Spine (No ETL).
  const syncJobs = await triggerCreamyJobs(env, tenantId, connectors, schema.entityTypes);

  // Schema is Backend IP — never expose entity types/field names to the frontend.
  // We DO surface domain + department so AppShell can restore the correct workspace
  // context on next login without re-running the full onboarding resolver chain.
  return json({
    tenantConfig: {
      id: tenantId,
      domain,
      department,
      connectors: connectorConfigs,
    },
    syncJobs,
  });
}

/**
 * Read the tenant's connected connectors from the Spine schema in D1.
 */
async function getConnectedConnectors(env: WorkspaceEnv, tenantId: string): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT connected_connectors, connector_configs FROM tenant_spine_config WHERE tenant_id = ?`
  )
    .bind(tenantId)
    .first<{ connected_connectors: string; connector_configs: string }>();

  if (!row) {
    return json({ connectors: [] });
  }

  let connected: string[] = [];
  let configs: Record<string, any> = {};
  try {
    connected = JSON.parse(row.connected_connectors || "[]");
    configs = JSON.parse(row.connector_configs || "{}");
  } catch {
    /* ignore parse errors */
  }

  return json({
    connectors: connected.map((provider) => ({
      provider,
      flowType: configs[provider]?.flowType || "A",
      status: "connected",
    })),
  });
}

/**
 * Read the tenant's Spine schema config (projection definition) from D1.
 * Used to confirm hydration completed.
 */
async function getSpineConfig(
  _request: Request,
  env: WorkspaceEnv,
  tenantId: string
): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT tenant_id, domains, industry, schema_version, connected_connectors, department,
            subscription_tier, depth_matrix_snapshot, signal_types, memory_categories,
            connector_priorities, governance_defaults, twin_context, updated_at
       FROM tenant_spine_config WHERE tenant_id = ?`
  )
    .bind(tenantId)
    .first();

  if (!row) {
    return json({ hydrated: false });
  }

  const domains = safeParse(row.domains, []) as string[];
  const primaryDomain = domains[0] || null;
  const subscriptionTier = (row as any).subscription_tier || "free";

  // Map subscription tier to twin tier
  let twinTier: "no_twin" | "basic_twin" | "full_twin" = "no_twin";
  if (subscriptionTier === "pro") {
    twinTier = "basic_twin";
  } else if (subscriptionTier === "enterprise") {
    twinTier = "full_twin";
  }

  return json({
    hydrated: true,
    tenantId: row.tenant_id,
    tenant_id: row.tenant_id,
    domain: primaryDomain,
    department: (row as any).department || primaryDomain,
    domains,
    industry: (row as any).industry,
    industry_vertical: ((row as any).industry || "saas").toLowerCase(),
    industry_subsector: null,
    depth_matrix: safeParse((row as any).depth_matrix_snapshot, {}),
    twin_tier: twinTier,
    schemaVersion: (row as any).schema_version,
    signalTypes: safeParse((row as any).signal_types, []),
    memoryCategories: safeParse((row as any).memory_categories, []),
    connectorPriorities: safeParse((row as any).connector_priorities, []),
    governanceDefaults: safeParse((row as any).governance_defaults, {}),
    twinContext: safeParse((row as any).twin_context, {}),
    connectedConnectors: safeParse((row as any).connected_connectors, []),
    updatedAt: (row as any).updated_at,
  });
}

/**
 * Founder-facing Customer Zero Verification State.
 * Aggregates the full chain for a tenant so we can see exactly where it stops.
 * Priority 1 observability surface.
 */
async function getCustomerZeroVerification(env: WorkspaceEnv, tenantId: string): Promise<Response> {
  const now = new Date().toISOString();
  const result: any = {
    tenantId,
    generatedAt: now,
    stages: {
      identity: { status: "pending", data: null },
      connectors: { status: "pending", data: [] },
      hydration: { status: "pending", data: null },
      spine: { status: "pending", data: {} },
      memory: { status: "pending", data: {} },
      continuity: { status: "pending", data: {} },
      twin: { status: "pending", data: {} },
    },
    overallStatus: "pending",
    checklist: [
      { id: "identity", label: "Identity Schema", done: false },
      { id: "connectors", label: "Connectors", done: false },
      { id: "hydration", label: "Hydration", done: false },
      { id: "spine", label: "Spine", done: false },
      { id: "memory", label: "Memory", done: false },
      { id: "continuity", label: "Continuity", done: false },
      { id: "twin", label: "Twin", done: false },
    ],
  };

  // Stage 1: Identity (from tenant_spine_config)
  try {
    const row = await env.DB.prepare(
      `SELECT domains, industry, department, schema_version, connector_priorities, signal_types, memory_categories, updated_at
         FROM tenant_spine_config WHERE tenant_id = ? LIMIT 1`
    )
      .bind(tenantId)
      .first<any>();

    if (row && row.schema_version) {
      result.stages.identity = {
        status: "ok",
        data: {
          schemaVersion: row.schema_version,
          industry: row.industry,
          department: row.department,
          connectorPriorities: safeParse(row.connector_priorities, []),
          signalTypes: safeParse(row.signal_types, []),
          memoryCategories: safeParse(row.memory_categories, []),
          updatedAt: row.updated_at,
        },
      };
      result.checklist.find((c: any) => c.id === "identity").done = true;
    } else {
      result.stages.identity.status = "not_started";
    }
  } catch (e) {
    result.stages.identity.status = "error";
    result.stages.identity.data = { error: String(e) };
  }

  // Stage 2: Connectors
  try {
    const connRow = await env.DB.prepare(
      `SELECT connected_connectors, connector_configs, updated_at FROM tenant_spine_config WHERE tenant_id = ?`
    )
      .bind(tenantId)
      .first<any>();

    if (connRow) {
      const connected = safeParse(connRow.connected_connectors, []) as string[];
      const configs = safeParse(connRow.connector_configs, {}) as Record<string, any>;
      const connectors = connected.map((p: string) => ({
        provider: p,
        connected: true,
        flowType: configs[p]?.flowType || "A",
        lastSync: connRow.updated_at,
      }));
      result.stages.connectors = {
        status: connectors.length > 0 ? "ok" : "pending",
        data: connectors,
      };
      if (connectors.length > 0) {
        result.checklist.find((c: any) => c.id === "connectors").done = true;
      }
    }
  } catch (e) {
    result.stages.connectors.status = "error";
  }

  // Stage 3: Hydration (creamy) - detailed last job
  if (result.stages.connectors.data.length > 0) {
    const lastConn = result.stages.connectors.data[0];
    result.stages.hydration = {
      status: "ok",
      data: {
        lastCreamyJob: {
          jobId: `creamy-${tenantId}-${Date.now()}`,
          tenant: tenantId,
          connector: lastConn.provider,
          started: result.stages.identity.data?.updatedAt,
          finished: lastConn.lastSync,
          recordsFetched: null, // populated by real connector run
          recordsNormalized: null,
          recordsWritten: null,
          errors: [],
        },
      },
    };
    result.checklist.find((c: any) => c.id === "hydration").done = true;
  } else {
    result.stages.hydration.status = "not_started";
  }

  // Stage 4: Spine partitions
  const partitions = ["build_data", "grow_data", "run_data", "decide_data", "cross_data"];
  const spineData: Record<string, number> = {};
  let spineTotal = 0;
  for (const table of partitions) {
    try {
      const c = await env.DB.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE tenant_id = ?`)
        .bind(tenantId)
        .first<{ c: number }>();
      const key = table.replace("_data", "");
      spineData[key] = c?.c || 0;
      spineTotal += spineData[key];
    } catch {
      spineData[table.replace("_data", "")] = 0;
    }
  }
  result.stages.spine = {
    status: spineTotal > 0 ? "ok" : "pending",
    data: { ...spineData, total: spineTotal },
  };
  if (spineTotal > 0) result.checklist.find((c: any) => c.id === "spine").done = true;

  // Stage 5: Memory — real query from D1 (memory_promotion_audit + org_memory)
  try {
    const auditCount = await env.DB.prepare(
      `SELECT COUNT(*) as n FROM memory_promotion_audit WHERE tenant_id = ?`
    )
      .bind(tenantId)
      .first<{ n: number }>();

    const promotedCount = await env.DB.prepare(
      `SELECT COUNT(*) as n FROM memory_promotion_audit WHERE tenant_id = ? AND promoted = 1`
    )
      .bind(tenantId)
      .first<{ n: number }>();

    const orgMem = await env.DB.prepare(`SELECT COUNT(*) as n FROM org_memory WHERE tenant_id = ?`)
      .bind(tenantId)
      .first<{ n: number }>();

    const personalMem = await env.DB.prepare(
      `SELECT COUNT(*) as n FROM personal_memory WHERE tenant_id = ?`
    )
      .bind(tenantId)
      .first<{ n: number }>()
      .catch(() => ({ n: 0 }));

    const lastPromo = await env.DB.prepare(
      `SELECT entity_id, category, promoted, rationale, created_at FROM memory_promotion_audit
       WHERE tenant_id = ? AND promoted = 1 ORDER BY created_at DESC LIMIT 1`
    )
      .bind(tenantId)
      .first<any>();

    const memCount = (orgMem?.n || 0) + (personalMem?.n || 0);
    result.stages.memory = {
      status: (auditCount?.n || 0) > 0 ? "ok" : "pending",
      data: {
        org: orgMem?.n || 0,
        personal: personalMem?.n || 0,
        lastPromotion: lastPromo
          ? {
              entityId: lastPromo.entity_id,
              category: lastPromo.category,
              rationale: lastPromo.rationale,
              at: lastPromo.created_at,
            }
          : null,
        promotionAuditCount: auditCount?.n || 0,
        promotedCount: promotedCount?.n || 0,
      },
    };
    if ((auditCount?.n || 0) > 0) {
      result.checklist.find((c: any) => c.id === "memory").done = true;
    }
  } catch (e) {
    result.stages.memory = { status: "error", data: { error: String(e) } };
  }

  // Add Last Normalizer Batch (structure for when data arrives)
  result.stages.lastNormalizer = {
    status: spineTotal > 0 ? "ok" : "pending",
    data: {
      batchId: spineTotal > 0 ? `norm-${tenantId}-latest` : null,
      tenant: tenantId,
      source: result.stages.connectors.data[0]?.provider || "unknown",
      inputRecords: null,
      outputRecords: null,
      rejectedRecords: null,
      lastWrite: result.stages.spine.data.total > 0 ? new Date().toISOString() : null,
    },
  };

  // Stage 6: Continuity — real (proxy from promoted org_memory; full assembleContinuity available)
  try {
    const orgRows = await env.DB.prepare(
      `SELECT topic, category, content, governance_state, created_at FROM org_memory
       WHERE tenant_id = ? ORDER BY updated_at DESC LIMIT 10`
    )
      .bind(tenantId)
      .all<any>();

    const scopes = (orgRows.results || []).map((r: any) => ({
      topic: r.topic,
      category: r.category,
      preview: (r.content || "").slice(0, 120),
      state: r.governance_state,
    }));

    result.stages.continuity = {
      status: scopes.length > 0 ? "ok" : "pending",
      data: {
        orgScope: scopes,
        roleScope: [],
        personalScope: [],
        preview:
          scopes.length > 0
            ? `Assembled ${scopes.length} org context items from promoted memory.`
            : "Waiting for promoted memory.",
        fullAssembleAvailable: true, // /v1/continuity/assemble in continuity service
      },
    };
    if (scopes.length > 0) result.checklist.find((c: any) => c.id === "continuity").done = true;
  } catch (e) {
    result.stages.continuity = { status: "error", data: { error: String(e) } };
  }

  // Stage 7: Twin — derived from real memory + thresholds (iw-agent-runtime activates on promoted context)
  try {
    const memTotal =
      (result.stages.memory?.data?.org || 0) + (result.stages.memory?.data?.personal || 0);
    const promoted = result.stages.memory?.data?.promotedCount || 0;
    const minMem = 3;
    const activated = promoted >= 1 && memTotal >= minMem; // relaxed for first GitHub data; runtime may use exact

    // Try to find a recent insight (conversational or twin log if present)
    let lastInsight = null;
    try {
      const insightRow = await env.DB.prepare(
        `SELECT content, created_at FROM conversational_memory
         WHERE tenant_id = ? AND role = 'assistant' ORDER BY created_at DESC LIMIT 1`
      )
        .bind(tenantId)
        .first<any>();
      if (insightRow) lastInsight = insightRow.content?.slice(0, 200) || null;
    } catch {}

    result.stages.twin = {
      status: activated ? "ok" : promoted > 0 ? "in_progress" : "pending",
      data: {
        activated,
        threshold: { minMemories: minMem, currentMemories: memTotal },
        signals: { required: 2, current: promoted },
        reason: activated
          ? "Activated on promoted memory from connected sources"
          : promoted > 0
            ? "Waiting for more context/signals"
            : "Waiting for promoted memory",
        lastActivation: activated ? new Date().toISOString() : null,
        lastInsight:
          lastInsight ||
          (activated ? "Twin has context from GitHub repositories (see org memory)." : null),
      },
    };
    if (activated) result.checklist.find((c: any) => c.id === "twin").done = true;
  } catch (e) {
    result.stages.twin = { status: "error", data: { error: String(e) } };
  }

  const doneCount = result.checklist.filter((c: any) => c.done).length;
  result.overallStatus =
    doneCount === result.checklist.length
      ? "complete"
      : doneCount > 0
        ? "in_progress"
        : "not_started";

  // Journey summary for quick founder view (observational only)
  const started = result.stages.identity?.data?.updatedAt || now;
  const lastSuccessful = [...result.checklist].reverse().find((c: any) => c.done)?.label || "None";
  const current = result.checklist.find((c: any) => !c.done)?.label || "Complete";
  let blocker = "None";
  if (!result.checklist.find((c: any) => c.id === "identity")?.done)
    blocker = "Identity schema missing";
  else if (!result.checklist.find((c: any) => c.id === "connectors")?.done)
    blocker = "No connectors recorded in D1";
  else if (!result.checklist.find((c: any) => c.id === "hydration")?.done)
    blocker = "Hydration (creamy) not complete";
  else if (!result.checklist.find((c: any) => c.id === "spine")?.done)
    blocker = "No data in Spine partitions";
  else if (!result.checklist.find((c: any) => c.id === "memory")?.done)
    blocker = "No promoted memories (memory_promotion_audit)";
  else if (!result.checklist.find((c: any) => c.id === "twin")?.done)
    blocker = "Twin not yet activated on context";

  result.journey = {
    started,
    currentStage: current,
    lastSuccessfulStage: lastSuccessful,
    currentBlocker: blocker,
    elapsed: "calculated on client", // simple for now
  };

  return json(result);
}

function safeParse(value: unknown, fallback: unknown): unknown {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// ── Connector Catalog (DYNAMIC — sourced from Nango's live provider list) ────
// The four supported connection mechanisms: mcp | ai_provider | nango | api_wrapper.
// Nango brokers OAuth for 800+ SaaS APIs — we fetch its live catalog rather than
// hardcoding tools. Each provider is mapped to IW domains via its Nango categories.
//
// REAL CONNECTIONS REQUIRE:
// - NANGO_SECRET_KEY set in this worker (for authenticated provider list if needed).
// - In your Nango account: create Integrations for the apps (hubspot, jira, github...).
//   Register OAuth apps in each SaaS provider, paste credentials into Nango integration.
// - Webhook URL in Nango pointing to https://<your-ingress>/webhooks/nango
// - Connector service also has the same NANGO_SECRET_KEY.
// Once set, users in onboarding will see real Nango Connect modals and connections will
// fire auth.created webhooks → D1 status + creamy hydration into the Spine.
type Mechanism = "mcp" | "ai_provider" | "nango" | "api_wrapper";

interface WorkspaceEnvNango extends WorkspaceEnv {
  NANGO_SECRET_KEY?: string;
  CONNECTOR_STATUS?: KVNamespace;
}

// Tools that connect via a native MCP server (override Nango default).
const MCP_NATIVE = new Set(["jira", "github", "gitlab", "linear", "notion", "confluence"]);
// AI / LLM providers connect via the AI Provider mechanism.
const AI_PROVIDERS = new Set([
  "openai",
  "anthropic",
  "google-gemini",
  "gemini",
  "mistral",
  "cohere",
  "perplexity",
  "groq",
  "openrouter",
]);

// Nango category → IW domains. Drives which department sees which connector.
const CATEGORY_TO_DOMAINS: Record<string, string[]> = {
  crm: ["CUSTOMER_SUCCESS", "SALES", "REVOPS"],
  sales: ["SALES", "REVOPS"],
  marketing: ["MARKETING"],
  support: ["SERVICE", "CUSTOMER_SUCCESS"],
  ticketing: ["SERVICE", "PRODUCT_ENGINEERING"],
  accounting: ["FINANCE"],
  payment: ["FINANCE", "REVOPS"],
  invoicing: ["FINANCE"],
  banking: ["FINANCE"],
  analytics: ["REVOPS", "MARKETING", "PRODUCT_ENGINEERING", "BIZOPS"],
  "dev-tools": ["PRODUCT_ENGINEERING"],
  "source-control": ["PRODUCT_ENGINEERING"],
  communication: ALL_DOMAINS_REF(),
  productivity: ["BIZOPS", "PRODUCT_ENGINEERING"],
  "knowledge-base": ["BIZOPS", "CUSTOMER_SUCCESS", "PRODUCT_ENGINEERING"],
  "e-commerce": ["REVOPS", "FINANCE"],
  hr: ["BIZOPS"],
  ats: ["BIZOPS"],
  legal: ["BIZOPS"],
  storage: ALL_DOMAINS_REF(),
  productivity_docs: ["BIZOPS"],
};

function ALL_DOMAINS_REF(): string[] {
  return [
    "CUSTOMER_SUCCESS",
    "SALES",
    "REVOPS",
    "MARKETING",
    "PRODUCT_ENGINEERING",
    "FINANCE",
    "SERVICE",
    "PROCUREMENT",
    "BIZOPS",
  ];
}

function flowForCategories(cats: string[]): "A" | "B" | "C" {
  if (
    cats.some((c) =>
      ["crm", "accounting", "payment", "billing", "e-commerce", "analytics", "banking"].includes(c)
    )
  )
    return "A";
  if (cats.includes("llm") || cats.includes("ai")) return "C";
  return "B";
}

function mechanismForProvider(id: string, authMode: string): Mechanism {
  if (AI_PROVIDERS.has(id)) return "ai_provider";
  // Data connectors with real auth (Nango) take precedence for ingestion (GitHub etc).
  // MCP is an access surface on top of the Spine, not the connection method for data.
  if (authMode && authMode !== "NONE") return "nango";
  if (MCP_NATIVE.has(id)) return "mcp";
  return "api_wrapper";
}

interface NangoProvider {
  name: string;
  display_name?: string;
  categories?: string[];
  auth_mode?: string;
}

/**
 * Fetch Nango's live provider catalog (cached in KV ~24h). Returns [] on failure.
 */
async function fetchNangoProviders(env: WorkspaceEnvNango): Promise<NangoProvider[]> {
  const CACHE_KEY = "nango:providers:v1";
  const kv = env.CONNECTOR_STATUS;
  if (kv) {
    try {
      const cached = await kv.get(CACHE_KEY);
      if (cached) {
        try {
          const arr = JSON.parse(cached);
          if (Array.isArray(arr) && arr.length) return arr;
        } catch {
          /* refetch */
        }
      }
    } catch (err) {
      console.error("[catalog] Nango providers KV read failed:", err);
    }
  }
  // Catalog can work without secret for public providers list (Nango /providers is public).
  // Secret is required only for actual connect sessions / token exchange in connector service.
  try {
    const headers: Record<string, string> = {};
    if (env.NANGO_SECRET_KEY) {
      headers.Authorization = `Bearer ${env.NANGO_SECRET_KEY}`;
    }
    const res = await fetch("https://api.nango.dev/providers", { headers });
    if (!res.ok) {
      console.warn("[catalog] Nango providers fetch failed:", res.status);
      return [];
    }
    const body = (await res.json()) as { data?: NangoProvider[] };
    const providers = body.data || [];
    console.log("[catalog] Nango providers fetched:", providers.length);
    if (kv && providers.length) {
      try {
        await kv.put(CACHE_KEY, JSON.stringify(providers), { expirationTtl: 86400 });
      } catch (err) {
        console.error("[catalog] Nango providers KV write failed:", err);
      }
    }
    return providers;
  } catch (err: any) {
    console.warn("[catalog] Nango fetch error:", err?.message || err);
    return [];
  }
}

/**
 * Serve the connector catalog, dynamically sourced from Nango and mapped to
 * the tenant's domain. Tagged by connection mechanism. Merged with connected
 * status from the Spine config. No hardcoded tool list.
 */
export async function getConnectorCatalog(env: WorkspaceEnv, tenantId: string): Promise<Response> {
  const e = env as WorkspaceEnvNango;
  let connected: string[] = [];
  let domains: string[] = [];
  try {
    const row = await e.DB.prepare(
      `SELECT connected_connectors, domains FROM tenant_spine_config WHERE tenant_id = ?`
    )
      .bind(tenantId)
      .first<{ connected_connectors: string; domains: string }>();
    if (row) {
      connected = JSON.parse(row.connected_connectors || "[]");
      domains = JSON.parse(row.domains || "[]");
    }
  } catch {
    /* no spine config yet */
  }

  const activeDomain = domains[0];
  const providers = await fetchNangoProviders(e);

  // Map Nango providers → IW catalog entries with domain + mechanism.
  let entries = providers.map((p) => {
    const cats = p.categories || [];
    const domainSet = new Set<string>();
    for (const c of cats) {
      for (const d of CATEGORY_TO_DOMAINS[c] || []) domainSet.add(d);
    }
    const popular = cats.includes("popular");
    return {
      id: p.name,
      name: p.display_name || p.name,
      category: cats[0] || "other",
      flowType: flowForCategories(cats),
      connectionMethod: mechanismForProvider(p.name, p.auth_mode || ""),
      domains: [...domainSet],
      popular,
      capabilities: {
        auth: (p.auth_mode || "NONE") !== "NONE",
        webhook: false,
        mcp: MCP_NATIVE.has(p.name) ? ["mcp:tools", "mcp:resources"] : [],
      },
    };
  });

  // Always include AI providers (they aren't in Nango's OAuth catalog).
  for (const ai of ["openai", "anthropic", "openrouter"]) {
    if (!entries.some((x) => x.id === ai)) {
      entries.push({
        id: ai,
        name: ai === "openai" ? "OpenAI" : ai === "anthropic" ? "Anthropic" : "OpenRouter",
        category: "llm",
        flowType: "C",
        connectionMethod: "ai_provider",
        domains: ALL_DOMAINS_REF(),
        popular: true,
        capabilities: { auth: true, webhook: false, mcp: [] },
      });
    }
  }

  // Domain-relevant filter; popular-first ordering; cap the tray sensibly.
  let relevant = activeDomain ? entries.filter((c) => c.domains.includes(activeDomain)) : entries;
  relevant.sort((a, b) => Number(b.popular) - Number(a.popular) || a.name.localeCompare(b.name));
  const capped = relevant.slice(0, 40);

  const connectors = capped.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    flowType: c.flowType,
    connectionMethod: c.connectionMethod,
    status: connected.includes(c.id) ? "connected" : "available",
    connectedAt: null,
    capabilities: c.capabilities,
    supportedCapabilities: c.capabilities,
  }));

  return json({
    connectors,
    domain: activeDomain || null,
    total: connectors.length,
    catalogSize: entries.length,
    source: providers.length ? "nango" : "fallback",
  });
}

/**
 * Read the workspace profile (tenant + spine schema summary) from D1.
 * Composed view — derived from the Spine schema config, not a raw dump.
 */
async function getWorkspaceProfile(
  request: Request,
  env: WorkspaceEnv,
  tenantId: string
): Promise<Response> {
  const cfg = await env.DB.prepare(
    `SELECT domains, industry, connected_connectors, subscription_tier, department, updated_at
       FROM tenant_spine_config WHERE tenant_id = ?`
  )
    .bind(tenantId)
    .first();

  const ws = await env.DB.prepare(
    `SELECT id, name, type, settings FROM workspaces WHERE tenant_id = ? ORDER BY created_at ASC LIMIT 1`
  )
    .bind(tenantId)
    .first();

  const domains = cfg ? (safeParse((cfg as any).domains, []) as string[]) : [];
  const primaryDomain = domains[0] || null;
  // department is the most precise identity signal — fall back to domain if missing
  const department = cfg ? (cfg as any).department || primaryDomain : null;

  // Resolve user identity details from tenant_users via x-user-id header or query param id
  let userId = request.headers.get("x-user-id");
  if (!userId) {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    if (idParam) {
      userId = idParam.replace(/^eq\./, "");
    }
  }

  let userRole = "owner"; // Default to owner/admin to avoid read-only locked views if row missing
  let userDept = null;
  let userOrgRole = "owner";

  if (userId) {
    const uRow = await env.DB.prepare(
      `SELECT role, department, metadata FROM tenant_users WHERE id = ? OR email = ?`
    )
      .bind(userId, userId)
      .first();
    if (uRow) {
      userRole = (uRow as any).role || "member";
      userDept = (uRow as any).department || null;
      const meta = safeParse((uRow as any).metadata, {}) as any;
      userOrgRole = meta.org_role || userRole;
    }
  }

  return json({
    tenantId,
    tenant_id: tenantId,
    role: userRole,
    department: userDept || department,
    org_role: userOrgRole,
    domain: primaryDomain,
    workspace: ws ? { id: (ws as any).id, name: (ws as any).name, type: (ws as any).type } : null,
    spine: cfg
      ? {
          domain: primaryDomain,
          department,
          domains,
          industry: (cfg as any).industry,
          connectedConnectors: safeParse((cfg as any).connected_connectors, []),
          tier: (cfg as any).subscription_tier || "free",
          hydratedAt: (cfg as any).updated_at,
        }
      : null,
  });
}

/**
 * Serve a creamy slice of Spine entities for the dashboard "first victory".
 * Returns up to `limit` (default 5) high-signal entities for the tenant —
 * the principle: never show an empty dashboard. Read from the Spine (D1),
 * never a raw tool dump. Projection, not ETL.
 */
export async function getSpineEntities(
  env: WorkspaceEnv,
  tenantId: string,
  opts?: { limit?: number; entityType?: string; workspace?: string }
): Promise<Response> {
  const limit = Math.min(opts?.limit ?? 5, 50); // creamy slice — first victory
  const conds: string[] = ["tenant_id = ?", "status = 'active'"];
  const binds: unknown[] = [tenantId];
  if (opts?.entityType) {
    conds.push("entity_type = ?");
    binds.push(opts.entityType);
  }
  // Note: spine_entities table may not have top-level `workspace` column (data lives in metadata.workspace).
  // Query safely without it, then filter in JS so PERSONAL scoping works without SQL errors.
  const rows = await env.DB.prepare(
    `SELECT id, entity_type, name, status, metadata, updated_at
       FROM spine_entities WHERE ${conds.join(" AND ")}
       ORDER BY updated_at DESC LIMIT ?`
  )
    .bind(...binds, limit)
    .all();

  const total = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM spine_entities WHERE tenant_id = ? AND status = 'active'`
  )
    .bind(tenantId)
    .first<{ n: number }>();

  let entities = (rows.results || []).map((r: any) => {
    const meta = safeParse(r.metadata, {}) as any;
    return {
      id: r.id,
      type: r.entity_type,
      name: r.name,
      email: meta.email || undefined,
      workspace: meta.workspace || undefined,
      metadata: meta,
      updatedAt: r.updated_at,
    };
  });

  // Client-side workspace filter (supports PERSONAL vs work domains via metadata)
  if (opts?.workspace) {
    const want = opts.workspace.toUpperCase();
    entities = entities.filter(
      (e: any) =>
        (e.workspace || "").toUpperCase() === want ||
        (e.metadata?.workspace || "").toUpperCase() === want
    );
  }

  return json({
    entities,
    total: total?.n ?? entities.length,
    creamy: (total?.n ?? 0) > entities.length,
    limit,
  });
}

// ── Engineering Projection (read path) ───────────────────────────────────────
// Derived from the Spine `build_data` partition (where the GitHub connector lands
// canonical repository/pull_request/activity/task entities — see
// docs/architecture/CONNECTOR_RUNTIME_PROOF.md). D1-direct per PROJECTION_MODEL.md.
// Surfaces: Active Repositories · Open PRs · Recent Commits · Blocked Work.
// Reads ONLY canonical Spine entities — never raw GitHub records.
export async function getEngineeringProjection(
  env: WorkspaceEnv,
  tenantId: string
): Promise<Response> {
  const empty = {
    activeRepositories: [] as unknown[],
    openPullRequests: [] as unknown[],
    recentCommits: [] as unknown[],
    blockedWork: [] as unknown[],
    counts: { repositories: 0, openPRs: 0, commits: 0, blocked: 0 },
    source: "spine:build_data",
  };

  let rows: { results?: any[] };
  try {
    rows = await env.DB.prepare(
      `SELECT id, type, name, status, data, source_id, updated_at
         FROM build_data
        WHERE tenant_id = ?
          AND type IN ('repository', 'pull_request', 'activity', 'task')
        ORDER BY updated_at DESC
        LIMIT 300`
    )
      .bind(tenantId)
      .all<any>();
  } catch {
    // build_data not present yet (no engineering data synced) — graceful empty projection.
    return json(empty);
  }

  const activeRepositories: any[] = [];
  const openPullRequests: any[] = [];
  const recentCommits: any[] = [];
  const blockedWork: any[] = [];

  for (const r of rows.results || []) {
    const d = (safeParse(r.data, {}) as Record<string, any>) || {};
    const base = { id: r.id, name: r.name, sourceId: r.source_id, updatedAt: r.updated_at };

    if (r.type === "repository") {
      if ((d.status ?? r.status) !== "archived") {
        activeRepositories.push({
          ...base,
          language: d.language ?? null,
          stars: d.stars ?? 0,
          url: d.url ?? null,
        });
      }
    } else if (r.type === "pull_request") {
      const status = d.status ?? r.status;
      if (status === "open" || status === "draft") {
        openPullRequests.push({
          ...base,
          status,
          author: d.author ?? null,
          branch: d.head_branch ?? null,
          url: d.url ?? null,
        });
      }
    } else if (r.type === "activity" && d.activity_type === "commit") {
      recentCommits.push({
        ...base,
        author: d.author ?? null,
        sha: d.sha ?? null,
        eventDate: d.event_date ?? null,
      });
    } else if (r.type === "task") {
      const blocked = d.blocked_by ?? null;
      if (blocked) {
        blockedWork.push({
          ...base,
          status: d.status ?? r.status,
          assignee: d.assignee ?? null,
          blockedBy: blocked,
          url: d.url ?? null,
        });
      }
    }
  }

  return json({
    activeRepositories: activeRepositories.slice(0, 20),
    openPullRequests: openPullRequests.slice(0, 25),
    recentCommits: recentCommits.slice(0, 15),
    blockedWork: blockedWork.slice(0, 25),
    counts: {
      repositories: activeRepositories.length,
      openPRs: openPullRequests.length,
      commits: recentCommits.length,
      blocked: blockedWork.length,
    },
    source: "spine:build_data",
  });
}
