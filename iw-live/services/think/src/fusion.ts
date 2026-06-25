import {
  performEntitySemanticLookup,
  type SemanticSearchResult,
  type SessionSearchResult,
} from "./semantic-lookup";

// ============================================================================
// TYPES - Evidence Reference System
// ============================================================================

export interface EvidenceRef {
  ref_type:
    | "spine_metric"
    | "spine_event"
    | "spine_signal"
    | "context_artifact"
    | "context_email"
    | "context_document"
    | "context_semantic"
    | "ai_session"
    | "ai_insight"
    | "ai_semantic";
  ref_id: string;
  ref_table: string;
  relevance_score?: number;
  display_label?: string;
  is_missing_marker?: boolean;
  is_semantic?: boolean;
}

export interface FusedSources {
  spine: {
    signals: any[];
    metrics: any[];
    events: any[];
  };
  context: {
    artifacts: any[];
    emails: any[];
    documents: any[];
    semantic_chunks?: SemanticSearchResult[];
  };
  ai: {
    sessions: any[];
    insights: any[];
    semantic_sessions?: SessionSearchResult[];
  };
  evidence_refs: EvidenceRef[];
  plane_status: PlaneStatus;
  correlation_id?: string;
  semantic_search_time_ms?: number;
}

// ============================================================================
// PLANE A: SPINE (Structured Data)
// ============================================================================

async function fetchSpineData(
  db: D1Database,
  tenant_id: string,
  entity_type: string,
  entity_id: string,
  lookbackHours: number = 72
): Promise<{ signals: any[]; metrics: any[]; events: any[] }> {
  const [signalsResult, metricsResult, eventsResult] = await Promise.all([
    db
      .prepare(
        `
            SELECT id, signal_key, metric_value, band, computed_at, evidence_ref_ids
            FROM signals
            WHERE tenant_id = ?
            AND entity_type = ?
            AND entity_id = ?
            AND computed_at > datetime('now', ?)
            ORDER BY computed_at DESC
            LIMIT 50
        `
      )
      .bind(tenant_id, entity_type, entity_id, `-${lookbackHours} hours`)
      .all(),

    db
      .prepare(
        `
            SELECT id, metric_key, metric_value, unit, recorded_at
            FROM spine_metrics
            WHERE tenant_id = ?
            AND entity_type = ?
            AND entity_id = ?
            AND recorded_at > datetime('now', ?)
            ORDER BY recorded_at DESC
            LIMIT 50
        `
      )
      .bind(tenant_id, entity_type, entity_id, `-${lookbackHours} hours`)
      .all()
      .catch(() => ({ results: [] })),

    db
      .prepare(
        `
            SELECT id, event_type, source_system, payload, created_at
            FROM events
            WHERE tenant_id = ?
            AND entity_type = ?
            AND entity_id = ?
            AND created_at > datetime('now', ?)
            ORDER BY created_at DESC
            LIMIT 100
        `
      )
      .bind(tenant_id, entity_type, entity_id, `-${lookbackHours} hours`)
      .all()
      .catch(() => ({ results: [] })),
  ]);

  return {
    signals: signalsResult.results || [],
    metrics: metricsResult.results || [],
    events: eventsResult.results || [],
  };
}

// ============================================================================
// PLANE B: CONTEXT (Unstructured Data / Knowledge)
// ============================================================================

