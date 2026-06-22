/**
 * Sales Dashboard — L1 Workspace Surface
 * Rule: All data from SSOT (Spine Sales Projection). No tool-specific schemas.
 */
import {
  DollarSign,
  TrendingUp,
  Phone,
  Target,
  Trophy,
  Star,
  Database,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useSpineProjection } from "../spine/spine-client";
import { ReadinessBar } from "../spine/readiness-bar";

interface SalesProjection {
  department: string;
  readiness: any;
  summary: {
    pipelineValue: number;
    forecastQ1: number;
    quotaQ1: number;
    weeklyActivity: number;
    winRate: number;
    closedWonQ1: number;
  };
  deals: any[];
  contacts: any[];
  activities: any[];
  pipelineByStage: { stage: string; value: number; count: number }[];
  activityByDay: { day: string; calls: number; emails: number; meetings: number }[];
  leaderboard: { name: string; initials: string; deals: number; revenue: number }[];
  closingThisWeek: any[];
  recentWins: any[];
}

const stageColors = ["#0066FF", "#7C4DFF", "#FF9800", "#FF4081"];
const leaderColors = ["#FFD700", "#C0C0C0", "#CD7F32", "var(--muted-foreground)", "var(--muted-foreground)"];

export function SalesDashboard() {
  const { data: projection, loading, error } = useSpineProjection<SalesProjection>("sales");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading sales projection...</span>
        </div>
      </div>
    );
  }

  if (error || !projection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Database className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Connect a CRM to populate the sales SSOT.</p>
          {error && <p className="text-xs text-[var(--iw-danger)]">{error}</p>}
        </div>
      </div>
    );
  }

  const { summary, pipelineByStage, activityByDay, leaderboard, closingThisWeek, recentWins } = projection;
  const pieData = pipelineByStage.map((s, i) => ({ ...s, color: stageColors[i] || "#666" }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="sales" />

      {/* KPI Cards — All values from Spine canonical deals + activities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Pipeline Value" value={`$${(summary.pipelineValue / 1000000).toFixed(2)}M`} change={`${summary.pipelineByStage?.length || pipelineByStage.length} stages`} icon={<DollarSign className="w-4 h-4" />} color="var(--iw-sales)" />
        <KPI title="Forecast (Q1)" value={`$${Math.round(summary.forecastQ1 / 1000)}K`} change={`vs $${(summary.quotaQ1 / 1000000).toFixed(1)}M quota`} icon={<Target className="w-4 h-4" />} color="var(--iw-blue)" />
        <KPI title="Weekly Activity" value={`${summary.weeklyActivity}`} change="Canonical activities" icon={<Phone className="w-4 h-4" />} color="var(--iw-purple)" />
        <KPI title="Win Rate" value={`${summary.winRate}%`} change="+5% vs last Q" icon={<Trophy className="w-4 h-4" />} color="var(--iw-warning)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3>Weekly Activity</h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-sales)]" /> Calls</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-blue)]" /> Emails</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-purple)]" /> Meetings</span>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="calls" fill="var(--iw-sales)" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="emails" fill="var(--iw-blue)" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="meetings" fill="var(--iw-purple)" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline by Stage — from canonical deal stages */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Pipeline by Stage</h3>
          <div className="h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `$${(val / 1000).toFixed(0)}K`} contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2">
            {pieData.map((s) => (
              <div key={s.stage} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.stage}
                </span>
                <span className="text-muted-foreground">${(s.value / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Closing This Week — from canonical deals filtered by probability + date */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>Closing Soon</h3>
            <span className="text-xs text-muted-foreground">{closingThisWeek.length} deals</span>
          </div>
          <div className="space-y-2">
            {closingThisWeek.map((deal: any) => (
              <div key={deal.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[var(--iw-sales)]/10 flex items-center justify-center text-xs font-semibold text-[var(--iw-sales)]">
                  {deal.owner?.initials || "??"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ fontWeight: 500 }}>{deal.name}</div>
                  <div className="text-[11px] text-muted-foreground">{deal.accountName} · {deal.probability}% prob</div>
                </div>
                <span className="text-sm" style={{ fontWeight: 600 }}>${(deal.amount / 1000).toFixed(0)}K</span>
              </div>
            ))}
            {closingThisWeek.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No deals closing soon</p>
            )}
          </div>
        </div>

        {/* Recent Wins — from canonical closed-won deals */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>Recent Wins</h3>
            <Star className="w-4 h-4 text-[var(--iw-warning)]" />
          </div>
          <div className="space-y-2">
            {recentWins.map((win: any) => (
              <div key={win.id} className="flex items-center gap-3 p-3 rounded-md bg-[var(--iw-success)]/5 border border-[var(--iw-success)]/20">
                <div className="w-8 h-8 rounded-lg bg-[var(--iw-success)]/10 flex items-center justify-center text-xs font-semibold text-[var(--iw-success)]">
                  {win.owner?.initials || "??"}
                </div>
                <div className="flex-1">
                  <div className="text-sm" style={{ fontWeight: 500 }}>{win.accountName}</div>
                  <div className="text-[11px] text-muted-foreground">{win.name}</div>
                </div>
                <span className="text-sm" style={{ fontWeight: 600, color: "var(--iw-success)" }}>${(win.amount / 1000).toFixed(0)}K</span>
              </div>
            ))}
            {recentWins.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent wins yet</p>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-3">Team Leaderboard</h3>
          <div className="space-y-2">
            {leaderboard.map((rep, i) => (
              <div key={rep.name} className="flex items-center gap-3 p-1.5">
                <span className="text-[11px] w-4 text-center" style={{ fontWeight: 600, color: leaderColors[i] || "var(--muted-foreground)" }}>
                  {i + 1}
                </span>
                <div className="w-6 h-6 rounded-full bg-[var(--iw-sales)] flex items-center justify-center text-white text-[9px]" style={{ fontWeight: 600 }}>
                  {rep.initials}
                </div>
                <div className="flex-1">
                  <div className="text-xs" style={{ fontWeight: 500 }}>{rep.name}</div>
                  <div className="text-[10px] text-muted-foreground">{rep.deals} deals</div>
                </div>
                <span className="text-xs" style={{ fontWeight: 600 }}>${(rep.revenue / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forecast vs Quota */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-3">Q1 Forecast vs Quota</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Closed Won</span>
              <span style={{ fontWeight: 500, color: "var(--iw-success)" }}>${Math.round(summary.closedWonQ1 / 1000)}K</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-[var(--iw-success)] rounded-full" style={{ width: `${Math.min(100, (summary.closedWonQ1 / summary.quotaQ1) * 100)}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Weighted Forecast</span>
              <span style={{ fontWeight: 500, color: "var(--iw-blue)" }}>${Math.round(summary.forecastQ1 / 1000)}K</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-[var(--iw-blue)] rounded-full" style={{ width: `${Math.min(100, (summary.forecastQ1 / summary.quotaQ1) * 100)}%` }} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Quota</div>
            <div className="text-sm" style={{ fontWeight: 600 }}>${(summary.quotaQ1 / 1000000).toFixed(1)}M</div>
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
