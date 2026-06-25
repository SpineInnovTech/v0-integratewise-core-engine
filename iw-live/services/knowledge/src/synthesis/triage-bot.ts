/**
 * Synthesis Pipeline — Triage Bot
 *
 * Classifies raw CouchDB conversations into structured extraction candidates.
 * Operates on SessionEvents from the continuity layer.
 *
 * Design: This is the CLASSIFIER stage of the synthesis pipeline.
 * It does NOT auto-approve — it produces draft Understanding Objects
 * that flow to the Promotion Gate.
 *
 * Input:  SessionContainer + SessionEvent[] (CouchDB raw)
 * Output: TriageClassification[] → routed to continuity-object-factory
 */

// Note: These types are duplicated from continuity service to avoid cross-service
// TypeScript project boundary issues. Keep in sync with services/continuity/src/types.ts

type EventType =
  | "cognition.event"
  | "entity.event"
  | "governance.event"
  | "workflow.event"
  | "communication.event"
  | "continuity.event"
  | "system.event"
  | "decision.event";

type SessionStatus = "active" | "paused" | "closed" | "promoting";

type TriageOutcome =
  | "retain_ephemeral"
  | "summarize"
  | "promote_to_knowledge"
  | "attach_artifact"
  | "update_doctrine"
  | "generate_projection"
  | "archive";

interface SessionEvent {
  _id: string;
  type: EventType;
  session_id: string;
  user_id: string;
  account_id?: string;
  timestamp: string;
  source: string;
  content: unknown;
  metadata?: Record<string, unknown>;
  lineage?: {
    parent_event_id?: string;
    root_session_id?: string;
    promoted_to?: string;
  };
}