async function fetchContextData(
  db: D1Database,
  tenant_id: string,
  entity_type: string,
  entity_id: string
): Promise<{ artifacts: any[]; emails: any[]; documents: any[] }> {
  const [artifactsResult, emailsResult, documentsResult] = await Promise.all([
    db
      .prepare(
        `
            SELECT ca.id, ca.artifact_type, ca.title, ca.content_summary, ca.source_system, al.link_type
            FROM artifact_links al
            JOIN canonical_artifacts ca ON al.artifact_id = ca.id
            WHERE al.tenant_id = ?
            AND al.entity_type = ?
            AND al.entity_id = ?
            ORDER BY ca.created_at DESC
            LIMIT 20
        `
      )
      .bind(tenant_id, entity_type, entity_id)
      .all()
      .catch(() => ({ results: [] })),

    db
      .prepare(
        `
            SELECT id, subject, sender, received_at, snippet
            FROM emails
            WHERE tenant_id = ?
            AND (related_entity_type = ? AND related_entity_id = ?)
            ORDER BY received_at DESC
            LIMIT 20
        `
      )
      .bind(tenant_id, entity_type, entity_id)
      .all()
      .catch(() => ({ results: [] })),

    db
      .prepare(
        `
            SELECT id, name, mime_type, source_system, last_modified_at
            FROM drive_files
            WHERE tenant_id = ?
            AND (related_entity_type = ? AND related_entity_id = ?)
            ORDER BY last_modified_at DESC
            LIMIT 20
        `
      )
      .bind(tenant_id, entity_type, entity_id)
      .all()
      .catch(() => ({ results: [] })),
  ]);

  return {
    artifacts: artifactsResult.results || [],
    emails: emailsResult.results || [],
    documents: documentsResult.results || [],
  };
}

// ============================================================================
// PLANE C: AI MEMORY (Brainstorm Sessions & Insights)
// ============================================================================

async function fetchAiMemoryData(
  db: D1Database,
  tenant_id: string,
  entity_type: string,
  entity_id: string
): Promise<{ sessions: any[]; insights: any[] }> {
  const [sessionsResult, insightsResult] = await Promise.all([
    db
      .prepare(
        `
            SELECT bs.id, bs.title, bs.session_type, bs.status, bs.created_at, bs.summary
            FROM brainstorm_sessions bs
            JOIN session_links sl ON bs.id = sl.session_id
            WHERE bs.tenant_id = ?
            AND sl.entity_type = ?
            AND sl.entity_id = ?
            ORDER BY bs.created_at DESC
            LIMIT 10
        `
      )
      .bind(tenant_id, entity_type, entity_id)
      .all()
      .catch(() => ({ results: [] })),

    db
      .prepare(
        `
            SELECT bi.id, bi.session_id, bi.insight_type, bi.content, bi.confidence, bi.created_at
            FROM brainstorm_insights bi
            JOIN brainstorm_sessions bs ON bi.session_id = bs.id
            JOIN session_links sl ON bs.id = sl.session_id
            WHERE bs.tenant_id = ?
            AND sl.entity_type = ?
            AND sl.entity_id = ?
            ORDER BY bi.created_at DESC
            LIMIT 20
        `
      )
      .bind(tenant_id, entity_type, entity_id)
      .all()
      .catch(() => ({ results: [] })),
  ]);

  return {
    sessions: sessionsResult.results || [],
    insights: insightsResult.results || [],
  };
}

export interface PlaneStatus {
  A: "available" | "empty" | "error";
  B: "available" | "empty" | "error";
  C: "available" | "empty" | "error";
}

function createMissingPlaneMarker(plane: "A" | "B" | "C", reason: string): EvidenceRef {
  const planeNames = { A: "spine", B: "context", C: "ai" };
  return {
    ref_type: plane === "A" ? "spine_event" : plane === "B" ? "context_artifact" : "ai_session",
    ref_id: `missing-${plane}-${Date.now()}`,
    ref_table: "missing_plane_marker",
    relevance_score: 0,
    display_label: `No ${planeNames[plane]} data: ${reason}`,
    is_missing_marker: true,
  };
}

