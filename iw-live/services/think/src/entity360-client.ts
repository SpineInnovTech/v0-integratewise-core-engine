/**
 * Entity 360 Client for Think Service
 *
 * Fetches the unified Entity 360 view from D1 domain tables when available,
 * with automatic fallback to Supabase REST.
 * Twin ONLY reads through this client — never from scattered sources.
 */

import type { Entity360 } from "@integratewise/types";

interface Entity360ClientConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  db?: D1Database;
}

export class Entity360Client {
  private config: Entity360ClientConfig;

  constructor(config: Entity360ClientConfig) {
    this.config = config;
  }

  /**
   * Fetch a single Entity 360
   */
  async get(
    tenantId: string,
    spineId: string,
    _layers?: string[],
    queryType?: string
  ): Promise<Entity360 | null> {
    if (this.config.db) {
      return this.getFromD1(tenantId, spineId, queryType);
    }
    return this.getFromSupabase(tenantId, spineId, queryType);
  }

  private async getFromD1(
    tenantId: string,
    spineId: string,
    queryType?: string
  ): Promise<Entity360 | null> {
    const db = this.config.db!;
    try {
      // 1. Search in D1 domain tables in parallel
      const tables = ["decide_data", "build_data", "grow_data", "run_data", "cross_data"];
      const queries = tables.map((table) =>
        db
          .prepare(`SELECT * FROM ${table} WHERE id = ? AND tenant_id = ? LIMIT 1`)
          .bind(spineId, tenantId)
          .first<any>()
      );
      const results = await Promise.all(queries);

      let foundEntity: any = null;
      let matchedTable = "";

      for (let i = 0; i < results.length; i++) {
        if (results[i]) {
          foundEntity = results[i];
          matchedTable = tables[i];
          break;
        }
      }

      if (!foundEntity) return null;

      // Parse data payload
      let rawData: any = {};
      try {
        rawData =
          typeof foundEntity.data === "string"
            ? JSON.parse(foundEntity.data)
            : foundEntity.data || {};
      } catch {}

      const entityType = foundEntity.type || "unknown";

      // 2. Parallel fetch related layers from D1 AND Supabase
      const [
        d1Signals,
        d1Context,
        d1Memories,
        d1Goals,
        sbSignals,
        sbContext,
        sbMemories,
        sbOrgMemories,
        sbGoals,
      ] = await Promise.all([
        this.fetchSignalsD1(db, tenantId, spineId),
        this.fetchContextD1(db, tenantId, spineId),
        this.fetchMemoriesD1(db, tenantId, spineId),
        this.fetchGoalsD1(db, tenantId, spineId),
        this.fetchSignals(tenantId, spineId),
        this.fetchContext(tenantId, spineId),
        this.fetchMemories(tenantId, spineId),
        this.fetchOrgMemoriesSupabase(tenantId, spineId),
        this.fetchGoals(tenantId, spineId),
      ]);

      // 3. Merge and Rank
      const rankedSignals = this.mergeAndRankSignals(d1Signals, sbSignals, queryType);
      const rankedContext = this.mergeAndRankContext(d1Context, sbContext, queryType);
      const rankedMemories = this.mergeAndRankMemories(
        d1Memories,
        sbMemories,
        sbOrgMemories,
        queryType
      );
      const rankedGoals = this.mergeAndRankGoals(d1Goals, sbGoals, queryType);

      // 4. Compress to token limit (default 4000 tokens / 8000 for complex queries)
      const isComplex = queryType
        ? queryType.toLowerCase().includes("complex") ||
          queryType.toLowerCase().includes("multi") ||
          queryType.toLowerCase().includes("reconstruction")
        : false;
      const maxTokens = isComplex ? 8000 : 4000;

      const compressedSignals = this.compressToTokenLimit(
        rankedSignals,
        (s) => (s.title || "") + " " + (s.description || ""),
        maxTokens
      );
      const compressedContext = this.compressToTokenLimit(
        rankedContext,
        (c) => (c.title || "") + " " + (c.summary || ""),
        maxTokens
      );
      const compressedMemories = this.compressToTokenLimit(
        rankedMemories,
        (m) => m.content || "",
        maxTokens
      );
      const compressedGoals = this.compressToTokenLimit(
        rankedGoals,
        (g) => g.title || "",
        maxTokens
      );

      const updatedAt =
        foundEntity.updated_at || foundEntity.created_at || new Date().toISOString();
      const ageMs = Date.now() - new Date(updatedAt).getTime();

      return {
        spine_id: spineId,
        tenant_id: tenantId,
        entity_type: entityType,
        display_name:
          foundEntity.name || rawData.name || rawData.title || rawData.company || "Unnamed",
        truth: {
          data: { ...foundEntity, data: rawData },
          source_table: matchedTable,
          source_schema: "d1",
          updated_at: updatedAt,
          freshness: ageMs < 3600000 ? "live" : ageMs < 86400000 ? "recent" : "stale",
          sources: foundEntity.source_tool ? [foundEntity.source_tool] : [],
        },
        context: {
          recent: compressedContext,
          total_count: rankedContext.length,
        },
        signals: {
          active: compressedSignals,
          summary: this.summarizeSignals(compressedSignals),
        },
        memory: {
          recent: compressedMemories,
          total_count: rankedMemories.length,
        },
        goals: {
          active: compressedGoals,
          health: this.computeGoalHealth(compressedGoals),
        },
        relationships: { children: [], related: [] },
        meta: {
          assembled_at: new Date().toISOString(),
          hydration_bucket: rawData.hydration_bucket || "B0",
          department: rawData.department || "BIZOPS",
          industry: rawData.industry,
          schema_version: "v1",
          cache_hit: false,
        },
      };
    } catch (err) {
      console.warn("[Entity360Client:D1] Failed to fetch:", err);
      return null;
    }
  }

