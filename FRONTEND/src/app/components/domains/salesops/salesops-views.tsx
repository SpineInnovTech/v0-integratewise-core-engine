/**
 * SalesOps Inner Views — Pipeline Kanban, Deals, Contacts, Activities, Sequences, Analytics
 * All data from Spine SSOT sales projection.
 */
import { useState, useMemo } from "react";
import {
  DollarSign, Users, Phone, Mail, Calendar, TrendingUp,
  Clock, Search, Filter, Plus, ChevronRight, MoreHorizontal,
  X, ExternalLink, MessageSquare, ArrowUpRight, Star,
  CheckCircle, Circle, Play, Pause, Zap, BarChart3, Eye,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from "recharts";
import { useSpineProjection } from "../../spine/spine-client";
import { formatCurrency, dealStageConfig, activityTypeConfig } from "../spine-projection";

/* ═══════════ Pipeline Kanban ═══════════ */
export function PipelineKanban() {
  const { data: proj } = useSpineProjection<any>("sales");
  const deals = proj?.deals || [];
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  const stages = [
    { id: "prospect", label: "Prospect", color: "#0066FF" },
    { id: "qualify", label: "Qualify", color: "#7C4DFF" },
    { id: "proposal", label: "Proposal", color: "#FF9800" },
    { id: "negotiate", label: "Negotiate", color: "#FF4081" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg" style={{ fontWeight: 600 }}>Pipeline</h2>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-sales)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Deal
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-[900px]">
          {stages.map(stage => {
            const stageDeals = deals.filter((d: any) => d.stage === stage.id);
            const total = stageDeals.reduce((s: number, d: any) => s + d.amount, 0);
            return (
              <div key={stage.id} className="flex-1 flex flex-col min-w-[220px]">
                <div className="flex items-center justify-between px-2 py-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm" style={{ fontWeight: 600 }}>{stage.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{stageDeals.length}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatCurrency(total, true)}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {stageDeals.map((deal: any) => (
                    <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer">
                      <p className="text-sm truncate" style={{ fontWeight: 500 }}>{deal.name}</p>
                      <p className="text-[10px] text-muted-foreground mb-2">{deal.accountName}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ fontWeight: 700 }}>{formatCurrency(deal.amount, true)}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[var(--iw-sales)]/10 flex items-center justify-center text-[8px]" style={{ fontWeight: 600 }}>{deal.owner?.initials}</div>
                          <span className="text-[10px] text-muted-foreground">{deal.probability}%</span>
                        </div>
                      </div>
                      {deal.daysSinceLastActivity > 5 && (
                        <div className="mt-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--iw-warning)]/10 text-[var(--iw-warning)] inline-flex items-center gap-1" style={{ fontWeight: 500 }}>
                          <Clock className="w-3 h-3" /> Stale ({deal.daysSinceLastActivity}d)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedDeal && <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />}
    </div>
  );
}

/* ═══════════ Deals List ═══════════ */
export function DealsView() {
  const { data: proj } = useSpineProjection<any>("sales");
  const deals = proj?.deals || [];
  const [filter, setFilter] = useState("open");
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  const filtered = useMemo(() => {
    if (filter === "open") return deals.filter((d: any) => !["closed-won", "closed-lost"].includes(d.stage));
    if (filter === "won") return deals.filter((d: any) => d.stage === "closed-won");
    if (filter === "lost") return deals.filter((d: any) => d.stage === "closed-lost");
    return deals;
  }, [deals, filter]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>Deals</h2>
            {["all", "open", "won", "lost"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 text-xs rounded-full ${filter === f ? "bg-[var(--iw-sales)]/15 text-[var(--iw-sales)]" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: filter === f ? 600 : 400 }}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({
                  f === "all" ? deals.length :
                  f === "open" ? deals.filter((d: any) => !["closed-won", "closed-lost"].includes(d.stage)).length :
                  f === "won" ? deals.filter((d: any) => d.stage === "closed-won").length :
                  deals.filter((d: any) => d.stage === "closed-lost").length
                })
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-sales)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Deal
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
            <span>Deal</span><span>Stage</span><span>Amount</span><span>Probability</span><span>Owner</span><span>Close Date</span>
          </div>
          {filtered.map((d: any) => {
            const cfg = dealStageConfig[d.stage] || {};
            return (
              <div key={d.id} onClick={() => setSelectedDeal(d)} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center">
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ fontWeight: 500 }}>{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">{d.accountName}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full w-fit" style={{ backgroundColor: `${cfg.color || "#999"}20`, color: cfg.color, fontWeight: 600 }}>
                  {cfg.label || d.stage}
                </span>
                <span className="text-sm" style={{ fontWeight: 600 }}>{formatCurrency(d.amount, true)}</span>
                <span className="text-sm">{d.probability}%</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[var(--iw-sales)]/10 flex items-center justify-center text-[8px]" style={{ fontWeight: 600 }}>{d.owner?.initials}</div>
                  <span className="text-xs text-muted-foreground truncate">{d.owner?.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{d.closeDate}</span>
              </div>
            );
          })}
        </div>
      </div>
      {selectedDeal && <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />}
    </div>
  );
}

/* ═══════════ Contacts ═══════════ */
export function ContactsView() {
  const { data: proj } = useSpineProjection<any>("sales");
  const contacts = proj?.contacts || [];
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.accountName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>Contacts</h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-sales)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Add Contact
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c: any) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--iw-sales)]/10 flex items-center justify-center text-sm" style={{ fontWeight: 600, color: "var(--iw-sales)" }}>
                  {c.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm truncate" style={{ fontWeight: 600 }}>{c.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{c.title}</p>
                  <p className="text-[11px] text-muted-foreground">{c.accountName}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: c.leadScore >= 80 ? "rgba(0,200,83,0.1)" : c.leadScore >= 60 ? "rgba(255,152,0,0.1)" : "rgba(189,189,189,0.1)", color: c.leadScore >= 80 ? "var(--iw-success)" : c.leadScore >= 60 ? "var(--iw-warning)" : "var(--muted-foreground)", fontWeight: 600 }}>
                  {c.leadScore}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="capitalize">{c.lifecycle}</span>
                <span>·</span>
                <span>{c.lastActivity}</span>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No contacts found</p>}
      </div>
    </div>
  );
}

/* ═══════════ Activities ═══════════ */
export function ActivitiesView() {
  const { data: proj } = useSpineProjection<any>("sales");
  const activities = proj?.activities || [];
  const activityByDay = proj?.activityByDay || [];
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = typeFilter === "all" ? activities : activities.filter((a: any) => a.type === typeFilter);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>Activities</h2>
            {["all", "email", "call", "meeting", "note"].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-2.5 py-1 text-xs rounded-full ${typeFilter === t ? "bg-[var(--iw-sales)]/15 text-[var(--iw-sales)]" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: typeFilter === t ? 600 : 400 }}>
                {t === "all" ? "All" : activityTypeConfig[t]?.label || t}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-sales)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Log Activity
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Activity Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>This Week</h3>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="calls" fill="var(--iw-success)" radius={[3, 3, 0, 0]} barSize={8} />
                <Bar dataKey="emails" fill="var(--iw-blue)" radius={[3, 3, 0, 0]} barSize={8} />
                <Bar dataKey="meetings" fill="var(--iw-purple)" radius={[3, 3, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-2">
          {filtered.slice(0, 15).map((a: any) => {
            const cfg = activityTypeConfig[a.type] || { label: a.type, color: "var(--muted-foreground)", icon: "📌" };
            return (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ backgroundColor: `${cfg.color}15` }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ fontWeight: 500 }}>{a.subject}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span>{cfg.label}</span>
                    {a.accountId && <span>· Account</span>}
                    <span>· {a.owner}</span>
                    <span className="ml-auto">{a.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activities recorded</p>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Sequences ═══════════ */
export function SequencesView() {
  const sequences = [
    { id: "s1", name: "Enterprise Outbound", status: "active", enrolled: 45, replied: 12, converted: 5, steps: 5, avgOpen: 34 },
    { id: "s2", name: "Mid-Market Follow-up", status: "active", enrolled: 78, replied: 22, converted: 8, steps: 4, avgOpen: 28 },
    { id: "s3", name: "Renewal Nurture", status: "active", enrolled: 32, replied: 18, converted: 14, steps: 3, avgOpen: 52 },
    { id: "s4", name: "Cold Outreach — APAC", status: "paused", enrolled: 120, replied: 15, converted: 3, steps: 6, avgOpen: 18 },
    { id: "s5", name: "Event Follow-up", status: "draft", enrolled: 0, replied: 0, converted: 0, steps: 3, avgOpen: 0 },
  ];

  const statusColor: Record<string, string> = { active: "var(--iw-success)", paused: "var(--iw-warning)", draft: "var(--muted-foreground)" };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg" style={{ fontWeight: 600 }}>Sequences</h2>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-sales)] text-white hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> New Sequence
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Active Sequences" value={`${sequences.filter(s => s.status === "active").length}`} color="var(--iw-success)" />
        <MetricCard label="Total Enrolled" value={`${sequences.reduce((s, sq) => s + sq.enrolled, 0)}`} color="var(--iw-blue)" />
        <MetricCard label="Avg Reply Rate" value={`${Math.round(sequences.filter(s => s.enrolled > 0).reduce((s, sq) => s + (sq.replied / sq.enrolled) * 100, 0) / sequences.filter(s => s.enrolled > 0).length)}%`} color="var(--iw-purple)" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
          <span>Sequence</span><span>Status</span><span>Enrolled</span><span>Replied</span><span>Converted</span><span>Open Rate</span><span />
        </div>
        {sequences.map(s => (
          <div key={s.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center">
            <div>
              <p className="text-sm" style={{ fontWeight: 500 }}>{s.name}</p>
              <p className="text-[10px] text-muted-foreground">{s.steps} steps</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full capitalize w-fit" style={{ backgroundColor: `${statusColor[s.status]}15`, color: statusColor[s.status], fontWeight: 600 }}>
              {s.status}
            </span>
            <span className="text-sm">{s.enrolled}</span>
            <span className="text-sm">{s.replied}</span>
            <span className="text-sm" style={{ fontWeight: 600, color: "var(--iw-success)" }}>{s.converted}</span>
            <span className="text-sm">{s.avgOpen}%</span>
            <button className="p-1 rounded hover:bg-secondary">
              {s.status === "active" ? <Pause className="w-3.5 h-3.5 text-muted-foreground" /> : <Play className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ Sales Analytics ═══════════ */
export function SalesAnalyticsView() {
  const { data: proj } = useSpineProjection<any>("sales");
  const deals = proj?.deals || [];
  const summary = proj?.summary || {};

  const weeklyTrend = [
    { week: "W1", created: 4, closed: 2, lost: 1 },
    { week: "W2", created: 6, closed: 3, lost: 0 },
    { week: "W3", created: 3, closed: 1, lost: 2 },
    { week: "W4", created: 7, closed: 4, lost: 1 },
    { week: "W5", created: 5, closed: 2, lost: 0 },
    { week: "W6", created: 8, closed: 3, lost: 1 },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>Sales Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Win Rate" value={`${summary.winRate || 38}%`} color="var(--iw-success)" sub="+5% vs Q4" />
        <MetricCard label="Avg Deal Cycle" value="34 days" color="var(--iw-blue)" />
        <MetricCard label="Activity Score" value="8.2/10" color="var(--iw-purple)" />
        <MetricCard label="Pipeline Velocity" value="$48K/wk" color="var(--iw-warning)" />
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>Deal Flow (Weekly)</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="created" fill="var(--iw-blue)" radius={[3, 3, 0, 0]} barSize={14} />
              <Bar dataKey="closed" fill="var(--iw-success)" radius={[3, 3, 0, 0]} barSize={14} />
              <Bar dataKey="lost" fill="var(--iw-danger)" radius={[3, 3, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {[{ l: "Created", c: "var(--iw-blue)" }, { l: "Closed Won", c: "var(--iw-success)" }, { l: "Lost", c: "var(--iw-danger)" }].map(i => (
            <span key={i.l} className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: i.c }} />{i.l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Deal Drawer ─── */
function DealDrawer({ deal, onClose }: { deal: any; onClose: () => void }) {
  const cfg = dealStageConfig[deal.stage] || {};
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg" style={{ fontWeight: 600 }}>{deal.name}</h3>
              <p className="text-xs text-muted-foreground">{deal.accountName}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Amount</p>
              <p className="text-lg" style={{ fontWeight: 700 }}>{formatCurrency(deal.amount, true)}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Stage</p>
              <p className="text-sm" style={{ fontWeight: 600, color: cfg.color }}>{cfg.label || deal.stage}</p>
            </div>
          </div>
          <div className="space-y-3">
            <Row label="Probability" value={`${deal.probability}%`} />
            <Row label="Close Date" value={deal.closeDate} />
            <Row label="Owner" value={deal.owner?.name || "—"} />
            <Row label="Next Step" value={deal.nextStep || "No next step defined"} />
            <Row label="Days Since Activity" value={`${deal.daysSinceLastActivity} days`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function MetricCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl" style={{ fontWeight: 700, color }}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}