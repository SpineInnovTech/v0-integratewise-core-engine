/**
 * Generated Insights View — AI-generated CSM insights with recommendations.
 * Entity: Generated_Insights
 */
import { useState } from "react";
import { Search, Sparkles, Lightbulb, CheckCircle2, Eye, X } from "lucide-react";
import { getAccountName, statusColor, type GeneratedInsight } from "../csm-intelligence-data";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";

const insightStatusColors: Record<string, string> = {
  New: "#3d7a50",
  Acknowledged: "#b8943f",
  Actioned: "#22c55e",
  Dismissed: "#6b665f",
};

export function InsightsView() {
  const {
    data: generatedInsightsData,
    isLoading,
    error,
  } = useWorkspaceEntities<GeneratedInsight>("insight");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading insights...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-64 text-iw-red">
        Failed to load data: {error}
      </div>
    );

  const filtered = generatedInsightsData
    .filter((i) => {
      if (
        search &&
        !i.insightText.toLowerCase().includes(search.toLowerCase()) &&
        !getAccountName(i.account).toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => b.dateGenerated.localeCompare(a.dateGenerated));

  const newCount = generatedInsightsData.filter((i) => i.status === "New").length;

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>
              Generated Insights
            </h2>
            <p className="text-xs text-muted-foreground">
              {generatedInsightsData.length} insights · {newCount} new · AI-powered recommendations
            </p>
          </div>
          <div
            className="px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[10px]"
            style={{
              background: "linear-gradient(135deg, #3d7a5020, #b8943f20)",
              color: "#b8943f",
              fontWeight: 600,
            }}
          >
            <Sparkles className="w-3 h-3" />
            L2 Intelligence
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-44"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Actioned">Actioned</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((ins) => (
          <div
            key={ins.insightId}
            className="rounded-xl border bg-card overflow-hidden"
            style={{ borderColor: ins.status === "New" ? "#3d7a5040" : "var(--border)" }}
          >
            {/* Header */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        ins.status === "New"
                          ? "linear-gradient(135deg, #3d7a5020, #b8943f20)"
                          : `${insightStatusColors[ins.status]}10`,
                    }}
                  >
                    {ins.status === "New" ? (
                      <Sparkles className="w-4 h-4" style={{ color: "#b8943f" }} />
                    ) : ins.status === "Actioned" ? (
                      <CheckCircle2 className="w-4 h-4 text-iw-forest-bright" />
                    ) : ins.status === "Acknowledged" ? (
                      <Eye className="w-4 h-4 text-iw-gold" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-foreground" style={{ fontWeight: 600 }}>
                        {getAccountName(ins.account)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        · {ins.csm} · {ins.dateGenerated}
                      </span>
                    </div>
                    <p className="text-xs text-foreground mt-1.5 leading-relaxed">
                      {ins.insightText}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    fontWeight: 600,
                    color: insightStatusColors[ins.status],
                    background: `${insightStatusColors[ins.status]}15`,
                  }}
                >
                  {ins.status}
                </span>
              </div>

              {/* Recommended Action */}
              <div
                className="p-3 rounded-lg border border-border/50"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(45, 90, 61,0.03), rgba(184, 148, 63,0.03))",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5" style={{ color: "#b8943f" }} />
                  <span
                    className="text-[9px] uppercase tracking-wider"
                    style={{ fontWeight: 600, color: "#b8943f" }}
                  >
                    Recommended Action
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{ins.recommendedAction}</p>
              </div>

              {/* Linkages */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-muted-foreground">Linked:</span>
                {ins.linkedMetric && (
                  <span
                    className="px-1.5 py-0.5 rounded bg-iw-forest-bright/10 text-iw-forest-mid"
                    style={{ fontWeight: 500 }}
                  >
                    {ins.linkedMetric}
                  </span>
                )}
                {ins.linkedRisk && (
                  <span
                    className="px-1.5 py-0.5 rounded bg-iw-red/10 text-iw-red"
                    style={{ fontWeight: 500 }}
                  >
                    {ins.linkedRisk}
                  </span>
                )}
                {ins.linkedInitiative && (
                  <span
                    className="px-1.5 py-0.5 rounded bg-iw-slate-mid/10 text-iw-slate-mid"
                    style={{ fontWeight: 500 }}
                  >
                    {ins.linkedInitiative}
                  </span>
                )}
                {ins.linkedObjective && (
                  <span
                    className="px-1.5 py-0.5 rounded bg-iw-forest-bright/10 text-iw-forest-mid"
                    style={{ fontWeight: 500 }}
                  >
                    {ins.linkedObjective}
                  </span>
                )}
                {!ins.linkedMetric &&
                  !ins.linkedRisk &&
                  !ins.linkedInitiative &&
                  !ins.linkedObjective && (
                    <span className="text-muted-foreground italic">No linked entities</span>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