  private async fetchSignalsD1(
    db: D1Database,
    _tenantId: string,
    entityId: string
  ): Promise<any[]> {
    try {
      const res = await db
        .prepare(
          `SELECT * FROM cross_data 
         WHERE type = 'signal' 
         AND status = 'new'
         AND (source_id = ? OR json_extract(data, '$.entity_id') = ?)
         ORDER BY created_at DESC LIMIT 20`
        )
        .bind(entityId, entityId)
        .all();

      return (res.results || []).map((r: any) => {
        let rawData: any = {};
        try {
          rawData = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
        } catch {}
        return {
          id: r.id,
          type: r.category || "unknown",
          severity: r.severity || "info",
          title: r.name || "Signal",
          description: rawData.description || "",
          evidence: (rawData.key_indicators || []).map((ind: string) => ({
            type: "pattern",
            source: rawData.generated_by || "system",
            description: ind,
          })),
          confidence: rawData.confidence || 0.5,
          created_at: r.created_at,
          generated_by: rawData.generated_by || "pipeline",
        };
      });
    } catch {
      return [];
    }
  }

  private async fetchContextD1(
    db: D1Database,
    _tenantId: string,
    entityId: string
  ): Promise<any[]> {
    try {
      const res = await db
        .prepare(
          `SELECT id, type, name as title, status, data, created_at FROM build_data 
         WHERE type = 'document' 
         AND json_extract(data, '$.entity_id') = ?
         ORDER BY created_at DESC LIMIT 10`
        )
        .bind(entityId)
        .all();

      return (res.results || []).map((r: any) => {
        let rawData: any = {};
        try {
          rawData = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
        } catch {}
        return {
          id: r.id,
          type: r.type,
          title: r.title,
          summary: rawData.summary || "",
          source: rawData.source || "system",
          created_at: r.created_at,
        };
      });
    } catch {
      return [];
    }
  }

  private async fetchMemoriesD1(
    db: D1Database,
    tenantId: string,
    entityId: string
  ): Promise<any[]> {
    try {
      const res = await db
        .prepare(
          `SELECT id, category as memory_type, content, created_at FROM personal_memory 
         WHERE tenant_id = ? 
         AND (linked_entity_id = ? OR json_extract(tags, '$') LIKE ?)
         ORDER BY created_at DESC LIMIT 15`
        )
        .bind(tenantId, entityId, `%${entityId}%`)
        .all();

      return (res.results || []).map((r: any) => ({
        id: r.id,
        memory_type: r.memory_type,
        content: r.content,
        confidence: 0.9,
        source: "personal_memory",
        created_at: r.created_at,
      }));
    } catch {
      return [];
    }
  }

  private async fetchGoalsD1(db: D1Database, tenantId: string, entityId: string): Promise<any[]> {
    try {
      const res = await db
        .prepare(
          `SELECT id, name as title, status, due_date, data FROM decide_data 
         WHERE type = 'okr' 
         AND tenant_id = ?
         AND (committed_to = ? OR json_extract(data, '$.account_id') = ?)
         ORDER BY created_at DESC LIMIT 10`
        )
        .bind(tenantId, entityId, entityId)
        .all();

      return (res.results || []).map((r: any) => {
        let rawData: any = {};
        try {
          rawData = typeof r.data === "string" ? JSON.parse(r.data) : r.data || {};
        } catch {}
        return {
          id: r.id,
          title: r.title,
          status: r.status,
          progress: rawData.progress || 0,
          target_date: r.due_date,
        };
      });
    } catch {
      return [];
    }
  }

