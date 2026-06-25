/**
 * Spine-Native MCP Tools
 *
 * MCP exposes the Spine, not individual tools.
 * These tools access canonical entities, signals, proposals, and memory
 * through the universal Spine interface.
 *
 * Doctrine: MCP is the protocol. The Spine is the destination.
 * Tool identity is erased at the Normalizer. Source-agnostic by design.
 */

import { z } from "zod";
import type { Bindings, Log } from "./tools";

// ─── D1 Helpers ──────────────────────────────────────────────────────────────

async function d1Select(
  db: D1Database,
  sql: string,
  params: unknown[]
): Promise<Record<string, unknown>[]> {
  const stmt = db.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const result = await bound.all();
  return (result.results || []) as Record<string, unknown>[];
}

// ─── spine.entity.get ────────────────────────────────────────────────────────

export const SpineEntityGetSchema = z.object({
  tenant_id: z.string().min(1),
  entity_type: z.string().min(1),
  entity_id: z.string().min(1),
});

export async function spineEntityGet(
  input: z.infer<typeof SpineEntityGetSchema>,
  env: Bindings,
  log: Log
): Promise<unknown> {
  if (!env.DB) {
    throw new Error("D1 Spine cache not available");
  }

  // Spine entities are stored in D1; query by tenant + type + id
  const rows = await d1Select(
    env.DB,
    `SELECT * FROM spine_entities WHERE tenant_id = ? AND entity_type = ? AND id = ? LIMIT 1`,
    [input.tenant_id, input.entity_type, input.entity_id]
  );

  if (rows.length === 0) {
    return { found: false, entity: null };
  }

  // Parse JSON fields if present
  const entity = rows[0];
  for (const key of ["data", "metadata", "traits"]) {
    if (entity[key] && typeof entity[key] === "string") {
      try {
        entity[key] = JSON.parse(entity[key] as string);
      } catch {
        // leave as string
      }
    }
  }

  log.info("spine.entity.get", {
    tenant_id: input.tenant_id,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
  });

  return { found: true, entity };
}

// ─── spine.entity.list ───────────────────────────────────────────────────────