function buildEvidenceRefs(
  spine: { signals: any[]; metrics: any[]; events: any[] },
  context: {
    artifacts: any[];
    emails: any[];
    documents: any[];
    semantic_chunks?: SemanticSearchResult[];
  },
  ai: { sessions: any[]; insights: any[]; semantic_sessions?: SessionSearchResult[] },
  semanticChunks: SemanticSearchResult[] = [],
  semanticSessions: SessionSearchResult[] = []
): { refs: EvidenceRef[]; planeStatus: PlaneStatus } {
  const refs: EvidenceRef[] = [];
  const planeStatus: PlaneStatus = { A: "available", B: "available", C: "available" };

  const hasSpineData =
    spine.signals.length > 0 || spine.metrics.length > 0 || spine.events.length > 0;
  if (!hasSpineData) {
    planeStatus.A = "empty";
    refs.push(createMissingPlaneMarker("A", "No recent signals, metrics, or events"));
  } else {
    spine.signals.forEach((s) =>
      refs.push({
        ref_type: "spine_signal",
        ref_id: s.id,
        ref_table: "signals",
        relevance_score: s.band === "critical" ? 1.0 : s.band === "warning" ? 0.7 : 0.4,
        display_label: `Signal: ${s.signal_key} (${s.band})`,
      })
    );
    spine.metrics.forEach((m) =>
      refs.push({
        ref_type: "spine_metric",
        ref_id: m.id,
        ref_table: "spine_metrics",
        relevance_score: 0.5,
        display_label: `Metric: ${m.metric_key} = ${m.metric_value}`,
      })
    );
    spine.events.forEach((e) =>
      refs.push({
        ref_type: "spine_event",
        ref_id: e.id,
        ref_table: "events",
        relevance_score: 0.6,
        display_label: `Event: ${e.event_type}`,
      })
    );
  }

  const hasContextData =
    context.artifacts.length > 0 || context.emails.length > 0 || context.documents.length > 0;
  if (!hasContextData) {
    planeStatus.B = "empty";
    refs.push(createMissingPlaneMarker("B", "No linked artifacts, emails, or documents"));
  } else {
    context.artifacts.forEach((a) =>
      refs.push({
        ref_type: "context_artifact",
        ref_id: a.id,
        ref_table: "canonical_artifacts",
        relevance_score: 0.7,
        display_label: `${a.artifact_type}: ${a.title}`,
      })
    );
    context.emails.forEach((e) =>
      refs.push({
        ref_type: "context_email",
        ref_id: e.id,
        ref_table: "emails",
        relevance_score: 0.5,
        display_label: `Email: ${e.subject}`,
      })
    );
    context.documents.forEach((d) =>
      refs.push({
        ref_type: "context_document",
        ref_id: d.id,
        ref_table: "drive_files",
        relevance_score: 0.4,
        display_label: `Doc: ${d.name}`,
      })
    );
  }

  semanticChunks.forEach((chunk) =>
    refs.push({
      ref_type: "context_semantic",
      ref_id: chunk.chunk_id,
      ref_table: "document_chunks",
      relevance_score: chunk.similarity_score,
      display_label: `[Semantic] ${chunk.source_type}: ${chunk.content.substring(0, 60)}...`,
      is_semantic: true,
    })
  );

  const hasAiData = ai.sessions.length > 0 || ai.insights.length > 0;
  if (!hasAiData) {
    planeStatus.C = "empty";
    refs.push(createMissingPlaneMarker("C", "No AI sessions or insights linked"));
  } else {
    ai.sessions.forEach((s) =>
      refs.push({
        ref_type: "ai_session",
        ref_id: s.id,
        ref_table: "brainstorm_sessions",
        relevance_score: 0.8,
        display_label: `Session: ${s.title}`,
      })
    );
    ai.insights.forEach((i) =>
      refs.push({
        ref_type: "ai_insight",
        ref_id: i.id,
        ref_table: "brainstorm_insights",
        relevance_score: i.confidence || 0.7,
        display_label: `Insight: ${i.insight_type}`,
      })
    );
  }

  semanticSessions.forEach((session) =>
    refs.push({
      ref_type: "ai_semantic",
      ref_id: session.session_id,
      ref_table: "ai_sessions",
      relevance_score: session.similarity_score,
      display_label: `[Semantic] Session: ${session.summary.substring(0, 60)}...`,
      is_semantic: true,
    })
  );

  return {
    refs: refs.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0)),
    planeStatus,
  };
}