  private async getFromSupabase(
    tenantId: string,
    spineId: string,
    queryType?: string
  ): Promise<Entity360 | null> {
    const supabaseUrl = this.config.supabaseUrl;
    const supabaseKey = this.config.supabaseKey;
    if (!supabaseUrl || !supabaseKey) return null;

    try {
      const params: Record<string, string> = {
        spine_id: `eq.${spineId}`,
        tenant_id: `eq.${tenantId}`,
        select: "*",
        limit: "1",
      };

      const entityRes = await fetch(
        `${supabaseUrl}/rest/v1/entities?${new URLSearchParams(params)}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!entityRes.ok) return null;
      const entities = (await entityRes.json()) as any[];
      if (!entities.length) {
        const byId = await fetch(
          `${supabaseUrl}/rest/v1/entities?id=eq.${spineId}&tenant_id=eq.${tenantId}&select=*&limit=1`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );
        if (!byId.ok) return null;
        const byIdRows = (await byId.json()) as any[];
        if (!byIdRows.length) return null;
        entities.push(byIdRows[0]);
      }

      const entity = entities[0];
      const entityType = entity.entity_type || "unknown";

      const [signals, context, memories, sbOrgMemories, goals] = await Promise.all([
        this.fetchSignals(tenantId, spineId),
        this.fetchContext(tenantId, spineId),
        this.fetchMemories(tenantId, spineId),
        this.fetchOrgMemoriesSupabase(tenantId, spineId),
        this.fetchGoals(tenantId, spineId),
      ]);

      const rankedSignals = this.mergeAndRankSignals([], signals, queryType);
      const rankedContext = this.mergeAndRankContext([], context, queryType);
      const rankedMemories = this.mergeAndRankMemories([], memories, sbOrgMemories, queryType);
      const rankedGoals = this.mergeAndRankGoals([], goals, queryType);

      const isComplex = queryType
        ? queryType.toLowerCase().includes("complex") ||
          queryType.toLowerCase().includes("multi") ||
          queryType.toLowerCase().includes("reconstruction")
        : false;
      const maxTokens = isComplex ? 8000 : 4000;

      const compressedSignals = this.compressToTokenLimit(
        rankedSignals,
        (s) => (s.title || "") + " " + (s.description || ""),
        maxTokens
      );
      const compressedContext = this.compressToTokenLimit(
        rankedContext,
        (c) => (c.title || "") + " " + (c.summary || ""),
        maxTokens
      );
      const compressedMemories = this.compressToTokenLimit(
        rankedMemories,
        (m) => m.content || "",
        maxTokens
      );
      const compressedGoals = this.compressToTokenLimit(
        rankedGoals,
        (g) => g.title || "",
        maxTokens
      );

      const updatedAt = entity.updated_at || entity.created_at || new Date().toISOString();
      const ageMs = Date.now() - new Date(updatedAt).getTime();

      return {
        spine_id: spineId,
        tenant_id: tenantId,
        entity_type: entityType,
        display_name: entity.name || entity.title || entity.company || "Unnamed",
        truth: {
          data: entity,
          source_table: "entities",
          source_schema: "public",
          updated_at: updatedAt,
          freshness: ageMs < 3600000 ? "live" : ageMs < 86400000 ? "recent" : "stale",
          sources: entity.source ? [entity.source] : [],
        },
        context: {
          recent: compressedContext,
          total_count: rankedContext.length,
        },
        signals: {
          active: compressedSignals,
          summary: this.summarizeSignals(compressedSignals),
        },
        memory: {
          recent: compressedMemories,
          total_count: rankedMemories.length,
        },
        goals: {
          active: compressedGoals,
          health: this.computeGoalHealth(compressedGoals),
        },
        relationships: { children: [], related: [] },
        meta: {
          assembled_at: new Date().toISOString(),
          hydration_bucket: entity.hydration_bucket || "B0",
          department: entity.department || "BIZOPS",
          industry: entity.industry,
          schema_version: "v1",
          cache_hit: false,
        },
      };
    } catch (err) {
      console.warn("[Entity360Client:Supabase] Failed to fetch:", err);
      return null;
    }
  }

  private async fetchSignals(tenantId: string, entityId: string): Promise<any[]> {
    const supabaseUrl = this.config.supabaseUrl;
    const supabaseKey = this.config.supabaseKey;
    if (!supabaseUrl || !supabaseKey) return [];

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/signals?entity_id=eq.${entityId}&tenant_id=eq.${tenantId}&status=eq.active&order=created_at.desc&limit=20`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (!res.ok) return [];
      const rows = (await res.json()) as any[];
      return rows.map((r) => ({
        id: r.id,
        type: r.signal_type || "unknown",
        severity: r.severity || "info",
        title: r.title || "Signal",
        description: r.description || "",
        evidence: (r.key_indicators || []).map((ind: string) => ({
          type: "pattern",
          source: r.generated_by || "system",
          description: ind,
        })),
        confidence: r.confidence || 0.5,
        created_at: r.created_at,
        generated_by: r.generated_by || "pipeline",
      }));
    } catch {
      return [];
    }
  }

  private async fetchContext(tenantId: string, entityId: string): Promise<any[]> {
    const supabaseUrl = this.config.supabaseUrl;
    const supabaseKey = this.config.supabaseKey;
    if (!supabaseUrl || !supabaseKey) return [];

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/context_extractions?entity_id=eq.${entityId}&tenant_id=eq.${tenantId}&order=created_at.desc&limit=10&select=id,type,title,summary,source,created_at`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (!res.ok) return [];
      return (await res.json()) as any[];
    } catch {
      return [];
    }
  }

  private async fetchMemories(tenantId: string, entityId: string): Promise<any[]> {
    const supabaseUrl = this.config.supabaseUrl;
    const supabaseKey = this.config.supabaseKey;
    if (!supabaseUrl || !supabaseKey) return [];

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/ai_memories?entity_id=eq.${entityId}&tenant_id=eq.${tenantId}&order=created_at.desc&limit=15&select=id,memory_type,content,confidence,source,created_at`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (!res.ok) return [];
      return (await res.json()) as any[];
    } catch {
      return [];
    }
  }

