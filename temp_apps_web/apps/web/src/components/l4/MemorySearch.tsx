"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, FileText, User, MessageSquare } from "lucide-react";
import { useGatewayQuery } from "@/hooks/use-gateway-query";

// ─── Types ───────────────────────────────────────────────────────────────────

type MemorySource = "org_memory" | "personal_memory" | "conversational_memory";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  source: MemorySource;
  domain?: string;
  evidence_refs?: string[];
  score: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SOURCE_META: Record<MemorySource, { label: string; Icon: typeof FileText; color: string }> = {
  org_memory: { label: "Org", Icon: FileText, color: "text-iw-forest" },
  personal_memory: { label: "Personal", Icon: User, color: "text-blue-600" },
  conversational_memory: { label: "Conversation", Icon: MessageSquare, color: "text-purple-600" },
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * MemorySearch — Hybrid search across org, personal, and conversational memory.
 * Scoped to tenant + active domain. Uses GET /api/v1/knowledge/search.
 */
export function MemorySearch() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data, isLoading, error, isFetching } = useGatewayQuery<SearchResponse>(
    ["memory", "search", submittedQuery],
    "/api/v1/knowledge/search",
    { q: submittedQuery },
    { enabled: !!submittedQuery }
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) setSubmittedQuery(trimmed);
    },
    [query]
  );

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Search form */}
      <form onSubmit={handleSubmit} role="search" aria-label="Search memory">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across org, personal, and conversational memory..."
            aria-label="Memory search query"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-iw-forest focus:border-transparent"
          />
          {isFetching && (
            <Loader2
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400"
              aria-hidden="true"
            />
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div role="alert" className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">
          Search failed: {error.message ?? "Unknown error"}
        </div>
      )}

      {/* Loading state (initial) */}
      {isLoading && submittedQuery && (
        <div className="flex items-center justify-center py-8" role="status">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" aria-hidden="true" />
          <span className="sr-only">Searching...</span>
        </div>
      )}

      {/* Results */}
      {data && !isLoading && (
        <>
          <p className="text-xs text-gray-500">
            {data.total} result{data.total !== 1 ? "s" : ""} for &ldquo;{submittedQuery}&rdquo;
          </p>

          {data.results.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              No matching memory found. Try different terms.
            </p>
          ) : (
            <ul className="space-y-3" aria-label="Search results">
              {data.results.map((result) => {
                const sourceMeta = SOURCE_META[result.source];
                const { Icon } = sourceMeta;

                return (
                  <li
                    key={result.id}
                    className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium text-gray-900">{result.title}</p>
                        <p className="text-xs text-gray-600 line-clamp-2">{result.snippet}</p>
                        {result.evidence_refs?.length ? (
                          <p className="text-xs text-gray-400 truncate">
                            Evidence: {result.evidence_refs.join(", ")}
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${sourceMeta.color} shrink-0`}
                        aria-label={`Source: ${sourceMeta.label}`}
                      >
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        {sourceMeta.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Empty initial state */}
      {!submittedQuery && !isLoading && (
        <p className="py-8 text-center text-sm text-gray-400">
          Enter a query to search across all memory layers.
        </p>
      )}
    </div>
  );
}
