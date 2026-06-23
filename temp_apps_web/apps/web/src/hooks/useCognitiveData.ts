import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api-client";

export interface UseCognitiveDataResult {
  data: any;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface SpineEntity {
  id: string;
  object_type?: string;
  tenant_id?: string;
  data: Record<string, any>;
  completeness_score?: number;
  fields_present?: number;
  fields_expected?: number;
  category?: string;
  updated_at?: string;
  relationships?: Record<string, any>;
}

export interface Signal {
  id: string;
  type: string;
  source: string;
  payload: any;
  created_at: string;
  processed: boolean;
  band?: "red" | "yellow" | "green";
  title?: string;
  computed_at?: string;
}

export interface Situation {
  id: string;
  type: string;
  severity: string;
  description: string;
  created_at: string;
  resolved: boolean;
  title?: string;
  status?: "open" | "closed" | "pending";
  recommendations?: string[];
  domain?: string;
  confidence?: number;
  narrative?: string;
  whyItMatters?: string;
  evidence?: Array<{ type: string; content?: string }>;
  proposedActions?: Array<{
    id: string;
    title: string;
    status: string;
    requiresApproval?: boolean;
  }>;
  createdAt?: string;
}

export interface EvidenceItem {
  id: string;
  type: string;
  source: string;
  source_type?: string;
  content: string;
  confidence: number;
  created_at: string;
  timestamp?: string;
  link?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor?: string;
  actor_type?: string;
  actor_id?: string;
  actor_name?: string;
  resource: string;
  timestamp: string;
  created_at?: string;
  changes: Record<string, any>;
  entity_type?: string;
  entity_id?: string;
}

export interface IQSession {
  id: string;
  title: string;
  messages: Array<{ role: string; content: string }>;
  started_at: string;
  created_at?: string;
  status: string;
  topic?: string;
  decisions?: string[];
}

export interface MemoryObject {
  id: string;
  type: string;
  content: string;
  tags: string[];
  created_at: string;
  status?: "active" | "archived" | "deleted";
  confidence?: number;
}

export interface KnowledgeSearchResult {
  id: string;
  title?: string;
  document_title?: string;
  snippet?: string;
  content?: string;
  score?: number;
  similarity?: number;
  source: string;
}

export interface KnowledgeTopic {
  id: string;
  name: string;
  description?: string;
  documentCount?: number;
  document_count?: number;
}

export function useCognitiveData(endpoint?: string): UseCognitiveDataResult {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    if (!endpoint) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // Extract label from endpoint path for apiFetch provenance
      const label = endpoint.split("/").filter(Boolean).slice(-1)[0] || "CognitiveData";
      const result = await apiFetch(endpoint, { signal: controller.signal }, label);
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return; // Request was cancelled
      console.warn(`[useCognitiveData] ${endpoint} failed:`, err?.message);
      if (!abortRef.current?.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [endpoint]);

  useEffect(() => {
    if (endpoint) {
      refetch();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [endpoint, refetch]);

  return { data, isLoading, error, refetch };
}

// ─── Spine Entities (v3.6 §22.1 → ③ Pipeline) ──────────────────────────────
export function useSpineEntities(filters?: Record<string, any>) {
  const qs = filters ? "?" + new URLSearchParams(filters as any).toString() : "";
  const result = useCognitiveData(`/api/v1/pipeline/entities${qs}`);
  return {
    entities: (result.data as SpineEntity[] | null) || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refetch,
  };
}

// ─── Knowledge Search (v3.6 §22.1 → ⑤ Knowledge) ──────────────────────────
export function useKnowledgeSearch(query?: string) {
  const result = useCognitiveData(
    query ? `/api/v1/knowledge/search?q=${encodeURIComponent(query)}` : undefined
  );
  return {
    results: (result.data as KnowledgeSearchResult[] | null) || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refetch,
  };
}

// ─── Knowledge Topics (v3.6 §22.1 → ⑤ Knowledge) ──────────────────────────
export function useKnowledgeTopics() {
  const result = useCognitiveData("/api/v1/knowledge/topics");
  return {
    topics: (result.data as KnowledgeTopic[] | null) || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refetch,
  };
}

// ─── Signals (v3.6 §22.2 → ④ Intelligence) ─────────────────────────────────
export function useSignals(filters?: Record<string, any>) {
  const qs = filters ? "?" + new URLSearchParams(filters as any).toString() : "";
  const result = useCognitiveData(`/api/v1/intelligence/signals${qs}`);
  // API returns envelope { data: Signal[], signal_count, ... } — unwrap .data
  const envelope = result.data as { data?: Signal[]; recent_signals?: Signal[] } | null;
  return {
    signals: envelope?.data || envelope?.recent_signals || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refetch,
  };
}

// ─── Situations (v3.6 §22.2 → ④ Intelligence) ──────────────────────────────
export function useSituations(filters?: Record<string, any>) {
  const qs = filters ? "?" + new URLSearchParams(filters as any).toString() : "";
  const result = useCognitiveData(`/api/v1/intelligence/situations${qs}`);
  // API returns envelope { data: Situation[] } — unwrap .data
  const envelope = result.data as { data?: Situation[] } | null;
  return {
    situations: envelope?.data || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refetch,
  };
}

// ─── Evidence (v3.6 §22.2 → ④ Intelligence) ────────────────────────────────
export function useEvidence(entityType?: string, entityId?: string) {
  const endpoint = entityId
    ? `/api/v1/cognitive/evidence/${entityId}`
    : entityType
      ? `/api/v1/cognitive/evidence?type=${entityType}`
      : undefined;
  const result = useCognitiveData(endpoint);
  return {
    evidence: (result.data as EvidenceItem[] | null) || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refetch,
  };
}

// ─── Audit Log (v3.6 §22.2 → immutable ops store) ──────────────────────────
export function useAuditLog(resourceId?: string) {
  const qs = resourceId ? `?entity_id=${resourceId}` : "";
  const result = useCognitiveData(`/api/v1/cognitive/audit${qs}`);
  // API returns envelope { entries: AuditEntry[] } — unwrap .entries
  const envelope = result.data as { entries?: AuditEntry[] } | null;
  return {
    logs: envelope?.entries || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refetch,
  };
}

// ─── IQ Sessions (v3.6 §22.1 → ⑤ Knowledge) ───────────────────────────────
export function useIQSessions() {
  const result = useCognitiveData("/api/v1/knowledge/sessions");
  // API may return { data: IQSession[] } or { items: IQSession[] } — try both
  const envelope = result.data as { data?: IQSession[]; items?: IQSession[] } | null;
  return {
    sessions: envelope?.data || envelope?.items || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refetch,
  };
}

// ─── Memories (v3.6 §22.2 → ④ Intelligence) ────────────────────────────────
export function useMemories(query?: string) {
  const qs = query ? `?q=${encodeURIComponent(query)}` : "";
  const result = useCognitiveData(`/api/v1/cognitive/memories${qs}`);
  // Knowledge API returns { success, data: MemoryObject[], correlation_id } — unwrap .data
  const envelope = result.data as { data?: MemoryObject[]; memories?: MemoryObject[] } | null;
  return {
    memories: envelope?.data || envelope?.memories || [],
    isLoading: result.isLoading,
    error: result.error,
    refresh: result.refetch,
  };
}

export default useCognitiveData;
