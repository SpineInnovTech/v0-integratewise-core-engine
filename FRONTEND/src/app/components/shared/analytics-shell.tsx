import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Download, Eye, Users, DollarSign, MousePointerClick, Globe, Target, Mail, Megaphone } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AnalyticsShellProps {
  module: "website" | "marketing" | "sales";
}

const websiteData = {
  kpis: [
    { title: "Page Views", value: "54.8K", change: "+12%", positive: true, icon: Eye, color: "var(--iw-purple)" },
    { title: "Unique Visitors", value: "18.2K", change: "+8%", positive: true, icon: Users, color: "var(--iw-blue)" },
    { title: "Bounce Rate", value: "42.3%", change: "-3.2%", positive: true, icon: Globe, color: "var(--iw-success)" },
    { title: "Avg Session", value: "3m 24s", change: "+15s", positive: true, icon: BarChart3, color: "var(--iw-warning)" },
  ],
  trend: [
    { week: "W1", visitors: 2800, pageViews: 8200 },
    { week: "W2", visitors: 3100, pageViews: 9100 },
    { week: "W3", visitors: 2900, pageViews: 8500 },
    { week: "W4", visitors: 3400, pageViews: 9800 },
    { week: "W5", visitors: 3200, pageViews: 12000 },
    { week: "W6", visitors: 3800, pageViews: 11200 },
  ],
  sources: [
    { name: "Organic", value: 42, color: "#00C853" },
    { name: "Direct", value: 28, color: "#0066FF" },
    { name: "Referral", value: 15, color: "#7C4DFF" },
    { name: "Social", value: 10, color: "#FF4081" },
    { name: "Paid", value: 5, color: "#FF9800" },
  ],
};

const marketingData = {
  kpis: [
    { title: "Total Leads", value: "1,078", change: "+24%", positive: true, icon: Users, color: "var(--iw-blue)" },
    { title: "MQLs", value: "342", change: "+18%", positive: true, icon: Target, color: "var(--iw-success)" },
    { title: "Email Open Rate", value: "42.5%", change: "+3.2%", positive: true, icon: Mail, color: "var(--iw-purple)" },
    { title: "Campaign ROI", value: "762%", change: "+128%", positive: true, icon: DollarSign, color: "var(--iw-warning)" },
  ],
  trend: [
    { week: "W1", leads: 120, mqls: 38 },
    { week: "W2", leads: 145, mqls: 42 },
    { week: "W3", leads: 168, mqls: 52 },
    { week: "W4", leads: 190, mqls: 58 },
    { week: "W5", leads: 210, mqls: 72 },
    { week: "W6", leads: 245, mqls: 80 },
  ],
  sources: [
    { name: "Email", value: 35, color: "#0066FF" },
    { name: "Social", value: 25, color: "#FF4081" },
    { name: "Webinar", value: 20, color: "#7C4DFF" },
    { name: "Ads", value: 12, color: "#FF9800" },
    { name: "Referral", value: 8, color: "#00C853" },
  ],
};

const salesData = {
  kpis: [
    { title: "Pipeline Value", value: "$445K", change: "+15%", positive: true, icon: DollarSign, color: "var(--iw-blue)" },
    { title: "Win Rate", value: "28%", change: "+4%", positive: true, icon: Target, color: "var(--iw-success)" },
    { title: "Avg Deal Size", value: "$74K", change: "+$8K", positive: true, icon: TrendingUp, color: "var(--iw-purple)" },
    { title: "Sales Cycle", value: "45 days", change: "-5 days", positive: true, icon: BarChart3, color: "var(--iw-warning)" },
  ],
  trend: [
    { week: "W1", closed: 0, pipeline: 320 },
    { week: "W2", closed: 0, pipeline: 350 },
    { week: "W3", closed: 65, pipeline: 380 },
    { week: "W4", closed: 65, pipeline: 410 },
    { week: "W5", closed: 65, pipeline: 420 },
    { week: "W6", closed: 65, pipeline: 445 },
  ],
  sources: [
    { name: "Outbound", value: 40, color: "#0066FF" },
    { name: "Inbound", value: 30, color: "#00C853" },
    { name: "Partner", value: 18, color: "#7C4DFF" },
    { name: "Expansion", value: 12, color: "#FF9800" },
  ],
};

const moduleDataMap = { website: websiteData, marketing: marketingData, sales: salesData };

export function AnalyticsShell({ module }: AnalyticsShellProps) {
  const [period, setPeriod] = useState("6w");
  const data = moduleDataMap[module];
  const trendKey1 = module === "website" ? "visitors" : module === "marketing" ? "leads" : "closed";
  const trendKey2 = module === "website" ? "pageViews" : module === "marketing" ? "mqls" : "pipeline";
  const label1 = module === "website" ? "Visitors" : module === "marketing" ? "Leads" : "Closed ($K)";
  const label2 = module === "website" ? "Page Views" : module === "marketing" ? "MQLs" : "Pipeline ($K)";

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>{module === "website" ? "Website" : module === "marketing" ? "Marketing" : "Sales"} Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">Performance metrics and cross-system analytics</p>
        </div>
        <div className="flex gap-2">
          <div className="flex p-0.5 bg-secondary rounded-md">
            {["1w", "4w", "6w", "3m"].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded text-xs transition-all ${period === p ? "bg-card shadow-sm" : "text-muted-foreground"}`} style={{ fontWeight: period === p ? 500 : 400 }}>{p}</button>
            ))}
          </div>
          <button className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-md text-sm hover:bg-accent transition-colors"><Download className="w-3 h-3" /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {data.kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{kpi.title}</span>
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}><Icon className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl mb-1" style={{ fontWeight: 600 }}>{kpi.value}</div>
              <span className={`text-[11px] flex items-center gap-0.5 ${kpi.positive ? "text-[var(--iw-success)]" : "text-[var(--iw-danger)]"}`} style={{ fontWeight: 500 }}>
                {kpi.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {kpi.change}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3>Trend</h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-blue)]" /> {label1}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--iw-purple)]" /> {label2}</span>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id={`grad-${module}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--iw-blue)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--iw-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey={trendKey1} stroke="var(--iw-blue)" fill={`url(#grad-${module})`} strokeWidth={2} />
                <Area type="monotone" dataKey={trendKey2} stroke="var(--iw-purple)" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">{module === "sales" ? "Deal Sources" : "Traffic Sources"}</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.sources} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {data.sources.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {data.sources.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} /> {s.name}</span>
                <span style={{ fontWeight: 500 }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