export async function fuseSources(
  db: D1Database,
  knowledge: Fetcher | undefined,
  entity_type: string,
  entity_id: string,
  tenant_id: string,
  options: {
    lookbackHours?: number;
    correlationId?: string;
    openaiApiKey?: string;
    openrouterApiKey?: string;
    semanticQuery?: string;
    enableSemanticSearch?: boolean;
    /** §17.1: When false, exclude Knowledge UI (Flow C compounding) from semantic search. Default true. */
    includeKnowledgeUI?: boolean;
    /** When true, restrict Flow C reads to approved compounding memory only. */
    approvedOnlyKnowledgeUI?: boolean;
  } = {}
): Promise<FusedSources> {
  const lookbackHours = options.lookbackHours || 72;
  const aiApiKey = options.openrouterApiKey || options.openaiApiKey;
  const aiProvider = options.openrouterApiKey ? "openrouter" : "openai";
  const includeKnowledgeUI = options.includeKnowledgeUI !== false;
  const approvedOnlyKnowledgeUI = options.approvedOnlyKnowledgeUI === true;

  const fetchPromises: [
    Promise<{ signals: any[]; metrics: any[]; events: any[] }>,
    Promise<{ artifacts: any[]; emails: any[]; documents: any[] }>,
    Promise<{ sessions: any[]; insights: any[] }>,
    Promise<{
      chunks: SemanticSearchResult[];
      sessions: SessionSearchResult[];
      search_time_ms?: number;
    } | null>,
  ] = [
    fetchSpineData(db, tenant_id, entity_type, entity_id, lookbackHours),
    fetchContextData(db, tenant_id, entity_type, entity_id),
    approvedOnlyKnowledgeUI
      ? Promise.resolve({ sessions: [], insights: [] })
      : fetchAiMemoryData(db, tenant_id, entity_type, entity_id),
    options.enableSemanticSearch && aiApiKey
      ? performEntitySemanticLookup(
          db,
          knowledge,
          { apiKey: aiApiKey, provider: aiProvider },
          tenant_id,
          entity_type,
          entity_id,
          options.semanticQuery,
          { topK: 10, minScore: 0.5, includeKnowledgeUI, approvedOnly: approvedOnlyKnowledgeUI }
        )
          .then((r) => ({
            chunks: r.chunks,
            sessions: includeKnowledgeUI ? r.sessions : [],
            search_time_ms: (r.query_embedding_time_ms || 0) + (r.search_time_ms || 0),
          }))
          .catch(() => null)
      : Promise.resolve(null),
  ];

  const [spine, context, ai, semanticResult] = await Promise.all(fetchPromises);

  const enhancedContext = { ...context, semantic_chunks: semanticResult?.chunks || [] };
  const enhancedAi = { ...ai, semantic_sessions: semanticResult?.sessions || [] };

  const { refs: evidence_refs, planeStatus } = buildEvidenceRefs(
    spine,
    enhancedContext,
    enhancedAi,
    semanticResult?.chunks || [],
    semanticResult?.sessions || []
  );

  return {
    spine,
    context: enhancedContext,
    ai: enhancedAi,
    evidence_refs,
    plane_status: planeStatus,
    correlation_id: options.correlationId,
    semantic_search_time_ms: semanticResult?.search_time_ms,
  };
}

export async function persistEvidenceRefs(
  db: D1Database,
  tenant_id: string,
  refs: EvidenceRef[]
): Promise<string[]> {
  if (refs.length === 0) return [];

  // Using batch for D1 efficiency
  const ids = refs.slice(0, 10).map(() => crypto.randomUUID());
  const statements = refs.slice(0, 10).map((ref, idx) => {
    const source_plane = ref.ref_type.startsWith("spine_")
      ? "structured"
      : ref.ref_type.startsWith("context_")
        ? "unstructured"
        : "chat";
    return db
      .prepare(
        `
            INSERT INTO evidence_refs (
                id, tenant_id, source_plane, source_type, source_id, 
                display_label, relevance_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        ids[idx],
        tenant_id,
        source_plane,
        ref.ref_type,
        ref.ref_id,
        ref.display_label || "",
        ref.relevance_score || 0.5
      );
  });

  await db.batch(statements);
  return ids;
}
