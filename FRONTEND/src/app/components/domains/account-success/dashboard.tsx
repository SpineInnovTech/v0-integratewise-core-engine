/**
 * CSM Home Dashboard — Today Summary, Quick Actions, Activity Feed, Hydration
 * L1 Workspace — Clean, work-focused. All data from Spine SSOT.
 * Now powered by the 16-table CSM Intelligence data model.
 */
import { useState } from "react";
import {
  HeartPulse, RefreshCw, AlertTriangle, TrendingUp, TrendingDown,
  Clock, CheckCircle, Users, Calendar, MessageSquare, ArrowUpRight,
  Target, Plus, Zap, ChevronRight, Loader2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useSpineProjection } from "../../spine/spine-client";
import { ReadinessBar } from "../../spine/readiness-bar";
import {
  accountMasterData,
  taskManagerData,
  engagementLogData,
  riskRegisterData,
  generatedInsightsData,
  healthColor,
  getHealthLabel,
  getIndustryIcon,
  getAccountName,
  getDaysUntilDue,
  formatCurrency,
  type AccountMaster,
  type TechnicalRisk,
} from "./csm-intelligence-data";

export function AccountSuccessDashboard() {
  const { loading } = useSpineProjection<any>("ops");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--iw-success)]" />
      </div>
    );
  }

  const accounts = accountMasterData;
  const tasks = taskManagerData;
  const engagements = engagementLogData;
  const risks = riskRegisterData;
  const insights = generatedInsightsData;

  const healthy = accounts.filter(a => a.healthScore >= 80);
  const atRisk = accounts.filter(a => a.healthScore >= 60 && a.healthScore < 80);
  const critical = accounts.filter(a => a.healthScore < 60);
  const renewingSoon = accounts.filter(a => a.daysToRenewal <= 60);
  const totalARR = accounts.reduce((s, a) => s + a.arr, 0);
  const avgHealth = Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / accounts.length);
  const nrr = 108;

  // Today's engagements (engagements on Feb 10)
  const todayEngagements = engagements.filter(e => e.engagementDate === "2026-02-10" || e.engagementDate.startsWith("2026-02-10"));
  // Overdue and due-today tasks
  const overdueTasks = tasks.filter(t => t.status === "Overdue");
  const todayTasks = tasks.filter(t => {
    const dueDays = getDaysUntilDue(t.dueDate);
    return dueDays === 0 || dueDays === 1;
  });
  // High-priority risks
  const criticalRisks = risks.filter(r => r.riskLevel === "Critical" || r.riskLevel === "High");

  const healthDistribution = [
    { range: "90-100", count: accounts.filter(a => a.healthScore >= 90).length, fill: "var(--iw-success)" },
    { range: "70-89", count: accounts.filter(a => a.healthScore >= 70 && a.healthScore < 90).length, fill: "var(--iw-blue)" },
    { range: "50-69", count: accounts.filter(a => a.healthScore >= 50 && a.healthScore < 70).length, fill: "var(--iw-warning)" },
    { range: "0-49", count: accounts.filter(a => a.healthScore < 50).length, fill: "var(--iw-danger)" },
  ];

  const healthTrend = [
    { month: "Sep", score: 72 }, { month: "Oct", score: 74 },
    { month: "Nov", score: 73 }, { month: "Dec", score: 76 },
    { month: "Jan", score: 75 }, { month: "Feb", score: avgHealth },
  ];

  const pieData = [
    { name: "Healthy", value: healthy.length, color: "var(--iw-success)" },
    { name: "At Risk", value: atRisk.length, color: "var(--iw-warning)" },
    { name: "Critical", value: critical.length, color: "var(--iw-danger)" },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="ops" />

      {/* Today Summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-[var(--iw-success)]" />
          <h3 className="text-sm" style={{ fontWeight: 600 }}>Today — February 10, 2026</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TodayCard icon={<Calendar className="w-4 h-4" />} label="Engagements" value={`${todayEngagements.length}`} sub={todayEngagements.length > 0 ? todayEngagements[0].engagementType : "No engagements"} color="var(--iw-blue)" />
          <TodayCard icon={<CheckCircle className="w-4 h-4" />} label="Tasks Due" value={`${todayTasks.length}`} sub={`${overdueTasks.length} overdue`} color={overdueTasks.length > 0 ? "var(--iw-danger)" : "var(--iw-success)"} />
          <TodayCard icon={<AlertTriangle className="w-4 h-4" />} label="Risk Alerts" value={`${criticalRisks.length}`} sub="Needs attention" color="var(--iw-danger)" />
          <TodayCard icon={<RefreshCw className="w-4 h-4" />} label="Renewals (30d)" value={`${accounts.filter(a => a.daysToRenewal <= 30).length}`} sub={`${formatCurrency(accounts.filter(a => a.daysToRenewal <= 30).reduce((s, a) => s + a.arr, 0))} ARR`} color="var(--iw-warning)" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: "Log Activity", icon: <Plus className="w-3.5 h-3.5" /> },
          { label: "Schedule Meeting", icon: <Calendar className="w-3.5 h-3.5" /> },
          { label: "Create Task", icon: <CheckCircle className="w-3.5 h-3.5" /> },
          { label: "Add Account", icon: <Users className="w-3.5 h-3.5" /> },
          { label: "View Reports", icon: <Target className="w-3.5 h-3.5" /> },
        ].map(a => (
          <button key={a.label} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors whitespace-nowrap" style={{ fontWeight: 500 }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Avg. Health Score" value={`${avgHealth}`} subtitle={`${healthy.length} healthy / ${accounts.length} total`} icon={<HeartPulse className="w-4 h-4" />} color="var(--iw-success)" trend={+2.3} />
        <KPI title="Total ARR" value={formatCurrency(totalARR)} subtitle="Net Revenue Retention 108%" icon={<TrendingUp className="w-4 h-4" />} color="var(--iw-blue)" trend={+8.2} />
        <KPI title="Renewals (60d)" value={`${renewingSoon.length}`} subtitle={`${formatCurrency(renewingSoon.reduce((s, a) => s + a.arr, 0))} ARR`} icon={<RefreshCw className="w-4 h-4" />} color="var(--iw-warning)" />
        <KPI title="At-Risk Accounts" value={`${atRisk.length + critical.length}`} subtitle={`${critical.length} critical, ${atRisk.length} at-risk`} icon={<AlertTriangle className="w-4 h-4" />} color="var(--iw-danger)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>Health Distribution</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                  {healthDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>Health Trend (6 Months)</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="var(--iw-success)" fill="var(--iw-success)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>Portfolio Breakdown</h3>
          <div className="h-[140px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={4}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(p => (
              <span key={p.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name} ({p.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Health Overview */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600 }}>Top Accounts by ARR</h3>
            <span className="text-[10px] text-muted-foreground">{accounts.length} accounts</span>
          </div>
          <div className="space-y-1.5">
            {[...accounts].sort((a, b) => b.arr - a.arr).slice(0, 6).map(acc => (
              <div key={acc.accountId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                <span className="text-base">{getIndustryIcon(acc.industryVertical)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ fontWeight: 500 }}>{acc.accountName}</div>
                  <div className="text-[10px] text-muted-foreground">{acc.contractType} · {acc.industryVertical}</div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs" style={{ fontWeight: 600 }}>{formatCurrency(acc.arr)}</span>
                  <span className={`block text-[10px] ${acc.healthScoreChange >= 0 ? "text-[var(--iw-success)]" : "text-[var(--iw-danger)]"}`}>
                    {acc.healthScoreChange >= 0 ? "+" : ""}{acc.healthScoreChange} pts
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: healthColor(acc.healthScore), fontWeight: 700 }}>
                  {acc.healthScore}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed + Risk Alerts */}
        <div className="space-y-6">
          {/* Risk Alerts from Risk Register */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm" style={{ fontWeight: 600 }}>Active Risk Alerts</h3>
              <AlertTriangle className="w-4 h-4 text-[var(--iw-danger)]" />
            </div>
            <div className="space-y-2">
              {risks.filter(r => r.riskLevel === "Critical" || r.riskLevel === "High").slice(0, 4).map(risk => {
                const severity = risk.riskLevel === "Critical" ? "high" : "medium";
                return (
                  <div key={risk.riskId} className="p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity" style={{
                    backgroundColor: severity === "high" ? "rgba(244,67,54,0.05)" : "rgba(255,152,0,0.05)",
                    border: `1px solid ${severity === "high" ? "rgba(244,67,54,0.15)" : "rgba(255,152,0,0.15)"}`,
                  }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded uppercase" style={{
                        backgroundColor: severity === "high" ? "rgba(244,67,54,0.15)" : "rgba(255,152,0,0.15)",
                        color: severity === "high" ? "var(--iw-danger)" : "var(--iw-warning)",
                        fontWeight: 700,
                      }}>{risk.riskLevel}</span>
                      <span className="text-xs" style={{ fontWeight: 500 }}>{getAccountName(risk.account)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{risk.riskTitle}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Renewals */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm" style={{ fontWeight: 600 }}>Upcoming Renewals</h3>
              <span className="text-[10px] text-muted-foreground">{renewingSoon.length} within 60 days</span>
            </div>
            <div className="space-y-1.5">
              {[...accounts].sort((a, b) => a.daysToRenewal - b.daysToRenewal).slice(0, 5).map(acc => (
                <div key={acc.accountId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                  <span className="text-base">{getIndustryIcon(acc.industryVertical)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ fontWeight: 500 }}>{acc.accountName}</div>
                    <div className="text-[10px] text-muted-foreground">{formatCurrency(acc.arr)} ARR</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${acc.daysToRenewal <= 30 ? "bg-[var(--iw-danger)]/10 text-[var(--iw-danger)]" : acc.daysToRenewal <= 60 ? "bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: 600 }}>
                    {acc.daysToRenewal}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ title, value, subtitle, icon, color, trend }: { title: string; value: string; subtitle: string; icon: React.ReactNode; color: string; trend?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
      </div>
      <div className="flex items-end gap-2 mb-0.5">
        <div className="text-2xl" style={{ fontWeight: 700, color }}>{value}</div>
        {trend !== undefined && (
          <span className={`text-[11px] flex items-center gap-0.5 mb-1 ${trend >= 0 ? "text-[var(--iw-success)]" : "text-[var(--iw-danger)]"}`} style={{ fontWeight: 500 }}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function TodayCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
      <div>
        <p className="text-lg" style={{ fontWeight: 700 }}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label} · {sub}</p>
      </div>
    </div>
  );
}
