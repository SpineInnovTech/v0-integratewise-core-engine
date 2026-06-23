/**
 * BizOps — Sales Hub
 * Pipeline kanban, win rate, avg deal size, sales velocity.
 */
import { useState } from "react";
import { TrendingUp, Plus, DollarSign, Target, Zap, Clock } from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import { formatCurrency, stageColor, type Deal, type DealStage } from "./bizops-data";

const STAGES: { id: DealStage; label: string }[] = [
  { id: "discovery", label: "Discovery" },
  { id: "qualification", label: "Qualification" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export function SalesHubView() {
  const { data: deals, isLoading } = useWorkspaceEntities<Deal>("opportunity");
  const [stageFilter, setStageFilter] = useState<"active" | "all">("active");

  const activeDeals = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === "won");
  const lostDeals = deals.filter((d) => d.stage === "lost");

  const winRate =
    wonDeals.length + lostDeals.length > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;
  const avgDealSize =
    wonDeals.length > 0
      ? Math.round(wonDeals.reduce((s, d) => s + d.value, 0) / wonDeals.length)
      : 0;
  const pipelineValue = activeDeals.reduce((s, d) => s + d.value, 0);
  // Sales velocity = (deals × winRate × ACV) / avgCycleDays
  const salesVelocity =
    avgDealSize > 0 ? Math.round((activeDeals.length * (winRate / 100) * avgDealSize) / 30) : 0;

  const displayDeals = stageFilter === "active" ? activeDeals : deals;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--iw-success)]" /> Sales Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pipeline, win rate, deal velocity</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      {/* Sales Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Pipeline Value",
            value: formatCurrency(pipelineValue),
            icon: DollarSign,
            color: "var(--iw-forest-mid)",
          },
          { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "var(--iw-success)" },
          {
            label: "Avg Deal Size",
            value: formatCurrency(avgDealSize),
            icon: DollarSign,
            color: "var(--iw-warning)",
          },
          {
            label: "Sales Velocity",
            value: `${formatCurrency(salesVelocity)}/mo`,
            icon: Zap,
            color: "var(--iw-gold)",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${color}15`, color }}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Stage filter */}
      <div className="flex items-center gap-2">
        <div className="flex p-0.5 bg-secondary rounded-md">
          {(["active", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStageFilter(f)}
              className={`px-3 py-1 rounded text-xs transition-all capitalize ${stageFilter === f ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {f === "active" ? "Active Deals" : "All Deals"}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{displayDeals.length} deals</span>
      </div>

      {/* Pipeline Kanban */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {STAGES.filter((s) => stageFilter === "all" || !["won", "lost"].includes(s.id)).map(
          (stage) => {
            const stageDeals = displayDeals.filter((d) => d.stage === stage.id);
            const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
            return (
              <div key={stage.id}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stageColor(stage.id) }}
                    />
                    <span className="text-xs font-semibold">{stage.label}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{stageDeals.length}</span>
                </div>
                <div className="space-y-2">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <p className="text-xs font-semibold truncate mb-1">{deal.name}</p>
                      <p className="text-[10px] text-muted-foreground mb-2">{deal.company}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold" style={{ color: "var(--iw-success)" }}>
                          {formatCurrency(deal.value)}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {deal.probability}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">{deal.closeDate}</span>
                      </div>
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-lg p-3 text-center text-[10px] text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
                {stageValue > 0 && (
                  <div className="mt-2 px-1 text-[10px] text-muted-foreground font-medium">
                    {formatCurrency(stageValue)}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      {deals.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No deals yet. Connect your CRM or add deals manually.
          </p>
        </div>
      )}
    </div>
  );
}

export default SalesHubView;
