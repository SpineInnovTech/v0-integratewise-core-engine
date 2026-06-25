/**
 * Hermes Spine Memory — CouchDB HTTP Client
 *
 * Pure fetch-based client. Works in:
 * - Node.js (18+)
 * - Cloudflare Workers
 * - Browser (via proxy)
 *
 * Design decisions:
 * - Class-based for connection pooling semantics (one instance = one config)
 * - No heavy drivers (nano, pouchdb) to keep bundle small
 * - All methods return typed promises
 */

import type {
  CouchDbConfig,
  CouchDbResponse,
  MangoSelector,
  MangoQueryOptions,
  MangoQueryResult,
  ViewQueryOptions,
  ViewQueryResult,
} from "./types.js";

export class CouchDbClient {
  private config: CouchDbConfig;

  constructor(config: CouchDbConfig) {
    this.config = config;
  }

  // ─── Auth Helpers ─────────────────────────────────────────────────────────

  private authHeader(): string {
    const { username, password } = this.config;
    const creds =
      typeof btoa === "function"
        ? btoa(`${username}:${password}`)
        : Buffer.from(`${username}:${password}`).toString("base64");
    return `Basic ${creds}`;
  }

  private dbUrl(dbName: string): string {
    return `${this.config.url.replace(/\/$/, "")}/${encodeURIComponent(dbName)}`;
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`CouchDB ${init?.method || "GET"} failed: ${res.status} ${text}`);
    }

    // HEAD returns no body
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as unknown as T;
    }

    return res.json() as Promise<T>;
  }

  // ─── Database Management ──────────────────────────────────────────────────

  async ensureDatabase(dbName: string): Promise<void> {
    const url = this.dbUrl(dbName);
    const res = await fetch(url, {
      method: "PUT",
      headers: { Authorization: this.authHeader() },
    });

    if (!res.ok && res.status !== 412) {
      const text = await res.text().catch(() => "");
      throw new Error(`CouchDB create DB failed: ${res.status} ${text}`);
    }
  }

  async databaseExists(dbName: string): Promise<boolean> {
    const res = await fetch(this.dbUrl(dbName), {
      method: "HEAD",
      headers: { Authorization: this.authHeader() },
    });
    return res.ok;
  }

  async deleteDatabase(dbName: string): Promise<void> {
    await this.fetchJson<unknown>(this.dbUrl(dbName), { method: "DELETE" });
  }

  async listDatabases(): Promise<string[]> {
    return this.fetchJson<string[]>(`${this.config.url.replace(/\/$/, "")}/_all_dbs`);
  }

  // ─── Document CRUD ────────────────────────────────────────────────────────

  async putDoc<T extends { _id: string; _rev?: string }>(
    dbName: string,
    doc: T
  ): Promise<CouchDbResponse> {
    const encodedId = encodeURIComponent(doc._id);
    return this.fetchJson<CouchDbResponse>(`${this.dbUrl(dbName)}/${encodedId}`, {
      method: "PUT",
      body: JSON.stringify(doc),
    });
  }

  async getDoc<T>(dbName: string, docId: string): Promise<T | null> {
    const res = await fetch(`${this.dbUrl(dbName)}/${encodeURIComponent(docId)}`, {
      headers: { Authorization: this.authHeader() },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`CouchDB GET failed: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async deleteDoc(dbName: string, docId: string, rev: string): Promise<void> {
    const res = await fetch(
      `${this.dbUrl(dbName)}/${encodeURIComponent(docId)}?rev=${encodeURIComponent(rev)}`,
      {
        method: "DELETE",
        headers: { Authorization: this.authHeader() },
      }
    );
    if (!res.ok && res.status !== 404) {
      throw new Error(`CouchDB DELETE failed: ${res.status}`);
    }
  }

  // ─── Bulk Operations ──────────────────────────────────────────────────────

  async bulkDocs<T extends { _id: string }>(
    dbName: string,
    docs: T[]
  ): Promise<Array<{ id: string; rev?: string; ok: boolean; error?: string }>> {
    return this.fetchJson<Array<{ id: string; rev?: string; ok: boolean; error?: string }>>(
      `${this.dbUrl(dbName)}/_bulk_docs`,
      {
        method: "POST",
        body: JSON.stringify({ docs }),
      }
    );
  }

  // ─── Mango Queries ────────────────────────────────────────────────────────

  async findDocs<T>(
    dbName: string,
    selector: MangoSelector,
    opts?: MangoQueryOptions
  ): Promise<MangoQueryResult<T>> {
    const body: Record<string, unknown> = { selector };
    if (opts?.sort) body.sort = opts.sort;
    if (opts?.limit) body.limit = opts.limit;
    if (opts?.skip) body.skip = opts.skip;
    if (opts?.use_index) body.use_index = opts.use_index;
    if (opts?.fields) body.fields = opts.fields;
    if (opts?.bookmark) body.bookmark = opts.bookmark;

    return this.fetchJson<MangoQueryResult<T>>(`${this.dbUrl(dbName)}/_find`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // ─── Views ────────────────────────────────────────────────────────────────

  async queryView<T>(
    dbName: string,
    designDoc: string,
    viewName: string,
    opts?: ViewQueryOptions
  ): Promise<ViewQueryResult<T>> {
    const params = new URLSearchParams();
    if (opts?.startkey !== undefined) params.set("startkey", JSON.stringify(opts.startkey));
    if (opts?.endkey !== undefined) params.set("endkey", JSON.stringify(opts.endkey));
    if (opts?.key !== undefined) params.set("key", JSON.stringify(opts.key));
    if (opts?.keys !== undefined) params.set("keys", JSON.stringify(opts.keys));
    if (opts?.descending !== undefined) params.set("descending", String(opts.descending));
    if (opts?.limit !== undefined) params.set("limit", String(opts.limit));
    if (opts?.skip !== undefined) params.set("skip", String(opts.skip));
    if (opts?.include_docs !== undefined) params.set("include_docs", String(opts.include_docs));

    return this.fetchJson<ViewQueryResult<T>>(
      `${this.dbUrl(dbName)}/_design/${designDoc}/_view/${viewName}?${params}`
    );
  }

  // ─── Index Management ─────────────────────────────────────────────────────

  async createIndex(
    dbName: string,
    name: string,
    fields: Record<string, "asc" | "desc">[],
    opts?: { partial_filter_selector?: MangoSelector }
  ): Promise<void> {
    const body: Record<string, unknown> = {
      index: { fields },
      name,
      type: "json",
    };
    if (opts?.partial_filter_selector) {
      body.partial_filter_selector = opts.partial_filter_selector;
    }

    const res = await fetch(`${this.dbUrl(dbName)}/_index`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok && res.status !== 200) {
      const text = await res.text().catch(() => "");
      throw new Error(`CouchDB index create failed: ${res.status} ${text}`);
    }
  }

  // ─── Design Doc Management ────────────────────────────────────────────────

  async getDesignDoc(dbName: string, docId: string): Promise<unknown | null> {
    return this.getDoc<unknown>(dbName, docId);
  }

  async putDesignDoc(dbName: string, docId: string, doc: unknown): Promise<CouchDbResponse> {
    return this.putDoc(dbName, { _id: docId, ...(doc as any) });
  }

  // ─── Info ─────────────────────────────────────────────────────────────────

  async dbInfo(dbName: string): Promise<{
    db_name: string;
    doc_count: number;
    doc_del_count: number;
    update_seq: number;
    purge_seq: number;
    compact_running: boolean;
    disk_size: number;
    instance_start_time: string;
  }> {
    return this.fetchJson(this.dbUrl(dbName));
  }
}
