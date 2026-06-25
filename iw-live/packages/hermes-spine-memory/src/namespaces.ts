/**
 * Hermes Spine Memory — Namespace Management
 *
 * Namespace isolation rules:
 * - `personal:user:{id}`  →  User-private memory (twin chat history, personal notes)
 * - `org:{tenant_id}`     →  Shared organizational memory (decisions, governance, ops)
 *
 * Database naming:
 * - Personal: `iw_mem_personal_{userId}`
 * - Org:      `iw_mem_org_{tenantId}`
 *
 * This guarantees physical isolation at the database level (Wall 1).
 */

import type { MemoryScope, Namespace, ResolveNamespaceInput } from "./types.js";

const DB_PREFIX = "iw_mem";

/** Build a database name from scope and subject id */
export function buildDbName(scope: MemoryScope, subjectId: string): string {
  const sanitized = subjectId.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  return `${DB_PREFIX}_${scope}_${sanitized}`;
}

/** Resolve a namespace from scope + userId + optional tenantId */
export function resolveNamespace(input: ResolveNamespaceInput): Namespace {
  const { scope, userId, tenantId } = input;

  if (scope === "org" && !tenantId) {
    throw new Error("Org scope requires tenantId");
  }

  const subjectId = scope === "personal" ? userId : tenantId!;
  const path = scope === "personal" ? `personal:user:${subjectId}` : `org:${subjectId}`;

  return {
    scope,
    subjectId,
    path,
    dbName: buildDbName(scope, subjectId),
  };
}

/** Parse a namespace path back into components */
export function parseNamespacePath(path: string): Omit<Namespace, "dbName"> {
  const parts = path.split(":");
  if (parts.length < 2) {
    throw new Error(`Invalid namespace path: ${path}`);
  }

  const scope = parts[0] as MemoryScope;
  if (scope !== "personal" && scope !== "org") {
    throw new Error(`Invalid scope in namespace path: ${scope}`);
  }

  const subjectId = parts.slice(1).join(":");
  return { scope, subjectId, path };
}

/** Derive a namespace DB name directly from a path */
export function dbNameFromPath(path: string): string {
  const parsed = parseNamespacePath(path);
  return buildDbName(parsed.scope, parsed.subjectId);
}

/** List all IntegrateWise memory databases on a CouchDB instance */
export async function listMemoryDatabases(config: {
  url: string;
  username: string;
  password: string;
}): Promise<string[]> {
  const creds =
    typeof btoa === "function"
      ? btoa(`${config.username}:${config.password}`)
      : Buffer.from(`${config.username}:${config.password}`).toString("base64");

  const res = await fetch(`${config.url.replace(/\/$/, "")}/_all_dbs`, {
    headers: { Authorization: `Basic ${creds}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list databases: ${res.status}`);
  }

  const all = (await res.json()) as string[];
  return all.filter((db) => db.startsWith(`${DB_PREFIX}_`));
}

/**
 * Routing logic for Twin memory context switching.
 *
 * Rules:
 * 1. If the user explicitly requests "personal", route to personal:user:{userId}
 * 2. If the user explicitly requests "org", route to org:{tenantId}
 * 3. If no preference and a tenantId exists, default to "org"
 * 4. If no preference and no tenantId, fall back to "personal"
 * 5. If switching scopes, capture the previous scope for context preservation
 */
export function routeTwinMemory(input: {
  requestedScope?: MemoryScope;
  userId: string;
  tenantId?: string;
  currentScope?: MemoryScope;
}): {
  namespace: Namespace;
  switched: boolean;
  previousScope?: MemoryScope;
} {
  const { requestedScope, userId, tenantId, currentScope } = input;

  // Determine target scope
  let targetScope: MemoryScope;
  if (requestedScope) {
    targetScope = requestedScope;
  } else if (tenantId) {
    targetScope = "org";
  } else {
    targetScope = "personal";
  }

  // Validate org scope has tenant
  if (targetScope === "org" && !tenantId) {
    throw new Error("Cannot route to org scope without tenantId");
  }

  const namespace = resolveNamespace({
    scope: targetScope,
    userId,
    tenantId,
  });

  const switched = currentScope !== undefined && currentScope !== targetScope;

  return {
    namespace,
    switched,
    previousScope: switched ? currentScope : undefined,
  };
}
