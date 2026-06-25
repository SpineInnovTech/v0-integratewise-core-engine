/**
 * SpineGatewayAdapter — Drop-in replacement for spineClient (gateway-proxy mode)
 *
 * Maps the Supabase-like `from(table).select().eq()` chainable interface to
 * HTTP calls through the GatewayHttpClient. Eliminates any direct Supabase
 * dependency from the frontend when VITE_SPINE_PROVIDER=gateway-proxy.
 *
 * Requirements: R1 (Gateway Proxy Client), R5 (All Workspace API Calls Route Through CF Gateway),
 *              R10 (Migration Path — drop-in replacement, same type exports)
 */

import { gatewayClient } from "../../lib/gateway-client";
import { authManager } from "../../lib/auth-manager";
import type { AuthEvent, AuthSession } from "../../lib/auth-manager";

// ─── Table → Endpoint Mapping ────────────────────────────────────────────────

const TABLE_ROUTE_MAP: Record<string, string> = {
  connectors: "/api/v1/workspace/connectors",
  entities: "/api/v1/pipeline/entities",
  profiles: "/api/v1/workspace/profile",
  tenant_spine_config: "/api/v1/workspace/spine-config",
  tenant_products: "/api/v1/workspace/tenant-products",
  product_catalog: "/api/v1/workspace/product-catalog",
  entity_type_map: "/api/v1/pipeline/entity-type-map",
  signals: "/api/v1/intelligence/signals",
  org_memory: "/api/v1/knowledge/memories?type=org",
  conversational_memory: "/api/v1/knowledge/memories?type=conversational",
  proposals: "/api/v1/governance/proposals",
  sync_checkpoints: "/api/v1/pipeline/sync-checkpoints",
  pipeline_quarantine: "/api/v1/pipeline/quarantine",
  continuity_objects: "/api/v1/knowledge/continuity-objects",
  spine_schema_registry: "/api/v1/pipeline/schema-registry",
  user_roles: "/api/v1/workspace/user-roles",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Decode Base64 obfuscated table names at runtime (same pattern as client.ts).
 */
function decodeTable(name: string): string {
  try {
    if (/^[a-zA-Z0-9+/=]+$/.test(name) && name.length % 4 === 0 && name.length > 4) {
      const decoded = atob(name);
      if (/^[a-zA-Z0-9_]+$/.test(decoded)) {
        return decoded;
      }
    }
  } catch {
    // Not base64 encoded — use as-is
  }
  return name;
}

/**
 * Parse a route that may contain base query params (e.g. "/path?type=org").
 * Returns { path, baseParams }.
 */
function parseRoute(route: string): { path: string; baseParams: Record<string, string> } {
  const qIdx = route.indexOf("?");
  if (qIdx === -1) {
    return { path: route, baseParams: {} };
  }
  const path = route.substring(0, qIdx);
  const baseParams: Record<string, string> = {};
  const search = new URLSearchParams(route.substring(qIdx + 1));
  search.forEach((value, key) => {
    baseParams[key] = value;
  });
  return { path, baseParams };
}

// ─── Filter Types ────────────────────────────────────────────────────────────

interface Filter {
  column: string;
  operator: string;
  value: unknown;
}

interface OrderClause {
  column: string;
  ascending: boolean;
}

// ─── Query Builder ───────────────────────────────────────────────────────────

/**
 * QueryBuilder collects query parameters (select, filters, order, limit)
 * and resolves them into a single HTTP request when awaited (.then()).
 */
class QueryBuilder<T = any> implements PromiseLike<{ data: T | null; error: any }> {
  private _table: string;
  private _route: string;
  private _columns: string = "*";
  private _filters: Filter[] = [];
  private _orFilters: string[] = [];
  private _order: OrderClause | null = null;
  private _limit: number | null = null;
  private _single: boolean = false;

  // Write operation state
  private _method: "GET" | "POST" | "PATCH" = "GET";
  private _body: unknown = undefined;

  constructor(table: string, route: string) {
    this._table = table;
    this._route = route;
  }

  // ─── SELECT ────────────────────────────────────────────────────────────

  select(columns: string = "*"): QueryBuilder<T[]> {
    this._columns = columns;
    this._method = "GET";
    return this as unknown as QueryBuilder<T[]>;
  }

  // ─── WRITE OPERATIONS ──────────────────────────────────────────────────

  update(data: Partial<T>): QueryBuilder<T> {
    this._method = "PATCH";
    this._body = data;
    return this as unknown as QueryBuilder<T>;
  }

  insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T> {
    this._method = "POST";
    this._body = data;
    return this as unknown as QueryBuilder<T>;
  }

  upsert(data: Partial<T> | Partial<T>[]): QueryBuilder<T> {
    this._method = "POST";
    this._body = { _upsert: true, data };
    return this as unknown as QueryBuilder<T>;
  }

  // ─── FILTER CHAIN ──────────────────────────────────────────────────────

  eq(column: string, value: unknown): QueryBuilder<T> {
    this._filters.push({ column, operator: "eq", value });
    return this;
  }

  neq(column: string, value: unknown): QueryBuilder<T> {
    this._filters.push({ column, operator: "neq", value });
    return this;
  }

  gt(column: string, value: unknown): QueryBuilder<T> {
    this._filters.push({ column, operator: "gt", value });
    return this;
  }

  gte(column: string, value: unknown): QueryBuilder<T> {
    this._filters.push({ column, operator: "gte", value });
    return this;
  }

  lt(column: string, value: unknown): QueryBuilder<T> {
    this._filters.push({ column, operator: "lt", value });
    return this;
  }

  lte(column: string, value: unknown): QueryBuilder<T> {
    this._filters.push({ column, operator: "lte", value });
    return this;
  }

  like(column: string, value: string): QueryBuilder<T> {
    this._filters.push({ column, operator: "like", value });
    return this;
  }

  ilike(column: string, value: string): QueryBuilder<T> {
    this._filters.push({ column, operator: "ilike", value });
    return this;
  }

  is(column: string, value: unknown): QueryBuilder<T> {
    this._filters.push({ column, operator: "is", value });
    return this;
  }

  in(column: string, values: unknown[]): QueryBuilder<T> {
    this._filters.push({ column, operator: "in", value: values });
    return this;
  }

  or(filters: string): QueryBuilder<T> {
    this._orFilters.push(filters);
    return this;
  }

  // ─── ORDER & LIMIT ────────────────────────────────────────────────────

  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T> {
    this._order = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number): QueryBuilder<T> {
    this._limit = count;
    return this;
  }

  // ─── SINGLE ────────────────────────────────────────────────────────────

  single(): QueryBuilder<T> {
    this._single = true;
    this._limit = 1;
    return this as unknown as QueryBuilder<T>;
  }

  // ─── THENABLE (resolves the query chain into an HTTP request) ──────────

  then<TResult1 = { data: T | null; error: any }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: T | null; error: any }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<{ data: T | null; error: any } | TResult> {
    return this._execute().catch(onrejected);
  }

  // ─── PRIVATE: Execute HTTP request ─────────────────────────────────────

  private async _execute(): Promise<{ data: T | null; error: any }> {
    try {
      const { path, baseParams } = parseRoute(this._route);
      const params: Record<string, string> = { ...baseParams };

      // Add select columns
      if (this._columns && this._columns !== "*") {
        params["select"] = this._columns;
      }

      // Serialize filters as PostgREST-like query params
      for (const filter of this._filters) {
        if (filter.operator === "in") {
          // in operator: col=in.(val1,val2,val3)
          const values = (filter.value as unknown[]).map((v) => String(v)).join(",");
          params[filter.column] = `in.(${values})`;
        } else {
          params[filter.column] = `${filter.operator}.${filter.value}`;
        }
      }

      // Serialize OR filters
      if (this._orFilters.length > 0) {
        params["or"] = `(${this._orFilters.join(",")})`;
      }

      // Add order
      if (this._order) {
        params["order"] = `${this._order.column}.${this._order.ascending ? "asc" : "desc"}`;
      }

      // Add limit
      if (this._limit !== null) {
        params["limit"] = String(this._limit);
      }

      let result: any;

      if (this._method === "GET") {
        result = await gatewayClient.get(path, params);
      } else if (this._method === "POST") {
        // For POST with filters (upsert/insert with match), attach filters as query params
        result = await gatewayClient.post(path + this._buildQueryString(params), this._body);
      } else if (this._method === "PATCH") {
        // For PATCH, filters identify the target rows
        result = await gatewayClient.patch(path + this._buildQueryString(params), this._body);
      }

      // Normalize response shape
      const data = this._normalizeResponse(result);

      return { data, error: null };
    } catch (err: any) {
      return {
        data: null,
        error: {
          message: err.message || "Unknown error",
          status: err.status || 500,
          code: err.code || "GATEWAY_ERROR",
        },
      };
    }
  }

  /**
   * Build a query string from params (for write operations that need filters in URL).
   */
  private _buildQueryString(params: Record<string, string>): string {
    const entries = Object.entries(params);
    if (entries.length === 0) return "";
    const search = new URLSearchParams(entries);
    return `?${search.toString()}`;
  }

  /**
   * Normalize the response — gateway may return raw array or wrapped object.
   */
  private _normalizeResponse(result: any): T | null {
    // If the gateway returns { data: [...] }, unwrap
    const data = result?.data ?? result;

    if (this._single) {
      if (Array.isArray(data)) {
        return (data[0] ?? null) as T;
      }
      return data as T;
    }

    return data as T;
  }
}

