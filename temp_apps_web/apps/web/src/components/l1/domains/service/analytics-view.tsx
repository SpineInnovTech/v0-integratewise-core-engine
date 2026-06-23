import { BarChart3, Loader2 } from "lucide-react";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export function ServiceAnalyticsView() {
  const { data: projection, loading } = useHydrateProjection<any>("service");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = projection?.summary || {};
  const ticketVolume = projection?.analytics?.ticketVolume || [
    { period: "Week 1", count: 120 },
    { period: "Week 2", count: 145 },
    { period: "Week 3", count: 132 },
    { period: "Week 4", count: 158 },
  ];
  const responseTime = projection?.analytics?.responseTime || [
    { period: "Week 1", avg: 55 },
    { period: "Week 2", avg: 48 },
    { period: "Week 3", avg: 42 },
    { period: "Week 4", avg: 38 },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Service Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Performance metrics and trends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "CSAT Score",
            value: `${summary.csatScore || 87}%`,
            color: "text-iw-forest-mid",
          },
          {
            label: "Avg Response",
            value: `${summary.avgResponseTime || 45}m`,
            color: "text-iw-slate-mid",
          },
          {
            label: "Resolution Rate",
            value: `${summary.firstContactResolution || 62}%`,
            color: "text-iw-slate-mid",
          },
          { label: "Open Tickets", value: summary.openTickets || 24, color: "text-iw-gold" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground">{kpi.label}</div>
            <div className={`text-2xl font-semibold mt-1 ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-4">Ticket Volume</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ticketVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--iw-forest-bright)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-4">Avg Response Time (min)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={responseTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="avg"
                fill="var(--iw-success, #3d7a50)"
                fillOpacity={0.1}
                stroke="var(--iw-success, #3d7a50)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default ServiceAnalyticsView;
