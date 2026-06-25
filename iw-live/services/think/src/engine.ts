import { fuseSources, persistEvidenceRefs, type FusedSources } from "./fusion";
import { createProposedActions, type ProposedAction } from "./actions";
import { generateNarrative, type Narrative } from "./narrative";
import { ContinuityLedger } from "./continuity";

// Helper to generate UUID for correlation
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Structured logging with correlation context
function logWithContext(
  correlationId: string,
  level: "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>
): void {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    correlation_id: correlationId,
    service: "think-engine",
    message,
    ...data,
  };
  console[level](JSON.stringify(log));
}

export interface ProcessEventResult {
  status: "success" | "no_match" | "error";
  insights?: any[]; // AI-generated insights (Flow C) - go to Knowledge triage, NOT Spine
  actions?: ProposedAction[]; // Action proposals - go to Govern/Act
  narrative?: Narrative;
  correlation_id?: string;
}

export interface ProcessEventOptions {
  correlationId?: string;
}

/** Optional: (tenantId) => allowed entity types from tenant_spine_config. When provided, proposals are only created for allowed entity types. */
export type GetAllowedEntityTypesFn = (tenantId: string) => Promise<Set<string> | null>;
export interface KnowledgeReadPolicy {
  includeKnowledgeUI: boolean;
  approvedOnly: boolean;
}
/** Optional: (tenantId) => whether Flow C is enabled and whether reads must stay in approved compounding memory. */
export type GetKnowledgeReadPolicyFn = (tenantId: string) => Promise<KnowledgeReadPolicy>;

/**
 * SignalEngine - AI Reasoning Engine
 *
 * KT NOTE COMPLIANCE:
 * - This engine generates AI insights (Flow C) which must NEVER write directly to Spine
 * - AI insights are routed to Knowledge triage → approval → Knowledge UI
 * - Only action proposals are created, which go through Govern → Act → re-ingestion
 * - Data-derived signals (Flow A) are created by the pipeline/normalizer, not this engine
 */
export class SignalEngine {
  private db: D1Database;
  private knowledge?: Fetcher;
  private agents?: Fetcher;
  private continuity: ContinuityLedger;
  private getAllowedEntityTypes?: GetAllowedEntityTypesFn;
  private getKnowledgeReadPolicy?: GetKnowledgeReadPolicyFn;

  constructor(
    db: D1Database,
    knowledge?: Fetcher,
    agents?: Fetcher,
    govern?: Fetcher,
    getAllowedEntityTypes?: GetAllowedEntityTypesFn,
    getKnowledgeReadPolicy?: GetKnowledgeReadPolicyFn
  ) {
    this.db = db;
    this.knowledge = knowledge;
    this.agents = agents;
    this.continuity = new ContinuityLedger(db, govern);
    this.getAllowedEntityTypes = getAllowedEntityTypes;
    this.getKnowledgeReadPolicy = getKnowledgeReadPolicy;
  }