  private async fetchGoals(tenantId: string, entityId: string): Promise<any[]> {
    const supabaseUrl = this.config.supabaseUrl;
    const supabaseKey = this.config.supabaseKey;
    if (!supabaseUrl || !supabaseKey) return [];

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/goals?or=(entity_id.eq.${entityId},account_id.eq.${entityId})&tenant_id=eq.${tenantId}&order=created_at.desc&limit=10&select=id,title,status,progress,target_date`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (!res.ok) return [];
      return (await res.json()) as any[];
    } catch {
      return [];
    }
  }

  private summarizeSignals(signals: any[]) {
    const s = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const sig of signals) {
      if (sig.severity in s) (s as any)[sig.severity]++;
    }
    return s;
  }

  private computeGoalHealth(goals: any[]): "on_track" | "at_risk" | "off_track" | "no_goals" {
    if (!goals.length) return "no_goals";
    const atRisk = goals.filter((g) => g.status === "at_risk").length;
    if (atRisk > goals.length / 2) return "off_track";
    if (atRisk > 0) return "at_risk";
    return "on_track";
  }

  private async fetchOrgMemoriesSupabase(tenantId: string, entityId: string): Promise<any[]> {
    const supabaseUrl = this.config.supabaseUrl;
    const supabaseKey = this.config.supabaseKey;
    if (!supabaseUrl || !supabaseKey) return [];

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/org_memory?tenant_id=eq.${tenantId}&or=(metadata->>entity_id.eq.${entityId},metadata->>linked_entity_id.eq.${entityId},content.ilike.%${entityId}%)&order=created_at.desc&limit=15`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (!res.ok) return [];
      const rows = (await res.json()) as any[];
      return rows.map((r: any) => ({
        id: r.id,
        memory_type: r.category || "insight",
        content: r.content || r.doctrine || "",
        confidence: 0.85,
        source: "org_memory",
        created_at: r.created_at || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  private mergeAndRankMemories(
    d1Memories: any[],
    sbMemories: any[],
    sbOrgMemories: any[],
    queryType?: string
  ): any[] {
    const all = [...d1Memories, ...sbMemories, ...sbOrgMemories];

    // Deduplicate by content
    const unique = new Map<string, any>();
    for (const item of all) {
      if (!item.content) continue;
      const normalizedContent = item.content.toLowerCase().trim();
      const existing = unique.get(normalizedContent);
      if (
        !existing ||
        (item.created_at && new Date(item.created_at) > new Date(existing.created_at))
      ) {
        unique.set(normalizedContent, item);
      }
    }

    const weights = getContextWeights(queryType);

    // Rank by score
    const ranked = Array.from(unique.values()).map((item) => {
      const ageDays =
        (Date.now() - new Date(item.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
      const recency = Math.max(0.1, 1.0 - ageDays / 180);
      const confidence = item.confidence || 0.85;
      const score = parseFloat((weights.institutional * recency * confidence).toFixed(3));
      return { ...item, relevance: score };
    });

    return ranked.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  private mergeAndRankSignals(d1Signals: any[], sbSignals: any[], queryType?: string): any[] {
    const all = [...d1Signals, ...sbSignals];

    // Deduplicate by title + description
    const unique = new Map<string, any>();
    for (const item of all) {
      const key = `${(item.title || "").toLowerCase()}:${(item.description || "").toLowerCase()}`;
      const existing = unique.get(key);
      if (
        !existing ||
        (item.created_at && new Date(item.created_at) > new Date(existing.created_at))
      ) {
        unique.set(key, item);
      }
    }

    const weights = getContextWeights(queryType);

    const ranked = Array.from(unique.values()).map((item) => {
      const ageDays =
        (Date.now() - new Date(item.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
      const recency = Math.max(0.1, 1.0 - ageDays / 180);
      const confidence = item.confidence || 0.8;
      const score = parseFloat((weights.operational * recency * confidence).toFixed(3));
      return { ...item, relevance: score };
    });

    return ranked.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  private mergeAndRankContext(d1Context: any[], sbContext: any[], queryType?: string): any[] {
    const all = [...d1Context, ...sbContext];

    const unique = new Map<string, any>();
    for (const item of all) {
      const key = (item.title || item.id || "").toLowerCase().trim();
      const existing = unique.get(key);
      if (
        !existing ||
        (item.created_at && new Date(item.created_at) > new Date(existing.created_at))
      ) {
        unique.set(key, item);
      }
    }

    const weights = getContextWeights(queryType);

    const ranked = Array.from(unique.values()).map((item) => {
      const ageDays =
        (Date.now() - new Date(item.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
      const recency = Math.max(0.1, 1.0 - ageDays / 180);
      const score = parseFloat((weights.institutional * recency * 0.7).toFixed(3));
      return { ...item, relevance: score };
    });

    return ranked.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  private mergeAndRankGoals(d1Goals: any[], sbGoals: any[], queryType?: string): any[] {
    const all = [...d1Goals, ...sbGoals];

    const unique = new Map<string, any>();
    for (const item of all) {
      const key = (item.title || "").toLowerCase().trim();
      const existing = unique.get(key);
      if (
        !existing ||
        (item.target_date && new Date(item.target_date) > new Date(existing.target_date))
      ) {
        unique.set(key, item);
      }
    }

    const weights = getContextWeights(queryType);

    const ranked = Array.from(unique.values()).map((item) => {
      const targetTime = item.target_date ? new Date(item.target_date).getTime() : Date.now();
      const remainingDays = (targetTime - Date.now()) / (1000 * 60 * 60 * 24);
      const recency = Math.max(0.1, Math.min(1.0, 1.0 - Math.abs(remainingDays) / 180));
      const score = parseFloat((weights.operational * recency * 0.9).toFixed(3));
      return { ...item, relevance: score };
    });

    return ranked.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  private compressToTokenLimit<T>(
    items: T[],
    extractor: (item: T) => string,
    maxTokens: number = 4000
  ): T[] {
    const maxChars = maxTokens * 4; // Approx 4 chars per token
    let currentChars = 0;
    const result: T[] = [];

    for (const item of items) {
      const text = extractor(item);
      const len = text.length;
      if (currentChars + len <= maxChars) {
        result.push(item);
        currentChars += len;
      } else {
        break;
      }
    }
    return result;
  }
}

// ─── Query-Type Helper ────────────────────────────────────────────────────────

export function getContextWeights(queryType?: string): {
  operational: number;
  institutional: number;
} {
  if (!queryType) return { operational: 0.6, institutional: 0.4 };
  const qt = queryType.toLowerCase();
  if (qt.includes("status")) return { operational: 0.8, institutional: 0.2 };
  if (qt.includes("action")) return { operational: 0.5, institutional: 0.5 };
  if (qt.includes("learning")) return { operational: 0.2, institutional: 0.8 };
  if (qt.includes("reasoning") || qt.includes("why") || qt.includes("decision")) {
    return { operational: 0.3, institutional: 0.7 };
  }
  return { operational: 0.6, institutional: 0.4 };
}
