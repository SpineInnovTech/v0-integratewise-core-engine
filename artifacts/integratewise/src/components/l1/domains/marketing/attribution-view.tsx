/**
 * Marketing — Attribution View
 * Data from Spine SSOT marketing projection.
 */
import { useState, useMemo } from "react";
import { Target, TrendingUp, DollarSign, Users, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { formatCurrency } from "../spine-projection";

type AttributionModel = "first" | "last" | "multi";

export function AttributionView() {
  const { data: proj } = useHydrateProjection<any>("marketing");
  const attributionData = proj?.attribution || [];
  const funnelStages = proj?.funnelStages || proj?.funnel_stages || [];
  const channelROI = proj?.channelROI || proj?.channel_roi || [];
  const summary = proj?.summary || {};

  const [model, setModel] = useState<AttributionModel>("multi");

  const totalRevenue = attributionData.reduce((s: number, d: any) => s + (d.revenue || 0), 0);
  const modelKey = model === "first" ? "firstTouch" : model === "last" ? "lastTouch" : "multiTouch";
  const totalConversions = attributionData.reduce(
    (s: number, d: any) => s + (d[modelKey] || d.first_touch || 0),
    0
  );

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg" style={{ fontWeight: 600 }}>
            Attribution
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-touch attribution models and funnel analysis
          </p>
        </div>
        <div className="flex p-0.5 bg-secondary rounded-md">
          {(["first", "last", "multi"] as AttributionModel[]).map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={`px-3 py-1.5 rounded text-xs transition-all ${model === m ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              style={{ fontWeight: model === m ? 500 : 400 }}
            >
              {m === "first" ? "First Touch" : m === "last" ? "Last Touch" : "Multi-Touch"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: DollarSign,
            color: "var(--iw-success)",
            label: "Attributed Revenue",
            value: totalRevenue > 0 ? formatCurrency(totalRevenue, true) : "—",
          },
          {
            icon: Users,
            color: "var(--iw-blue)",
            label: "Total Conversions",
            value: totalConversions > 0 ? totalConversions.toString() : "—",
          },
          {
            icon: Target,
            color: "var(--iw-purple)",
            label: "Channels Tracked",
            value: attributionData.length > 0 ? attributionData.length.toString() : "—",
          },
          {
            icon: TrendingUp,
            color: "var(--iw-warning)",
            label: "Avg Deal Size",
            value:
              totalRevenue > 0 && totalConversions > 0
                ? formatCurrency(Math.round(totalRevenue / totalConversions), true)
                : summary.avgDealSize
                  ? formatCurrency(summary.avgDealSize, true)
                  : "—",
          },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
            <div className="text-lg" style={{ fontWeight: 600 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {attributionData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
              Channel Attribution (
              {model === "first" ? "First Touch" : model === "last" ? "Last Touch" : "Multi-Touch"})
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attributionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis
                    dataKey="channel"
                    type="category"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey={modelKey}
                    fill="var(--iw-blue)"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                    name="Conversions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {channelROI.length > 0 ? (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
                Campaign ROI by Channel
              </h3>
              <div className="space-y-3">
                {channelROI.map((ch: any) => {
                  const maxROI = Math.max(...channelROI.map((c: any) => c.roi || 0), 1);
                  return (
                    <div key={ch.name || ch.channel}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ fontWeight: 500 }}>
                          {ch.name || ch.channel}
                        </span>
                        <span
                          className="text-xs"
                          style={{
                            fontWeight: 600,
                            color: (ch.roi || 0) > 500 ? "var(--iw-success)" : "inherit",
                          }}
                        >
                          {ch.roi || 0}% ROI
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(((ch.roi || 0) / maxROI) * 100, 100)}%`,
                            backgroundColor: ch.color || "var(--iw-blue)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-center text-sm text-muted-foreground">
              No channel ROI data available
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          No attribution data yet. Connect your marketing tools to populate.
        </div>
      )}

      {/* Conversion Funnel */}
      {funnelStages.length > 0 ? (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Conversion Funnel
          </h3>
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {funnelStages.map((stage: any, i: number) => (
              <div key={stage.stage || i} className="flex items-center gap-2 flex-shrink-0">
                <div className="text-center min-w-[100px]">
                  <div
                    className="w-full py-3 rounded-lg mb-1"
                    style={{ backgroundColor: "var(--iw-blue)", opacity: 1 - i * 0.15 }}
                  >
                    <div className="text-white text-sm" style={{ fontWeight: 600 }}>
                      {(stage.count || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs" style={{ fontWeight: 500 }}>
                    {stage.stage}
                  </div>
                  {stage.dropoff > 0 && (
                    <div className="text-[10px] text-[var(--iw-danger)]">-{stage.dropoff}%</div>
                  )}
                </div>
                {i < funnelStages.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : attributionData.length > 0 ? null : null}
    </div>
  );
}

export default AttributionView;
