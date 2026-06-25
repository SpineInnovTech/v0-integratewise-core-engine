/**
 * BizOps — CRM
 * Leads pipeline (New → Contacted → Qualified → Converted), activities, scoring.
 */
import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  TrendingUp,
  Filter,
} from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import { formatCurrency, stageColor, type Lead, type LeadStage } from "./bizops-data";

const STAGES: { id: LeadStage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "converted", label: "Converted" },
];

const SOURCE_ICONS: Record<string, string> = {
  linkedin: "💼",
  website: "🌐",
  referral: "🤝",
  inbound: "📥",
  outbound: "📤",
  other: "📋",
};

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: MessageSquare,
};

export function CRMView() {
  const { data: leads, isLoading } = useWorkspaceEntities<Lead>("contact");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all");

  const filtered = leads.filter((l) => {
    if (
      search &&
      !l.name.toLowerCase().includes(search.toLowerCase()) &&
      !l.company.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (stageFilter !== "all" && l.stage !== stageFilter) return false;
    return true;
  });

  const pipelineValue = leads
    .filter((l) => l.stage === "qualified")
    .reduce((s, l) => s + l.value, 0);
  const conversionRate =
    leads.length > 0
      ? Math.round((leads.filter((l) => l.stage === "converted").length / leads.length) * 100)
      : 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--iw-warning)]" /> CRM
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lead pipeline, activities, and conversion tracking
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Leads", value: leads.length, color: "var(--iw-forest-mid)" },
          {
            label: "Pipeline Value",
            value: formatCurrency(pipelineValue),
            color: "var(--iw-success)",
          },
          { label: "Conversion Rate", value: `${conversionRate}%`, color: "var(--iw-warning)" },
          {
            label: "Qualified",
            value: leads.filter((l) => l.stage === "qualified").length,
            color: "var(--iw-gold)",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-bold" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as any)}
            className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex p-0.5 bg-secondary rounded-md">
            {(["kanban", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded text-xs transition-all capitalize ${view === v ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban */}
      {view === "kanban" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((stage) => {
            const stageLeads = filtered.filter((l) => l.stage === stage.id);
            const stageValue = stageLeads.reduce((s, l) => s + l.value, 0);
            return (
              <div key={stage.id}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stageColor(stage.id) }}
                    />
                    <span className="text-xs font-semibold">{stage.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {stageLeads.length} · {formatCurrency(stageValue)}
                  </span>
                </div>
                <div className="space-y-2">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium truncate">{lead.name}</p>
                        <span className="text-[10px] ml-1 shrink-0">
                          {SOURCE_ICONS[lead.source] || "📋"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">{lead.company}</p>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--iw-success)" }}
                        >
                          {formatCurrency(lead.value)}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] text-primary font-bold">
                            {lead.score}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-[11px] text-muted-foreground">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["Name", "Company", "Source", "Stage", "Value", "Score", "Assigned"].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2.5 px-4 text-xs text-muted-foreground font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-medium">{lead.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{lead.company}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-xs">
                      {SOURCE_ICONS[lead.source]} {lead.source}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium"
                      style={{
                        backgroundColor: `${stageColor(lead.stage)}15`,
                        color: stageColor(lead.stage),
                      }}
                    >
                      {lead.stage}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(lead.value)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <div className="w-full max-w-[60px] h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--iw-forest-mid)]"
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{lead.score}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{lead.assignedTo}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No leads found. Connect HubSpot or add leads manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CRMView;
