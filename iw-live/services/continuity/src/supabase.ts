/**
 * Continuity DB Shim — 100% Cloudflare (DECISION 22).
 *
 * Reads go to D1 (edge SQLite) directly; writes go through the Pipeline db-proxy
 * (the single Spine writer). There is NO Supabase/PostgREST path — D1 + Pipeline
 * are required bindings. Exported names are kept stable for callers.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DbConfig {
  /** Cloudflare D1 binding (edge SQLite) — required for reads. */
  DB?: D1Database;
  /** Pipeline service binding (db-proxy) — required for writes. */
  PIPELINE?: Fetcher;
  /** @deprecated retained only for source-compat with older callers; unused. */
  url?: string;
  /** @deprecated retained only for source-compat with older callers; unused. */
  serviceRoleKey?: string;
}

/** @deprecated alias — use DbConfig. Kept so existing imports keep compiling. */
export type SupabaseConfig = DbConfig;

// ─── PostgREST-style filter parsing → SQLite ────────────────────────────────

function parseQuery(table: string, params?: Record<string, any>): { sql: string; values: any[] } {
  const clauses: string[] = [];
  const values: any[] = [];
  let limitStr = "";
  let orderStr = "";

  const targetTable = table.replace("memory.", "").replace("public.", "");

  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (val === undefined || val === null) continue;
      const valStr = String(val);

      if (key === "limit") {
        limitStr = `LIMIT ${parseInt(valStr)}`;
      } else if (key === "order") {
        const [field, dir] = valStr.split(".");
        orderStr = `ORDER BY ${field} ${dir === "desc" ? "DESC" : "ASC"}`;
      } else if (key === "select") {
        // ignore select projections for D1 wildcard queries
      } else if (valStr.startsWith("eq.")) {
        clauses.push(`${key} = ?`);
        values.push(valStr.substring(3));
      } else if (valStr.startsWith("neq.")) {
        clauses.push(`${key} != ?`);
        values.push(valStr.substring(4));
      } else if (valStr.startsWith("in.")) {
        const inVals = valStr
          .substring(3)
          .replace(/^\(|\)$/g, "")
          .split(",");
        const placeholders = inVals.map(() => "?").join(", ");
        clauses.push(`${key} IN (${placeholders})`);
        values.push(...inVals);
      } else if (valStr === "is.null") {
        clauses.push(`${key} IS NULL`);
      } else {
        clauses.push(`${key} = ?`);
        values.push(valStr);
      }
    }
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM ${targetTable} ${whereClause} ${orderStr} ${limitStr}`.trim();

  return { sql, values };
}

function reviveJson<T>(row: any): T {
  const mapped = { ...row };
  for (const [k, v] of Object.entries(mapped)) {
    if (typeof v === "string" && (v.startsWith("{") || v.startsWith("["))) {
      try {
        mapped[k] = JSON.parse(v as string);
      } catch {
        /* leave as string */
      }
    }
  }
  return mapped as T;
}

// ─── Write path: Pipeline db-proxy (single Spine writer) ────────────────────

async function queryDbProxy(
  config: DbConfig,
  table: string,
  method: "POST" | "PATCH" | "DELETE",
  queryStr?: string,
  payload?: any
): Promise<any> {
  const pipeline = config.PIPELINE;
  if (!pipeline) {
    throw new Error("PIPELINE binding required for db-proxy writes (Cloudflare-only plane).");
  }

  const response = await pipeline.fetch("http://pipeline/api/v1/db-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, method, query: queryStr, payload }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`db-proxy error: ${response.status} - ${errText}`);
  }

  return response.json();
}

// ─── Query Builder (kept for callers) ───────────────────────────────────────

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
}

// ─── Table Operations (D1 reads · Pipeline writes) ──────────────────────────

export async function insert<T>(
  config: DbConfig,
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[]
): Promise<{ data: T[] | null; error: string | null }> {
  try {
    const data = await queryDbProxy(config, table, "POST", undefined, rows);
    return {
      data: Array.isArray(data) ? (data as T[]) : ([data] as unknown as T[]),
      error: null,
    };
  } catch (err: any) {
    console.error(`[db-shim:insert] db-proxy insert failed on ${table}: ${err.message}`);
    return { data: null, error: err.message };
  }
}

export async function update<T>(
  config: DbConfig,
  table: string,
  filter: Record<string, unknown>,
  values: Record<string, unknown>
): Promise<{ data: T[] | null; error: string | null }> {
  const filterQuery = Object.entries(filter)
    .map(([k, v]) => `${k}=eq.${v}`)
    .join("&");

  try {
    const data = await queryDbProxy(config, table, "PATCH", filterQuery, values);
    return {
      data: Array.isArray(data) ? (data as T[]) : ([data] as unknown as T[]),
      error: null,
    };
  } catch (err: any) {
    console.error(`[db-shim:update] db-proxy update failed on ${table}: ${err.message}`);
    return { data: null, error: err.message };
  }
}

export async function select<T>(
  config: DbConfig,
  table: string,
  params?: Record<string, string | number | boolean | undefined>,
  opts?: { count?: "exact" | "planned" | "estimated" }
): Promise<{ data: T[] | null; error: string | null; count: number | null }> {
  if (!config.DB) {
    return {
      data: null,
      error: "DB (D1) binding required for reads (Cloudflare-only plane).",
      count: null,
    };
  }
  try {
    const { sql, values } = parseQuery(table, params);
    const { results } = await config.DB.prepare(sql)
      .bind(...values)
      .all();

    const data = (results || []).map((row: any) => reviveJson(row)) as unknown as T[];

    let count: number | null = null;
    if (opts?.count) {
      const countSql = sql
        .replace(/SELECT\s+\*\s+FROM/i, "SELECT COUNT(*) as cnt FROM")
        .replace(/ORDER BY.*/i, "")
        .replace(/LIMIT.*/i, "");
      const countRes = await config.DB.prepare(countSql)
        .bind(...values)
        .first<{ cnt: number }>();
      count = countRes?.cnt ?? null;
    }

    return { data, error: null, count };
  } catch (err: any) {
    console.error(`[db-shim:select] D1 select query failed on ${table}: ${err.message}`);
    return { data: null, error: err.message, count: null };
  }
}

export async function selectOne<T>(
  config: DbConfig,
  table: string,
  params: Record<string, string | number | boolean | undefined>
): Promise<{ data: T | null; error: string | null }> {
  if (!config.DB) {
    return { data: null, error: "DB (D1) binding required for reads (Cloudflare-only plane)." };
  }
  try {
    const { sql, values } = parseQuery(table, { ...params, limit: 1 });
    const row = await config.DB.prepare(sql)
      .bind(...values)
      .first();
    if (!row) return { data: null, error: null };
    return { data: reviveJson<T>(row), error: null };
  } catch (err: any) {
    console.error(`[db-shim:selectOne] D1 selectOne failed on ${table}: ${err.message}`);
    return { data: null, error: err.message };
  }
}

export async function deleteRows(
  config: DbConfig,
  table: string,
  filter: Record<string, unknown>
): Promise<{ error: string | null }> {
  const filterQuery = Object.entries(filter)
    .map(([k, v]) => `${k}=eq.${v}`)
    .join("&");
  try {
    await queryDbProxy(config, table, "DELETE", filterQuery);
    return { error: null };
  } catch (err: any) {
    console.error(`[db-shim:deleteRows] db-proxy delete failed on ${table}: ${err.message}`);
    return { error: err.message };
  }
}

// ─── Utilities ──────────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}:${ts}-${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
