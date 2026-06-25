/**
 * Duplicate Resolution View
 *
 * HITL UI for reviewing merge candidates from S7.5 Identity Resolution.
 * Actions: Merge / Keep Separate / Defer
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  GitMerge,
  GitFork,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
} from "lucide-react";

interface MergeCandidate {
  id: number;
  tenant_id: string;
  entity_type: string;
  source_a: string;
  external_id_a: string;
  source_b: string;
  external_id_b: string;
  confidence: number;
  matched_fields: string;
  status: string;
  name_a?: string;
  email_a?: string;
  name_b?: string;
  email_b?: string;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8786";

export function DuplicateResolutionView() {
  const [candidates, setCandidates] = useState<MergeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [resolving, setResolving] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter, limit: "50" });
      if (entityTypeFilter) params.set("entity_type", entityTypeFilter);
      const res = await fetch(`${API_BASE}/api/v1/identity/candidates?${params}`, {
        headers: { "x-tenant-id": "default" },
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    }
    setLoading(false);
  }, [filter, entityTypeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/identity/stats`, {
        headers: { "x-tenant-id": "default" },
      });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchCandidates();
    fetchStats();
  }, [fetchCandidates, fetchStats]);

  const resolve = async (id: number, action: "merge" | "keep-separate" | "defer") => {
    setResolving(id);
    try {
      const body =
        action === "merge"
          ? {
              primary_source: candidates.find((c) => c.id === id)?.source_a,
              primary_external_id: candidates.find((c) => c.id === id)?.external_id_a,
            }
          : {};
      await fetch(`${API_BASE}/api/v1/identity/candidates/${id}/${action}`, {
        method: "POST",
        headers: { "x-tenant-id": "default", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      fetchStats();
    } catch (err) {
      console.error("Failed to resolve:", err);
    }
    setResolving(null);
  };

  const confidenceColor = (c: number) =>
    c >= 0.9
      ? "text-iw-red"
      : c >= 0.7
        ? "text-iw-gold"
        : c >= 0.5
          ? "text-iw-gold"
          : "text-gray-500";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-iw-slate-mid" />
            Identity Resolution
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review potential duplicates detected by the pipeline
          </p>
        </div>
        <button
          onClick={() => {
            fetchCandidates();
            fetchStats();
          }}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(stats.merge_candidates || []).map((s: any) => (
            <div key={s.status} className="p-3 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground capitalize">{s.status}</p>
              <p className="text-2xl font-bold">{s.count}</p>
              {s.avg_confidence && (
                <p className="text-xs text-muted-foreground">
                  Avg confidence: {Math.round(s.avg_confidence * 100)}%
                </p>
              )}
            </div>
          ))}
          <div className="p-3 border rounded-lg bg-card">
            <p className="text-xs text-muted-foreground">Entity Signatures</p>
            <p className="text-2xl font-bold">{stats.total_signatures || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {["pending", "merged", "rejected", "deferred"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                filter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="text-xs border rounded-lg px-2 py-1.5 bg-background"
          aria-label="Filter by entity type"
        >
          <option value="">All types</option>
          <option value="account">Account</option>
          <option value="contact">Contact</option>
          <option value="lead">Lead</option>
          <option value="ticket">Ticket</option>
        </select>
      </div>

      {/* Candidate List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading candidates...</div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-iw-forest-bright opacity-50" />
            <p className="text-sm text-muted-foreground">No {filter} candidates</p>
          </div>
        ) : (
          candidates.map((c) => {
            const matchedFields = JSON.parse(c.matched_fields || "[]");
            return (
              <div
                key={c.id}
                className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* Entity comparison */}
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    {/* Entity A */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/30 dark:text-iw-slate-mid/60">
                          {c.source_a}
                        </span>
                        <span className="text-xs text-muted-foreground">{c.entity_type}</span>
                      </div>
                      <p className="font-medium text-sm">{c.name_a || c.external_id_a}</p>
                      {c.email_a && <p className="text-xs text-muted-foreground">{c.email_a}</p>}
                    </div>

                    {/* Entity B */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-iw-slate-mid/10 text-iw-slate dark:bg-iw-slate-mid/90/30 dark:text-iw-slate-mid/60">
                          {c.source_b}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{c.name_b || c.external_id_b}</p>
                      {c.email_b && <p className="text-xs text-muted-foreground">{c.email_b}</p>}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="text-right ml-4">
                    <p className={`text-lg font-bold ${confidenceColor(c.confidence)}`}>
                      {Math.round(c.confidence * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">match</p>
                  </div>
                </div>

                {/* Matched fields */}
                {matchedFields.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {matchedFields.map((f: string) => (
                      <span
                        key={f}
                        className="text-xs px-2 py-0.5 rounded-full bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/30 dark:text-green-300"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {filter === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => resolve(c.id, "merge")}
                      disabled={resolving === c.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-iw-forest-mid text-white hover:bg-iw-forest-mid disabled:opacity-50 transition-colors"
                    >
                      <GitMerge className="h-3.5 w-3.5" />
                      Merge
                    </button>
                    <button
                      onClick={() => resolve(c.id, "keep-separate")}
                      disabled={resolving === c.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                      <GitFork className="h-3.5 w-3.5" />
                      Keep Separate
                    </button>
                    <button
                      onClick={() => resolve(c.id, "defer")}
                      disabled={resolving === c.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-muted disabled:opacity-50 transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Defer
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DuplicateResolutionView;