  /**
   * Phase 2 & 3: Governed Delegation to the Agent Garden.
   * Injects session memory (Phase 2), calls intelligence service,
   * then captures the result into the continuity ledger (Phase 3).
   */
  async delegateToGarden(
    tenantId: string,
    sessionId: string,
    agentType: string,
    objective: string,
    entityType?: string,
    entityId?: string,
    correlationId: string = generateUUID()
  ): Promise<any> {
    if (!this.agents) {
      throw new Error("Agents service binding required for Garden delegation.");
    }

    logWithContext(correlationId, "info", "Phase 2: Preparing 6-layer memory injection", {
      agentType,
      sessionId,
    });

    // Layer 5: Conversational Memory (Recent Session Context)
    const memoryResult = await this.db
      .prepare(
        `SELECT role, content FROM conversational_memory WHERE session_id = ? ORDER BY created_at ASC LIMIT 10`
      )
      .bind(sessionId)
      .all();

    // Layer 6: Evolutionary Memory (Personal/Behavioral Patterns)
    let evolutionaryMemory: any[] = [];
    try {
      const personalMemoryResult = await this.db
        .prepare(`SELECT category, content FROM personal_memory WHERE tenant_id = ? LIMIT 5`)
        .bind(tenantId)
        .all();
      evolutionaryMemory = personalMemoryResult.results || [];
    } catch (e) {
      // Ignore if personal_memory table isn't fully synced to D1 edge yet
    }

    // Layer 2: Knowledge (Org Memory / Canonical Artifacts references)
    let knowledgeRefs: any[] = [];
    if (entityType && entityId) {
      const policy = this.getKnowledgeReadPolicy
        ? await this.getKnowledgeReadPolicy(tenantId)
        : { includeKnowledgeUI: true, approvedOnly: true };
      const sources = await fuseSources(this.db, this.knowledge, entityType, entityId, tenantId, {
        lookbackHours: 72,
        correlationId,
        includeKnowledgeUI: policy.includeKnowledgeUI,
        approvedOnlyKnowledgeUI: policy.approvedOnly,
      });
      // Axiom: Agent holds only references.
      knowledgeRefs = sources.evidence_refs || [];
    }

    // Assemble the strict 6-Layer Cognitive Payload
    const injectedContext = {
      layer_1_skills: ["analyze", "propose_action"], // Tightly scoped to agentType in reality
      layer_2_knowledge: knowledgeRefs,
      layer_3_lineage: { correlationId, trigger: objective },
      layer_4_doctrines: [
        "Self-Realisation Rule: You are a stateless execution vessel.",
        "By default, any stored memory belongs to the Spine.",
        "You hold only a reference; all learnings must be returned to the Spine.",
        "NEVER execute writes directly. Output ProposedActions for GOVERN.",
      ],
      layer_5_memory: memoryResult.results || [],
      layer_6_evolutionary_memory: evolutionaryMemory,
    };

    // 2. Delegate to Intelligence (Agent Garden)
    const payload = {
      taskId: `task_${crypto.randomUUID()}`,
      sessionId,
      tenantId,
      objective,
      context: injectedContext,
    };

    const response = await this.agents.fetch("http://internal/delegate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Agent delegation failed: ${response.status} ${errorText}`);
    }

    const delegationResult = (await response.json()) as any;

    logWithContext(correlationId, "info", "Phase 3: Capturing delegation result", {
      agentType,
      success: delegationResult.success,
    });

    // 3. Write result back to Continuity Ledger and push proposals to Govern Triage
    if (delegationResult.success) {
      await this.continuity.captureAgentResult({
        sessionId,
        tenantId,
        agentType,
        result: delegationResult.result,
        correlationId,
      });
    }

    return delegationResult;
  }

  /**
   * Entry point: Process a single event through the Signal Engine (D1).
   *
   * KT NOTE: This is Flow C (AI reasoning). It does NOT write directly to Spine.
   * - AI insights are sent to Knowledge triage for review
   * - Only action proposals are created (go through Govern/Act)
   * - Data-derived signals (Flow A) are created by pipeline/normalizer
   */
  async processEvent(
    event: {
      id: string;
      tenant_id: string;
      event_type: string;
      entity_type: string;
      entity_id: string;
    },
    options: ProcessEventOptions = {}
  ): Promise<ProcessEventResult> {
    const correlationId = options.correlationId || generateUUID();

    logWithContext(correlationId, "info", "Processing event (Flow C - AI reasoning)", {
      event_id: event.id,
      event_type: event.event_type,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
    });

    // 1. Find matching Signal Rules
    const rulesResult = await this.db
      .prepare(
        `
            SELECT * FROM signal_rules 
            WHERE (tenant_id IS NULL OR tenant_id = ?)
            AND event_type_match = ?
            AND is_active = 1
        `
      )
      .bind(event.tenant_id, event.event_type)
      .all();

    const rules = rulesResult.results || [];

    if (rules.length === 0) {
      logWithContext(correlationId, "info", "No matching rules found");
      return { status: "no_match", correlation_id: correlationId };
    }

    const insightsCreated: any[] = [];
    let allActions: ProposedAction[] = [];
    let lastNarrative: Narrative | undefined;

    for (const rule of rules) {
      const insightId = crypto.randomUUID();
      const band =
        (rule as any).severity_score > 70
          ? "critical"
          : (rule as any).severity_score > 40
            ? "warning"
            : "good";

      // KT NOTE: This is AI-generated insight (Flow C), NOT a data-derived signal
      // It should go to Knowledge triage, NOT to Spine
      const insight = {
        id: insightId,
        tenant_id: event.tenant_id,
        insight_key: rule.signal_key,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        severity_score: rule.severity_score,
        band,
        evidence_ref_ids: [event.id],
        correlation_id: correlationId,
        created_at: new Date().toISOString(),
      };

      insightsCreated.push(insight);
      logWithContext(correlationId, "info", "AI insight generated (Flow C)", {
        insight_id: insightId,
        insight_key: rule.signal_key,
        kt_note: "Will be sent to Knowledge triage, NOT Spine",
      });

      // Send to Knowledge triage for Flow C governance
      if (this.knowledge) {
        try {
          await this.sendToKnowledgeTriage(event.tenant_id, insight, correlationId);
        } catch (triageErr: any) {
          logWithContext(correlationId, "warn", "Failed to send to Knowledge triage", {
            error: triageErr.message,
          });
          // Non-blocking - continue with action proposals
        }
      }

      // 2. Attempt Situation Escalation (creates action proposals only)
      const escalationResult = await this.checkEscalation(
        event.tenant_id,
        event.entity_type,
        event.entity_id,
        insight,
        correlationId,
        this.getAllowedEntityTypes
      );

      if (escalationResult) {
        if (escalationResult.actions) {
          allActions = allActions.concat(escalationResult.actions);
        }
        if (escalationResult.narrative) {
          lastNarrative = escalationResult.narrative;
        }
      }
    }

    return {
      status: "success",
      insights: insightsCreated, // Flow C: AI insights → Knowledge triage
      actions: allActions, // Action proposals → Govern/Act
      narrative: lastNarrative,
      correlation_id: correlationId,
    };
  }

