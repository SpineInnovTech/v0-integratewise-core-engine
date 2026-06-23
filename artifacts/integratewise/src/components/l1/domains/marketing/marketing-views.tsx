/**
 * Marketing Inner Views — Campaigns, Leads, Analytics, Forms, Email, Social, Blog, Website
 * All data from Spine SSOT marketing projection.
 */
import { useState, useMemo } from "react";
import {
  Megaphone,
  Users,
  BarChart3,
  Mail,
  Share2,
  FileText,
  Globe,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  MousePointerClick,
  Eye,
  FormInput,
  CheckCircle,
  MoreHorizontal,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { formatCurrency, healthColor } from "../spine-projection";

/* ═══════════ Campaigns ═══════════ */
export function MarketingCampaignsView() {
  const { data: proj } = useHydrateProjection<any>("marketing");
  const campaigns = proj?.campaigns || [];
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return campaigns;
    return campaigns.filter((c: any) => c.status === statusFilter);
  }, [campaigns, statusFilter]);

  const statuses = ["all", "active", "scheduled", "completed", "paused"];
  const statusColor: Record<string, string> = {
    active: "var(--iw-success)",
    scheduled: "var(--iw-forest-mid)",
    completed: "var(--iw-gold)",
    paused: "var(--iw-warning)",
    draft: "var(--muted-foreground)",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Campaigns
            </h2>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-full capitalize ${statusFilter === s ? "bg-[var(--iw-gold)]/15 text-[var(--iw-gold)]" : "bg-secondary text-muted-foreground"}`}
                style={{ fontWeight: statusFilter === s ? 600 : 400 }}
              >
                {s === "all" ? `All (${campaigns.length})` : s}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-gold)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Campaign
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {filtered.map((c: any) => {
            const progress = c.progress ?? 0;
            return (
              <div
                key={c.campaign_id || c.id}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm" style={{ fontWeight: 600 }}>
                      {c.name || c.campaign_name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {c.channel || "Multi-channel"} · {c.start_date || "—"} — {c.end_date || "—"}
                    </p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                    style={{
                      backgroundColor: `${statusColor[c.status] || "var(--muted-foreground)"}15`,
                      color: statusColor[c.status] || "var(--muted-foreground)",
                      fontWeight: 600,
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Budget</span>
                    <p style={{ fontWeight: 600 }}>
                      {c.budget ? formatCurrency(c.budget, true) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Pipeline</span>
                    <p style={{ fontWeight: 600 }}>
                      {c.pipeline_generated ? formatCurrency(c.pipeline_generated, true) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Leads</span>
                    <p style={{ fontWeight: 600 }}>{c.leads_generated ?? "—"}</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--iw-gold)]"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{progress}% complete</p>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              {campaigns.length === 0
                ? "No campaigns yet. Connect your marketing tools to populate."
                : "No campaigns match this filter"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Lead Queue ═══════════ */
export function MarketingLeadsView() {
  const { data: proj } = useHydrateProjection<any>("marketing");
  const leads = proj?.leads || [];
  const [search, setSearch] = useState("");

  const filtered = leads.filter(
    (l: any) =>
      !search ||
      l.company?.toLowerCase().includes(search.toLowerCase()) ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.source?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Leads
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-gold)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Add Lead
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Lead</span>
            <span>Source</span>
            <span>Score</span>
            <span>Status</span>
            <span>Last Activity</span>
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {leads.length === 0
                ? "No leads yet. Connect your marketing tools to populate."
                : "No leads match your search"}
            </p>
          )}
          {filtered.map((l: any) => {
            const score = l.lead_score ?? l.score ?? 0;
            return (
              <div
                key={l.lead_id || l.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                    {l.name || l.company}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{l.company || l.email || "—"}</p>
                </div>
                <span className="text-xs text-muted-foreground capitalize">{l.source || "—"}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full w-fit"
                  style={{
                    backgroundColor: `${healthColor(score)}15`,
                    color: healthColor(score),
                    fontWeight: 600,
                  }}
                >
                  {score}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {l.status || "new"}
                </span>
                <span className="text-xs text-muted-foreground">{l.last_activity || "—"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Marketing Analytics ═══════════ */
export function MarketingAnalyticsView() {
  const { data: proj } = useHydrateProjection<any>("marketing");
  const metrics = proj?.marketingMetrics || proj?.marketing_metrics || [];
  const summary = proj?.summary || {};

  const cac = summary.cac ?? "—";
  const leadToWin = summary.leadToWinRate ?? "—";
  const paidROI = summary.paidROI ?? "—";
  const cpl = summary.costPerLead ?? "—";

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>
        Marketing Analytics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="CAC"
          value={cac !== "—" ? formatCurrency(cac, true) : "—"}
          color="var(--iw-forest-mid)"
        />
        <MetricCard
          label="Lead-to-Win"
          value={leadToWin !== "—" ? `${leadToWin}%` : "—"}
          color="var(--iw-success)"
        />
        <MetricCard
          label="Paid ROI"
          value={paidROI !== "—" ? `${paidROI}x` : "—"}
          color="var(--iw-gold)"
        />
        <MetricCard
          label="Cost per Lead"
          value={cpl !== "—" ? formatCurrency(cpl, true) : "—"}
          color="var(--iw-warning)"
        />
      </div>

      {metrics.length > 0 ? (
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
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          No marketing analytics yet. Connect your marketing tools to populate.
        </div>
      )}
    </div>
  );
}

/* ═══════════ Channel Views (Email, Social, Blog, Website) ═══════════ */
function ChannelView({
  title,
  channelKey,
  icon: Icon,
  accentColor,
}: {
  title: string;
  channelKey: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor: string;
}) {
  const { data: proj } = useHydrateProjection<any>("marketing");
  const channels = proj?.channelPerformance || proj?.channel_performance || [];
  const channel = channels.find((c: any) => c.channel?.toLowerCase() === channelKey.toLowerCase());

  const metrics = channel
    ? [
        { label: "Impressions", value: channel.impressions?.toLocaleString() ?? "—" },
        { label: "Clicks", value: channel.clicks?.toLocaleString() ?? "—" },
        { label: "CTR", value: channel.ctr ? `${channel.ctr}%` : "—" },
        { label: "Conversions", value: channel.conversions?.toLocaleString() ?? "—" },
        { label: "Engagement", value: channel.engagement ? `${channel.engagement}%` : "—" },
        { label: "Cost", value: channel.cost ? formatCurrency(channel.cost, true) : "—" },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: accentColor }} />
        <h2 className="text-lg" style={{ fontWeight: 600 }}>
          {title}
        </h2>
      </div>

      {channel ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                <p className="text-xl" style={{ fontWeight: 700, color: accentColor }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Engagement progress */}
          {channel.engagement != null && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>
                Engagement Score
              </h3>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(channel.engagement, 100)}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {channel.engagement}% average engagement rate
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          No {title.toLowerCase()} data yet. Connect your marketing tools to populate.
        </div>
      )}
    </div>
  );
}

export function MarketingEmailView() {
  return (
    <ChannelView
      title="Email Studio"
      channelKey="email"
      icon={Mail}
      accentColor="var(--iw-forest-mid)"
    />
  );
}

export function MarketingSocialView() {
  return (
    <ChannelView
      title="Social Calendar"
      channelKey="social"
      icon={Share2}
      accentColor="var(--iw-gold)"
    />
  );
}

export function MarketingBlogView() {
  return (
    <ChannelView
      title="Blog Pipeline"
      channelKey="blog"
      icon={FileText}
      accentColor="var(--iw-success)"
    />
  );
}

export function MarketingWebsiteView() {
  return (
    <ChannelView
      title="Website Optimization"
      channelKey="website"
      icon={Globe}
      accentColor="var(--iw-warning)"
    />
  );
}

/* ═══════════ Forms & Landing Pages ═══════════ */
export function MarketingFormsView() {
  const { data: proj } = useHydrateProjection<any>("marketing");
  const forms = proj?.forms || [];
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery) return forms;
    const q = searchQuery.toLowerCase();
    return forms.filter((f: any) => (f.name || f.title || "").toLowerCase().includes(q));
  }, [forms, searchQuery]);

  const totalSubmissions = forms.reduce((s: number, f: any) => s + (f.submissions || 0), 0);
  const activeForms = forms.filter((f: any) => f.status === "active");
  const withConversion = forms.filter((f: any) => (f.conversion_rate || f.conversionRate || 0) > 0);
  const avgConversion = withConversion.length
    ? Math.round(
        (withConversion.reduce(
          (s: number, f: any) => s + (f.conversion_rate || f.conversionRate || 0),
          0
        ) /
          withConversion.length) *
          10
      ) / 10
    : 0;
  const crmConnected = forms.filter((f: any) => f.crm_connected || f.crmConnected).length;

  const typeColors: Record<string, string> = {
    "lead-gen": "var(--iw-success)",
    contact: "var(--iw-forest-mid)",
    feedback: "var(--iw-gold)",
    registration: "var(--iw-pink)",
    "landing-page": "var(--iw-warning)",
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg" style={{ fontWeight: 600 }}>
            Forms & Landing Pages
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Lead capture forms and landing pages with conversion tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Total Submissions"
          value={totalSubmissions.toLocaleString()}
          color="var(--foreground)"
        />
        <MetricCard
          label="Active Forms"
          value={String(activeForms.length)}
          color="var(--iw-forest-mid)"
        />
        <MetricCard
          label="Avg Conversion"
          value={avgConversion > 0 ? `${avgConversion}%` : "—"}
          color="var(--iw-success)"
        />
        <MetricCard
          label="CRM Connected"
          value={forms.length > 0 ? `${crmConnected}/${forms.length}` : "—"}
          color="var(--foreground)"
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search forms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((form: any) => {
          const formType = form.type || "contact";
          const typeColor = typeColors[formType] || "var(--muted-foreground)";
          const convRate = form.conversion_rate || form.conversionRate || 0;
          const formStatus = form.status || "active";
          return (
            <div
              key={form.id || form.form_id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${typeColor}15` }}
                  >
                    <FormInput className="w-4 h-4" style={{ color: typeColor }} />
                  </div>
                  <div>
                    <div className="text-sm" style={{ fontWeight: 600 }}>
                      {form.name || form.title || "Untitled Form"}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                        style={{
                          backgroundColor: `${typeColor}15`,
                          color: typeColor,
                          fontWeight: 500,
                        }}
                      >
                        {formType.replace("-", " ")}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full capitalize"
                        style={{
                          backgroundColor:
                            formStatus === "active"
                              ? "rgba(0,200,83,0.1)"
                              : "rgba(158,158,158,0.1)",
                          color:
                            formStatus === "active"
                              ? "var(--iw-success)"
                              : "var(--muted-foreground)",
                          fontWeight: 500,
                        }}
                      >
                        {formStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-1.5 rounded hover:bg-secondary">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: "Submissions", value: (form.submissions || 0).toLocaleString() },
                  {
                    label: "Conversion",
                    value: convRate > 0 ? `${convRate}%` : "—",
                    color: convRate >= 20 ? "var(--iw-success)" : undefined,
                  },
                  { label: "Views", value: (form.views || 0).toLocaleString() },
                  { label: "Fields", value: form.fields || "—" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-1.5 rounded bg-secondary/50 text-center">
                    <div className="text-[9px] text-muted-foreground">{label}</div>
                    <div className="text-xs" style={{ fontWeight: 600, color }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border text-[10px] text-muted-foreground">
                <span>Last submission: {form.last_submission || form.lastSubmission || "—"}</span>
                {(form.crm_connected || form.crmConnected) && (
                  <span className="flex items-center gap-1" style={{ color: "var(--iw-success)" }}>
                    <CheckCircle className="w-3 h-3" /> CRM
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <FormInput className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">
              {forms.length === 0
                ? "No forms yet. Connect your marketing tools to populate."
                : "No forms match your search."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shared Helpers ─── */
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
