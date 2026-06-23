/**
 * BizOps — Clients
 * Client registry, health scores, ARR/MRR, active projects, engagements.
 */
import { useState } from "react";
import { Briefcase, Plus, Search, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import { formatCurrency, healthColor, type Client } from "./bizops-data";

export function ClientsView() {
  const { data: clients, isLoading } = useWorkspaceEntities<Client>("account");
  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState<"all" | "healthy" | "at-risk" | "critical">(
    "all"
  );

  const filtered = clients.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (healthFilter !== "all" && c.health !== healthFilter) return false;
    return true;
  });

  const totalARR = clients.reduce((s, c) => s + c.arr, 0);
  const totalMRR = clients.reduce((s, c) => s + c.mrr, 0);
  const atRisk = clients.filter((c) => c.health !== "healthy").length;
  const avgHealth =
    clients.length > 0
      ? Math.round(clients.reduce((s, c) => s + c.healthScore, 0) / clients.length)
      : 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[var(--iw-forest-mid)]" /> Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Client registry, health, revenue, and engagements
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total ARR", value: formatCurrency(totalARR), color: "var(--iw-success)" },
          { label: "Total MRR", value: formatCurrency(totalMRR), color: "var(--iw-forest-mid)" },
          {
            label: "Avg Health",
            value: `${avgHealth}%`,
            color:
              avgHealth >= 80
                ? "var(--iw-success)"
                : avgHealth >= 60
                  ? "var(--iw-warning)"
                  : "var(--iw-danger)",
          },
          {
            label: "At Risk",
            value: String(atRisk),
            color: atRisk > 0 ? "var(--iw-danger)" : "var(--iw-success)",
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
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-1 p-0.5 bg-secondary rounded-md">
          {(["all", "healthy", "at-risk", "critical"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setHealthFilter(f)}
              className={`px-3 py-1 rounded text-xs transition-all capitalize ${healthFilter === f ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Client grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((client) => (
          <div
            key={client.id}
            className={`bg-card border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${client.health === "critical" ? "border-[var(--iw-danger)]/30" : client.health === "at-risk" ? "border-[var(--iw-warning)]/30" : "border-border"}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{client.name}</p>
                <p className="text-xs text-muted-foreground">
                  {client.industry} · CSM: {client.csm}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: healthColor(client.health) }}
                >
                  {client.healthScore}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "ARR", value: formatCurrency(client.arr) },
                { label: "MRR", value: formatCurrency(client.mrr) },
                { label: "Projects", value: String(client.activeProjects) },
              ].map(({ label, value }) => (
                <div key={label} className="p-2 bg-secondary/50 rounded text-center">
                  <p className="text-[9px] text-muted-foreground">{label}</p>
                  <p className="text-xs font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Contract ends {client.contractEnd}
              </span>
              {client.openTickets > 0 && (
                <span className="flex items-center gap-1 text-[var(--iw-warning)]">
                  <AlertTriangle className="w-3 h-3" /> {client.openTickets} tickets
                </span>
              )}
              {client.nps !== null && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> NPS {client.nps}
                </span>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 bg-card border border-border rounded-lg p-8 text-center">
            <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No clients found. Connect your CRM to import client data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientsView;