  /**
   * Send AI insight to Knowledge triage (Flow C governance)
   * KT NOTE: Flow C never writes directly to Spine. All AI insights go through triage.
   */
  private async sendToKnowledgeTriage(
    tenantId: string,
    insight: any,
    correlationId: string
  ): Promise<void> {
    if (!this.knowledge) {
      logWithContext(correlationId, "warn", "Knowledge service not available, skipping triage");
      return;
    }

    const triagePayload = {
      session_id: insight.id,
      tenant_id: tenantId,
      platform: "integratewise",
      content: JSON.stringify({
        type: "ai_insight",
        insight_key: insight.insight_key,
        entity_type: insight.entity_type,
        entity_id: insight.entity_id,
        severity_score: insight.severity_score,
        band: insight.band,
        evidence_refs: insight.evidence_ref_ids,
      }),
      source_type: "think_engine",
      metadata: {
        correlation_id: correlationId,
        created_at: insight.created_at,
      },
    };

    const response = await this.knowledge.fetch("http://internal/v1/triage/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(triagePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Knowledge triage failed: ${response.status} ${errorText}`);
    }

    logWithContext(correlationId, "info", "Sent to Knowledge triage", {
      insight_id: insight.id,
      triage_status: "pending_review",
    });
  }

  /**
   * Check if a new insight triggers Action Proposal creation.
   *
   * KT NOTE: This is Flow C (AI reasoning). It does NOT create situations in D1/Spine.
   * It only creates action proposals which go through Govern/Act properly.
   * Data-derived situations (Flow A) are created by pipeline/normalizer.
   */
  private async checkEscalation(
    tenant_id: string,
    entity_type: string,
    entity_id: string,
    newInsight: any,
    correlationId: string,
    getAllowedEntityTypes?: GetAllowedEntityTypesFn
  ): Promise<{
    context: any; // AI reasoning context (Flow C) - NOT persisted to Spine
    actions: ProposedAction[];
    narrative: Narrative;
    sources: FusedSources;
  } | null> {
    // Find rules that require this insight
    const escalationRulesResult = await this.db
      .prepare(
        `
            SELECT * FROM situation_escalation_rules
            WHERE json_each_text(required_signal_keys) = ?
            AND (tenant_id IS NULL OR tenant_id = ?)
        `
      )
      .bind(newInsight.insight_key, tenant_id)
      .all();

    const escalationRules = escalationRulesResult.results || [];

    for (const rule of escalationRules) {
      const requiredKeys =
        typeof rule.required_signal_keys === "string"
          ? JSON.parse(rule.required_signal_keys)
          : rule.required_signal_keys;

      // Check if ALL required insights exist for this entity recently (last 48h)
      // Note: This queries D1 operational state, NOT Spine
      const placeholders = requiredKeys.map(() => "?").join(",");
      const recentInsightsResult = await this.db
        .prepare(
          `
                SELECT id, insight_key FROM ai_insights_buffer
                WHERE tenant_id = ?
                AND entity_type = ?
                AND entity_id = ?
                AND insight_key IN (${placeholders})
                AND created_at > datetime('now', '-48 hours')
            `
        )
        .bind(tenant_id, entity_type, entity_id, ...requiredKeys)
        .all();

      const recentInsights = recentInsightsResult.results || [];
      const foundKeys = new Set(recentInsights.map((s) => s.insight_key));
      const allFound = requiredKeys.every((key: string) => foundKeys.has(key));

      if (allFound) {
        logWithContext(correlationId, "info", "Action proposal trigger (Flow C)", {
          situation_key: rule.situation_key,
          required_insights: requiredKeys,
          kt_note: "Creating action proposals only, NOT persisting to Spine",
        });

        // ====== A/B/C FUSION ======
        const knowledgePolicy = this.getKnowledgeReadPolicy
          ? await this.getKnowledgeReadPolicy(tenant_id)
          : { includeKnowledgeUI: true, approvedOnly: false };
        const sources = await fuseSources(
          this.db,
          this.knowledge,
          entity_type,
          entity_id,
          tenant_id,
          {
            lookbackHours: 72,
            correlationId,
            includeKnowledgeUI: knowledgePolicy.includeKnowledgeUI,
            approvedOnlyKnowledgeUI: knowledgePolicy.approvedOnly,
          }
        );

        const evidenceRefIds = await persistEvidenceRefs(this.db, tenant_id, sources.evidence_refs);

        // KT NOTE: Create in-memory context only (Flow C), do NOT persist to D1/Spine
        const contextId = crypto.randomUUID();
        const reasoningContext = {
          id: contextId,
          tenant_id,
          context_key: rule.situation_key,
          title: "Alert: " + (rule as any).situation_key.replace(".", " "),
          summary: "Detected complex pattern from AI insights",
          severity: (rule as any).min_severity_threshold > 80 ? "critical" : "high",
          insight_ids: recentInsights.map((s) => s.id),
          evidence_ref_ids: evidenceRefIds,
          entity_type,
          entity_id,
          correlation_id: correlationId,
          plane_status: sources.plane_status,
          // Flow C marker - indicates this is AI-generated, not data-derived
          flow_type: "C",
          kt_note: "AI reasoning context - NOT persisted to Spine",
        };

        const narrative = generateNarrative(
          {
            id: contextId,
            situation_key: (rule as any).situation_key,
            entity_type,
            entity_id,
            tenant_id,
          },
          sources
        );

        const allowedEntityTypes = getAllowedEntityTypes
          ? await getAllowedEntityTypes(tenant_id)
          : undefined;

        // Create action proposals (Flow C) - these go through Govern/Act
        const actions = await createProposedActions(
          this.db,
          {
            id: contextId,
            situation_key: (rule as any).situation_key,
            entity_type,
            entity_id,
            tenant_id,
          },
          sources,
          evidenceRefIds,
          allowedEntityTypes ?? undefined
        );

        logWithContext(correlationId, "info", "Action proposals created (Flow C)", {
          context_id: contextId,
          action_count: actions.length,
          kt_note: "Proposals go through Govern/Act, NOT direct Spine write",
        });

        // Return context (in-memory only) + actions
        return { context: reasoningContext, actions, narrative, sources };
      }
    }

    return null;
  }

  /**
   * On-demand analysis
   */
  async analyzeEntity(
    tenant_id: string,
    entity_type: string,
    entity_id: string
  ): Promise<{ sources: FusedSources; narrative: Narrative }> {
    const knowledgePolicy = this.getKnowledgeReadPolicy
      ? await this.getKnowledgeReadPolicy(tenant_id)
      : { includeKnowledgeUI: true, approvedOnly: false };
    const sources = await fuseSources(this.db, this.knowledge, entity_type, entity_id, tenant_id, {
      lookbackHours: 168,
      includeKnowledgeUI: knowledgePolicy.includeKnowledgeUI,
      approvedOnlyKnowledgeUI: knowledgePolicy.approvedOnly,
    });

    const narrative = generateNarrative(
      { id: "analysis", situation_key: "manual.analysis", entity_type, entity_id, tenant_id },
      sources
    );

    return { sources, narrative };
  }
}