interface SessionContainer {
  _id: string;
  type: "session.container";
  tenant_id: string;
  user_id: string;
  account_id?: string;
  started_at: string;
  last_event_at: string;
  event_count: number;
  status: SessionStatus;
  tags: string[];
  summary?: string;
  triage_status?: "pending" | "in_review" | "approved" | "rejected";
  triage_outcome?: TriageOutcome;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TriageClassification {
  classificationId: string;
  sessionId: string;
  tenantId: string;
  outcome: TriageOutcome;
  confidence: number;
  reasoning: string;
  extractions: KnowledgeExtraction[];
  suggestedDomain: KnowledgeDomain;
  requiresHitl: boolean;
  createdAt: string;
}

export interface KnowledgeExtraction {
  type:
    | "insight"
    | "preference"
    | "fact"
    | "decision"
    | "action_item"
    | "relationship"
    | "doctrine_update";
  content: string;
  priority: "high" | "medium" | "low";
  category: string;
  confidence: number;
  sourceEvents: string[]; // event _ids
  entityRefs?: Array<{ entityType: string; entityId: string }>;
}

export type KnowledgeDomain =
  | "executive"
  | "product"
  | "engineering"
  | "design"
  | "ai-operations"
  | "business-operations"
  | "sales"
  | "marketing"
  | "customer-success"
  | "finance"
  | "research-and-continuity"
  | "infrastructure-and-security";

export interface TriageBotConfig {
  minConfidence: number;
  autoApproveThreshold: number;
  highPriorityDomains: KnowledgeDomain[];
  doctrineUpdateTriggers: string[];
}

// ─── Default Configuration ──────────────────────────────────────────────────

const DEFAULT_CONFIG: TriageBotConfig = {
  minConfidence: 0.6,
  autoApproveThreshold: 0.92,
  highPriorityDomains: ["executive", "finance", "infrastructure-and-security"],
  doctrineUpdateTriggers: ["policy", "standard", "principle", "doctrine", "rule"],
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Classify a session into extraction candidates.
 *
 * This is a PURE FUNCTION over session data. In production,
 * an AI model (Cloudflare Workers AI or OpenRouter) would
 * replace the heuristic classifyEvents() call.
 */
export function classifySession(
  session: SessionContainer,
  events: SessionEvent[],
  config: Partial<TriageBotConfig> = {}
): TriageClassification {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const now = new Date().toISOString();

  // 1. Heuristic / rule-based classification
  const extractions = classifyEvents(events, mergedConfig);

  // 2. Determine outcome based on extractions
  const hasHighConfidence = extractions.some(
    (e) => e.confidence >= mergedConfig.autoApproveThreshold
  );
  const hasDoctrineTrigger = extractions.some((e) =>
    mergedConfig.doctrineUpdateTriggers.some((t) => e.content.toLowerCase().includes(t))
  );

  let outcome: TriageOutcome = "retain_ephemeral";
  if (extractions.length === 0) {
    outcome = "archive";
  } else if (hasDoctrineTrigger) {
    outcome = "update_doctrine";
  } else if (hasHighConfidence && !mergedConfig.highPriorityDomains.includes(inferDomain(events))) {
    outcome = "promote_to_knowledge";
  } else {
    outcome = "summarize";
  }

  // 3. Determine if HITL is required
  const requiresHitl =
    !hasHighConfidence ||
    mergedConfig.highPriorityDomains.includes(inferDomain(events)) ||
    hasDoctrineTrigger;

  // 4. Compute overall confidence
  const avgConfidence =
    extractions.length > 0
      ? extractions.reduce((sum, e) => sum + e.confidence, 0) / extractions.length
      : 0;

  return {
    classificationId: `class:${session._id}:${Date.now().toString(36)}`,
    sessionId: session._id,
    tenantId: session.tenant_id,
    outcome,
    confidence: avgConfidence,
    reasoning: buildReasoning(session, extractions, outcome),
    extractions,
    suggestedDomain: inferDomain(events),
    requiresHitl,
    createdAt: now,
  };
}

/**
 * Batch classify multiple sessions (for cron / queue processing).
 */
export function classifySessions(
  sessions: Array<{ session: SessionContainer; events: SessionEvent[] }>,
  config?: Partial<TriageBotConfig>
): TriageClassification[] {
  return sessions.map(({ session, events }) => classifySession(session, events, config));
}

// ─── Event Classification (Heuristic) ───────────────────────────────────────

function classifyEvents(events: SessionEvent[], config: TriageBotConfig): KnowledgeExtraction[] {
  const extractions: KnowledgeExtraction[] = [];

  for (const event of events) {
    const content = stringifyContent(event.content);
    if (!content || content.length < 10) continue;

    // Decision detection
    if (content.match(/\b(decided?|agreed?|concluded?|resolved?|voted?)\b/i)) {
      extractions.push({
        type: "decision",
        content: content.slice(0, 500),
        priority: "high",
        category: "decision",
        confidence: 0.78,
        sourceEvents: [event._id],
      });
    }

    // Action item detection
    if (content.match(/\b(action item|todo|task|follow.up|will do|assigned to)\b/i)) {
      extractions.push({
        type: "action_item",
        content: content.slice(0, 500),
        priority: "medium",
        category: "action",
        confidence: 0.72,
        sourceEvents: [event._id],
      });
    }

    // Insight detection
    if (content.match(/\b(insight|observation|pattern|trend|realized?|discovered?)\b/i)) {
      extractions.push({
        type: "insight",
        content: content.slice(0, 500),
        priority: "medium",
        category: "insight",
        confidence: 0.65,
        sourceEvents: [event._id],
      });
    }

    // Preference detection
    if (content.match(/\b(prefer|like|want|need|should|would be better)\b/i)) {
      extractions.push({
        type: "preference",
        content: content.slice(0, 500),
        priority: "low",
        category: "preference",
        confidence: 0.58,
        sourceEvents: [event._id],
      });
    }

    // Doctrine trigger detection
    if (config.doctrineUpdateTriggers.some((t) => content.toLowerCase().includes(t))) {
      extractions.push({
        type: "doctrine_update",
        content: content.slice(0, 500),
        priority: "high",
        category: "doctrine",
        confidence: 0.85,
        sourceEvents: [event._id],
      });
    }
  }

  // Deduplicate by content similarity (simple hash)
  const seen = new Set<string>();
  return extractions.filter((e) => {
    const hash = e.content.slice(0, 80).toLowerCase().replace(/\s+/g, " ");
    if (seen.has(hash)) return false;
    seen.add(hash);
    return e.confidence >= config.minConfidence;
  });
}

// ─── Domain Inference ───────────────────────────────────────────────────────

function inferDomain(events: SessionEvent[]): KnowledgeDomain {
  const text = events
    .map((e) => stringifyContent(e.content))
    .join(" ")
    .toLowerCase();

  const domainSignals: Array<{ domain: KnowledgeDomain; keywords: string[] }> = [
    { domain: "executive", keywords: ["strategy", "okr", "kpi", "board", "ceo", "vision"] },
    { domain: "product", keywords: ["feature", "roadmap", "user story", "product manager", "mvp"] },
    { domain: "engineering", keywords: ["code", "deploy", "bug", "pr", "github", "api"] },
    { domain: "design", keywords: ["ui", "ux", "figma", "prototype", "mockup", "user research"] },
    {
      domain: "ai-operations",
      keywords: ["model", "prompt", "llm", "training", "inference", "embedding"],
    },
    {
      domain: "business-operations",
      keywords: ["process", "workflow", "sop", "efficiency", "automation"],
    },
    { domain: "sales", keywords: ["deal", "pipeline", "quota", "prospect", "crm", "close"] },
    { domain: "marketing", keywords: ["campaign", "lead", "content", "seo", "brand", "funnel"] },
    {
      domain: "customer-success",
      keywords: ["onboard", "retention", "health score", "nps", "support"],
    },
    { domain: "finance", keywords: ["budget", "revenue", "forecast", "invoice", "arr", "mrr"] },
    {
      domain: "research-and-continuity",
      keywords: ["experiment", "hypothesis", "lineage", "audit", "knowledge"],
    },
    {
      domain: "infrastructure-and-security",
      keywords: ["server", "cloud", "security", "compliance", "gdpr", "soc2"],
    },
  ];

  let bestDomain: KnowledgeDomain = "business-operations";
  let bestScore = 0;

  for (const signal of domainSignals) {
    const score = signal.keywords.reduce((sum, kw) => sum + (text.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestDomain = signal.domain;
    }
  }

  return bestDomain;
}

// ─── Reasoning Builder ──────────────────────────────────────────────────────

function buildReasoning(
  session: SessionContainer,
  extractions: KnowledgeExtraction[],
  outcome: TriageOutcome
): string {
  const parts: string[] = [];
  parts.push(`Session ${session._id} has ${session.event_count} events.`);
  parts.push(`Extracted ${extractions.length} knowledge items.`);
  parts.push(
    `Highest confidence: ${Math.max(0, ...extractions.map((e) => e.confidence)).toFixed(2)}.`
  );
  parts.push(`Recommended outcome: ${outcome}.`);

  if (extractions.some((e) => e.type === "doctrine_update")) {
    parts.push("Doctrine update trigger detected — requires governance review.");
  }

  return parts.join(" ");
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function stringifyContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") {
    try {
      return JSON.stringify(content);
    } catch {
      return "";
    }
  }
  return String(content || "");
}
