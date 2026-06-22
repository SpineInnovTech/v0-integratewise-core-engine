/**
 * SalesOps Dashboard — Execution-focused: pipeline kanban, activity, leads, rep performance.
 * Data from Spine Sales projection.
 */
import {
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSpineProjection } from "../../spine/spine-client";
import { ReadinessBar } from "../../spine/readiness-bar";

export function SalesOpsDashboard() {
  const { data: projection, loading } = useSpineProjection<any>("sales");

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const summary = projection?.summary || {};
  const deals = projection?.deals || [];
  const contacts = projection?.contacts || [];
  const activityByDay = projection?.activityByDay || [];
  const leaderboard = projection?.leaderboard || [];
  const closingThisWeek = projection?.closingThisWeek || [];

  // Pipeline Kanban stages
  const stages = [
    { id: "prospect", label: "Prospect", color: "#0066FF" },
    { id: "qualify", label: "Qualify", color: "#7C4DFF" },
    { id: "proposal", label: "Proposal", color: "#FF9800" },
    { id: "negotiate", label: "Negotiate", color: "#FF4081" },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="sales" />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStat label="Open Deals" value={deals.filter((d: any) => !["closed-won", "closed-lost"].includes(d.stage)).length.toString()} icon={<DollarSign className="w-4 h-4" />} color="var(--iw-sales)" />
        <QuickStat label="Closing Soon" value={closingThisWeek.length.toString()} icon={<Clock className="w-4 h-4" />} color="var(--iw-warning)" />
        <QuickStat label="Contacts" value={contacts.length.toString()} icon={<Users className="w-4 h-4" />} color="var(--iw-blue)" />
        <QuickStat label="Win Rate" value={`${summary.winRate || 0}%`} icon={<TrendingUp className="w-4 h-4" />} color="var(--iw-purple)" />
      </div>

      {/* Pipeline Kanban */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3>Pipeline</h3>
          <span className="text-xs text-muted-foreground">{deals.filter((d: any) => !["closed-won", "closed-lost"].includes(d.stage)).length} open deals</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stages.map((stage) => {
            const stageDeals = deals.filter((d: any) => d.stage === stage.id);
            const stageTotal = stageDeals.reduce((s: number, d: any) => s + d.amount, 0);
            return (
              <div key={stage.id} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs" style={{ fontWeight: 600 }}>{stage.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">${(stageTotal / 1000).toFixed(0)}K</span>
                </div>
                <div className="space-y-2">
                  {stageDeals.map((deal: any) => (
                    <div key={deal.id} className="p-2 bg-card rounded-md border border-border hover:shadow-sm transition-all cursor-pointer">
                      <div className="text-xs truncate" style={{ fontWeight: 500 }}>{deal.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{deal.accountName}</span>
                        <span className="text-[10px]" style={{ fontWeight: 600 }}>${(deal.amount / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-4 h-4 rounded-full bg-[var(--iw-sales)] flex items-center justify-center text-white text-[7px]" style={{ fontWeight: 600 }}>{deal.owner?.initials}</div>
                        <span className="text-[9px] text-muted-foreground">{deal.probability}% prob</span>
                      </div>
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-muted-foreground">No deals</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3>This Week's Activity</h3>
            <div className="flex gap-2 text-[10px]">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[var(--iw-sales)]" /> Calls</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[var(--iw-blue)]" /> Emails</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[var(--iw-purple)]" /> Meetings</span>
            </div>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="calls" fill="var(--iw-sales)" radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="emails" fill="var(--iw-blue)" radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="meetings" fill="var(--iw-purple)" radius={[3, 3, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Contacts */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>Key Contacts</h3>
            <button className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-2">
            {contacts.slice(0, 5).map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[var(--iw-sales)] flex items-center justify-center text-white text-[10px]" style={{ fontWeight: 600 }}>
                  {c.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ fontWeight: 500 }}>{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">{c.title} · {c.accountName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">Score</div>
                  <div className="text-xs" style={{ fontWeight: 600, color: c.leadScore >= 80 ? "var(--iw-success)" : c.leadScore >= 60 ? "var(--iw-warning)" : "var(--muted-foreground)" }}>{c.leadScore}</div>
                </div>
              </div>
            ))}
            {contacts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Connect CRM to see contacts</p>}
          </div>
        </div>
      </div>

      {/* Rep Leaderboard */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-3">Team Leaderboard</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {leaderboard.map((rep: any, i: number) => {
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={rep.name} className={`p-3 rounded-lg text-center ${i === 0 ? "bg-amber-500/5 border border-amber-500/20" : "bg-secondary/50"}`}>
                <div className="text-xl mb-1">{medals[i] || `#${i + 1}`}</div>
                <div className="w-10 h-10 rounded-full bg-[var(--iw-sales)] flex items-center justify-center text-white text-xs mx-auto mb-2" style={{ fontWeight: 600 }}>{rep.initials}</div>
                <div className="text-sm" style={{ fontWeight: 600 }}>{rep.name}</div>
                <div className="text-xs text-muted-foreground">{rep.deals} deals</div>
                <div className="text-sm mt-1" style={{ fontWeight: 600, color: "var(--iw-sales)" }}>${(rep.revenue / 1000).toFixed(0)}K</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg" style={{ fontWeight: 600, color }}>{value}</div>
    </div>
  );
}
