/**
 * Entity 360 Assembler
 *
 * Assembles the complete 360-degree view of any entity by pulling from:
 * - Spine (truth)
 * - Knowledge (context + memory)
 * - Intelligence (signals)
 * - D1 (goals, relationships)
 *
 * PRINCIPLE: This is the ONLY way Twin reads entity data.
 * Twin never queries Spine, Knowledge, or Intelligence directly.
 */

import type {
  Entity360,
  Entity360Request,
  Entity360Response,
  Entity360BatchRequest,
  Entity360BatchResponse,
  Entity360Truth,
  Entity360Context,
  Entity360Signals,
  Entity360Signal,
  Entity360Memory,
  Entity360Goals,
  Entity360Relationships,
} from "@integratewise/types";
// Entity360Goal used inline in fetchGoals
import type { Entity360Goal } from "@integratewise/types";
import { getSpineTarget, resolveEntityType } from "./index.js";

// ═══════════════════════════════════════════════════════════════════════════════
// ASSEMBLER
// ═══════════════════════════════════════════════════════════════════════════════

interface AssemblerEnv {
  // DECISION 22: Cloudflare-only product plane. D1 + KV for entity projections.
  CACHE?: KVNamespace;
  KNOWLEDGE?: Fetcher;
  CACHE_DB?: D1Database;
}

const DEFAULT_LIMITS = {
  context: 10,
  signals: 20,
  memory: 15,
  relationships: 20,
};

const CACHE_TTL = 60; // 60 seconds

/*
function getDomainForType(type: string): "decide" | "build" | "grow" | "run" | "cross" {
  const t = type.toLowerCase();
  if (
    ["okr", "strategic_objective", "business_context", "kpi", "decision", "commitment"].includes(t)
  ) {
    return "decide";
  }
  if (["task", "workflow", "document", "blocker", "calendar_event"].includes(t)) {
    return "build";
  }
  if (["account", "contact", "opportunity", "ticket", "renewal", "risk"].includes(t)) {
    return "grow";
  }
  if (["ops_metric", "ops_metrics"].includes(t)) {
    return "run";
  }
  return "cross";
}
*/

/**
 * Assemble a single Entity 360
 */
export async function assembleEntity360(
  req: Entity360Request,
  env: AssemblerEnv
): Promise<Entity360Response> {
  const start = Date.now();
  const layers = req.layers || ["truth", "context", "signals", "memory", "goals", "relationships"];
  const limits = { ...DEFAULT_LIMITS, ...req.limits };

  // Check cache first
  const cacheKey = `e360:${req.tenant_id}:${req.spine_id}`;
  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey);
    if (cached) {
      try {
        const entity = JSON.parse(cached) as Entity360;
        entity.meta.cache_hit = true;
        return { success: true, entity };
      } catch {
        /* cache miss */
      }
    }
  }

  try {
    // Under Cloudflare-first architecture, all plans are served from D1/KV.
    const isFreeOrPersonal = true;

    // 1. Fetch truth (always needed — it tells us entity_type)
    const truth = await fetchTruth(env, req.tenant_id, req.spine_id, isFreeOrPersonal);
    if (!truth) {
      return { success: false, error: `Entity not found: ${req.spine_id}` };
    }

    // 2. Parallel fetch remaining layers
    const [context, signals, memory, goals, relationships] = await Promise.all([
      layers.includes("context")
        ? fetchContext(
            env,
            req.tenant_id,
            req.spine_id,
            truth.data.entity_type as string,
            limits.context,
            isFreeOrPersonal
          )
        : emptyContext(),
      layers.includes("signals")
        ? fetchSignals(env, req.tenant_id, req.spine_id, limits.signals, isFreeOrPersonal)
        : emptySignals(),
      layers.includes("memory")
        ? fetchMemory(env, req.tenant_id, req.spine_id, limits.memory, isFreeOrPersonal)
        : emptyMemory(),
      layers.includes("goals")
        ? fetchGoals(env, req.tenant_id, req.spine_id, isFreeOrPersonal)
        : emptyGoals(),
      layers.includes("relationships")
        ? fetchRelationships(
            env,
            req.tenant_id,
            req.spine_id,
            truth.data.entity_type as string,
            limits.relationships,
            isFreeOrPersonal
          )
        : emptyRelationships(),
    ]);

    const entity: Entity360 = {
      spine_id: req.spine_id,
      tenant_id: req.tenant_id,
      entity_type: String(truth.data.entity_type || "unknown"),
      display_name: String(
        truth.data.name || truth.data.title || truth.data.company || truth.data.email || "Unnamed"
      ),
      truth,
      context,
      signals,
      memory,
      goals,
      relationships,
      meta: {
        assembled_at: new Date().toISOString(),
        hydration_bucket: String(truth.data.hydration_bucket || "B0"),
        department: String(truth.data.department || "BIZOPS"),
        industry: truth.data.industry as string | undefined,
        schema_version: "v1",
        cache_hit: false,
        assembly_ms: Date.now() - start,
      },
    };

    // Cache the result
    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(entity), { expirationTtl: CACHE_TTL });
    }

    return { success: true, entity };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Assembly failed",
    };
  }
}

