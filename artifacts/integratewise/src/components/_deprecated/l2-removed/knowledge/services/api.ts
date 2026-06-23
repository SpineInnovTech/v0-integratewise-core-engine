import { apiFetch } from "@/lib/api-client";
import type {
  KnowledgeDocument,
  KnowledgeTopic,
  KnowledgeSearchResult,
  InboxItem,
  Session,
} from "../types";

// ── Envelope types ───────────────────────────────────────────────────────────
// Knowledge service consistently wraps responses in { success, data, correlation_id }

interface KnowledgeEnvelope<T = any> {
  success?: boolean;
  data?: T;
  correlation_id?: string;
}

// ── Documents ────────────────────────────────────────────────────────────────

export async function fetchDocuments(params?: Record<string, any>): Promise<KnowledgeDocument[]> {
  try {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    const envelope = await apiFetch<KnowledgeEnvelope<any[]>>(`/api/v1/knowledge/documents${qs}`);
    // Unwrap envelope and map API fields → frontend type
    const rows = envelope.data || (Array.isArray(envelope) ? envelope : []);
    return rows.map((d: any) => ({
      id: d.id,
      title: d.title || "Untitled",
      content: d.content || "",
      source: d.source || d.entity_type || "unknown",
      provider: d.provider || "knowledge",
      type: d.type || "document",
      status: d.status === "ready" ? "processed" : d.status || "pending",
      tenant_id: d.tenant_id || "",
      created_at: d.created_at || "",
      updated_at: d.updated_at || d.created_at || "",
      tags: d.tags || [],
      metadata: d.metadata || {},
    }));
  } catch (err) {
    console.error("Failed to fetch documents:", err);
    return [];
  }
}

// ── Topics ───────────────────────────────────────────────────────────────────

export async function fetchTopics(): Promise<KnowledgeTopic[]> {
  try {
    const envelope = await apiFetch<KnowledgeEnvelope<any[]>>("/api/v1/knowledge/topics");
    // Unwrap envelope and map snake_case → camelCase
    const rows = envelope.data || (Array.isArray(envelope) ? envelope : []);
    return rows.map((t: any) => ({
      id: t.id,
      name: t.name || "",
      description: t.description || "",
      documentCount: t.document_count ?? t.documentCount ?? 0,
      lastUpdated: t.updated_at || t.created_at || "",
      cadence: t.cadence,
    }));
  } catch (err) {
    console.error("Failed to fetch topics:", err);
    return [];
  }
}

export async function getTopics(): Promise<KnowledgeTopic[]> {
  return fetchTopics();
}

export async function saveTopic(topic: Partial<KnowledgeTopic>): Promise<KnowledgeTopic> {
  try {
    if (topic.id) {
      const envelope = await apiFetch<KnowledgeEnvelope<any>>(
        `/api/v1/knowledge/topics/${topic.id}`,
        { method: "PUT", body: topic }
      );
      const d = envelope.data || envelope;
      return {
        id: d.id || topic.id,
        name: d.name || topic.name || "",
        description: d.description || topic.description || "",
        documentCount: d.document_count ?? d.documentCount ?? 0,
        lastUpdated: d.updated_at || new Date().toISOString(),
      };
    } else {
      const envelope = await apiFetch<KnowledgeEnvelope<any>>("/api/v1/knowledge/topics", {
        method: "POST",
        body: topic,
      });
      const d = envelope.data || envelope;
      return {
        id: d.id || "",
        name: d.name || topic.name || "",
        description: d.description || topic.description || "",
        documentCount: d.document_count ?? 0,
        lastUpdated: d.updated_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("Failed to save topic:", err);
    throw err;
  }
}

export async function deleteTopic(id: string): Promise<void> {
  try {
    await apiFetch(`/api/v1/knowledge/topics/${id}`, { method: "DELETE" });
  } catch (err) {
    console.error("Failed to delete topic:", err);
    throw err;
  }
}

// ── Search ───────────────────────────────────────────────────────────────────

export async function searchKnowledge(query: string): Promise<KnowledgeSearchResult[]> {
  try {
    const envelope = await apiFetch<KnowledgeEnvelope<any>>("/api/v1/knowledge/search", {
      method: "POST",
      body: { query },
    });
    // API returns { success, data: { results: [...], totalResults, ... } }
    const inner = envelope.data || envelope;
    const results = inner.results || (Array.isArray(inner) ? inner : []);
    return results.map((r: any) => ({
      id: r.id || r.chunk_id || "",
      title: r.title || r.metadata?.title || "Untitled",
      snippet: r.snippet || r.content?.slice(0, 200) || "",
      score: r.score ?? r.similarity ?? 0,
      source: r.source || "knowledge",
      document: {
        id: r.document_id || r.file_id || r.id || "",
        title: r.document_title || r.title || "",
        content: r.content || "",
        source: r.source || "knowledge",
        provider: r.provider || "knowledge",
        type: "document" as const,
        status: "processed" as const,
        tenant_id: r.tenant_id || "",
        created_at: r.created_at || "",
        updated_at: r.updated_at || "",
        tags: r.tags || [],
        metadata: r.metadata || {},
      },
    }));
  } catch (err) {
    console.error("Failed to search knowledge:", err);
    return [];
  }
}

export async function searchSessions(query: string): Promise<Session[]> {
  try {
    // Gateway may rewrite this path — try POST to match backend route
    const qs = "?" + new URLSearchParams({ q: query }).toString();
    const envelope = await apiFetch<KnowledgeEnvelope<any>>(
      `/api/v1/knowledge/sessions/search${qs}`
    );
    const inner = envelope.data || envelope;
    const results = inner.results || (Array.isArray(inner) ? inner : []);
    return results;
  } catch (err) {
    console.error("Failed to search sessions:", err);
    return [];
  }
}

// ── Inbox ────────────────────────────────────────────────────────────────────

export async function fetchInbox(): Promise<InboxItem[]> {
  try {
    const envelope = await apiFetch<KnowledgeEnvelope<any>>("/api/v1/knowledge/inbox");
    // API returns { success, data: { items: [...], limit, offset } }
    const inner = envelope.data || envelope;
    const items = inner.items || (Array.isArray(inner) ? inner : []);
    return items.map((i: any) => ({
      id: i.id,
      title: i.title || i.category || i.platform || "Inbox item",
      source: i.source || i.platform || "unknown",
      receivedAt: i.receivedAt || i.created_at || "",
      status: i.status || (i.approval_status === "approved" ? "reviewed" : "new"),
      content: i.content || "",
      provider: i.provider || i.platform || "unknown",
    }));
  } catch (err) {
    console.error("Failed to fetch inbox:", err);
    return [];
  }
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  try {
    const envelope = await apiFetch<KnowledgeEnvelope<any>>("/api/v1/knowledge/sessions");
    const inner = envelope.data || envelope;
    const items = inner.items || inner.results || (Array.isArray(inner) ? inner : []);
    return items;
  } catch (err) {
    console.error("Failed to fetch sessions:", err);
    return [];
  }
}

// ── Document Processing ──────────────────────────────────────────────────────

export async function processDocument(id: string): Promise<void> {
  try {
    // Backend route is /v1/knowledge/reprocess/:id, gateway may rewrite
    await apiFetch(`/api/v1/knowledge/documents/${id}/process`, { method: "POST" });
  } catch (err) {
    console.error("Failed to process document:", err);
    throw err;
  }
}
