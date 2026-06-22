/**
 * Accounts View — Grid / List / Kanban by health status
 * CSM Intelligence L1 Workspace — Clean, work-focused, no AI noise.
 */
import { useState, useMemo } from "react";
import {
  Search, Grid3x3, List, KanbanSquare, Filter, Download, Plus,
  TrendingUp, TrendingDown, Clock, ChevronDown, ExternalLink, MoreHorizontal,
  X, HeartPulse, Users, BarChart3,
} from "lucide-react";
import { accounts as allAccounts, getHealthColor, getHealthLabel, type CSMAccount } from "./csm-data";

type ViewLayout = "grid" | "list" | "kanban";

export function AccountsView() {
  const [layout, setLayout] = useState<ViewLayout>("grid");
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CSMAccount | null>(null);

  const filtered = useMemo(() => {
    return allAccounts.filter(a => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.industry.toLowerCase().includes(search.toLowerCase())) return false;
      if (tierFilter !== "all" && a.tier !== tierFilter) return false;
      if (healthFilter === "healthy" && a.healthScore < 80) return false;
      if (healthFilter === "at-risk" && (a.healthScore < 60 || a.healthScore >= 80)) return false;
      if (healthFilter === "critical" && a.healthScore >= 60) return false;
      return true;
    });
  }, [search, tierFilter, healthFilter]);

  const totalARR = filtered.reduce((s, a) => s + a.arr, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[var(--iw-success)]/30"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${showFilters ? "bg-[var(--iw-success)]/10 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <Filter className="w-3.5 h-3.5" />
              Filters
              {(tierFilter !== "all" || healthFilter !== "all") && <span className="w-1.5 h-1.5 rounded-full bg-[var(--iw-success)]" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} accounts · ${(totalARR / 1000000).toFixed(1)}M ARR</span>
            <div className="flex items-center bg-secondary rounded-lg p-0.5">
              {([["grid", Grid3x3], ["list", List], ["kanban", KanbanSquare]] as [ViewLayout, any][]).map(([id, Icon]) => (
                <button key={id} onClick={() => setLayout(id)} className={`p-1.5 rounded-md transition-colors ${layout === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-success)] text-white hover:opacity-90 transition-opacity">
              <Plus className="w-3.5 h-3.5" />
              Add Account
            </button>
          </div>
        </div>
        {/* Filter chips */}
        {showFilters && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Tier:</span>
            {["all", "enterprise", "mid-market", "smb"].map(t => (
              <button key={t} onClick={() => setTierFilter(t)} className={`px-2.5 py-1 text-xs rounded-full transition-colors ${tierFilter === t ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: tierFilter === t ? 600 : 400 }}>
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            <div className="w-px h-4 bg-border" />
            <span className="text-xs text-muted-foreground">Health:</span>
            {["all", "healthy", "at-risk", "critical"].map(h => (
              <button key={h} onClick={() => setHealthFilter(h)} className={`px-2.5 py-1 text-xs rounded-full transition-colors ${healthFilter === h ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: healthFilter === h ? 600 : 400 }}>
                {h.charAt(0).toUpperCase() + h.slice(1).replace("-", " ")}
              </button>
            ))}
            {(tierFilter !== "all" || healthFilter !== "all") && (
              <button onClick={() => { setTierFilter("all"); setHealthFilter("all"); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {layout === "grid" && <GridView accounts={filtered} onSelect={setSelectedAccount} />}
        {layout === "list" && <ListView accounts={filtered} onSelect={setSelectedAccount} />}
        {layout === "kanban" && <KanbanView accounts={filtered} onSelect={setSelectedAccount} />}
      </div>

      {/* Account Detail Drawer */}
      {selectedAccount && <AccountDetailDrawer account={selectedAccount} onClose={() => setSelectedAccount(null)} />}
    </div>
  );
}

function GridView({ accounts, onSelect }: { accounts: CSMAccount[]; onSelect: (a: CSMAccount) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {accounts.map(acc => (
        <div key={acc.id} onClick={() => onSelect(acc)} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">{acc.logo}</span>
              <div className="min-w-0">
                <h4 className="text-sm truncate" style={{ fontWeight: 600 }}>{acc.name}</h4>
                <p className="text-[11px] text-muted-foreground">{acc.tier} · {acc.industry}</p>
              </div>
            </div>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ backgroundColor: getHealthColor(acc.healthScore), fontWeight: 700 }}>
              {acc.healthScore}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ARR</p>
              <p className="text-sm" style={{ fontWeight: 600 }}>${(acc.arr / 1000).toFixed(0)}K</p>
              <span className={`text-[10px] ${acc.arrGrowth >= 0 ? "text-[var(--iw-success)]" : "text-[var(--iw-danger)]"}`}>
                {acc.arrGrowth >= 0 ? "+" : ""}{acc.arrGrowth}%
              </span>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Renewal</p>
              <p className="text-sm" style={{ fontWeight: 600 }}>{acc.renewalDays}d</p>
              <span className="text-[10px] text-muted-foreground">{acc.renewalDate}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px]" style={{ fontWeight: 600 }}>{acc.owner.initials}</div>
              <span className="text-[11px] text-muted-foreground">{acc.owner.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" /> {acc.lastTouchpoint}
            </div>
          </div>
          {acc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {acc.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ListView({ accounts, onSelect }: { accounts: CSMAccount[]; onSelect: (a: CSMAccount) => void }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
        <span>Account</span><span>ARR</span><span>Health</span><span>Renewal</span><span>Owner</span><span>Last Touch</span><span />
      </div>
      {accounts.map(acc => (
        <div key={acc.id} onClick={() => onSelect(acc)} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer items-center">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg">{acc.logo}</span>
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ fontWeight: 500 }}>{acc.name}</p>
              <p className="text-[10px] text-muted-foreground">{acc.tier} · {acc.region}</p>
            </div>
          </div>
          <div>
            <p className="text-sm" style={{ fontWeight: 600 }}>${(acc.arr / 1000).toFixed(0)}K</p>
            <span className={`text-[10px] flex items-center gap-0.5 ${acc.arrGrowth >= 0 ? "text-[var(--iw-success)]" : "text-[var(--iw-danger)]"}`}>
              {acc.arrGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {acc.arrGrowth >= 0 ? "+" : ""}{acc.arrGrowth}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: getHealthColor(acc.healthScore), fontWeight: 700 }}>
              {acc.healthScore}
            </div>
            <span className="text-[10px] text-muted-foreground">{getHealthLabel(acc.healthScore)}</span>
          </div>
          <div>
            <p className="text-sm" style={{ fontWeight: 500 }}>{acc.renewalDays}d</p>
            <p className="text-[10px] text-muted-foreground">{acc.renewalDate}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px]" style={{ fontWeight: 600 }}>{acc.owner.initials}</div>
            <span className="text-[11px] text-muted-foreground truncate">{acc.owner.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">{acc.lastTouchpoint}</span>
          <button className="p-1 rounded hover:bg-secondary"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
        </div>
      ))}
    </div>
  );
}

function KanbanView({ accounts, onSelect }: { accounts: CSMAccount[]; onSelect: (a: CSMAccount) => void }) {
  const columns = [
    { id: "healthy", label: "Healthy (80+)", color: "var(--iw-success)", accounts: accounts.filter(a => a.healthScore >= 80) },
    { id: "at-risk", label: "At Risk (60-79)", color: "var(--iw-warning)", accounts: accounts.filter(a => a.healthScore >= 60 && a.healthScore < 80) },
    { id: "critical", label: "Critical (<60)", color: "var(--iw-danger)", accounts: accounts.filter(a => a.healthScore < 60) },
  ];

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map(col => (
        <div key={col.id} className="flex-shrink-0 w-80 flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
            <span className="text-sm" style={{ fontWeight: 600 }}>{col.label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>{col.accounts.length}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              ${(col.accounts.reduce((s, a) => s + a.arr, 0) / 1000000).toFixed(1)}M
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {col.accounts.map(acc => (
              <div key={acc.id} onClick={() => onSelect(acc)} className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{acc.logo}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate" style={{ fontWeight: 500 }}>{acc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{acc.tier}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: getHealthColor(acc.healthScore), fontWeight: 700 }}>
                    {acc.healthScore}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>${(acc.arr / 1000).toFixed(0)}K ARR</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {acc.renewalDays}d renewal</span>
                </div>
                {acc.openTickets > 0 && (
                  <div className="mt-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--iw-warning)]/10 text-[var(--iw-warning)] inline-flex items-center gap-1" style={{ fontWeight: 500 }}>
                    {acc.openTickets} open tickets
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AccountDetailDrawer({ account: acc, onClose }: { account: CSMAccount; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "health" | "activity">("overview");
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{acc.logo}</span>
              <div>
                <h3 className="text-lg" style={{ fontWeight: 600 }}>{acc.name}</h3>
                <p className="text-xs text-muted-foreground">{acc.tier} · {acc.industry} · {acc.region}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            {(["overview", "health", "activity"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeTab === tab ? "bg-[var(--iw-success)]/10 text-[var(--iw-success)]" : "text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: activeTab === tab ? 600 : 400 }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === "overview" && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">ARR</p>
                  <p className="text-lg" style={{ fontWeight: 700 }}>${(acc.arr / 1000).toFixed(0)}K</p>
                  <span className={`text-[10px] ${acc.arrGrowth >= 0 ? "text-[var(--iw-success)]" : "text-[var(--iw-danger)]"}`}>
                    {acc.arrGrowth >= 0 ? "+" : ""}{acc.arrGrowth}%
                  </span>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Health</p>
                  <p className="text-lg" style={{ fontWeight: 700, color: getHealthColor(acc.healthScore) }}>{acc.healthScore}</p>
                  <span className="text-[10px] text-muted-foreground">{getHealthLabel(acc.healthScore)}</span>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Renewal</p>
                  <p className="text-lg" style={{ fontWeight: 700 }}>{acc.renewalDays}d</p>
                  <span className="text-[10px] text-muted-foreground">{acc.renewalDate}</span>
                </div>
              </div>
              {/* Details */}
              <div className="space-y-3">
                <DetailRow label="Owner" value={acc.owner.name} />
                <DetailRow label="NPS" value={`${acc.nps}`} />
                <DetailRow label="CSAT" value={`${acc.csat}/5`} />
                <DetailRow label="Contacts" value={`${acc.contacts}`} />
                <DetailRow label="Open Tickets" value={`${acc.openTickets}`} />
                <DetailRow label="Last Touch" value={acc.lastTouchpoint} />
                <DetailRow label="Sources" value={acc.sources.join(", ")} />
              </div>
              {acc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {acc.tags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "health" && (
            <>
              <div className="flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-[6px] flex items-center justify-center" style={{ borderColor: getHealthColor(acc.healthScore) }}>
                  <div className="text-center">
                    <p className="text-3xl" style={{ fontWeight: 700, color: getHealthColor(acc.healthScore) }}>{acc.healthScore}</p>
                    <p className="text-[10px] text-muted-foreground">/100</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <HealthBar label="Product Adoption" value={acc.productAdoption} max={40} />
                <HealthBar label="Engagement" value={acc.engagement} max={30} />
                <HealthBar label="Value Realization" value={acc.valueRealization} max={30} />
              </div>
            </>
          )}

          {activeTab === "activity" && (
            <div className="space-y-3">
              {[
                { time: "2h ago", text: `Email sent to ${acc.owner.name}`, type: "email" },
                { time: "1d ago", text: "Health score updated: stable", type: "system" },
                { time: "2d ago", text: "Check-in meeting completed", type: "meeting" },
                { time: "5d ago", text: "Support ticket resolved: #TSK-142", type: "ticket" },
                { time: "1w ago", text: "NPS survey response received", type: "survey" },
              ].map((ev, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--iw-success)] mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm">{ev.text}</p>
                    <p className="text-[10px] text-muted-foreground">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function HealthBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? "var(--iw-success)" : pct >= 50 ? "var(--iw-warning)" : "var(--iw-danger)";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs" style={{ fontWeight: 600 }}>{value}/{max}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
