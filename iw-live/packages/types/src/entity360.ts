/**
 * Entity 360 Types
 *
 * The unified data surface that Twin reads from.
 * Assembles: Spine Truth + Context + Signals + Memories + Goals
 *
 * PRINCIPLE: Twin ONLY reads from Entity360. Never from scattered sources.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE ENTITY 360 TYPE
// ═══════════════════════════════════════════════════════════════════════════════

/** The complete 360-degree view of any entity */
export interface Entity360 {
  /** Canonical spine ID */
  spine_id: string;
  /** Tenant isolation */
  tenant_id: string;
  /** Resolved entity type (e.g. "account", "contact") */
  entity_type: string;
  /** Display name (organic label) */
  display_name: string;

  // ── Layer 1: Spine Truth (structured, canonical) ──
  truth: Entity360Truth;

  // ── Layer 2: Context (Flow B - emails, docs, meetings) ──
  context: Entity360Context;

  // ── Layer 3: Signals (Flow A derived + Flow C AI) ──
  signals: Entity360Signals;

  // ── Layer 4: Memory (Flow C - AI extracted knowledge) ──
  memory: Entity360Memory;

  // ── Layer 5: Goals & Outcomes ──
  goals: Entity360Goals;

  // ── Layer 6: Relationships ──
  relationships: Entity360Relationships;

  // ── Metadata ──
  meta: Entity360Meta;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Layer 1: Canonical truth from Spine */
export interface Entity360Truth {
  /** Raw spine data (priority fields only) */
  data: Record<string, unknown>;
  /** Which schema table this came from */
  source_table: string;
  /** Source schema (e.g. "cs", "sales") */
  source_schema: string;
  /** Last updated timestamp */
  updated_at: string;
  /** Data freshness indicator */
  freshness: "live" | "recent" | "stale";
  /** Connected sources that feed this entity */
  sources: string[];
}

/** Layer 2: Unstructured context from Flow B */
export interface Entity360Context {
  /** Recent context extractions (emails, docs, meetings) */
  recent: Entity360ContextItem[];
  /** Total context items available */
  total_count: number;
}

export interface Entity360ContextItem {
  id: string;
  type: "email" | "document" | "meeting" | "note" | "conversation" | "file";
  title: string;
  summary?: string;
  source: string;
  created_at: string;
  /** Relevance score (0-1) */
  relevance?: number;
}

/** Layer 3: Active signals */
export interface Entity360Signals {
  /** Active signals for this entity */
  active: Entity360Signal[];
  /** Signal summary counts by severity */
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export interface Entity360Signal {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  /** Evidence chain - what data triggered this */
  evidence: Entity360Evidence[];
  confidence: number;
  created_at: string;
  /** Source: "pipeline" (Flow A), "ai" (Flow C), or "typescript_intelligence" (SignalAnalyzer) */
  generated_by: "pipeline" | "ai" | "typescript_intelligence";
}

export interface Entity360Evidence {
  type: "data_change" | "threshold" | "pattern" | "context" | "memory";
  source: string;
  description: string;
  value?: unknown;
  timestamp?: string;
}

/** Layer 4: AI-extracted memories */
export interface Entity360Memory {
  /** Recent memories relevant to this entity */
  recent: Entity360MemoryItem[];
  /** Total memories available */
  total_count: number;
}

export interface Entity360MemoryItem {
  id: string;
  type: "decision" | "preference" | "insight" | "action" | "rule" | "fact";
  content: string;
  confidence: number;
  source: "ai_extracted" | "user_confirmed" | "system";
  created_at: string;
  expires_at?: string;
}

/** Layer 5: Goals and outcomes */
export interface Entity360Goals {
  /** Active goals linked to this entity */
  active: Entity360Goal[];
  /** Overall goal health */
  health: "on_track" | "at_risk" | "off_track" | "no_goals";
}

export interface Entity360Goal {
  id: string;
  title: string;
  status: "active" | "completed" | "at_risk" | "paused";
  progress: number;
  target_date?: string;
  metrics?: Array<{ name: string; current: number; target: number }>;
}

/** Layer 6: Entity relationships */
export interface Entity360Relationships {
  /** Parent entity (e.g. account for a contact) */
  parent?: { spine_id: string; entity_type: string; display_name: string };
  /** Child entities */
  children: Array<{ spine_id: string; entity_type: string; display_name: string; count?: number }>;
  /** Related entities (same level) */
  related: Array<{ spine_id: string; entity_type: string; display_name: string; relation: string }>;
}

/** Metadata about the 360 assembly */
export interface Entity360Meta {
  /** When this 360 was assembled */
  assembled_at: string;
  /** Hydration bucket (B0-B7) */
  hydration_bucket: string;
  /** Department/domain context */
  department: string;
  /** Industry context */
  industry?: string;
  /** Schema version used */
  schema_version: string;
  /** Cache status */
  cache_hit: boolean;
  /** Assembly duration in ms */
  assembly_ms?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST / RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Request to get Entity 360 */
export interface Entity360Request {
  tenant_id: string;
  spine_id: string;
  /** Optional: limit which layers to fetch (default: all) */
  layers?: Array<"truth" | "context" | "signals" | "memory" | "goals" | "relationships">;
  /** Optional: max items per layer */
  limits?: {
    context?: number;
    signals?: number;
    memory?: number;
    relationships?: number;
  };
}

/** Response wrapper */
export interface Entity360Response {
  success: boolean;
  entity?: Entity360;
  error?: string;
}

/** Batch request for multiple entities */
export interface Entity360BatchRequest {
  tenant_id: string;
  spine_ids: string[];
  layers?: Array<"truth" | "context" | "signals" | "memory" | "goals" | "relationships">;
}

export interface Entity360BatchResponse {
  success: boolean;
  entities: Entity360[];
  errors: Array<{ spine_id: string; error: string }>;
}
