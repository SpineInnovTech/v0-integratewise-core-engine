import type { Env } from "../types";

export async function spineHealth(env: Env): Promise<{ ok: boolean; status: number }> {
  if (!env.PIPELINE) {
    return { ok: false, status: 0 };
  }

  try {
    const res = await env.PIPELINE.fetch("http://internal/health");
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 500 };
  }
}

export async function spineReadMemory(env: Env, tenantId: string, limit = 10): Promise<unknown> {
  if (!env.PIPELINE) {
    return { error: "PIPELINE_BINDING_MISSING", items: [] };
  }

  try {
    const res = await env.PIPELINE.fetch(`http://internal/api/v1/memory?limit=${limit}`, {
      headers: {
        "x-tenant-id": tenantId,
      },
    });

    if (!res.ok) {
      return { error: res.status, text: await res.text() };
    }
    return await res.json();
  } catch (error: any) {
    console.error("[Spine Client] Read memory failed:", error.message);
    return { error: "SPINE_FETCH_ERROR", message: error.message };
  }
}

// ── Engineering projection (Phase 3) ─────────────────────────────────────────
// The Twin answers engineering questions from the SPINE — never the GitHub API.
// Reads the `build_data` partition D1-direct (the SAME partition the GitHub
// connector lands canonical entities into, and the gateway projects from). Shape
// mirrors services/gateway getEngineeringProjection so both readers agree.
// Read-only; degrades to an empty projection before any data is synced.
export interface EngineeringProjection {
  activeRepositories: Array<Record<string, unknown>>;
  openPullRequests: Array<Record<string, unknown>>;
  recentCommits: Array<Record<string, unknown>>;
  blockedWork: Array<Record<string, unknown>>;
  counts: { repositories: number; openPRs: number; commits: number; blocked: number };
  source: string;
}

function safeJson(value: unknown): Record<string, any> {
  if (value && typeof value === "object") return value as Record<string, any>;
  try {
    return JSON.parse(String(value ?? "{}")) || {};
  } catch {
    return {};
  }
}

export async function spineReadEngineering(
  env: Env,
  tenantId: string
): Promise<EngineeringProjection> {
  const empty: EngineeringProjection = {
    activeRepositories: [],
    openPullRequests: [],
    recentCommits: [],
    blockedWork: [],
    counts: { repositories: 0, openPRs: 0, commits: 0, blocked: 0 },
    source: "spine:build_data",
  };

  if (!env.D1) return { ...empty, source: "spine:build_data:unbound" };

  let rows: { results?: any[] };
  try {
    rows = await env.D1.prepare(
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
    // build_data not present yet (no engineering data synced) — graceful empty.
    return empty;
  }

  const out: EngineeringProjection = {
    activeRepositories: [],
    openPullRequests: [],
    recentCommits: [],
    blockedWork: [],
    counts: { repositories: 0, openPRs: 0, commits: 0, blocked: 0 },
    source: "spine:build_data",
  };

  for (const r of rows.results || []) {
    const d = safeJson(r.data);
    const base = { id: r.id, name: r.name, sourceId: r.source_id, updatedAt: r.updated_at };
    if (r.type === "repository") {
      if ((d.status ?? r.status) !== "archived") {
        out.activeRepositories.push({
          ...base,
          language: d.language ?? null,
          stars: d.stars ?? 0,
          url: d.url ?? null,
        });
      }
    } else if (r.type === "pull_request") {
      const status = d.status ?? r.status;
      if (status === "open" || status === "draft") {
        out.openPullRequests.push({
          ...base,
          status,
          author: d.author ?? null,
          branch: d.head_branch ?? null,
          url: d.url ?? null,
        });
      }
    } else if (r.type === "activity" && d.activity_type === "commit") {
      out.recentCommits.push({
        ...base,
        author: d.author ?? null,
        sha: d.sha ?? null,
        eventDate: d.event_date ?? null,
      });
    } else if (r.type === "task" && (d.blocked_by ?? null)) {
      out.blockedWork.push({
        ...base,
        status: d.status ?? r.status,
        assignee: d.assignee ?? null,
        blockedBy: d.blocked_by,
        url: d.url ?? null,
      });
    }
  }

  out.activeRepositories = out.activeRepositories.slice(0, 20);
  out.openPullRequests = out.openPullRequests.slice(0, 25);
  out.recentCommits = out.recentCommits.slice(0, 15);
  out.blockedWork = out.blockedWork.slice(0, 25);
  out.counts = {
    repositories: out.activeRepositories.length,
    openPRs: out.openPullRequests.length,
    commits: out.recentCommits.length,
    blocked: out.blockedWork.length,
  };
  return out;
}
