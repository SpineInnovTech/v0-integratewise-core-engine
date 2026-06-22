/**
 * Marketing Dashboard — L1 Workspace Surface
 * Rule: All data from SSOT (Spine Marketing Projection). No tool-specific schemas.
 */
import {
  Users,
  TrendingUp,
  Mail,
  MousePointerClick,
  Plus,
  Eye,
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

interface MarketingProjection {
  department: string;
  readiness: any;
  summary: {
    leadsGenerated: number;
    mqls: number;
    emailOpenRate: number;
    revenueInfluenced: number;
    conversionRate: number;
  };
  leads: any[];
  campaigns: any[];
  funnelStages: { stage: string; count: number; pct: number }[];
  leadTrend: { week: string; leads: number; mqls: number }[];
  channelMix: { channel: string; pct: number }[];
  topContent: { title: string; views: number; conversions: number; type: string }[];
}

const channelColors = ["var(--iw-marketing)", "var(--iw-success)", "var(--iw-blue)", "var(--iw-warning)", "var(--iw-purple)"];

const statusColors: Record<string, string> = {
  active: "bg-[var(--iw-success)]/10 text-[var(--iw-success)]",
  completed: "bg-secondary text-muted-foreground",
  scheduled: "bg-[var(--iw-blue)]/10 text-[var(--iw-blue)]",
  paused: "bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]",
  draft: "bg-secondary text-muted-foreground",
};

export function MarketingDashboard() {
  const { data: projection, loading, error } = useSpineProjection<MarketingProjection>("marketing");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading marketing projection...</span>
        </div>
      </div>
    );
  }

  if (error || !projection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Database className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Connect marketing tools to populate the SSOT.</p>
          {error && <p className="text-xs text-[var(--iw-danger)]">{error}</p>}
        </div>
      </div>
    );
  }

  const { summary, campaigns, funnelStages, leadTrend, channelMix, topContent } = projection;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="marketing" />

      {/* KPI Cards — From canonical leads + campaigns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Leads Generated" value={summary.leadsGenerated.toLocaleString()} change="+24% MoM" icon={<Users className="w-4 h-4" />} color="var(--iw-marketing)" />
        <KPI title="Marketing Qualified" value={summary.mqls.toLocaleString()} change={`${Math.round(summary.mqls / Math.max(summary.leadsGenerated, 1) * 100)}% conversion`} icon={<TrendingUp className="w-4 h-4" />} color="var(--iw-blue)" />
        <KPI title="Email Open Rate" value={`${summary.emailOpenRate}%`} change="+3% vs avg" icon={<Mail className="w-4 h-4" />} color="var(--iw-success)" />
        <KPI title="Revenue Influenced" value={`$${Math.round(summary.revenueInfluenced / 1000)}K`} change="This quarter" icon={<MousePointerClick className="w-4 h-4" />} color="var(--iw-purple)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3>Lead Generation Trend</h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-marketing)]" /> Leads</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-blue)]" /> MQLs</span>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadTrend}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--iw-marketing)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--iw-marketing)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="leads" stroke="var(--iw-marketing)" fill="url(#leadGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="mqls" stroke="var(--iw-blue)" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel — from canonical lead lifecycle stages */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Lead Funnel</h3>
          <div className="space-y-2">
            {funnelStages.map((stage, i) => {
              const prevCount = i > 0 ? funnelStages[i - 1].count : stage.count;
              const convRate = i > 0 ? ((stage.count / prevCount) * 100).toFixed(0) : "100";
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ fontWeight: 500 }}>{stage.stage}</span>
                    <span className="text-muted-foreground">{stage.count.toLocaleString()}</span>
                  </div>
                  <div className="relative">
                    <div className="w-full h-6 bg-secondary rounded" style={{ width: `${stage.pct}%`, minWidth: "40px" }}>
                      <div
                        className="h-full rounded transition-all flex items-center justify-end pr-2"
                        style={{
                          width: `${stage.pct}%`,
                          minWidth: "40px",
                          backgroundColor: "var(--iw-marketing)",
                          opacity: 0.15 + (stage.pct / 100) * 0.85,
                        }}
                      >
                        {i > 0 && (
                          <span className="text-[10px] text-muted-foreground" style={{ fontWeight: 500 }}>
                            {convRate}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Campaigns — from canonical campaign entities */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3>Campaigns</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[var(--iw-marketing)] text-white rounded-md text-xs hover:opacity-90 transition-opacity">
            <Plus className="w-3 h-3" /> New Campaign
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Campaign</th>
                <th className="text-left py-2 px-3 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Status</th>
                <th className="text-left py-2 px-3 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 500 }}>Channel</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>Clicks</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 500 }}>Conv %</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c: any) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer">
                  <td className="py-2.5 px-3">
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.type}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${statusColors[c.status] || ""}`} style={{ fontWeight: 500 }}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground hidden sm:table-cell capitalize">{c.channel}</td>
                  <td className="py-2.5 px-3 text-right text-xs hidden md:table-cell">{c.clicks.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-xs hidden lg:table-cell">{c.conversionRate}%</td>
                  <td className="py-2.5 px-3 text-right text-xs" style={{ fontWeight: 500 }}>${(c.revenue / 1000).toFixed(0)}K</td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Connect marketing tools to see campaign data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Content */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-3">Top Performing Content</h3>
          <div className="space-y-2">
            {topContent.map((content, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-colors">
                <div className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>
                  {content.type}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ fontWeight: 500 }}>{content.title}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs flex items-center gap-1"><Eye className="w-3 h-3 text-muted-foreground" /> {(content.views / 1000).toFixed(1)}K</div>
                  <div className="text-[10px] text-muted-foreground">{content.conversions} conv</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Mix */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-3">Channel Mix</h3>
          <div className="space-y-3">
            {channelMix.map((ch, i) => (
              <div key={ch.channel}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ fontWeight: 500 }}>{ch.channel}</span>
                  <span className="text-muted-foreground">{ch.pct}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${ch.pct}%`, backgroundColor: channelColors[i] || "var(--muted-foreground)" }} />
                </div>
              </div>
            ))}
          </div>
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
