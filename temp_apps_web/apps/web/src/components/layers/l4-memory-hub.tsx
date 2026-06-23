"use client";

/**
 * L4 — Memory Hub (dedicated layer workbench)
 *
 * "Where you KNOW. The library. Governed knowledge."
 *
 * User intent:  Remember
 * System wire:  S7 Memory Engine (knowledge + continuity) via Gateway
 *
 * Surfaces:
 *   - Semantic search across the knowledge store     → POST /api/v1/knowledge/search
 *   - Org memory browser (decision & org memory)     → GET  /api/v1/cognitive/memories
 *   - Documents (Flow B)                             → GET  /api/v1/knowledge/documents
 *   - AI session history (conversational memory)     → GET  /api/v1/knowledge/sessions
 *
 * Doctrine: read-only projection. Memory promotion happens through
 * Governance (L7) — never directly from this surface.
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  Search,
  FileText,
  MessageSquare,
  BookOpen,
  Landmark,
  History,
  Loader2,
} from "lucide-react";
import { knowledge, cognitive } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayerShell, LayerEmptyState, LayerLoading } from "./layer-shell";

// ─── Types (organic projections — no backend schema leaks) ──────────────────

interface MemoryItem {
  id: string;
  title?: string;
  content?: string;
  summary?: string;
  type?: string;
  category?: string;
  confidence?: number;
  created_at?: string;
  updated_at?: string;
}

interface DocumentItem {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  status?: string;
  created_at?: string;
}

interface SessionItem {
  id: string;
  title?: string;
  summary?: string;
  agent?: string;
  status?: string;
  created_at?: string;
}

function asArray<T>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.results)) return res.results;
  if (Array.isArray(res?.memories)) return res.memories;
  if (Array.isArray(res?.documents)) return res.documents;
  if (Array.isArray(res?.sessions)) return res.sessions;
  return [];
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ─── Memory Card ─────────────────────────────────────────────────────────────

function MemoryCard({ item }: { item: MemoryItem }) {
  const text = item.summary || item.content || "";
  return (
    <Card className="p-0 gap-0">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium leading-snug">
            {item.title || item.category || "Memory"}
          </span>
          {item.type && (
            <Badge variant="secondary" className="text-[10px] h-5 shrink-0">
              {item.type}
            </Badge>
          )}
        </div>
        {text && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{text}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          {typeof item.confidence === "number" && (
            <span className="text-[10px] text-muted-foreground font-iw-mono">
              {Math.round(item.confidence * (item.confidence <= 1 ? 100 : 1))}% confidence
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/70">
            {formatDate(item.updated_at || item.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Workbench ──────────────────────────────────────────────────────────

export function L4MemoryHub({ domain }: { domain?: string } = {}) {
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Semantic search (only fires when a query is submitted)
  const searchQuery = useQuery({
    queryKey: ["l4", "memory-search", activeQuery, domain],
    queryFn: () =>
      knowledge.search(activeQuery, { limit: 20, ...(domain ? { workspace: domain } : {}) }),
    enabled: activeQuery.length > 1,
    staleTime: 30_000,
  });

  // Org + decision memory
  const memoriesQuery = useQuery({
    queryKey: ["l4", "memories", domain],
    queryFn: () => cognitive.memories(domain ? ({ workspace: domain } as any) : undefined),
    staleTime: 60_000,
    retry: 1,
  });

  // Documents (Flow B)
  const documentsQuery = useQuery({
    queryKey: ["l4", "documents", domain],
    queryFn: () =>
      knowledge.documents({ limit: 25, ...(domain ? ({ workspace: domain } as any) : {}) }),
    staleTime: 60_000,
    retry: 1,
  });

  // Conversational memory (AI sessions)
  const sessionsQuery = useQuery({
    queryKey: ["l4", "sessions"],
    queryFn: () => knowledge.sessions({ limit: 25 }),
    staleTime: 60_000,
    retry: 1,
  });

  const handleSearch = useCallback(() => {
    const q = searchInput.trim();
    if (q.length > 1) setActiveQuery(q);
  }, [searchInput]);

  const memories = asArray<MemoryItem>(memoriesQuery.data);
  const documents = asArray<DocumentItem>(documentsQuery.data);
  const sessions = asArray<SessionItem>(sessionsQuery.data);
  const searchResults = asArray<MemoryItem>(searchQuery.data);

  return (
    <LayerShell
      layer="L4"
      title="Knowledge Workbench"
      subtitle="Personal memory · Org memory · Decisions · Documents · Research"
      systemWire="S7 Memory Engine — knowledge + continuity"
      icon={<Brain className="w-5 h-5" />}
    >
      {/* ── Semantic Search Bar ── */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search across all memory — decisions, documents, conversations..."
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={searchInput.trim().length < 2} size="sm">
          {searchQuery.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* ── Search Results (when active) ── */}
      {activeQuery && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground">
              Results for &ldquo;{activeQuery}&rdquo;
            </span>
            <button
              onClick={() => {
                setActiveQuery("");
                setSearchInput("");
              }}
              className="text-[10px] text-muted-foreground/70 hover:text-foreground underline"
            >
              Clear
            </button>
          </div>
          {searchQuery.isLoading ? (
            <LayerLoading />
          ) : searchResults.length === 0 ? (
            <LayerEmptyState
              icon={<Search className="w-5 h-5" />}
              title="No matches found"
              hint="Try a broader query — semantic search spans memories, documents, and sessions."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {searchResults.map((m, i) => (
                <MemoryCard key={m.id || i} item={m} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Memory Tabs ── */}
      <Tabs defaultValue="org" className="w-full">
        <TabsList>
          <TabsTrigger value="org" className="gap-1.5 text-xs">
            <Landmark className="w-3.5 h-3.5" /> Org Memory
            {memories.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                {memories.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" /> Documents
            {documents.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                {documents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5 text-xs">
            <MessageSquare className="w-3.5 h-3.5" /> Conversations
            {sessions.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                {sessions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Org + Decision Memory */}
        <TabsContent value="org" className="mt-4">
          {memoriesQuery.isLoading ? (
            <LayerLoading />
          ) : memories.length === 0 ? (
            <LayerEmptyState
              icon={<BookOpen className="w-5 h-5" />}
              title="No organizational memory yet"
              hint="Memory grows as decisions are approved in Governance and knowledge is promoted from sessions."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {memories.map((m, i) => (
                <MemoryCard key={m.id || i} item={m} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents (Flow B) */}
        <TabsContent value="documents" className="mt-4">
          {documentsQuery.isLoading ? (
            <LayerLoading />
          ) : documents.length === 0 ? (
            <LayerEmptyState
              icon={<FileText className="w-5 h-5" />}
              title="No documents yet"
              hint="Upload documents via the Knowledge views — they flow through extraction into governed memory."
            />
          ) : (
            <Card className="p-0 gap-0 overflow-hidden">
              <CardContent className="p-0">
                {documents.map((d, i) => (
                  <div
                    key={d.id || i}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < documents.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium truncate">
                        {d.name || d.title || d.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.status && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          {d.status}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground/70">
                        {formatDate(d.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Conversational Memory */}
        <TabsContent value="sessions" className="mt-4">
          {sessionsQuery.isLoading ? (
            <LayerLoading />
          ) : sessions.length === 0 ? (
            <LayerEmptyState
              icon={<History className="w-5 h-5" />}
              title="No conversation history yet"
              hint="AI sessions (Flow C) appear here once you start working with the Twin."
            />
          ) : (
            <Card className="p-0 gap-0 overflow-hidden">
              <CardHeader className="px-4 py-3 border-b border-border">
                <CardTitle className="text-sm">AI Session History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sessions.map((s, i) => (
                  <div
                    key={s.id || i}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < sessions.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">
                        {s.title || s.summary || `Session ${s.id}`}
                      </div>
                      {s.agent && (
                        <div className="text-[10px] text-muted-foreground">{s.agent}</div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/70 shrink-0">
                      {formatDate(s.created_at)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </LayerShell>
  );
}

export default L4MemoryHub;
