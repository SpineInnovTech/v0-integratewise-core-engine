/**
 * Business Context View — Account-level strategic context.
 * Entity: Business_Context
 */
import { useState } from "react";
import { Search, Cloud, Server, Shield } from "lucide-react";
import { getAccountName, type BusinessContext } from "../csm-intelligence-data";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";

const maturityColors: Record<string, string> = {
  Nascent: "#ef4444",
  Developing: "#b8943f",
  Advancing: "#3d7a50",
  Leading: "#22c55e",
};

export function BusinessContextView() {
  const {
    data: businessContextData,
    isLoading,
    error,
  } = useWorkspaceEntities<BusinessContext>("business_context");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading business context...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-64 text-iw-red">
        Failed to load data: {error}
      </div>
    );

  const filtered = businessContextData.filter(
    (b) => !search || getAccountName(b.account).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>
            Business Context
          </h2>
          <p className="text-xs text-muted-foreground">
            {businessContextData.length} accounts with strategic context mapped
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-48"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((b) => {
          const expanded = expandedId === b.contextId;
          return (
            <div
              key={b.contextId}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expanded ? null : b.contextId)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-iw-forest-bright to-iw-gold flex items-center justify-center text-white">
                    <Server className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate" style={{ fontWeight: 600 }}>
                      {getAccountName(b.account)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {b.businessModel} · {b.marketPosition}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      fontWeight: 600,
                      color: maturityColors[b.digitalMaturity],
                      background: `${maturityColors[b.digitalMaturity]}15`,
                    }}
                  >
                    {b.digitalMaturity}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    IT: {b.itComplexityScore}/100
                  </span>
                </div>
              </button>

              {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                      <p
                        className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1"
                        style={{ fontWeight: 600 }}
                      >
                        Operating Environment
                      </p>
                      <p className="text-xs text-foreground">{b.operatingEnvironment}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                      <p
                        className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1"
                        style={{ fontWeight: 600 }}
                      >
                        Cloud Strategy
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Cloud className="w-3 h-3 text-iw-slate-mid" />
                        <p className="text-xs text-foreground">{b.cloudStrategy}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                      <p
                        className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1"
                        style={{ fontWeight: 600 }}
                      >
                        Data Classification
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-iw-gold" />
                        <p className="text-xs text-foreground">{b.dataClassification}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                      <p
                        className="text-[9px] uppercase tracking-wider text-muted-foreground mb-2"
                        style={{ fontWeight: 600 }}
                      >
                        Key Business Challenges
                      </p>
                      <div className="space-y-1">
                        {b.keyBusinessChallenges.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-iw-gold flex-shrink-0" />
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
                      <p
                        className="text-[9px] uppercase tracking-wider text-muted-foreground mb-2"
                        style={{ fontWeight: 600 }}
                      >
                        Strategic Priorities
                      </p>
                      <div className="space-y-1">
                        {b.strategicPrioritiesCustomer.map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-iw-slate-mid flex-shrink-0" />
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1">
                    <span>Legacy Systems: {b.legacySystemCount}</span>
                    <span>IT Complexity: {b.itComplexityScore}/100</span>
                    <span>
                      Updated: {b.lastUpdated} by {b.updatedBy}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
