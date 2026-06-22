import { useState } from "react";
import { Target, TrendingUp, DollarSign, Users, ArrowRight, Eye, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const attributionData = [
  { channel: "Organic Search", firstTouch: 28, lastTouch: 18, multiTouch: 22, revenue: 98000 },
  { channel: "LinkedIn Ads", firstTouch: 22, lastTouch: 15, multiTouch: 18, revenue: 72000 },
  { channel: "Email Campaign", firstTouch: 12, lastTouch: 32, multiTouch: 24, revenue: 84000 },
  { channel: "Direct", firstTouch: 18, lastTouch: 12, multiTouch: 14, revenue: 56000 },
  { channel: "Referral", firstTouch: 10, lastTouch: 8, multiTouch: 9, revenue: 35000 },
  { channel: "Webinar", firstTouch: 8, lastTouch: 12, multiTouch: 10, revenue: 42000 },
  { channel: "Google Ads", firstTouch: 2, lastTouch: 3, multiTouch: 3, revenue: 12000 },
];

const funnelStages = [
  { stage: "Visitors", count: 12450, dropoff: 0 },
  { stage: "Leads", count: 1078, dropoff: 91.3 },
  { stage: "MQLs", count: 342, dropoff: 68.3 },
  { stage: "SQLs", count: 128, dropoff: 62.6 },
  { stage: "Opportunities", count: 45, dropoff: 64.8 },
  { stage: "Closed Won", count: 18, dropoff: 60 },
];

const channelROI = [
  { name: "Email", roi: 1352, color: "#0066FF" },
  { name: "Organic", roi: 924, color: "#00C853" },
  { name: "LinkedIn", roi: 567, color: "#7C4DFF" },
  { name: "Webinar", roi: 433, color: "#FF4081" },
  { name: "Referral", roi: 380, color: "#FF9800" },
  { name: "Google Ads", roi: 120, color: "#F44336" },
];

export function AttributionView() {
  const [model, setModel] = useState<"first" | "last" | "multi">("multi");

  const totalRevenue = attributionData.reduce((s, d) => s + d.revenue, 0);
  const modelKey = model === "first" ? "firstTouch" : model === "last" ? "lastTouch" : "multiTouch";

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Attribution</h2>
          <p className="text-sm text-muted-foreground mt-1">Multi-touch attribution models and funnel analysis</p>
        </div>
        <div className="flex p-0.5 bg-secondary rounded-md">
          {[
            { id: "first" as const, label: "First Touch" },
            { id: "last" as const, label: "Last Touch" },
            { id: "multi" as const, label: "Multi-Touch" },
          ].map((m) => (
            <button key={m.id} onClick={() => setModel(m.id)} className={`px-3 py-1.5 rounded text-xs transition-all ${model === m.id ? "bg-card shadow-sm" : "text-muted-foreground"}`} style={{ fontWeight: model === m.id ? 500 : 400 }}>{m.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-[var(--iw-success)]" /><span className="text-[10px] text-muted-foreground">Attributed Revenue</span></div><div className="text-lg" style={{ fontWeight: 600 }}>${(totalRevenue / 1000).toFixed(0)}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-[var(--iw-blue)]" /><span className="text-[10px] text-muted-foreground">Total Conversions</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{attributionData.reduce((s, d) => s + d[modelKey], 0)}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><Target className="w-4 h-4 text-[var(--iw-purple)]" /><span className="text-[10px] text-muted-foreground">Channels Tracked</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{attributionData.length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-[var(--iw-warning)]" /><span className="text-[10px] text-muted-foreground">Avg Deal Size</span></div><div className="text-lg" style={{ fontWeight: 600 }}>${Math.round(totalRevenue / 18 / 100) * 100}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Attribution Chart */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Channel Attribution ({model === "first" ? "First Touch" : model === "last" ? "Last Touch" : "Multi-Touch"})</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis dataKey="channel" type="category" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey={modelKey} fill="var(--iw-blue)" radius={[0, 4, 4, 0]} barSize={16} name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROI by Channel */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="mb-4">Campaign ROI by Channel</h3>
          <div className="space-y-3">
            {channelROI.map((ch) => (
              <div key={ch.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ fontWeight: 500 }}>{ch.name}</span>
                  <span className="text-xs" style={{ fontWeight: 600, color: ch.roi > 500 ? "var(--iw-success)" : "inherit" }}>{ch.roi}% ROI</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min((ch.roi / 1352) * 100, 100)}%`, backgroundColor: ch.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="mb-4">Conversion Funnel</h3>
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {funnelStages.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-2 flex-shrink-0">
              <div className="text-center min-w-[100px]">
                <div className="w-full py-3 rounded-lg mb-1" style={{ backgroundColor: `var(--iw-blue)`, opacity: 1 - i * 0.15 }}>
                  <div className="text-white text-sm" style={{ fontWeight: 600 }}>{stage.count.toLocaleString()}</div>
                </div>
                <div className="text-xs" style={{ fontWeight: 500 }}>{stage.stage}</div>
                {stage.dropoff > 0 && <div className="text-[10px] text-[var(--iw-danger)]">-{stage.dropoff}%</div>}
              </div>
              {i < funnelStages.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
