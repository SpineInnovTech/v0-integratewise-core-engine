/**
 * Identity Mapper Service
 *
 * Entity deduplication and cross-source identity resolution.
 * Uses fuzzy matching with signature generation for entity unification.
 *
 * @integratewise/normalizer
 */

export interface Entity {
  id: string;
  source: string;
  sourceId: string;
  type: EntityType;
  attributes: Record<string, unknown>;
  canonicalId?: string;
  signature?: string;
  confidence?: number;
  mergedFrom?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EntityType =
  | "person"
  | "company"
  | "deal"
  | "ticket"
  | "project"
  | "document"
  | "contact"
  | "account";

export interface MatchResult {
  entity: Entity;
  matchedEntity: Entity;
  confidence: number;
  matchedFields: string[];
  strategy: MatchStrategy;
}

export type MatchStrategy = "exact" | "fuzzy" | "email" | "domain" | "phone" | "signature";

export interface MatchConfig {
  /** Minimum confidence score to consider a match */
  minConfidence: number;
  /** Field weights for fuzzy matching */
  fieldWeights: Record<string, number>;
  /** Enable automatic merging above this threshold */
  autoMergeThreshold: number;
}

const DEFAULT_CONFIG: MatchConfig = {
  minConfidence: 0.7,
  autoMergeThreshold: 0.95,
  fieldWeights: {
    email: 1.0,
    domain: 0.9,
    phone: 0.8,
    name: 0.6,
    title: 0.3,
    address: 0.5,
  },
};

/**
 * Generate a normalized signature for entity matching
 */
export function generateSignature(type: EntityType, attributes: Record<string, unknown>): string {
  const parts: string[] = [type];

  // Extract key identifying fields
  const email = normalizeEmail(attributes.email as string);
  const name = normalizeName(attributes.name as string);
  const domain = extractDomain(attributes.email as string, attributes.website as string);
  const phone = normalizePhone(attributes.phone as string);

  if (email) parts.push(`email:${email}`);
  if (domain) parts.push(`domain:${domain}`);
  if (phone) parts.push(`phone:${phone}`);
  if (name) parts.push(`name:${name}`);

  // Create hash of sorted parts
  const combined = parts.sort().join("|").toLowerCase();
  return hashString(combined);
}

/**
 * Normalize email for comparison
 */
export function normalizeEmail(email?: string): string | null {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  // Remove plus addressing
  const [local, domain] = normalized.split("@");
  if (!domain) return null;
  const cleanLocal = local.split("+")[0];
  return `${cleanLocal}@${domain}`;
}

/**
 * Normalize name for comparison
 */
export function normalizeName(name?: string): string | null {
  if (!name) return null;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize phone number
 */
export function normalizePhone(phone?: string): string | null {
  if (!phone) return null;
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return null;
  // Take last 10 digits for comparison
  return digits.slice(-10);
}

/**
 * Extract domain from email or website
 */
export function extractDomain(email?: string, website?: string): string | null {
  if (email) {
    const [, domain] = email.split("@");
    if (domain) {
      // Skip common email providers
      const commonProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
      if (!commonProviders.includes(domain.toLowerCase())) {
        return domain.toLowerCase();
      }
    }
  }
  if (website) {
    try {
      const url = new URL(website.startsWith("http") ? website : `https://${website}`);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Simple hash function for signatures
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Calculate similarity between two strings (Levenshtein-based)
 */
export function calculateSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  const longerLength = longer.length;

  if (longerLength === 0) return 1;

  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longerLength - distance) / longerLength;
}

/**
 * Levenshtein distance implementation
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate match confidence between two entities
 */
export function calculateMatchConfidence(
  a: Entity,
  b: Entity,
  config: MatchConfig = DEFAULT_CONFIG
): { confidence: number; matchedFields: string[]; strategy: MatchStrategy } {
  if (a.type !== b.type) {
    return { confidence: 0, matchedFields: [], strategy: "exact" };
  }

  const matchedFields: string[] = [];
  let totalWeight = 0;
  let matchedWeight = 0;

  // Check signature match first (high confidence)
  if (a.signature && b.signature && a.signature === b.signature) {
    return { confidence: 1.0, matchedFields: ["signature"], strategy: "signature" };
  }

  // Email match (very reliable)
  const emailA = normalizeEmail(a.attributes.email as string);
  const emailB = normalizeEmail(b.attributes.email as string);
  if (emailA && emailB) {
    totalWeight += config.fieldWeights.email;
    if (emailA === emailB) {
      matchedWeight += config.fieldWeights.email;
      matchedFields.push("email");
    }
  }

  // Domain match (good for companies)
  const domainA = extractDomain(a.attributes.email as string, a.attributes.website as string);
  const domainB = extractDomain(b.attributes.email as string, b.attributes.website as string);
  if (domainA && domainB) {
    totalWeight += config.fieldWeights.domain;
    if (domainA === domainB) {
      matchedWeight += config.fieldWeights.domain;
      matchedFields.push("domain");
    }
  }

  // Phone match
  const phoneA = normalizePhone(a.attributes.phone as string);
  const phoneB = normalizePhone(b.attributes.phone as string);
  if (phoneA && phoneB) {
    totalWeight += config.fieldWeights.phone;
    if (phoneA === phoneB) {
      matchedWeight += config.fieldWeights.phone;
      matchedFields.push("phone");
    }
  }

  // Name similarity (fuzzy)
  const nameA = normalizeName(a.attributes.name as string);
  const nameB = normalizeName(b.attributes.name as string);
  if (nameA && nameB) {
    totalWeight += config.fieldWeights.name;
    const nameSimilarity = calculateSimilarity(nameA, nameB);
    if (nameSimilarity > 0.8) {
      matchedWeight += config.fieldWeights.name * nameSimilarity;
      matchedFields.push("name");
    }
  }

  const confidence = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  const strategy: MatchStrategy = matchedFields.includes("email")
    ? "email"
    : matchedFields.includes("domain")
      ? "domain"
      : matchedFields.includes("phone")
        ? "phone"
        : matchedFields.length > 0
          ? "fuzzy"
          : "exact";

  return { confidence, matchedFields, strategy };
}

/**
 * Merge two entities into a canonical entity
 */
export function mergeEntities(primary: Entity, secondary: Entity): Entity {
  const merged: Entity = {
    ...primary,
    canonicalId: primary.canonicalId || primary.id,
    mergedFrom: [...(primary.mergedFrom || []), secondary.id, ...(secondary.mergedFrom || [])],
    attributes: {
      ...secondary.attributes,
      ...primary.attributes, // Primary takes precedence
    },
    updatedAt: new Date(),
  };

  // Recalculate signature
  merged.signature = generateSignature(merged.type, merged.attributes);

  return merged;
}

/**
 * SQL queries for identity mapping
 */
export const identityQueries = {
  /** Find potential matches */
  findMatches: `
    SELECT * FROM canonical_entities
    WHERE type = $1
      AND tenant_id = $2
      AND (
        signature = $3
        OR LOWER(attributes->>'email') = LOWER($4)
        OR attributes->>'domain' = $5
      )
    LIMIT 10
  `,

  /** Insert or update canonical entity */
  upsertCanonical: `
    INSERT INTO canonical_entities (id, type, source, source_id, attributes, signature, tenant_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (source, source_id, tenant_id) 
    DO UPDATE SET 
      attributes = canonical_entities.attributes || EXCLUDED.attributes,
      signature = EXCLUDED.signature,
      updated_at = NOW()
    RETURNING *
  `,

  /** Record entity merge */
  recordMerge: `
    INSERT INTO entity_merges (canonical_id, merged_id, confidence, strategy, tenant_id)
    VALUES ($1, $2, $3, $4, $5)
  `,

  /** Get merge history */
  getMergeHistory: `
    SELECT * FROM entity_merges
    WHERE canonical_id = $1 OR merged_id = $1
    ORDER BY created_at DESC
  `,

  /** Unmerge entities */
  unmerge: `
    DELETE FROM entity_merges WHERE id = $1
  `,
};

/**
 * SQL migration for identity mapping tables
 */
export const IDENTITY_MIGRATIONS = `
-- Canonical Entities Table
CREATE TABLE IF NOT EXISTS canonical_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}',
  signature TEXT,
  canonical_id UUID REFERENCES canonical_entities(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id, tenant_id)
);

-- Entity Merges Table
CREATE TABLE IF NOT EXISTS entity_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id UUID NOT NULL REFERENCES canonical_entities(id),
  merged_id UUID NOT NULL REFERENCES canonical_entities(id),
  confidence NUMERIC(3,2) NOT NULL,
  strategy TEXT NOT NULL,
  merged_by UUID REFERENCES profiles(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(canonical_id, merged_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_canonical_signature ON canonical_entities(signature);
CREATE INDEX IF NOT EXISTS idx_canonical_type_tenant ON canonical_entities(type, tenant_id);
CREATE INDEX IF NOT EXISTS idx_canonical_source ON canonical_entities(source, tenant_id);
CREATE INDEX IF NOT EXISTS idx_merges_canonical ON entity_merges(canonical_id);
`;
