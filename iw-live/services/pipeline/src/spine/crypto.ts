/**
 * Spine Vault Cryptography — AES-256-GCM Application-Layer Encryption
 *
 * The Spine schema in D1 is stored as opaque encrypted blobs.
 * Even with direct D1 access, the structure is invisible:
 * - No column names reveal entity shape
 * - No plaintext entity types, names, or fields
 * - Tenant IDs are hashed (can't reverse to know who)
 * - The entire entity is sealed as one envelope
 *
 * Only services holding SPINE_ENCRYPTION_KEY can read/write.
 * Key lives in Cloudflare Secrets Store — never in code, never in env files.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SpineEntity {
  id: string;
  tenant_id: string;
  entity_type: string;
  name: string;
  source: string;
  source_id: string;
  health_score?: number;
  health_trend?: string;
  arr?: number;
  tier?: string;
  status?: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SealedEnvelope {
  /** Opaque key — HMAC of tenant_id + source + source_id */
  k: string;
  /** Encrypted blob — base64 encoded (IV + ciphertext + tag) */
  v: string;
  /** Tenant shard — SHA-256 of tenant_id (for index queries, not reversible) */
  t: string;
  /** Timestamp */
  c: string;
}

// ─── Key Derivation ──────────────────────────────────────────────────────────

/**
 * Import the raw encryption key from Cloudflare Secrets Store.
 * The key must be 32 bytes (256 bits) base64-encoded.
 */
export async function importKey(rawKeyBase64: string): Promise<CryptoKey> {
  const keyBytes = Uint8Array.from(atob(rawKeyBase64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Generate a new 256-bit key (for initial setup only — run once, store in Secrets).
 */
export async function generateKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...key));
}

// ─── Hashing (one-way, for keys and tenant shards) ───────────────────────────

/**
 * HMAC-SHA256 for deterministic opaque key generation.
 * Used to create the `k` field — unique per entity but unreversible.
 */
async function hmacKey(secret: CryptoKey, data: string): Promise<string> {
  const enc = new TextEncoder();
  // Derive an HMAC key from the AES key material
  const hmacKeyMaterial = await crypto.subtle.importKey(
    "raw",
    await crypto.subtle.exportKey("raw", secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", hmacKeyMaterial, enc.encode(data));
  return bufToHex(new Uint8Array(sig));
}

/**
 * SHA-256 hash for tenant shard (index-safe, not reversible).
 */
async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return bufToHex(new Uint8Array(hash));
}

// ─── Encrypt / Decrypt ───────────────────────────────────────────────────────

/**
 * Seal an entity into an encrypted envelope.
 * The entire entity (all fields, all data) becomes one opaque blob.
 */
export async function seal(key: CryptoKey, entity: SpineEntity): Promise<SealedEnvelope> {
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(entity));

  // 96-bit random IV (recommended for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    plaintext
  );

  // Combine: IV (12 bytes) + ciphertext+tag
  const sealed = new Uint8Array(iv.length + ciphertext.byteLength);
  sealed.set(iv, 0);
  sealed.set(new Uint8Array(ciphertext), iv.length);

  // Generate opaque key from tenant + source identity
  const opaqueKey = await hmacKey(key, `${entity.tenant_id}:${entity.source}:${entity.source_id}`);
  const tenantShard = await sha256(entity.tenant_id);

  return {
    k: opaqueKey,
    v: bufToBase64(sealed),
    t: tenantShard,
    c: entity.updated_at || new Date().toISOString(),
  };
}

/**
 * Unseal an encrypted envelope back into a SpineEntity.
 */
export async function unseal(key: CryptoKey, envelope: SealedEnvelope): Promise<SpineEntity> {
  const sealed = base64ToBuf(envelope.v);

  // Extract IV (first 12 bytes) and ciphertext+tag (rest)
  const iv = sealed.slice(0, 12);
  const ciphertext = sealed.slice(12);

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(plaintext)) as SpineEntity;
}

/**
 * Compute the opaque key for a given entity identity (for lookups).
 * Same deterministic HMAC as seal() uses.
 */
export async function computeKey(
  key: CryptoKey,
  tenantId: string,
  source: string,
  sourceId: string
): Promise<string> {
  return hmacKey(key, `${tenantId}:${source}:${sourceId}`);
}

/**
 * Compute tenant shard hash (for filtered queries).
 */
export async function computeTenantShard(tenantId: string): Promise<string> {
  return sha256(tenantId);
}

// ─── Batch Operations ────────────────────────────────────────────────────────

/**
 * Seal multiple entities in parallel.
 */
export async function sealBatch(
  key: CryptoKey,
  entities: SpineEntity[]
): Promise<SealedEnvelope[]> {
  return Promise.all(entities.map((e) => seal(key, e)));
}

/**
 * Unseal multiple envelopes in parallel.
 */
export async function unsealBatch(
  key: CryptoKey,
  envelopes: SealedEnvelope[]
): Promise<SpineEntity[]> {
  return Promise.all(envelopes.map((e) => unseal(key, e)));
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufToBase64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}

function base64ToBuf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
