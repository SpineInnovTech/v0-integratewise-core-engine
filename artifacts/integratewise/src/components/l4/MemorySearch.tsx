/**
 * MemorySearch — Hybrid search across memory stores
 *
 * Searches org_memory, personal_memory, conversational_memory
 * scoped to tenant + active domain. Displays source/evidence.
 *
 * Phase 8 Task 36
 * Requirements: 9.4, 9.5
 */

import React, { useState } from "react";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string;
  evidence_refs: string[];
  confidence: number;
  store: "org_memory" | "personal_memory" | "conversational_memory";
  created_at: string;
}

interface Props {
  tenantId: string;
  domain?: string;
}

export function MemorySearch({ tenantId, domain }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch("/api/v1/memory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          tenant_id: tenantId,
          domain: domain || undefined,
          limit: 20,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="memory-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memory (semantic + keyword)..."
          className="search-input"
        />
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {searched && results.length === 0 && !loading && (
        <p className="no-results">No results found.</p>
      )}

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.id} className="search-result">
              <div className="result-header">
                <strong>{r.title}</strong>
                <span className="store-badge">{r.store}</span>
                <span className="confidence">{(r.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="result-content">{r.content.slice(0, 200)}...</p>
              <div className="result-meta">
                <span>Category: {r.category}</span>
                <span>Source: {r.source}</span>
                {r.evidence_refs.length > 0 && (
                  <span>Evidence: {r.evidence_refs.join(", ")}</span>
                )}
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
