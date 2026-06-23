/**
 * CEO View — Company-wide dashboard
 */
import React from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import { DollarSign, TrendingUp, Users, Target, Zap, AlertTriangle } from "lucide-react";

export function CEOView() {
  const { data: batch } = useWorkspaceEntitiesBatch([
    "account",
    "opportunity",
    "okr",
    "generated_insight",
  ]);
  const accounts = batch.account ?? [];
  const opportunities = batch.opportunity ?? [];
  const okrs = batch.okr ?? [];
  const insights = batch.generated_insight ?? [];

  const totalArr = accounts.reduce((s: number, a: any) => s + (a.arr || a.mrr * 12 || 0), 0);
  const pipeline = opportunities.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const avgOkrProgress = okrs.length
    ? Math.round(okrs.reduce((s: number, o: any) => s + (o.progress || 0), 0) / okrs.length)
    : 0;
  const criticalSignals = insights.filter(
    (i: any) => i.severity === "critical" || i.severity === "high"
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold">CEO Dashboard</h2>
        <p className="text-sm text-muted-foreground">Company-wide performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BigCard
          label="ARR"
          value={`$${(totalArr / 1000000).toFixed(1)}M`}
          icon={<DollarSign className="h-5 w-5 text-iw-forest-mid" />}
        />
        <BigCard
          label="Pipeline"
          value={`$${(pipeline / 1000000).toFixed(1)}M`}
          icon={<TrendingUp className="h-5 w-5 text-iw-slate-mid" />}
        />
        <BigCard
          label="Customers"
          value={accounts.length}
          icon={<Users className="h-5 w-5 text-iw-slate" />}
        />
        <BigCard
          label="OKR Progress"
          value={`${avgOkrProgress}%`}
          icon={<Target className="h-5 w-5 text-iw-slate-mid" />}
        />
      </div>

      {criticalSignals.length > 0 && (
        <div className="border rounded-lg p-4 border-iw-red/20 bg-iw-red/5 dark:bg-iw-red/90/10">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-iw-red" /> Critical Signals
          </h3>
          {criticalSignals.slice(0, 5).map((s: any, i: number) => (
            <div key={i} className="py-2 border-b last:border-0 text-sm">
              {s.title || s.content || "Signal"}
            </div>
          ))}
        </div>
      )}

      {okrs.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Strategic Objectives</h3>
          {okrs.slice(0, 6).map((okr: any) => (
            <div key={okr.id} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{okr.title || okr.name || "OKR"}</span>
                <span className="text-muted-foreground">{okr.progress || 0}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${(okr.progress || 0) >= 70 ? "bg-iw-forest-bright" : (okr.progress || 0) >= 40 ? "bg-iw-gold" : "bg-iw-red"}`}
                  style={{ width: `${okr.progress || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BigCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-5 border rounded-lg bg-card">
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default CEOView;
