/**
 * Service Inner Views — Tickets, Customers, Knowledge, Analytics, CSAT
 * All data from Spine SSOT service projection.
 */
import { useState, useMemo } from "react";
import {
  Ticket,
  Users,
  BookOpen,
  BarChart3,
  Star,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronRight,
  ArrowUpRight,
  Filter,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { formatCurrency, healthColor } from "../spine-projection";

/* ═══════════ Ticket Queue ═══════════ */
export function ServiceTicketsView() {
  const { data: proj } = useHydrateProjection<any>("service");
  const tickets = proj?.tickets || [];
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const filtered = useMemo(() => {
    let list = tickets;
    if (statusFilter !== "all") {
      list = list.filter((t: any) => t.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t: any) =>
          t.subject?.toLowerCase().includes(q) ||
          t.ticket_id?.toLowerCase().includes(q) ||
          t.customer_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickets, statusFilter, search]);

  const statuses = ["all", "open", "in_progress", "waiting", "resolved", "closed"];
  const statusColor: Record<string, string> = {
    open: "var(--iw-danger)",
    in_progress: "var(--iw-forest-mid)",
    waiting: "var(--iw-warning)",
    resolved: "var(--iw-success)",
    closed: "var(--muted-foreground)",
  };
  const priorityColor: Record<string, string> = {
    critical: "var(--iw-danger)",
    high: "var(--iw-danger)",
    medium: "var(--iw-warning)",
    low: "var(--iw-forest-mid)",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Tickets
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-forest-mid)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Create Ticket
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xs rounded-full capitalize ${statusFilter === s ? "bg-[var(--iw-forest-mid)]/15 text-[var(--iw-forest-mid)]" : "bg-secondary text-muted-foreground"}`}
              style={{ fontWeight: statusFilter === s ? 600 : 400 }}
            >
              {s === "all" ? `All (${tickets.length})` : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>ID</span>
            <span>Subject</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Assignee</span>
            <span>SLA</span>
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {tickets.length === 0
                ? "No tickets yet. Connect your service tools to populate."
                : "No tickets match your filters"}
            </p>
          )}
          {filtered.map((t: any) => (
            <div
              key={t.ticket_id || t.id}
              onClick={() => setSelectedTicket(t)}
              className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
            >
              <span className="text-xs" style={{ fontWeight: 600 }}>
                {t.ticket_id || t.id}
              </span>
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                  {t.subject}
                </p>
                <p className="text-[10px] text-muted-foreground">{t.customer_name || "—"}</p>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full capitalize w-fit"
                style={{
                  backgroundColor: `${priorityColor[t.priority] || "var(--muted-foreground)"}15`,
                  color: priorityColor[t.priority] || "var(--muted-foreground)",
                  fontWeight: 600,
                }}
              >
                {t.priority}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full capitalize w-fit"
                style={{
                  backgroundColor: `${statusColor[t.status] || "var(--muted-foreground)"}15`,
                  color: statusColor[t.status] || "var(--muted-foreground)",
                  fontWeight: 600,
                }}
              >
                {t.status?.replace("_", " ")}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {t.assignee || "Unassigned"}
              </span>
              <span className="text-xs text-muted-foreground">{t.sla_status || "—"}</span>
            </div>
          ))}
        </div>
      </div>
      {selectedTicket && (
        <TicketDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}

/* ═══════════ Customer Service Health ═══════════ */
export function ServiceCustomersView() {
  const { data: proj } = useHydrateProjection<any>("service");
  const customers = proj?.customers || [];
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c: any) =>
      !search ||
      c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.tier?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Customer Health
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c: any) => {
            const health = c.health_score ?? c.health ?? 0;
            return (
              <div
                key={c.customer_id || c.id}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full bg-[var(--iw-forest-mid)]/10 flex items-center justify-center text-sm"
                    style={{ fontWeight: 600, color: "var(--iw-forest-mid)" }}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm truncate" style={{ fontWeight: 600 }}>
                      {c.customer_name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground capitalize">{c.tier} tier</p>
                  </div>
                  <span
                    className="text-sm px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${healthColor(health)}15`,
                      color: healthColor(health),
                      fontWeight: 700,
                    }}
                  >
                    {health}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(health, 100)}%`,
                      backgroundColor: healthColor(health),
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{c.open_tickets ?? 0} open tickets</span>
                  <span>·</span>
                  <span>Avg resolution: {c.avg_resolution_time || "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            {customers.length === 0
              ? "No customers yet. Connect your service tools to populate."
              : "No customers match your search"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════ Knowledge Base ═══════════ */
export function ServiceKnowledgeView() {
  const { data: proj } = useHydrateProjection<any>("service");
  const articles = proj?.knowledgeArticles || proj?.knowledge_articles || [];
  const [search, setSearch] = useState("");

  const filtered = articles.filter(
    (a: any) =>
      !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Knowledge Base
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-forest-mid)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Article
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <div
              key={a.article_id || a.id}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--iw-forest-mid)]" />
                  <h4 className="text-sm" style={{ fontWeight: 600 }}>
                    {a.title}
                  </h4>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: "var(--iw-forest-mid)/10",
                    color: "var(--iw-forest-mid)",
                    fontWeight: 600,
                  }}
                >
                  {a.category || "General"}
                </span>
              </div>
              {a.excerpt && (
                <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{a.excerpt}</p>
              )}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>Views: {a.view_count ?? 0}</span>
                {a.helpfulness_rating != null && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="w-3 h-3" /> {a.helpfulness_rating}%
                    </span>
                  </>
                )}
                <span>·</span>
                <span>{a.updated_at || a.created_at || "—"}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              {articles.length === 0
                ? "No knowledge articles yet. Connect your service tools to populate."
                : "No articles match your search"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Service Analytics ═══════════ */
export function ServiceAnalyticsView() {
  const { data: proj } = useHydrateProjection<any>("service");
  const metrics = proj?.serviceMetrics || proj?.service_metrics || [];
  const summary = proj?.summary || {};
  const ticketsByDay = proj?.ticketsByDay || [];

  const sla = summary.slaCompliance ?? (metrics.length > 0 ? "—" : "—");
  const avgRes = summary.avgResolutionTime ?? "—";
  const escalation = summary.escalationRate ?? "—";
  const firstContact = summary.firstContactResolution ?? "—";

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>
        Service Analytics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="SLA Compliance"
          value={sla !== "—" ? `${sla}%` : "—"}
          color="var(--iw-success)"
        />
        <MetricCard
          label="Avg Resolution Time"
          value={avgRes !== "—" ? avgRes : "—"}
          color="var(--iw-forest-mid)"
        />
        <MetricCard
          label="Escalation Rate"
          value={escalation !== "—" ? `${escalation}%` : "—"}
          color="var(--iw-warning)"
        />
        <MetricCard
          label="First Contact Resolution"
          value={firstContact !== "—" ? `${firstContact}%` : "—"}
          color="var(--iw-gold)"
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
          Ticket Volume (Daily)
        </h3>
        <div className="h-[220px]">
          {ticketsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="opened"
                  fill="var(--iw-forest-mid)"
                  radius={[3, 3, 0, 0]}
                  barSize={10}
                />
                <Bar
                  dataKey="resolved"
                  fill="var(--iw-success)"
                  radius={[3, 3, 0, 0]}
                  barSize={10}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No trend data available yet
            </div>
          )}
        </div>
        {ticketsByDay.length > 0 && (
          <div className="flex justify-center gap-4 mt-2">
            {[
              { l: "Opened", c: "var(--iw-forest-mid)" },
              { l: "Resolved", c: "var(--iw-success)" },
            ].map((i) => (
              <span
                key={i.l}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: i.c }} />
                {i.l}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Table */}
      {metrics.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Metric</span>
            <span>Value</span>
            <span>Trend</span>
            <span>Period</span>
          </div>
          {metrics.map((m: any) => (
            <div
              key={m.metric_id || m.id || m.name}
              className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 items-center"
            >
              <span className="text-sm" style={{ fontWeight: 500 }}>
                {m.name || m.metric_name}
              </span>
              <span className="text-sm" style={{ fontWeight: 600 }}>
                {m.value}
                {m.unit || ""}
              </span>
              <span
                className="text-xs flex items-center gap-0.5"
                style={{
                  color:
                    m.trend > 0
                      ? "var(--iw-success)"
                      : m.trend < 0
                        ? "var(--iw-danger)"
                        : "var(--muted-foreground)",
                }}
              >
                {m.trend > 0 && <TrendingUp className="w-3 h-3" />}
                {m.trend < 0 && <TrendingDown className="w-3 h-3" />}
                {m.trend != null ? `${m.trend > 0 ? "+" : ""}${m.trend}%` : "—"}
              </span>
              <span className="text-xs text-muted-foreground">{m.period || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════ CSAT Metrics ═══════════ */
export function ServiceCSATView() {
  const { data: proj } = useHydrateProjection<any>("service");
  const csatResponses = proj?.csatResponses || proj?.csat_responses || [];
  const summary = proj?.summary || {};

  const overallCsat = summary.overallCsat ?? "—";
  const firstResponse = summary.firstResponseCsat ?? "—";
  const resolutionQuality = summary.resolutionQualityCsat ?? "—";
  const nps = summary.nps ?? "—";

  // Aggregate CSAT distribution from responses
  const distribution = useMemo(() => {
    if (csatResponses.length === 0) return [];
    const buckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    csatResponses.forEach((r: any) => {
      const score = r.score ?? r.rating ?? 0;
      if (score >= 1 && score <= 5) buckets[score]++;
    });
    return Object.entries(buckets).map(([score, count]) => ({
      score: `${score} star`,
      count,
    }));
  }, [csatResponses]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>
        Customer Satisfaction
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Overall CSAT"
          value={overallCsat !== "—" ? `${overallCsat}%` : "—"}
          color="var(--iw-success)"
        />
        <MetricCard
          label="First Response"
          value={firstResponse !== "—" ? `${firstResponse}%` : "—"}
          color="var(--iw-forest-mid)"
        />
        <MetricCard
          label="Resolution Quality"
          value={resolutionQuality !== "—" ? `${resolutionQuality}%` : "—"}
          color="var(--iw-gold)"
        />
        <MetricCard label="NPS" value={nps !== "—" ? `${nps}` : "—"} color="var(--iw-warning)" />
      </div>

      {distribution.length > 0 ? (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Rating Distribution
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="score" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="var(--iw-success)" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          No CSAT data yet. Connect your service tools to populate.
        </div>
      )}

      {/* Recent Responses */}
      {csatResponses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm" style={{ fontWeight: 600 }}>
            Recent Responses
          </h3>
          {csatResponses.slice(0, 10).map((r: any) => {
            const score = r.score ?? r.rating ?? 0;
            return (
              <div
                key={r.response_id || r.id}
                className="bg-card border border-border rounded-lg p-3 flex items-start gap-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor:
                      score >= 4
                        ? "rgba(0,200,83,0.1)"
                        : score >= 3
                          ? "rgba(255,152,0,0.1)"
                          : "rgba(244,67,54,0.1)",
                  }}
                >
                  {score >= 4 ? (
                    <ThumbsUp className="w-4 h-4" style={{ color: "var(--iw-success)" }} />
                  ) : (
                    <ThumbsDown
                      className="w-4 h-4"
                      style={{ color: score >= 3 ? "var(--iw-warning)" : "var(--iw-danger)" }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm" style={{ fontWeight: 500 }}>
                      {r.customer_name || "Anonymous"}
                    </span>
                    <span
                      className="text-xs"
                      style={{ fontWeight: 600, color: healthColor(score * 20) }}
                    >
                      {score}/5
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{r.comment}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{r.created_at || "—"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Ticket Drawer ─── */
function TicketDrawer({ ticket, onClose }: { ticket: any; onClose: () => void }) {
  const priorityColor: Record<string, string> = {
    critical: "var(--iw-danger)",
    high: "var(--iw-danger)",
    medium: "var(--iw-warning)",
    low: "var(--iw-forest-mid)",
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                {ticket.ticket_id || ticket.id}
              </h3>
              <p className="text-xs text-muted-foreground">{ticket.subject}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Priority</p>
              <p
                className="text-sm capitalize"
                style={{
                  fontWeight: 600,
                  color: priorityColor[ticket.priority] || "var(--muted-foreground)",
                }}
              >
                {ticket.priority}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Status</p>
              <p className="text-sm capitalize" style={{ fontWeight: 600 }}>
                {ticket.status?.replace("_", " ")}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Row label="Customer" value={ticket.customer_name || "—"} />
            <Row label="Assignee" value={ticket.assignee || "Unassigned"} />
            <Row label="Channel" value={ticket.channel || "—"} />
            <Row label="SLA Status" value={ticket.sla_status || "—"} />
            <Row label="Created" value={ticket.created_at || "—"} />
            <Row label="First Response" value={ticket.first_response_time || "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Helpers ─── */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm" style={{ fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl" style={{ fontWeight: 700, color }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