/**
 * Batch assemble multiple Entity 360s
 */
export async function assembleEntity360Batch(
  req: Entity360BatchRequest,
  env: AssemblerEnv
): Promise<Entity360BatchResponse> {
  const results = await Promise.allSettled(
    req.spine_ids.map((spine_id) =>
      assembleEntity360({ tenant_id: req.tenant_id, spine_id, layers: req.layers }, env)
    )
  );

  const entities: Entity360[] = [];
  const errors: Array<{ spine_id: string; error: string }> = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value.success && result.value.entity) {
      entities.push(result.value.entity);
    } else {
      const error =
        result.status === "rejected"
          ? String(result.reason)
          : result.value.error || "Unknown error";
      errors.push({ spine_id: req.spine_ids[i], error });
    }
  });

  return { success: errors.length === 0, entities, errors };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER FETCHERS (DECISION 22: D1-only, no Supabase fallback)
// ═══════════════════════════════════════════════════════════════════════════════

/** Layer 1: Fetch canonical truth from Spine (D1) */
async function fetchTruth(
  env: AssemblerEnv,
  tenantId: string,
  spineId: string,
  _isFreeOrPersonal: boolean
): Promise<Entity360Truth | null> {
  if (env.CACHE_DB) {
    const row = await env.CACHE_DB.prepare(
      "SELECT * FROM entity_cache WHERE id = ? AND tenant_id = ? LIMIT 1"
    )
      .bind(spineId, tenantId)
      .first<any>();

    if (!row) return null;

    const entityType = resolveEntityType(row.type || "unknown");
    const target = getSpineTarget(entityType);
    const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
    const updatedAt = row.updated_at || new Date().toISOString();
    const ageMs = Date.now() - new Date(updatedAt).getTime();

    return {
      data: {
        id: row.id,
        tenant_id: row.tenant_id,
        entity_type: entityType,
        source: row.source_tool,
        source_id: row.source_id,
        updated_at: updatedAt,
        ...parsedData,
      },
      source_table: target?.table || "entities",
      source_schema: target?.schema || "public",
      updated_at: updatedAt,
      freshness: ageMs < 3600000 ? "live" : ageMs < 86400000 ? "recent" : "stale",
      sources: row.source_tool ? [row.source_tool] : [],
    };
  }

  return null;
}

