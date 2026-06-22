/**
 * Website Dashboard — L1 Workspace Surface
 * Rule: All data from SSOT (Spine Website Projection). No tool-specific schemas.
 */
import {
  FileText,
  Eye,
  Search,
  Clock,
  Plus,
  Smartphone,
  Monitor,
  Tablet,
  Zap,
  AlertTriangle,
  CheckCircle,
  Database,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSpineProjection } from "../spine/spine-client";
import { ReadinessBar } from "../spine/readiness-bar";

interface WebsiteProjection {
  department: string;
  readiness: any;
  summary: {
    totalPages: number;
    monthlyVisitors: number;
    visitorsGrowth: number;
    seoHealth: number;
    uptime: number;
    avgSessionDuration: number;
  };
  pages: any[];
  trafficTimeline: { day: string; visitors: number; unique: number }[];
  coreWebVitals: { metric: string; value: string; status: string; threshold: string }[];
  deviceBreakdown: { device: string; pct: number; visitors: number }[];
  trafficSources: { source: string; pct: number }[];
  seoIssues: { type: string; message: string; severity: string }[];
  recentEdits: { page: string; action: string; author: string; time: string }[];
}

const sourceColors = ["var(--iw-success)", "var(--iw-website)", "var(--iw-blue)", "var(--iw-warning)", "var(--iw-pink)"];
const deviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
};

export function WebsiteDashboard() {
  const { data: projection, loading, error } = useSpineProjection<WebsiteProjection>("website");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading website projection...</span>
        </div>
      </div>
    );
  }

  if (error || !projection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Database className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Spine not ready for website data.</p>
          {error && <p className="text-xs text-[var(--iw-danger)]">{error}</p>}
        </div>
      </div>
    );
  }

  const { summary, pages, trafficTimeline, coreWebVitals, deviceBreakdown, trafficSources, seoIssues, recentEdits } = projection;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="website" />

      {/* KPI Cards — From canonical page entities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Total Pages" value={`${summary.totalPages}`} change={`${pages.filter((p: any) => p.status === "draft").length} drafts`} icon={<FileText className="w-4 h-4" />} color="var(--iw-website)" />
        <KPI title="Monthly Visitors" value={summary.monthlyVisitors >= 1000 ? `${(summary.monthlyVisitors / 1000).toFixed(1)}K` : `${summary.monthlyVisitors}`} change={`+${summary.visitorsGrowth}% MoM`} icon={<Eye className="w-4 h-4" />} color="var(--iw-blue)" />
        <KPI title="SEO Health" value={`${summary.seoHealth}/100`} change={`${seoIssues.length} issues`} icon={<Search className="w-4 h-4" />} color="var(--iw-success)" />
        <KPI title="Uptime" value={`${summary.uptime}%`} change="Last 30 days" icon={<Zap className="w-4 h-4" />} color="var(--iw-warning)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3>Traffic Overview</h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-website)]" /> Total</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-blue)]" /> Unique</span>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficTimeline}>
                <defs>
                  <linearGradient id="webGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--iw-website)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--iw-website)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="visitors" stroke="var(--iw-website)" fill="url(#webGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="unique" stroke="var(--iw-blue)" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Core Web Vitals</h3>
          <div className="space-y-3">
            {coreWebVitals.map((vital) => (
              <div key={vital.metric} className="flex items-center justify-between p-2.5 rounded-md bg-[var(--iw-success)]/5 border border-[var(--iw-success)]/20">
                <div>
                  <div className="text-sm" style={{ fontWeight: 600 }}>{vital.metric}</div>
                  <div className="text-[10px] text-muted-foreground">{vital.threshold}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm" style={{ fontWeight: 600, color: "var(--iw-success)" }}>{vital.value}</div>
                  <CheckCircle className="w-3 h-3 text-[var(--iw-success)] ml-auto" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Mobile Performance</span>
              <span style={{ fontWeight: 500, color: "var(--iw-success)" }}>94/100</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-[var(--iw-success)] rounded-full" style={{ width: "94%" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages — from canonical page entities */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>Top Pages</h3>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-[var(--iw-website)] text-white rounded-md text-xs hover:opacity-90 transition-opacity">
              <Plus className="w-3 h-3" /> New Page
            </button>
          </div>
          <div className="space-y-1">
            {pages.map((page: any) => (
              <div key={page.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ fontWeight: 500 }}>{page.title}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{page.path}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${page.status === "published" ? "bg-[var(--iw-success)]/10 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: 500 }}>
                    {page.status}
                  </span>
                  <div className="text-right">
                    <div className="text-xs">{page.views.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">views</div>
                  </div>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white"
                    style={{ backgroundColor: page.seoScore >= 85 ? "var(--iw-success)" : page.seoScore >= 70 ? "var(--iw-warning)" : "var(--iw-danger)", fontWeight: 600 }}
                  >
                    {page.seoScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* SEO Issues */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="mb-3">SEO Issues</h3>
            <div className="space-y-2">
              {seoIssues.map((issue, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-secondary/50">
                  {issue.type === "error" ? (
                    <AlertTriangle className="w-4 h-4 text-[var(--iw-danger)] flex-shrink-0" />
                  ) : issue.type === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-[var(--iw-warning)] flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-[var(--iw-success)] flex-shrink-0" />
                  )}
                  <span className="text-xs">{issue.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="mb-3">Traffic Sources</h3>
            <div className="space-y-2">
              {trafficSources.map((src, i) => (
                <div key={src.source}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{src.source}</span>
                    <span className="text-muted-foreground">{src.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${src.pct}%`, backgroundColor: sourceColors[i] || "var(--muted-foreground)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="mb-3">Device Breakdown</h3>
            <div className="grid grid-cols-3 gap-2">
              {deviceBreakdown.map((dev) => {
                const Icon = deviceIcons[dev.device] || Monitor;
                return (
                  <div key={dev.device} className="text-center p-2 rounded-md bg-secondary/50">
                    <Icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <div className="text-sm" style={{ fontWeight: 600 }}>{dev.pct}%</div>
                    <div className="text-[10px] text-muted-foreground">{dev.device}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Edits */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {recentEdits.map((edit, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-colors">
              <div className="w-6 h-6 rounded-full bg-[var(--iw-website)] flex items-center justify-center text-white text-[9px]" style={{ fontWeight: 600 }}>
                {edit.author.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate"><span style={{ fontWeight: 500 }}>{edit.page}</span> - {edit.action}</div>
                <div className="text-[10px] text-muted-foreground">by {edit.author}</div>
              </div>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {edit.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPI({ title, value, change, icon, color }: { title: string; value: string; change: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
      </div>
      <div className="text-2xl mb-1" style={{ fontWeight: 600, color }}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{change}</div>
    </div>
  );
}