// ─── Auth Adapter ────────────────────────────────────────────────────────────

/**
 * Auth object that delegates to AuthManager while maintaining the same
 * response shape as the Supabase auth client for backward compatibility.
 */
const authAdapter = {
  async getSession() {
    try {
      const session = await authManager.getSession();
      if (!session) {
        return { data: { session: null }, error: null };
      }
      return {
        data: {
          session: {
            access_token: session.accessToken,
            user: {
              id: session.user.id,
              email: session.user.email,
              user_metadata: {
                name: session.user.name || "",
                tenant_id: session.user.tenant_id,
              },
            },
          },
        },
        error: null,
      };
    } catch (err: any) {
      return { data: { session: null }, error: { message: err.message } };
    }
  },

  onAuthStateChange(cb: (event: string, session: any) => void) {
    const unsubscribe = authManager.onAuthStateChange(
      (event: AuthEvent, session: AuthSession | null) => {
        // Map to Supabase-like callback shape
        const mappedSession = session
          ? {
              access_token: session.accessToken,
              user: {
                id: session.user.id,
                email: session.user.email,
                user_metadata: {
                  name: session.user.name || "",
                  tenant_id: session.user.tenant_id,
                },
              },
            }
          : null;
        cb(event, mappedSession);
      }
    );
    // Return shape compatible with Supabase's onAuthStateChange
    return { data: { subscription: { unsubscribe } } };
  },

  async signInWithPassword(_credentials: { email: string; password: string }) {
    // Gateway uses OAuth redirect flow, not password-based auth.
    // Initiate OAuth flow instead.
    await authManager.signIn();
    return {
      data: { session: null, user: null },
      error: null,
    };
  },

  async signUp(_credentials: { email: string; password: string }) {
    // Redirect to OAuth signup
    await authManager.signIn();
    return {
      data: { user: null },
      error: null,
    };
  },

  async signOut() {
    await authManager.signOut();
    return { error: null };
  },

  async getUser() {
    try {
      const session = await authManager.getSession();
      if (!session) {
        return { data: { user: null }, error: null };
      }
      return {
        data: {
          user: {
            id: session.user.id,
            email: session.user.email,
            user_metadata: {
              name: session.user.name || "",
              tenant_id: session.user.tenant_id,
            },
          },
        },
        error: null,
      };
    } catch (err: any) {
      return { data: { user: null }, error: { message: err.message } };
    }
  },

  async refreshSession() {
    try {
      await authManager.refreshToken();
      const session = await authManager.getSession();
      return {
        data: {
          session: session
            ? {
                access_token: session.accessToken,
                user: {
                  id: session.user.id,
                  email: session.user.email,
                  user_metadata: {
                    name: session.user.name || "",
                    tenant_id: session.user.tenant_id,
                  },
                },
              }
            : null,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: { session: null }, error: { message: err.message } };
    }
  },
};

// ─── Channel Stub (SSE delegate) ─────────────────────────────────────────────

/**
 * Channel stub mimicking Supabase Realtime channel interface.
 * Delegates to SSE client when available (Task 6); for now returns a
 * chainable stub that components can call without breaking.
 */
function createChannelStub(name: string) {
  const handlers: Array<{ event: string; filter: any; callback: any }> = [];
  let sseConnection: { close(): void } | null = null;

  const channel = {
    on(event: string, filter: any, callback?: any) {
      // Support both 2-arg and 3-arg signatures
      const cb = callback || filter;
      handlers.push({ event, filter: callback ? filter : undefined, callback: cb });
      return channel;
    },
    subscribe() {
      // Attempt to connect via gateway SSE if available
      try {
        const path = `/stream/${name}`;
        sseConnection = gatewayClient.sse(path, (sseEvent) => {
          for (const handler of handlers) {
            try {
              handler.callback(sseEvent.data);
            } catch {
              // Don't let bad handlers break the channel
            }
          }
        });
      } catch {
        // SSE not available yet — silent degradation
        // Task 6 will wire the full SSE client
      }
      return channel;
    },
    unsubscribe() {
      if (sseConnection) {
        sseConnection.close();
        sseConnection = null;
      }
      return Promise.resolve();
    },
  };

  return channel;
}

// ─── SpineGatewayAdapter ─────────────────────────────────────────────────────

/**
 * The main adapter instance. Drop-in replacement for spineClient when
 * VITE_SPINE_PROVIDER=gateway-proxy.
 */
const spineGatewayAdapter = {
  /**
   * Create a query builder for the given table.
   * Decodes Base64-obfuscated table names and maps to CF Gateway routes.
   */
  from(table: string) {
    const physicalTable = decodeTable(table);
    const route = TABLE_ROUTE_MAP[physicalTable];

    if (!route) {
      console.warn(
        `[SpineGatewayAdapter] No route mapping for table "${physicalTable}". ` +
          `Falling back to /api/v1/data/${physicalTable}`
      );
      return new QueryBuilder(physicalTable, `/api/v1/data/${physicalTable}`);
    }

    return new QueryBuilder(physicalTable, route);
  },

  /**
   * Auth object — delegates to AuthManager, wraps responses in
   * Supabase-compatible shapes for backward compatibility.
   */
  auth: authAdapter,

  /**
   * Create a real-time channel (SSE-backed stub).
   * Full implementation comes with Task 6 (SSE client).
   */
  channel(name: string) {
    return createChannelStub(name);
  },

  /**
   * Remove/disconnect a channel.
   */
  removeChannel(channel: any) {
    if (channel && typeof channel.unsubscribe === "function") {
      return channel.unsubscribe();
    }
    return Promise.resolve();
  },
};

export { spineGatewayAdapter };
export default spineGatewayAdapter;
