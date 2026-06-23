/**
 * Value Streams View — Business process value streams with cycle time and value metrics.
 * Entity: Value_Streams
 */
import { useState } from "react";
import { Search, ArrowDown, Clock, Zap, DollarSign } from "lucide-react";
import {
  getAccountName,
  formatCurrency,
  formatNumber,
  riskColor,
  type ValueStream,
} from "../csm-intelligence-data";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";

export function ValueStreamsView() {
  const {
    data: valueStreamsData,
    isLoading,
    error,
  } = useWorkspaceEntities<ValueStream>("value_stream");
  const [search, setSearch] = useState("");

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading value streams...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-64 text-iw-red">
        Failed to load data: {error}
      </div>
    );

  const filtered = valueStreamsData.filter(
    (v) =>
      !search ||
      v.valueStreamName.toLowerCase().includes(search.toLowerCase()) ||
      getAccountName(v.account).toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = valueStreamsData.reduce((s, v) => s + v.totalBusinessValueUsd, 0);
  const withReduction = valueStreamsData.filter((v) => v.cycleTimeReductionPercent > 0);
  const avgReduction =
    withReduction.length > 0
      ? Math.round(
          withReduction.reduce((s, v) => s + v.cycleTimeReductionPercent, 0) / withReduction.length
        )
      : 0;

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>
            Value Streams
          </h2>
          <p className="text-xs text-muted-foreground">
            {valueStreamsData.length} value streams · Business process optimization tracking
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-48"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Total Business Value
          </p>
          <p className="text-xl mt-1 text-iw-forest-bright" style={{ fontWeight: 700 }}>
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Avg Cycle Time Reduction
          </p>
          <p className="text-xl mt-1 text-iw-slate-mid" style={{ fontWeight: 700 }}>
            {avgReduction}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Total APIs Consumed
          </p>
          <p className="text-xl mt-1 text-foreground" style={{ fontWeight: 700 }}>
            {valueStreamsData.reduce((s, v) => s + v.apisConsumed, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Annual Transactions
          </p>
          <p className="text-xl mt-1 text-foreground" style={{ fontWeight: 700 }}>
            {formatNumber(valueStreamsData.reduce((s, v) => s + v.annualTransactionVolume, 0))}
          </p>
        </div>
      </div>

      {/* Stream Cards */}
      <div className="space-y-3">
        {filtered.map((v) => (
          <div key={v.streamId} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-iw-gold flex-shrink-0" />
                  <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>
                    {v.valueStreamName}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {getAccountName(v.account)} · {v.streamId} · Owner: {v.processOwner}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{v.businessProcess}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    fontWeight: 600,
                    color: riskColor(v.operationalRiskLevel),
                    background: `${riskColor(v.operationalRiskLevel)}15`,
                  }}
                >
                  Risk: {v.operationalRiskLevel}
                </span>
                <span className="text-xs text-iw-forest-bright" style={{ fontWeight: 700 }}>
                  {formatCurrency(v.totalBusinessValueUsd)}
                </span>
              </div>
            </div>

            {/* Cycle Time Visual */}
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground" style={{ fontWeight: 600 }}>
                  Cycle Time Optimization
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground">Baseline</p>
                  <p className="text-sm text-muted-foreground" style={{ fontWeight: 600 }}>
                    {v.cycleTimeBaselineHours}h
                  </p>
                </div>
                <ArrowDown className="w-3 h-3 text-iw-forest-bright rotate-[-90deg]" />
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground">Current</p>
                  <p className="text-sm text-foreground" style={{ fontWeight: 700 }}>
                    {v.cycleTimeCurrentHours}h
                  </p>
                </div>
                <ArrowDown className="w-3 h-3 text-iw-slate-mid rotate-[-90deg]" />
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground">Target</p>
                  <p className="text-sm text-iw-slate-mid" style={{ fontWeight: 600 }}>
                    {v.cycleTimeTargetHours}h
                  </p>
                </div>
                <div className="ml-auto text-center px-3 py-1 rounded-lg bg-iw-forest-bright/10">
                  <p className="text-[9px] text-iw-forest-mid">Reduction</p>
                  <p className="text-sm text-iw-forest-bright" style={{ fontWeight: 700 }}>
                    {v.cycleTimeReductionPercent}%
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Endpoints
                </p>
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>
                  {v.integrationEndpoints}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  APIs Consumed
                </p>
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>
                  {v.apisConsumed}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Annual Volume
                </p>
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>
                  {formatNumber(v.annualTransactionVolume)}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  CSAT Impact
                </p>
                <p
                  className="text-xs"
                  style={{
                    fontWeight: 600,
                    color: v.customerSatisfactionImpact === "High" ? "#22c55e" : "#b8943f",
                  }}
                >
                  {v.customerSatisfactionImpact}
                </p>
              </div>
            </div>

            {/* Linkages */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Links:</span>
              {v.linkedStrategicObjectives.map((o) => (
                <span
                  key={o}
                  className="px-1.5 py-0.5 rounded bg-iw-forest-bright/10 text-iw-forest-mid"
                  style={{ fontWeight: 500 }}
                >
                  {o}
                </span>
              ))}
              {v.enabledMuleSoftCapabilities.map((c) => (
                <span
                  key={c}
                  className="px-1.5 py-0.5 rounded bg-iw-slate-mid/10 text-iw-slate-mid"
                  style={{ fontWeight: 500 }}
                >
                  {c}
                </span>
              ))}
              {v.linkedMetrics.map((m) => (
                <span
                  key={m}
                  className="px-1.5 py-0.5 rounded bg-iw-forest-bright/10 text-iw-forest-mid"
                  style={{ fontWeight: 500 }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
