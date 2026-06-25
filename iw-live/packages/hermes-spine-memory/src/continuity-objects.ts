/**
 * Hermes Spine Memory — Continuity Object CRUD
 *
 * Understanding Objects stored in CouchDB:
 * - operational-realization
 * - governance-outcome
 * - deployment-lineage
 * - customer-continuity-state
 * - organizational-synthesis
 * - continuity-transition
 *
 * Each object carries:
 *   id, type, domain, content, lineage[], references[],
 *   createdAt, updatedAt, scope, userId, tenantId?, schemaVersion
 */

import { CouchDbClient } from "./client.js";
import type {
  ContinuityObject,
  ContinuityObjectType,
  LineageEntry,
  MemoryScope,
  ObjectReference,
} from "./types.js";
import { buildDbName } from "./namespaces.js";

export const CURRENT_SCHEMA_VERSION = "2025-05-19";

// ─── ID Generation ──────────────────────────────────────────────────────────

export function generateObjectId(type: ContinuityObjectType): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `obj:${type}:${ts}-${rand}`;
}

// ─── Object Factory ─────────────────────────────────────────────────────────

export interface CreateObjectInput {
  type: ContinuityObjectType;
  domain: string;
  content: unknown;
  userId: string;
  scope: MemoryScope;
  tenantId?: string;
  lineage?: LineageEntry[];
  references?: ObjectReference[];
  tags?: string[];
}

