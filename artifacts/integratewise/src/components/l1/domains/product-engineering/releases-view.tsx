/**
 * Product & Engineering Releases View
 *
 * Shows real changelog data from the Knowledge service (articles tagged "release" or "changelog")
 * with an embedded fallback of the structured CHANGELOG.md entries.
 * Used in PE_MAP via content-router.tsx.
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Calendar,
  CheckCircle,
  GitBranch,
  Zap,
  Shield,
  Bug,
  Wrench,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

/* ── Embedded changelog entries (fallback when Knowledge service is unavailable) ── */
interface ChangelogEntry {
  version: string;
  date: string;
  status: "deployed" | "in-testing" | "planned";
  sections: Array<{
    title: string;
    type: "added" | "fixed" | "changed" | "removed";
    items: string[];
  }>;
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.4.0",
    date: "2026-04-10",
    status: "deployed",
    sections: [
      {
        title: "India/Dubai Market Connectors",
        type: "added",
        items: [
          "Google Sheets connector — Sheets API v4 + Drive API v3 with OAuth",
          "Tally ERP/Prime connector — XML HTTP API for Indian accounting",
          "Razorpay connector — REST API for Indian payment processing",
          "Vyapar connector — REST API for Indian SMB invoicing",
          "Khatabook connector — REST API for Indian SMB bookkeeping",
          "Shiprocket connector — Token-based auth for e-commerce logistics",
          "Sync adapter count: 46 → 52 providers",
        ],
      },
      {
        title: "Billing System (7 disconnections resolved)",
        type: "fixed",
        items: [
          "Plan IDs unified — backend matches frontend (free/starter/growth/enterprise)",
          "Dual-schema entitlement read with fallback",
          "SubscriptionsPage mounted across all 12 domain content maps",
          "SubscriptionsPage rewritten with real TenantContext + Stripe checkout",
          "TenantProvider mounted in AppShell",
          "Free subscription auto-created on onboarding",
          "UpgradePrompt uses useNavigate() instead of dead link",
        ],
      },
      {
        title: "Loader Service",
        type: "changed",
        items: [
          "processCreamyLayer() and processBackgroundSync() call real universalSync()",
          "Graceful fallback to placeholder records if provider not in registry",
        ],
      },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-04-10",
    status: "deployed",
    sections: [
      {
        title: "Security & Infrastructure (Phase 1 Audit)",
        type: "fixed",
        items: [
          "Removed hardcoded Figma access token from source",
          "Removed MCP connector tokens from source",
          "Deleted root wrangler.toml containing credentials",
          "Resolved v3.6 split-brain across 6 service wrangler.toml files",
        ],
      },
      {
        title: "OAuth Token Refresh",
        type: "added",
        items: ["OAuth token refresh module with automatic retry and expiry detection"],
      },
      {
        title: "Product Terminology",
        type: "changed",
        items: ['Replaced all "IntegrateWise OS" references with "Knowledge Workspace"'],
      },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-04-09",
    status: "deployed",
    sections: [
      {
        title: "Repository Cleanup",
        type: "changed",
        items: [
          "Deleted 5 empty service directories",
          "Deleted legacy Bitbucket pipeline configs",
          "Deleted orphaned packages (os-ui, hub)",
          "Fixed Figma secrets in .env.example",
        ],
      },
      {
        title: "Documentation",
        type: "added",
        items: ["Activity log at .logs/ACTIVITY_LOG.md", "System flow documentation rewrite"],
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-04-08",
    status: "deployed",
    sections: [
      {
        title: "Initial Architecture",
        type: "added",
        items: [
          "22 Cloudflare Worker services (6 deployed)",
          "18 shared packages",
          "12 L1 domain views + 14 L2 cognitive overlay components",
          "Spine v2 adaptive intelligence layer",
          "Knowledge service with ~25 endpoints",
          "MCP connector with 12 tools",
          "Loader service with 8-stage pipeline",
          "Billing infrastructure (Stripe + Razorpay)",
          "46 sync adapters for third-party data ingestion",
        ],
      },
    ],
  },
];

/* ── Helpers ── */
const typeIcon: Record<string, React.ElementType> = {
  added: Zap,
  fixed: Bug,
  changed: Wrench,
  removed: Shield,
};

const typeBadgeColor: Record<string, string> = {
  added: "text-iw-forest-bright/80 border-iw-forest-bright/60/30 bg-iw-forest-bright/80/10",
  fixed: "text-iw-gold-light border-amber-400/30 bg-iw-gold-light/10",
  changed: "text-iw-slate-mid/80 border-iw-slate-mid/60/30 bg-iw-slate-mid/70/10",
  removed: "text-iw-red/70 border-iw-red/60/30 bg-iw-red/60/10",
};

const statusColor: Record<string, string> = {
  deployed: "text-iw-forest-bright/80",
  "in-testing": "text-iw-slate-mid/80",
  planned: "text-slate-400",
};

const statusIcon: Record<string, React.ElementType> = {
  deployed: CheckCircle,
  "in-testing": GitBranch,
  planned: Package,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Main Component ── */
export default function ReleasesView() {
  const [knowledgeArticles, setKnowledgeArticles] = useState<any[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set([CHANGELOG[0]?.version])
  );
  const [loading, setLoading] = useState(true);

  // Fetch release-related articles from Knowledge service
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<any>(
          "/api/v1/knowledge/search",
          { method: "POST", body: { query: "release changelog update version" } },
          "ReleaseArticles"
        );
        setKnowledgeArticles(Array.isArray(res) ? res : res.data || res.results || []);
      } catch {
        // Knowledge service unavailable — embedded changelog is the fallback
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-[var(--iw-gold)]" />
          Release Management
        </h1>
        <p className="text-slate-400 mt-1">Track releases, deployments, and what shipped</p>
        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-iw-forest-bright/80" />{" "}
            {CHANGELOG.filter((c) => c.status === "deployed").length} deployed
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-iw-forest-bright/80" />{" "}
            {CHANGELOG.reduce(
              (n, c) => n + c.sections.reduce((s, sec) => s + sec.items.length, 0),
              0
            )}{" "}
            changes tracked
          </span>
        </div>
      </div>

      {/* Knowledge service articles (if any) */}
      {knowledgeArticles.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            From Knowledge Base
          </h2>
          <div className="space-y-2">
            {knowledgeArticles.slice(0, 5).map((article: any, i: number) => (
              <div
                key={article.id || i}
                className="rounded-lg p-3 border border-white/10 bg-[var(--iw-bg-secondary)] text-sm"
              >
                <div className="font-medium text-white">
                  {article.title || article.content?.slice(0, 80) || "Untitled"}
                </div>
                {article.summary && (
                  <p className="text-slate-400 mt-1 text-xs line-clamp-2">{article.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structured changelog */}
      <div className="space-y-3">
        {CHANGELOG.map((release) => {
          const isExpanded = expandedVersions.has(release.version);
          const StatusIcon = statusIcon[release.status] || Package;

          return (
            <Card key={release.version} className="border-white/10 bg-[var(--iw-bg-secondary)]">
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => toggleVersion(release.version)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${statusColor[release.status]}`} />
                    <span className="text-white">v{release.version}</span>
                    <Badge
                      className={`text-xs ${statusColor[release.status]} border border-current/30`}
                    >
                      {release.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(release.date)}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  {release.sections.map((section, si) => {
                    const Icon = typeIcon[section.type] || Zap;
                    return (
                      <div key={si}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-white">{section.title}</span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${typeBadgeColor[section.type]}`}
                          >
                            {section.type}
                          </Badge>
                        </div>
                        <ul className="space-y-1 ml-6">
                          {section.items.map((item, ii) => (
                            <li key={ii} className="text-sm text-slate-300 flex items-start gap-2">
                              <span className="text-slate-600 mt-1.5 shrink-0">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
          <span className="text-sm text-slate-400 ml-2">
            Checking Knowledge service for updates...
          </span>
        </div>
      )}
    </div>
  );
}