/** Layer 2: Fetch context from D1 or Knowledge service binding */
async function fetchContext(
  env: AssemblerEnv,
  tenantId: string,
  spineId: string,
  _entityType: string,
  limit: number,
  _isFreeOrPersonal: boolean
): Promise<Entity360Context> {
  if (env.CACHE_DB) {
    try {
      const d1Res = await env.CACHE_DB.prepare(
        `SELECT c.* FROM cross_data c
         JOIN link_data l ON (l.source_id = c.id OR l.target_id = c.id)
         WHERE c.type = 'context_extraction' AND c.tenant_id = ? 
           AND (l.source_id = ? OR l.target_id = ?)
         ORDER BY c.created_at DESC LIMIT ?`
      )
        .bind(tenantId, spineId, spineId, limit)
        .all<any>();

      const recent = (d1Res.results || []).map((r) => {
        const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
        return {
          id: r.id,
          type: data.type || "document",
          title: r.name || data.title || "Untitled",
          summary: data.summary || "",
          source: r.source_tool || data.source || "unknown",
          created_at: r.created_at,
          relevance: data.relevance || 0.8,
        };
      });

      return { recent, total_count: recent.length };
    } catch {
      // Fall through to Knowledge service fallback
    }
  }

  // Fallback: Knowledge service binding (CF service binding, not Supabase)
  if (env.KNOWLEDGE) {
    try {
      const res = await env.KNOWLEDGE.fetch(
        new Request(`http://knowledge/v1/context/${spineId}?tenant_id=${tenantId}&limit=${limit}`)
      );
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.items?.length) {
          return {
            recent: data.items.map((item: any) => ({
              id: item.id,
              type: item.type || "document",
              title: item.title || "Untitled",
              summary: item.summary,
              source: item.source || "knowledge",
              created_at: item.created_at,
              relevance: item.relevance,
            })),
            total_count: data.total || data.items.length,
          };
        }
      }
    } catch {
      /* Knowledge service unavailable */
    }
  }

  return emptyContext();
}

/** Layer 3: Fetch active signals from D1 */
async function fetchSignals(
  env: AssemblerEnv,
  tenantId: string,
  spineId: string,
  limit: number,
  _isFreeOrPersonal: boolean
): Promise<Entity360Signals> {
  if (env.CACHE_DB) {
    try {
      const d1Res = await env.CACHE_DB.prepare(
        "SELECT * FROM signal_cache WHERE entity_id = ? AND tenant_id = ? ORDER BY updated_at DESC LIMIT ?"
      )
        .bind(spineId, tenantId, limit)
        .all<any>();

      const active: Entity360Signal[] = (d1Res.results || []).map((r) => {
        const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
        return {
          id: r.id,
          type: r.signal_type || "unknown",
          severity: r.severity || "info",
          title: data.title || "Signal",
          description: data.description || "",
          evidence: (data.key_indicators || []).map((ind: string) => ({
            type: "pattern" as const,
            source: data.generated_by || "system",
            description: ind,
          })),
          confidence: data.confidence || 0.5,
          created_at: r.updated_at,
          generated_by: data.generated_by || "pipeline",
        };
      });

      const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      for (const s of active) {
        if (s.severity in summary) summary[s.severity as keyof typeof summary]++;
      }

      return { active, summary };
    } catch {
      return emptySignals();
    }
  }

  return emptySignals();
}

/** Layer 4: Fetch AI memories from D1 or Knowledge service binding */
async function fetchMemory(
  env: AssemblerEnv,
  tenantId: string,
  spineId: string,
  limit: number,
  _isFreeOrPersonal: boolean
): Promise<Entity360Memory> {
  if (env.CACHE_DB) {
    try {
      const d1Res = await env.CACHE_DB.prepare(
        `SELECT c.* FROM cross_data c
         JOIN link_data l ON (l.source_id = c.id OR l.target_id = c.id)
         WHERE c.type = 'org_memory' AND c.tenant_id = ? 
           AND (l.source_id = ? OR l.target_id = ?)
         ORDER BY c.created_at DESC LIMIT ?`
      )
        .bind(tenantId, spineId, spineId, limit)
        .all<any>();

      const recent = (d1Res.results || []).map((r) => {
        const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
        return {
          id: r.id,
          type: data.memory_type || "insight",
          content: r.name || data.content || "",
          confidence: data.confidence || 0.8,
          source: r.source_tool || data.source || "ai_extracted",
          created_at: r.created_at,
          expires_at: data.expires_at || null,
        };
      });

      return { recent, total_count: recent.length };
    } catch {
      // Fall through to Knowledge service fallback
    }
  }

  // Fallback: Knowledge service binding (CF service binding, not Supabase)
  if (env.KNOWLEDGE) {
    try {
      const res = await env.KNOWLEDGE.fetch(
        new Request(
          `http://knowledge/v1/memories?tenant_id=${tenantId}&entity_id=${spineId}&limit=${limit}`
        )
      );
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.memories?.length) {
          return {
            recent: data.memories.map((m: any) => ({
              id: m.id,
              type: m.memory_type || "insight",
              content: m.content,
              confidence: m.confidence || 0.8,
              source: m.source || "ai_extracted",
              created_at: m.created_at,
              expires_at: m.expires_at,
            })),
            total_count: data.total || data.memories.length,
          };
        }
      }
    } catch {
      /* Knowledge service unavailable */
    }
  }

  return emptyMemory();
}

