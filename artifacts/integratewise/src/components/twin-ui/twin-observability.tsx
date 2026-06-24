import type { FC } from "react";
import {
  BarChart as BarChartBase,
  Bar as BarBase,
  XAxis as XAxisBase,
  YAxis as YAxisBase,
  Tooltip as TooltipBase,
  ResponsiveContainer,
  LineChart as LineChartBase,
  Line as LineBase,
  CartesianGrid as CartesianGridBase,
} from "recharts";
import { Activity, Brain, MessageSquare, Bot, GitBranch, Wrench, DollarSign, Clock, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";

// recharts 2.x types don't satisfy React 19's stricter JSX.ElementType — cast
// each chart primitive (same workaround used in metrics-view.tsx).
const BarChart = BarChartBase as unknown as FC<any>;
const Bar = BarBase as unknown as FC<any>;
const XAxis = XAxisBase as unknown as FC<any>;
const YAxis = YAxisBase as unknown as FC<any>;
const Tooltip = TooltipBase as unknown as FC<any>;
const LineChart = LineChartBase as unknown as FC<any>;
const Line = LineBase as unknown as FC<any>;
const CartesianGrid = CartesianGridBase as unknown as FC<any>;

const hourlyActivity = [
  { h: "6", convs: 0, agents: 1, tools: 3 },
  { h: "7", convs: 0, agents: 2, tools: 5 },
  { h: "8", convs: 1, agents: 4, tools: 12 },
  { h: "9", convs: 2, agents: 3, tools: 9 },
  { h: "10", convs: 3, agents: 5, tools: 18 },
  { h: "11", convs: 1, agents: 2, tools: 7 },
  { h: "12", convs: 0, agents: 1, tools: 4 },
];

const latencyTrend = [
  { t: "Mon", p50: 820, p95: 2100 },
  { t: "Tue", p50: 740, p95: 1900 },
  { t: "Wed", p50: 910, p95: 2400 },
  { t: "Thu", p50: 680, p95: 1800 },
  { t: "Fri", p50: 760, p95: 2000 },
  { t: "Sat", p50: 620, p95: 1600 },
  { t: "Today", p50: 710, p95: 1750 },
];

const METRICS = [
  { icon: MessageSquare, label: "Conversations",   value: "47",     sub: "today",          up: true,  color: "var(--iw-blue)" },
  { icon: Clock,         label: "Sessions",         value: "1,024",  sub: "total",          up: true,  color: "var(--iw-blue)" },
  { icon: Brain,         label: "Memory Reads",     value: "2,847",  sub: "today",          up: true,  color: "var(--iw-purple)" },
  { icon: Brain,         label: "Memory Writes",    value: "312",    sub: "today",          up: true,  color: "var(--iw-purple)" },
  { icon: Bot,           label: "Agent Runs",       value: "1,243",  sub: "today",          up: true,  color: "var(--iw-success)" },
  { icon: GitBranch,     label: "Workflow Runs",    value: "89",     sub: "today",          up: true,  color: "var(--iw-success)" },
  { icon: Wrench,        label: "Tool Calls",       value: "4,821",  sub: "today",          up: false, color: "var(--iw-warning)" },
  { icon: DollarSign,    label: "Cost Today",       value: "$1.84",  sub: "↓ 12% vs avg",  up: true,  color: "var(--iw-success)" },
  { icon: Clock,         label: "Avg Latency",      value: "710ms",  sub: "p50",            up: true,  color: "var(--iw-blue)" },
  { icon: AlertTriangle, label: "Failures",         value: "2",      sub: "today",          up: true,  color: "var(--iw-danger)" },
  { icon: CheckCircle2,  label: "Success Rate",     value: "99.8%",  sub: "7d avg",         up: true,  color: "var(--iw-success)" },
  { icon: Activity,      label: "Active Sessions",  value: "1",      sub: "right now",      up: true,  color: "var(--iw-blue)" },
];

export function TwinObservability() {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "var(--background)" }}>
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <h2 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>Observability</h2>
        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
          Twin health — conversations, sessions, memory, agents, costs, latency
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Metric grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {METRICS.map((m, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <m.icon className="w-3.5 h-3.5 shrink-0" style={{ color: m.color }} />
                <span className="text-[9px] uppercase tracking-wider truncate" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{m.label}</span>
              </div>
              <div className="text-xl" style={{ fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {m.up ? <TrendingUp className="w-3 h-3" style={{ color: "var(--iw-success)" }} /> : <TrendingDown className="w-3 h-3" style={{ color: "var(--iw-danger)" }} />}
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{m.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Activity chart */}
        <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs mb-3" style={{ fontWeight: 700, color: "var(--foreground)" }}>Activity today (by hour)</p>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyActivity} barSize={12}>
                <XAxis dataKey="h" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="convs" fill="var(--iw-blue)" radius={[3,3,0,0]} name="Conversations" />
                <Bar dataKey="agents" fill="var(--iw-success)" radius={[3,3,0,0]} name="Agent runs" />
                <Bar dataKey="tools" fill="var(--iw-warning)" radius={[3,3,0,0]} name="Tool calls" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 mt-2">
            {[["var(--iw-blue)","Conversations"],["var(--iw-success)","Agents"],["var(--iw-warning)","Tools"]].map(([c,l],i) => (
              <span key={i} className="flex items-center gap-1 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Latency chart */}
        <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs mb-3" style={{ fontWeight: 700, color: "var(--foreground)" }}>Response latency (7d, ms)</p>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="p50" stroke="var(--iw-success)" strokeWidth={2} dot={false} name="p50" />
                <Line type="monotone" dataKey="p95" stroke="var(--iw-warning)" strokeWidth={2} dot={false} strokeDasharray="4 4" name="p95" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent failures */}
        <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs mb-3" style={{ fontWeight: 700, color: "var(--foreground)" }}>Recent failures</p>
          {[
            { id: "exec-0840", msg: "Schema Drift Detector — malformed Jira webhook payload", time: "6:10 AM", resolved: false },
            { id: "exec-0821", msg: "CRM Reconciler — Salesforce rate limit hit, retried successfully", time: "Yesterday", resolved: true },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: f.resolved ? "var(--iw-success)" : "var(--iw-danger)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px]" style={{ color: "var(--foreground)", fontWeight: 500 }}>{f.msg}</p>
                <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{f.id} · {f.time} · {f.resolved ? "Resolved" : "Open"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
