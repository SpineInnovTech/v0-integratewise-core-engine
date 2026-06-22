/**
 * Account Master View — Full account intelligence table with drilldown narrative.
 * Entity: Account_Master (16 fields visible, full detail on expand)
 */
import { useState } from "react";
import { Search, Filter, ChevronDown, ChevronUp, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { accountMasterData, formatCurrency, healthColor, riskColor, type AccountMaster } from "../csm-intelligence-data";

const trendIcon = (trend: string) => {
  if (trend === "Improving") return <TrendingUp className="w-3 h-3 text-green-500" />;
  if (trend === "Declining") return <TrendingDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

export function AccountMasterView() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"healthScore" | "arr" | "daysToRenewal">("healthScore");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = accountMasterData
    .filter(a => {
      if (search && !a.accountName.toLowerCase().includes(search.toLowerCase()) && !a.accountId.toLowerCase().includes(search.toLowerCase())) return false;
      if (riskFilter !== "all" && a.renewalRiskLevel !== riskFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      return mul * ((a[sortBy] as number) - (b[sortBy] as number));
    });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(false); }
  };

  const SortHeader = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button onClick={() => toggleSort(col)} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
      {label}
      {sortBy === col && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
    </button>
  );

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>Account Master</h2>
          <p className="text-xs text-muted-foreground">{accountMasterData.length} accounts · SSOT entity table</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-48" />
          </div>
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Risk Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total ARR", value: formatCurrency(accountMasterData.reduce((s, a) => s + a.arr, 0)), color: "#3b82f6" },
          { label: "Avg Health", value: `${Math.round(accountMasterData.reduce((s, a) => s + a.healthScore, 0) / accountMasterData.length)}`, color: "#22c55e" },
          { label: "At Risk", value: `${accountMasterData.filter(a => a.renewalRiskLevel === "Critical" || a.renewalRiskLevel === "High").length}`, color: "#ef4444" },
          { label: "Avg Days to Renewal", value: `${Math.round(accountMasterData.reduce((s, a) => s + a.daysToRenewal, 0) / accountMasterData.length)}`, color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="text-xl mt-1" style={{ fontWeight: 700, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 600 }}>Account</th>
                <th className="text-left px-3 py-2.5"><SortHeader col="healthScore" label="Health" /></th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground hidden md:table-cell" style={{ fontWeight: 600 }}>Trend</th>
                <th className="text-left px-3 py-2.5"><SortHeader col="arr" label="ARR" /></th>
                <th className="text-left px-3 py-2.5"><SortHeader col="daysToRenewal" label="Renewal" /></th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 600 }}>Risk</th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 600 }}>CSM</th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground hidden xl:table-cell" style={{ fontWeight: 600 }}>Industry</th>
                <th className="px-3 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <AccountRow key={a.accountId} account={a} expanded={expandedId === a.accountId} onToggle={() => setExpandedId(expandedId === a.accountId ? null : a.accountId)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AccountRow({ account: a, expanded, onToggle }: { account: AccountMaster; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="border-b border-border/50 hover:bg-secondary/20 cursor-pointer transition-colors" onClick={onToggle}>
        <td className="px-3 py-2.5">
          <div className="flex flex-col">
            <span style={{ fontWeight: 600 }} className="text-foreground">{a.accountName}</span>
            <span className="text-[10px] text-muted-foreground">{a.accountId} · {a.country}</span>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs" style={{ fontWeight: 700, background: healthColor(a.healthScore) }}>{a.healthScore}</div>
          </div>
        </td>
        <td className="px-3 py-2.5 hidden md:table-cell">
          <div className="flex items-center gap-1">
            {trendIcon(a.healthScoreTrend3M)}
            <span className="text-[10px] text-muted-foreground">{a.healthScoreChange > 0 ? "+" : ""}{a.healthScoreChange}</span>
          </div>
        </td>
        <td className="px-3 py-2.5" style={{ fontWeight: 600 }}>{formatCurrency(a.arr)}</td>
        <td className="px-3 py-2.5">
          <span className={`${a.daysToRenewal <= 30 ? "text-red-500" : a.daysToRenewal <= 90 ? "text-amber-500" : "text-foreground"}`} style={{ fontWeight: 500 }}>
            {a.daysToRenewal}d
          </span>
        </td>
        <td className="px-3 py-2.5 hidden lg:table-cell">
          <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 600, color: riskColor(a.renewalRiskLevel), background: `${riskColor(a.renewalRiskLevel)}15` }}>{a.renewalRiskLevel}</span>
        </td>
        <td className="px-3 py-2.5 hidden lg:table-cell text-muted-foreground">{a.customerSuccessManager}</td>
        <td className="px-3 py-2.5 hidden xl:table-cell text-muted-foreground">{a.industryVertical}</td>
        <td className="px-3 py-2.5">{expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={9} className="px-4 py-4 bg-secondary/10 border-b border-border">
            <div className="space-y-3">
              {/* Narrative */}
              <div className="p-3 rounded-lg bg-card border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1" style={{ fontWeight: 600 }}>CSM Narrative</p>
                <p className="text-xs text-foreground leading-relaxed">{a.csmNarrative}</p>
              </div>
              {/* Detail Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  { l: "Contract Type", v: a.contractType },
                  { l: "Contract Period", v: `${a.contractStartDate} → ${a.contractEndDate}` },
                  { l: "ACV", v: formatCurrency(a.acv) },
                  { l: "S&P Rating", v: a.spRating },
                  { l: "Customer Revenue", v: formatCurrency(a.customerAnnualRevenue) },
                  { l: "Employees", v: a.employeeCount.toLocaleString() },
                  { l: "Geography", v: a.geography },
                  { l: "Account Executive", v: a.accountExecutive },
                  { l: "Solutions Architect", v: a.solutionsArchitect },
                  { l: "Exec Sponsor (Customer)", v: a.executiveSponsorCustomer },
                  { l: "Exec Sponsor (MuleSoft)", v: a.executiveSponsorMuleSoft },
                  { l: "Engagement Cadence", v: a.engagementCadence },
                  { l: "Last Engagement", v: a.lastEngagementDate },
                  { l: "Next Engagement", v: a.nextEngagementDue },
                  { l: "Data Source", v: a.dataSource },
                  { l: "Last Modified", v: `${a.lastModified} by ${a.modifiedBy}` },
                ].map(d => (
                  <div key={d.l} className="p-2 rounded-lg bg-card border border-border/50">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{d.l}</p>
                    <p className="text-xs text-foreground mt-0.5" style={{ fontWeight: 500 }}>{d.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