export const SpineEntityListSchema = z.object({
  tenant_id: z.string().min(1),
  entity_type: z.string().min(1),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export async function spineEntityList(
  input: z.infer<typeof SpineEntityListSchema>,
  env: Bindings,
  log: Log
): Promise<unknown> {
  if (!env.DB) {
    throw new Error("D1 Spine cache not available");
  }

  const rows = await d1Select(
    env.DB,
    `SELECT * FROM spine_entities WHERE tenant_id = ? AND entity_type = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    [input.tenant_id, input.entity_type, input.limit, input.offset]
  );

  for (const entity of rows) {
    for (const key of ["data", "metadata", "traits"]) {
      if (entity[key] && typeof entity[key] === "string") {
        try {
          entity[key] = JSON.parse(entity[key] as string);
        } catch {
          // leave as string
        }
      }
    }
  }

  log.info("spine.entity.list", {
    tenant_id: input.tenant_id,
    entity_type: input.entity_type,
    count: rows.length,
  });

  return { entities: rows, count: rows.length };
}

// ─── spine.entity.search ─────────────────────────────────────────────────────

export const SpineEntitySearchSchema = z.object({
  tenant_id: z.string().min(1),
  q: z.string().min(1),
  entity_type: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

export async function spineEntitySearch(
  input: z.infer<typeof SpineEntitySearchSchema>,
  env: Bindings,
  log: Log
): Promise<unknown> {
  if (!env.DB) {
    throw new Error("D1 Spine cache not available");
  }

  const likePattern = `%${input.q}%`;
  let sql: string;
  let params: unknown[];

  if (input.entity_type) {
    sql = `SELECT * FROM spine_entities WHERE tenant_id = ? AND entity_type = ? AND (name LIKE ? OR id LIKE ?) ORDER BY updated_at DESC LIMIT ?`;
    params = [input.tenant_id, input.entity_type, likePattern, likePattern, input.limit];
  } else {
    sql = `SELECT * FROM spine_entities WHERE tenant_id = ? AND (name LIKE ? OR id LIKE ?) ORDER BY updated_at DESC LIMIT ?`;
    params = [input.tenant_id, likePattern, likePattern, input.limit];
  }

  const rows = await d1Select(env.DB, sql, params);

  for (const entity of rows) {
    for (const key of ["data", "metadata", "traits"]) {
      if (entity[key] && typeof entity[key] === "string") {
        try {
          entity[key] = JSON.parse(entity[key] as string);
        } catch {
          // leave as string
        }
      }
    }
  }

  log.info("spine.entity.search", {
    tenant_id: input.tenant_id,
    q: input.q,
    count: rows.length,
  });

  return { entities: rows, count: rows.length };
}

// ─── signal.list ─────────────────────────────────────────────────────────────

export const SignalListSchema = z.object({
  tenant_id: z.string().min(1),
  status: z.enum(["pending_review", "approved", "all"]).default("all"),
  limit: z.number().min(1).max(50).default(20),
});

export async function signalList(
  input: z.infer<typeof SignalListSchema>,
  env: Bindings,
  log: Log
): Promise<unknown> {
  // Direct D1 read from spine-cache (ADK: fastest path for reads)
  if (env.DB) {
    try {
      let query = "SELECT * FROM signals WHERE tenant_id = ?";
      const params: any[] = [input.tenant_id];

      if (input.status && input.status !== "all") {
        if (input.status === "pending_review") {
          query += " AND processed = 0";
        } else if (input.status === "approved") {
          query += " AND processed = 1";
        }
      }

      query += " ORDER BY created_at DESC LIMIT ?";
      params.push(input.limit);

      const result = await env.DB.prepare(query)
        .bind(...params)
        .all();
      const rows = (result.results || []).map((row: any) => {
        let payload: any = {};
        try {
          payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload || {};
        } catch {
          /* leave empty */
        }

        return {
          id: row.id,
          tenant_id: row.tenant_id,
          signal_type: row.signal_type,
          workspace: row.workspace,
          source_entity_id: row.source_entity_id,
          processed: row.processed,
          proposal_id: row.proposal_id,
          payload,
          created_at: row.created_at,
        };
      });

      log.info("signal.list (D1 direct)", { tenant_id: input.tenant_id, count: rows.length });
      return { signals: rows, count: rows.length };
    } catch (dbErr: any) {
      log.warn("signal.list D1 query failed, falling back to service", { error: dbErr.message });
      // Fall through to service call
    }
  }

  // Fallback: Route to intelligence worker
  const intelligenceUrl =
    env.INTELLIGENCE_URL || "https://integratewise-intelligence.connect-a1b.workers.dev";

  const qs = new URLSearchParams();
  qs.set("tenant_id", input.tenant_id);
  qs.set("limit", String(input.limit));

  const res = await fetch(`${intelligenceUrl}/v1/signals?${qs.toString()}`, {
    headers: {
      "x-tenant-id": input.tenant_id,
      "x-service-auth": env.SERVICE_SECRET || "",
    },
  });

  if (!res.ok) {
    throw new Error(`Intelligence service error: ${res.status}`);
  }

  const data = (await res.json()) as any;
  log.info("signal.list", { tenant_id: input.tenant_id, count: data.signals?.length || 0 });
  return data;
}

// ─── proposal.list ───────────────────────────────────────────────────────────

export const ProposalListSchema = z.object({
  tenant_id: z.string().min(1),
  status: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export async function proposalList(
  input: z.infer<typeof ProposalListSchema>,
  env: Bindings,
  log: Log
): Promise<unknown> {
  // Direct D1 read from spine-cache (ADK: fastest path for reads)
  if (env.DB) {
    try {
      let query = "SELECT * FROM proposals WHERE tenant_id = ?";
      const params: any[] = [input.tenant_id];

      if (input.status) {
        const statuses = input.status.split(",").map((s) => s.trim());
        if (statuses.length === 1) {
          query += " AND status = ?";
          params.push(statuses[0]);
        } else {
          query += ` AND status IN (${statuses.map(() => "?").join(",")})`;
          params.push(...statuses);
        }
      } else {
        // Default: pending_review + approved
        query += " AND status IN ('pending_review', 'approved')";
      }

      query += " ORDER BY created_at DESC LIMIT ?";
      params.push(input.limit);

      const result = await env.DB.prepare(query)
        .bind(...params)
        .all();
      const rows = (result.results || []).map((row: any) => ({
        id: row.id,
        tenant_id: row.tenant_id,
        status: row.status,
        action_type: row.action_type,
        action_description: row.action_description,
        confidence: row.confidence,
        reasoning_summary: row.reasoning_summary,
        originating_entity_type: row.originating_entity_type,
        originating_entity_id: row.originating_entity_id,
        ops_priority: row.ops_priority,
        ops_surface: row.ops_surface,
        reviewed_by: row.reviewed_by,
        reviewed_at: row.reviewed_at,
        review_notes: row.review_notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      log.info("proposal.list (D1 direct)", { tenant_id: input.tenant_id, count: rows.length });
      return { proposals: rows, count: rows.length };
    } catch (dbErr: any) {
      log.warn("proposal.list D1 query failed, falling back to service", { error: dbErr.message });
      // Fall through to service call
    }
  }

  // Fallback: Route to intelligence/govern worker
  const intelligenceUrl =
    env.INTELLIGENCE_URL || "https://integratewise-intelligence.connect-a1b.workers.dev";

  const qs = new URLSearchParams();
  qs.set("tenant_id", input.tenant_id);
  qs.set("limit", String(input.limit));
  if (input.status) qs.set("status", input.status);

  const res = await fetch(`${intelligenceUrl}/v1/proposals?${qs.toString()}`, {
    headers: {
      "x-tenant-id": input.tenant_id,
      "x-service-auth": env.SERVICE_SECRET || "",
    },
  });

  if (!res.ok) {
    throw new Error(`Intelligence service error: ${res.status}`);
  }

  const data = (await res.json()) as any;
  log.info("proposal.list", { tenant_id: input.tenant_id, count: data.count || 0 });
  return data;
}

// ─── proposal.approve ────────────────────────────────────────────────────────

export const ProposalApproveSchema = z.object({
  tenant_id: z.string().min(1),
  proposal_id: z.string().min(1),
  review_notes: z.string().optional(),
});

export async function proposalApprove(
  input: z.infer<typeof ProposalApproveSchema>,
  env: Bindings,
  log: Log
): Promise<unknown> {
  const intelligenceUrl =
    env.INTELLIGENCE_URL || "https://integratewise-intelligence.connect-a1b.workers.dev";

  const res = await fetch(`${intelligenceUrl}/v1/proposals/${input.proposal_id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": input.tenant_id,
      "x-service-auth": env.SERVICE_SECRET || "",
    },
    body: JSON.stringify({
      review_notes: input.review_notes,
    }),
  });

  if (!res.ok) {
    throw new Error(`Intelligence service error: ${res.status}`);
  }

  const data = (await res.json()) as any;
  log.info("proposal.approve", {
    tenant_id: input.tenant_id,
    proposal_id: input.proposal_id,
  });

  return data;
}

// ─── proposal.reject ─────────────────────────────────────────────────────────

export const ProposalRejectSchema = z.object({
  tenant_id: z.string().min(1),
  proposal_id: z.string().min(1),
  review_notes: z.string().min(1),
});

export async function proposalReject(
  input: z.infer<typeof ProposalRejectSchema>,
  env: Bindings,
  log: Log
): Promise<unknown> {
  const intelligenceUrl =
    env.INTELLIGENCE_URL || "https://integratewise-intelligence.connect-a1b.workers.dev";

  const res = await fetch(`${intelligenceUrl}/v1/proposals/${input.proposal_id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": input.tenant_id,
      "x-service-auth": env.SERVICE_SECRET || "",
    },
    body: JSON.stringify({
      review_notes: input.review_notes,
    }),
  });

  if (!res.ok) {
    throw new Error(`Intelligence service error: ${res.status}`);
  }

  const data = (await res.json()) as any;
  log.info("proposal.reject", {
    tenant_id: input.tenant_id,
    proposal_id: input.proposal_id,
  });

  return data;
}

// ─── search.semantic ─────────────────────────────────────────────────────────

export const SemanticSearchSchema = z.object({
  tenant_id: z.string().min(1),
  q: z.string().min(1),
  entity_type: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

export async function semanticSearch(
  input: z.infer<typeof SemanticSearchSchema>,
  env: Bindings,
  log: Log
): Promise<unknown> {
  // Route to knowledge service for semantic search (POST /knowledge/search)
  if (!env.KNOWLEDGE) {
    throw new Error("Knowledge service binding not available");
  }

  const req = new Request("http://internal/knowledge/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": input.tenant_id,
    },
    body: JSON.stringify({
      query: input.q,
      type: "hybrid",
      top_k: input.limit,
      entity_type: input.entity_type,
      approved_only: false,
    }),
  });

  const res = await env.KNOWLEDGE.fetch(req);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Knowledge service error: ${res.status} ${errText}`.trim());
  }

  const data = (await res.json()) as any;
  log.info("search.semantic", {
    tenant_id: input.tenant_id,
    q: input.q,
    count: data.results?.length || 0,
  });

  return data;
}
