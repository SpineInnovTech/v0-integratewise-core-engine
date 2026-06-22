import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Calendar,
  ArrowUpRight,
  Plug,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
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
  Legend,
} from "recharts";

const revenueTrend = [
  { month: "Sep", revenue: 2300, target: 2200 },
  { month: "Oct", revenue: 2500, target: 2400 },
  { month: "Nov", revenue: 2700, target: 2600 },
  { month: "Dec", revenue: 2900, target: 2800 },
  { month: "Jan", revenue: 3200, target: 3000 },
  { month: "Feb", revenue: 3400, target: 3200 },
];

const integrationVolume = [
  { name: "Salesforce", calls: 1247, records: 14520 },
  { name: "HubSpot", calls: 892, records: 8340 },
  { name: "Stripe", calls: 567, records: 5672 },
  { name: "Slack", calls: 456, records: 0 },
  { name: "Zoho", calls: 267, records: 3400 },
  { name: "Razorpay", calls: 234, records: 1890 },
];

const healthDistribution = [
  { name: "Healthy (80+)", value: 4, color: "#00C853" },
  { name: "At Risk (60-79)", value: 2, color: "#FF9800" },
  { name: "Critical (<60)", value: 2, color: "#F44336" },
];

const regionBreakdown = [
  { region: "India", arr: 1023, accounts: 5 },
  { region: "Singapore", arr: 375, accounts: 2 },
  { region: "Australia", arr: 350, accounts: 1 },
];

export function OpsAnalyticsView() {
  const [period, setPeriod] = useState("6m");

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Analytics & Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">Cross-system data aggregation and operational metrics</p>
        </div>
        <div className="flex gap-2">
          <div className="flex p-0.5 bg-secondary rounded-md">
            {["1m", "3m", "6m", "1y"].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded text-xs transition-all ${period === p ? "bg-card shadow-sm" : "text-muted-foreground"}`} style={{ fontWeight: period === p ? 500 : 400 }}>{p}</button>
            ))}
          </div>
          <button className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-md text-sm hover:bg-accent transition-colors"><Download className="w-3 h-3" /> Export</button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPI title="Total ARR" value="$3.4M" change="+12.4%" positive icon={<DollarSign className="w-4 h-4" />} color="var(--iw-blue)" />
        <KPI title="Avg Health Score" value="75.4" change="+2.8" positive icon={<Activity className="w-4 h-4" />} color="var(--iw-success)" />
        <KPI title="API Calls (24h)" value="3,842" change="+156" positive icon={<Plug className="w-4 h-4" />} color="var(--iw-purple)" />
        <KPI title="Active Users" value="9/11" change="82%" positive icon={<Users className="w-4 h-4" />} color="var(--iw-warning)" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3>Revenue vs Target ($K)</h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-blue)]" /> Revenue</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-purple)]" /> Target</span>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop key="start" offset="5%" stopColor="var(--iw-blue)" stopOpacity={0.15} />
                    <stop key="end" offset="95%" stopColor="var(--iw-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--iw-blue)" fill="url(#revGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="target" stroke="var(--iw-purple)" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Account Health</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={healthDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {healthDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {healthDistribution.map((h) => (
              <div key={h.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} /> {h.name}</span>
                <span style={{ fontWeight: 500 }}>{h.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Integration API Volume (24h)</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={integrationVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="calls" fill="var(--iw-blue)" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Revenue by Region ($K)</h3>
          <div className="space-y-4">
            {regionBreakdown.map((r) => (
              <div key={r.region}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ fontWeight: 500 }}>{r.region}</span>
                  <span className="text-sm" style={{ fontWeight: 600 }}>${r.arr}K</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--iw-blue)]" style={{ width: `${(r.arr / 1023) * 100}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{r.accounts} account{r.accounts > 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ title, value, change, positive, icon, color }: { title: string; value: string; change: string; positive: boolean; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
      </div>
      <div className="text-2xl mb-1" style={{ fontWeight: 600 }}>{value}</div>
      <span className={`text-[11px] flex items-center gap-0.5 ${positive ? "text-[var(--iw-success)]" : "text-[var(--iw-danger)]"}`} style={{ fontWeight: 500 }}>
        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {change}
      </span>
    </div>
  );
}