export function createContinuityObject(input: CreateObjectInput): ContinuityObject {
  const now = new Date().toISOString();
  return {
    _id: generateObjectId(input.type),
    type: input.type,
    domain: input.domain,
    content: input.content,
    userId: input.userId,
    scope: input.scope,
    tenantId: input.tenantId,
    lineage: input.lineage || [],
    references: input.references || [],
    tags: input.tags || [],
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── CRUD Operations ────────────────────────────────────────────────────────

export class ContinuityObjectStore {
  constructor(private client: CouchDbClient) {}

  private dbName(scope: MemoryScope, subjectId: string): string {
    return buildDbName(scope, subjectId);
  }

  /** Ensure the target database and indexes exist */
  async ensureStore(scope: MemoryScope, subjectId: string): Promise<void> {
    const db = this.dbName(scope, subjectId);
    await this.client.ensureDatabase(db);

    // Core indexes for continuity object queries
    await this.client.createIndex(db, "idx-type-domain", [{ type: "asc" }, { domain: "asc" }]);

    await this.client.createIndex(db, "idx-updated", [{ updatedAt: "desc" }]);

    await this.client.createIndex(db, "idx-user-scope", [{ userId: "asc" }, { scope: "asc" }]);

    await this.client.createIndex(db, "idx-references", [{ "references.refId": "asc" }]);
  }

  /** Create a new continuity object */
  async create(input: CreateObjectInput): Promise<{ id: string; rev: string }> {
    const db = this.dbName(
      input.scope,
      input.scope === "personal" ? input.userId : input.tenantId!
    );
    await this.ensureStore(
      input.scope,
      input.scope === "personal" ? input.userId : input.tenantId!
    );

    const doc = createContinuityObject(input);
    const res = await this.client.putDoc(db, doc);
    return { id: res.id, rev: res.rev };
  }

  /** Read a continuity object by ID */
  async read(
    scope: MemoryScope,
    subjectId: string,
    objectId: string
  ): Promise<ContinuityObject | null> {
    const db = this.dbName(scope, subjectId);
    return this.client.getDoc<ContinuityObject>(db, objectId);
  }

  /** Update an existing continuity object (preserves lineage, merges references) */
  async update(
    scope: MemoryScope,
    subjectId: string,
    objectId: string,
    updates: Partial<Pick<ContinuityObject, "content" | "domain" | "references" | "tags">>
  ): Promise<{ id: string; rev: string }> {
    const db = this.dbName(scope, subjectId);
    const existing = await this.client.getDoc<ContinuityObject>(db, objectId);
    if (!existing) {
      throw new Error(`Continuity object not found: ${objectId}`);
    }

    const updated: ContinuityObject = {
      ...existing,
      ...updates,
      references: updates.references
        ? [...existing.references, ...updates.references]
        : existing.references,
      updatedAt: new Date().toISOString(),
    };

    const res = await this.client.putDoc(db, updated);
    return { id: res.id, rev: res.rev };
  }

  /** Append a lineage entry to an existing object */
  async appendLineage(
    scope: MemoryScope,
    subjectId: string,
    objectId: string,
    entry: LineageEntry
  ): Promise<{ id: string; rev: string }> {
    const db = this.dbName(scope, subjectId);
    const existing = await this.client.getDoc<ContinuityObject>(db, objectId);
    if (!existing) {
      throw new Error(`Continuity object not found: ${objectId}`);
    }

    const updated: ContinuityObject = {
      ...existing,
      lineage: [...existing.lineage, entry],
      updatedAt: new Date().toISOString(),
    };

    const res = await this.client.putDoc(db, updated);
    return { id: res.id, rev: res.rev };
  }

  /** Soft-delete a continuity object */
  async delete(scope: MemoryScope, subjectId: string, objectId: string): Promise<void> {
    const db = this.dbName(scope, subjectId);
    const existing = await this.client.getDoc<ContinuityObject>(db, objectId);
    if (!existing) return;

    await this.client.deleteDoc(db, objectId, existing._rev!);
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  /** List objects by type and optional domain */
  async listByType(
    scope: MemoryScope,
    subjectId: string,
    type: ContinuityObjectType,
    opts?: { domain?: string; limit?: number; skip?: number }
  ): Promise<ContinuityObject[]> {
    const db = this.dbName(scope, subjectId);
    const selector: Record<string, unknown> = { type };
    if (opts?.domain) selector.domain = opts.domain;

    const result = await this.client.findDocs<ContinuityObject>(db, selector, {
      sort: [{ updatedAt: "desc" }],
      limit: opts?.limit ?? 50,
      skip: opts?.skip ?? 0,
    });

    return result.docs;
  }

  /** List objects referencing a specific entity/document/session */
  async listByReference(
    scope: MemoryScope,
    subjectId: string,
    refType: ObjectReference["refType"],
    refId: string,
    opts?: { limit?: number }
  ): Promise<ContinuityObject[]> {
    const db = this.dbName(scope, subjectId);
    const result = await this.client.findDocs<ContinuityObject>(
      db,
      {
        references: {
          $elemMatch: { refType, refId },
        },
      },
      {
        sort: [{ updatedAt: "desc" }],
        limit: opts?.limit ?? 50,
      }
    );

    return result.docs;
  }

  /** Full-text-ish search on object content (CouchDB Mango $regex) */
  async search(
    scope: MemoryScope,
    subjectId: string,
    q: string,
    opts?: { limit?: number; fields?: string[] }
  ): Promise<ContinuityObject[]> {
    const db = this.dbName(scope, subjectId);
    const result = await this.client.findDocs<ContinuityObject>(
      db,
      {
        $or: [{ domain: { $regex: `(?i)${q}` } }, { content: { $regex: `(?i)${q}` } }],
      },
      {
        sort: [{ updatedAt: "desc" }],
        limit: opts?.limit ?? 20,
        fields: opts?.fields,
      }
    );

    return result.docs;
  }

  /** List recently updated objects across all types */
  async recent(
    scope: MemoryScope,
    subjectId: string,
    opts?: { limit?: number; since?: string }
  ): Promise<ContinuityObject[]> {
    const db = this.dbName(scope, subjectId);
    const selector: Record<string, unknown> = {};
    if (opts?.since) {
      selector.updatedAt = { $gte: opts.since };
    }

    const result = await this.client.findDocs<ContinuityObject>(db, selector, {
      sort: [{ updatedAt: "desc" }],
      limit: opts?.limit ?? 20,
    });

    return result.docs;
  }
}
