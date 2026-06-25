/**
 * Spine Vault — Encrypted D1 Storage Layer
 *
 * The spine_vault table is the ONLY place Spine entities persist in D1.
 * Structure is opaque: 4 columns (k, v, t, c) — no schema leaks.
 *
 * Pipeline writes sealed envelopes.
 * Gateway reads and decrypts on demand.
 * Nobody else can read the data — not even with D1 access.
 */

import {
  seal,
  unseal,
  sealBatch,
  unsealBatch,
  computeKey,
  computeTenantShard,
  importKey,
  type SpineEntity,
} from "./crypto";

// ─── D1 Table Management ────────────────────────────────────────────────────

const CREATE_VAULT_SQL = `
CREATE TABLE IF NOT EXISTS spine_vault (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL,
  t TEXT NOT NULL,
  c TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vault_t ON spine_vault(t);
CREATE INDEX IF NOT EXISTS idx_vault_tc ON spine_vault(t, c);
`;

/**
 * Ensure spine_vault table exists. Idempotent.
 */
export async function ensureVaultTable(db: D1Database): Promise<void> {
  await db.exec(CREATE_VAULT_SQL);
}

// ─── Write Operations (Pipeline only) ────────────────────────────────────────

/**
 * Write a single entity to the vault. Upsert by opaque key.
 */
export async function vaultWrite(
  db: D1Database,
  encryptionKey: string,
  entity: SpineEntity
): Promise<{ key: string; written: boolean }> {
  const key = await importKey(encryptionKey);
  const envelope = await seal(key, entity);

  await db
    .prepare(
      `INSERT INTO spine_vault (k, v, t, c)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(k) DO UPDATE SET v = ?2, c = ?4`
    )
    .bind(envelope.k, envelope.v, envelope.t, envelope.c)
    .run();

  return { key: envelope.k, written: true };
}

/**
 * Write a batch of entities. Returns count of successful writes.
 */
export async function vaultWriteBatch(
  db: D1Database,
  encryptionKey: string,
  entities: SpineEntity[]
): Promise<{ written: number; keys: string[] }> {
  const key = await importKey(encryptionKey);
  const envelopes = await sealBatch(key, entities);

  // D1 batch — all-or-nothing per batch
  const stmts = envelopes.map((env) =>
    db
      .prepare(
        `INSERT INTO spine_vault (k, v, t, c)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(k) DO UPDATE SET v = ?2, c = ?4`
      )
      .bind(env.k, env.v, env.t, env.c)
  );

  await db.batch(stmts);

  return { written: envelopes.length, keys: envelopes.map((e) => e.k) };
}

// ─── Read Operations (Gateway / authorized services only) ────────────────────

/**
 * Read a single entity by tenant + source + source_id.
 */
export async function vaultRead(
  db: D1Database,
  encryptionKey: string,
  tenantId: string,
  source: string,
  sourceId: string
): Promise<SpineEntity | null> {
  const key = await importKey(encryptionKey);
  const opaqueKey = await computeKey(key, tenantId, source, sourceId);

  const row = await db
    .prepare("SELECT v FROM spine_vault WHERE k = ?1")
    .bind(opaqueKey)
    .first<{ v: string }>();

  if (!row) return null;

  return unseal(key, { k: opaqueKey, v: row.v, t: "", c: "" });
}

/**
 * Read a single entity by its opaque key (when you already have it).
 */
export async function vaultReadByKey(
  db: D1Database,
  encryptionKey: string,
  opaqueKey: string
): Promise<SpineEntity | null> {
  const key = await importKey(encryptionKey);

  const row = await db
    .prepare("SELECT v FROM spine_vault WHERE k = ?1")
    .bind(opaqueKey)
    .first<{ v: string }>();

  if (!row) return null;

  return unseal(key, { k: opaqueKey, v: row.v, t: "", c: "" });
}

/**
 * List all entities for a tenant (decrypted). Paginated.
 */
export async function vaultListByTenant(
  db: D1Database,
  encryptionKey: string,
  tenantId: string,
  limit = 50,
  offset = 0
): Promise<SpineEntity[]> {
  const key = await importKey(encryptionKey);
  const tenantShard = await computeTenantShard(tenantId);

  const rows = await db
    .prepare("SELECT k, v, t, c FROM spine_vault WHERE t = ?1 ORDER BY c DESC LIMIT ?2 OFFSET ?3")
    .bind(tenantShard, limit, offset)
    .all<{ k: string; v: string; t: string; c: string }>();

  if (!rows.results || rows.results.length === 0) return [];

  return unsealBatch(key, rows.results);
}

/**
 * Count entities for a tenant.
 */
export async function vaultCount(db: D1Database, tenantId: string): Promise<number> {
  const tenantShard = await computeTenantShard(tenantId);

  const row = await db
    .prepare("SELECT COUNT(*) as cnt FROM spine_vault WHERE t = ?1")
    .bind(tenantShard)
    .first<{ cnt: number }>();

  return row?.cnt || 0;
}

/**
 * Delete a single entity by tenant + source + source_id.
 */
export async function vaultDelete(
  db: D1Database,
  encryptionKey: string,
  tenantId: string,
  source: string,
  sourceId: string
): Promise<boolean> {
  const key = await importKey(encryptionKey);
  const opaqueKey = await computeKey(key, tenantId, source, sourceId);

  const result = await db.prepare("DELETE FROM spine_vault WHERE k = ?1").bind(opaqueKey).run();

  return (result.meta?.changes || 0) > 0;
}

/**
 * Search entities by tenant (decrypt all, filter in-memory).
 * For large datasets this is expensive — use Vectorize for semantic search.
 * This is for structured exact-match queries only.
 */
export async function vaultSearch(
  db: D1Database,
  encryptionKey: string,
  tenantId: string,
  filter: {
    entity_type?: string;
    status?: string;
    name_contains?: string;
  },
  limit = 20
): Promise<SpineEntity[]> {
  // Fetch more than needed, filter after decrypt
  const all = await vaultListByTenant(db, encryptionKey, tenantId, limit * 3);

  let results = all;

  if (filter.entity_type) {
    results = results.filter((e) => e.entity_type === filter.entity_type);
  }
  if (filter.status) {
    results = results.filter((e) => e.status === filter.status);
  }
  if (filter.name_contains) {
    const q = filter.name_contains.toLowerCase();
    results = results.filter((e) => e.name.toLowerCase().includes(q));
  }

  return results.slice(0, limit);
}
