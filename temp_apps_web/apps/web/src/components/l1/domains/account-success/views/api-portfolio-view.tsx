/**
 * API Portfolio View — API inventory with performance, SLA, and health metrics.
 * Entity: API_Portfolio
 */
import { useState } from "react";
import {
  Search,
  Activity,
  Wifi,
  WifiOff,
  Loader2,
  AlertTriangle,
  Code,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  getAccountName,
  formatNumber,
  statusColor,
  type APIPortfolio,
} from "../csm-intelligence-data";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";

const typeColors: Record<string, string> = {
  System: "#3d7a50",
  Process: "#b8943f",
  Experience: "#3d7a50",
};

export function ApiPortfolioView() {
  const navigate = useNavigate();
  const {
    data: apiPortfolioData,
    isLoading,
    error,
  } = useWorkspaceEntities<APIPortfolio>("api_portfolio");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading API portfolio…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-iw-red mx-auto mb-2" />
          <p className="text-sm text-iw-red">Failed to load API data</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const filtered = apiPortfolioData.filter((a) => {
    if (
      search &&
      !a.apiName.toLowerCase().includes(search.toLowerCase()) &&
      !getAccountName(a.account).toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (typeFilter !== "all" && a.apiType !== typeFilter) return false;
    if (healthFilter !== "all" && a.healthStatus !== healthFilter) return false;
    return true;
  });

  const total = apiPortfolioData.length;
  const healthy = apiPortfolioData.filter((a) => a.healthStatus === "Healthy").length;
  const warning = apiPortfolioData.filter((a) => a.healthStatus === "Warning").length;
  const critical = apiPortfolioData.filter((a) => a.healthStatus === "Critical").length;
  const offline = apiPortfolioData.filter((a) => a.healthStatus === "Offline").length;

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Code className="w-5 h-5" style={{ color: "var(--iw-signal-info)" }} />
          <h1 className="text-xl font-semibold">API Portfolio</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {total} API{total !== 1 ? "s" : ""} tracked across all accounts. Performance, SLA, and
          health monitoring.
        </p>
      </div>

      {/* Summary Cards + Health Bar */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total APIs", value: total.toString(), color: "#3d7a50", icon: Code },
            { label: "Healthy", value: healthy.toString(), color: "#22c55e", icon: Wifi },
            { label: "Warning", value: warning.toString(), color: "#b8943f", icon: Activity },
            {
              label: "Critical",
              value: (critical + offline).toString(),
              color: "#ef4444",
              icon: WifiOff,
            },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <c.icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
              </div>
              <p className="text-xl font-bold" style={{ color: c.color }}>
                {c.value}
              </p>
            </div>
          ))}
        </div>
        {total > 0 && (
          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
            <div
              className="h-full bg-iw-forest-bright transition-all"
              style={{ width: `${(healthy / total) * 100}%` }}
            />
            <div
              className="h-full bg-iw-gold transition-all"
              style={{ width: `${(warning / total) * 100}%` }}
            />
            <div
              className="h-full bg-iw-red transition-all"
              style={{ width: `${((critical + offline) / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search APIs…"
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-44"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="System">System</option>
          <option value="Process">Process</option>
          <option value="Experience">Experience</option>
        </select>
        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)}
          className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none"
        >
          <option value="all">All Health</option>
          <option value="Healthy">Healthy</option>
          <option value="Warning">Warning</option>
          <option value="Critical">Critical</option>
          <option value="Offline">Offline</option>
        </select>
      </div>

      {/* Table */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Code className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-lg font-medium">No APIs tracked yet</p>
          <p className="text-sm mt-1">
            Connect Anypoint Platform or API management tool to populate this view.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No APIs match the current filters</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  {[
                    "API Name",
                    "Account",
                    "Type",
                    "Txns/mo",
                    "Resp (ms)",
                    "SLA %",
                    "Error %",
                    "Uptime",
                    "Health",
                    "Objectives",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                      style={{ fontWeight: 600 }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.apiId}
                    className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <div>
                        <span className="text-foreground" style={{ fontWeight: 600 }}>
                          {a.apiName}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          {a.apiVersion}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {a.businessCapability} · {a.ownerTeam}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                      {getAccountName(a.account)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] text-white"
                        style={{ fontWeight: 600, background: typeColors[a.apiType] }}
                      >
                        {a.apiType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-foreground" style={{ fontWeight: 500 }}>
                      {formatNumber(a.monthlyTransactions)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        style={{
                          fontWeight: 600,
                          color: a.avgResponseTimeMs > a.slaTargetMs ? "#ef4444" : "#22c55e",
                        }}
                      >
                        {a.avgResponseTimeMs}
                      </span>
                      <span className="text-muted-foreground">/{a.slaTargetMs}</span>
                    </td>
                    <td
                      className="px-3 py-2.5"
                      style={{
                        fontWeight: 600,
                        color:
                          a.slaCompliancePercent >= 99
                            ? "#22c55e"
                            : a.slaCompliancePercent >= 95
                              ? "#b8943f"
                              : "#ef4444",
                      }}
                    >
                      {a.slaCompliancePercent}%
                    </td>
                    <td
                      className="px-3 py-2.5"
                      style={{
                        fontWeight: 600,
                        color:
                          a.errorRatePercent > 0.5
                            ? "#ef4444"
                            : a.errorRatePercent > 0.1
                              ? "#b8943f"
                              : "#22c55e",
                      }}
                    >
                      {a.errorRatePercent}%
                    </td>
                    <td
                      className="px-3 py-2.5"
                      style={{
                        fontWeight: 600,
                        color: a.uptimePercent >= 99.9 ? "#22c55e" : "#b8943f",
                      }}
                    >
                      {a.uptimePercent}%
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {a.healthStatus === "Healthy" ? (
                          <Wifi className="w-3.5 h-3.5 text-iw-forest-bright" />
                        ) : a.healthStatus === "Warning" ? (
                          <Activity className="w-3.5 h-3.5 text-iw-gold" />
                        ) : (
                          <WifiOff className="w-3.5 h-3.5 text-iw-red" />
                        )}
                        <span
                          className="text-[10px]"
                          style={{ fontWeight: 600, color: statusColor(a.healthStatus) }}
                        >
                          {a.healthStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {a.linkedStrategicObjectives.map((o) => (
                          <span
                            key={o}
                            className="text-[8px] px-1 py-0.5 rounded bg-iw-forest-bright/10 text-iw-forest-mid"
                            style={{ fontWeight: 500 }}
                          >
                            {o}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
