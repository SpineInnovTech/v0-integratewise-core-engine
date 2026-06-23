/**
 * What's New — Personal domain changelog view
 *
 * Shows the founder what changed recently in IntegrateWise.
 * Fetches recent knowledge articles tagged as releases/changelog,
 * plus an embedded structured changelog for when the Knowledge service
 * is unavailable or has no results.
 *
 * This is the dogfooding surface — Nirmal sees this from his Personal workspace.
 */

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Zap,
  Bug,
  Wrench,
  Shield,
  Calendar,
  RefreshCw,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

/* ── Recent changelog entries (embedded fallback) ── */
interface ChangeEntry {
  version: string;
  date: string;
  highlights: string[];
  type: "major" | "minor" | "patch";
}

const RECENT_CHANGES: ChangeEntry[] = [
  {
    version: "0.4.0",
    date: "2026-04-10",
    type: "minor",
    highlights: [
      "6 new connectors for India/Dubai market (Google Sheets, Tally, Razorpay, Vyapar, Khatabook, Shiprocket)",
      "Billing system fully wired end-to-end — 7 disconnections fixed",
      "Loader now uses real sync adapters instead of mock data",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-04-10",
    type: "minor",
    highlights: [
      "Security audit — removed hardcoded secrets from source",
      "OAuth token refresh module added",
      "Split-brain routing resolved across 6 services",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-04-09",
    type: "minor",
    highlights: [
      "Repository cleanup — removed 5 empty services, legacy configs",
      "Activity log created for tracking changes",
    ],
  },
];

const typeColors: Record<string, string> = {
  major: "text-iw-red/70 border-iw-red/60/30 bg-iw-red/60/10",
  minor: "text-iw-forest-bright/80 border-iw-forest-bright/60/30 bg-iw-forest-bright/80/10",
  patch: "text-iw-slate-mid/80 border-iw-slate-mid/60/30 bg-iw-slate-mid/70/10",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WhatsNewView() {
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch recent activity from Knowledge service
        const res = await apiFetch<any>("/api/v1/knowledge/memories", {}, "WhatsNew");
        const items = res.data || res.memories || [];
        setKnowledgeItems(items.slice(0, 10));
      } catch {
        // Fallback to embedded changelog only
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 md:p-8 min-h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-[var(--iw-gold)]" />
            What's New
          </h1>
          <p className="text-sm text-[var(--iw-text-secondary)]">
            Recent changes, improvements, and fixes in your Continuity Bridge
          </p>
        </div>

        {/* Activity from Knowledge service */}
        {knowledgeItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-iw-slate-mid uppercase tracking-wider mb-3">
              Recent Knowledge Activity
            </h2>
            <div className="space-y-2">
              {knowledgeItems.map((item: any, i: number) => (
                <div
                  key={item.id || i}
                  className="rounded-lg p-3 border border-border bg-card hover:border-iw-slate-mid/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {item.title || item.content?.slice(0, 100) || "Knowledge update"}
                      </p>
                      {item.category && (
                        <span className="text-xs text-iw-slate-mid mt-0.5">{item.category}</span>
                      )}
                    </div>
                    {item.created_at && (
                      <span className="text-xs text-slate-600 shrink-0">
                        {formatDate(item.created_at.split("T")[0])}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Changelog timeline */}
        <div>
          <h2 className="text-xs font-semibold text-iw-slate-mid uppercase tracking-wider mb-4">
            Release Timeline
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-iw-paper-warm/60" />

            <div className="space-y-6">
              {RECENT_CHANGES.map((release, ri) => (
                <div key={release.version} className="relative pl-9">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${
                      ri === 0
                        ? "bg-iw-forest-bright/80 border-iw-forest-bright/60/50"
                        : "bg-[var(--iw-paper-deep)] border-[var(--iw-rule)]"
                    }`}
                  />

                  <div className="rounded-xl border border-border bg-card p-4">
                    {/* Version header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">v{release.version}</span>
                        <Badge className={`text-[10px] ${typeColors[release.type]}`}>
                          {release.type}
                        </Badge>
                      </div>
                      <span className="text-xs text-iw-slate-mid flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(release.date)}
                      </span>
                    </div>

                    {/* Highlights */}
                    <ul className="space-y-2">
                      {release.highlights.map((h, hi) => (
                        <li key={hi} className="flex items-start gap-2 text-sm text-slate-300">
                          <ArrowRight className="w-3.5 h-3.5 text-[var(--iw-gold)] mt-0.5 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
            <span className="text-sm text-slate-400 ml-2">Loading latest updates...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default WhatsNewView;