/** Layer 5: Fetch goals linked to entity from D1 */
async function fetchGoals(
  env: AssemblerEnv,
  tenantId: string,
  spineId: string,
  _isFreeOrPersonal: boolean
): Promise<Entity360Goals> {
  if (env.CACHE_DB) {
    try {
      const d1Res = await env.CACHE_DB.prepare(
        `SELECT g.* FROM decide_data g
         LEFT JOIN link_data l ON (l.source_id = g.id OR l.target_id = g.id)
         WHERE g.type = 'goal' AND g.tenant_id = ? 
           AND (l.source_id = ? OR l.target_id = ? OR g.owner = ?)
         ORDER BY g.created_at DESC LIMIT 10`
      )
        .bind(tenantId, spineId, spineId, spineId)
        .all<any>();

      const active: Entity360Goal[] = (d1Res.results || []).map((r) => {
        const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
        return {
          id: r.id,
          title: r.name || data.title || "Goal",
          status: r.status || "active",
          progress: r.progress || 0,
          target_date: r.due_date || data.target_date,
        };
      });

      const atRisk = active.filter((g) => g.status === "at_risk").length;
      const health =
        active.length === 0
          ? ("no_goals" as const)
          : atRisk > active.length / 2
            ? ("off_track" as const)
            : atRisk > 0
              ? ("at_risk" as const)
              : ("on_track" as const);

      return { active, health };
    } catch {
      return emptyGoals();
    }
  }

  return emptyGoals();
}

/** Layer 6: Fetch entity relationships from D1 */
async function fetchRelationships(
  env: AssemblerEnv,
  tenantId: string,
  spineId: string,
  entityType: string,
  limit: number,
  _isFreeOrPersonal: boolean
): Promise<Entity360Relationships> {
  const result: Entity360Relationships = { children: [], related: [] };

  if (env.CACHE_DB) {
    try {
      if (entityType === "contact") {
        const row = await env.CACHE_DB.prepare(
          "SELECT data FROM entity_cache WHERE id = ? AND tenant_id = ? LIMIT 1"
        )
          .bind(spineId, tenantId)
          .first<any>();

        if (row) {
          const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data || {};
          const accountId = data.account_id || data.company_id;
          if (accountId) {
            const parentAcc = await env.CACHE_DB.prepare(
              "SELECT id, data FROM entity_cache WHERE id = ? AND tenant_id = ? LIMIT 1"
            )
              .bind(accountId, tenantId)
              .first<any>();
            if (parentAcc) {
              const parentData =
                typeof parentAcc.data === "string"
                  ? JSON.parse(parentAcc.data)
                  : parentAcc.data || {};
              result.parent = {
                spine_id: parentAcc.id,
                entity_type: "account",
                display_name: parentData.name || parentData.company || "Account",
              };
            }
          }
        }
      }

      if (entityType === "account") {
        const d1Res = await env.CACHE_DB.prepare(
          `SELECT id, data FROM entity_cache 
           WHERE tenant_id = ? AND type = 'contact' AND (
             data LIKE ?
           ) LIMIT ?`
        )
          .bind(tenantId, `%${spineId}%`, limit)
          .all<any>();

        const children = (d1Res.results || [])
          .filter((r) => {
            const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
            return data.account_id === spineId || data.company_id === spineId;
          })
          .map((r) => {
            const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
            return {
              spine_id: r.id,
              entity_type: "contact",
              display_name: data.name || data.full_name || "Contact",
            };
          });

        result.children = children;
      }
    } catch {
      // ignore — return empty result
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY LAYER DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════

function emptyContext(): Entity360Context {
  return { recent: [], total_count: 0 };
}
function emptySignals(): Entity360Signals {
  return { active: [], summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 } };
}
function emptyMemory(): Entity360Memory {
  return { recent: [], total_count: 0 };
}
function emptyGoals(): Entity360Goals {
  return { active: [], health: "no_goals" };
}
function emptyRelationships(): Entity360Relationships {
  return { children: [], related: [] };
}
