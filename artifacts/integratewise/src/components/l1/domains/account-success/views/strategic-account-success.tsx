/**
 * Strategic Account Success — Executive/board view
 * Account Success Product Family
 */
import React from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import {
  DollarSign,
  Shield,
  Heart,
  Calendar,
  TrendingUp,
  Target,
  AlertTriangle,
} from "lucide-react";
import type { AccountMaster } from "../csm-intelligence-data";

export function StrategicAccountSuccess() {
  const { data: projection } = useHydrateProjection("customer_success");
  const { data: batch, isLoading } = useWorkspaceEntitiesBatch([
    "account_master",
    "strategic_objective",
    "initiative",
    "stakeholder_outcome",
  ]);
  const accounts = (batch.account_master ?? []) as AccountMaster[];
  const objectives = batch.strategic_objective ?? [];
  const initiatives = batch.initiative ?? [];
  const outcomes = batch.stakeholder_outcome ?? [];

  const totalArr = accounts.reduce((s, a) => s + (a.arr || 0), 0);
  const avgHealth = accounts.length
    ? Math.round(accounts.reduce((s, a) => s + (a.healthScore || 0), 0) / accounts.length)
    : 0;
  const activeAccounts = accounts.filter((a) => a.accountStatus === "Active");
  const logoRetention = accounts.length
    ? Math.round((activeAccounts.length / accounts.length) * 100)
    : 0;
  const renewals90d = accounts.filter((a) => a.daysToRenewal > 0 && a.daysToRenewal <= 90);
  const renewalArr = renewals90d.reduce((s, a) => s + (a.arr || 0), 0);

  // Industry breakdown
  const byIndustry: Record<string, { count: number; arr: number }> = {};
  accounts.forEach((a) => {
    const ind = a.industryVertical || "Other";
    if (!byIndustry[ind]) byIndustry[ind] = { count: 0, arr: 0 };
    byIndustry[ind].count++;
    byIndustry[ind].arr += a.arr || 0;
  });
  const industries = Object.entries(byIndustry).sort((a, b) => b[1].arr - a[1].arr);
  const maxIndustryArr = industries[0]?.[1].arr || 1;

  const activeInitiatives = initiatives.filter(
    (i: any) => i.status === "active" || i.status === "in_progress"
  );
  const blockedInitiatives = initiatives.filter((i: any) => i.status === "blocked");

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading Strategic View...
      </div>
    );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-iw-slate" /> Strategic Account Success
        </h2>
        <p className="text-sm text-muted-foreground">Executive view — VP CS / CCO</p>
      </div>

      {/* Big 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BigStat
          label="Total ARR"
          value={`$${(totalArr / 1000000).toFixed(1)}M`}
          icon={<DollarSign className="h-5 w-5" />}
          color="text-iw-forest-mid"
        />
        <BigStat
          label="Logo Retention"
          value={`${logoRetention}%`}
          icon={<Shield className="h-5 w-5" />}
          color={logoRetention >= 90 ? "text-iw-forest-mid" : "text-iw-gold-light"}
        />
        <BigStat
          label="Avg Health"
          value={avgHealth}
          icon={<Heart className="h-5 w-5" />}
          color={avgHealth >= 70 ? "text-iw-forest-mid" : "text-iw-gold-light"}
        />
        <BigStat
          label="ARR Renewing 90d"
          value={`$${(renewalArr / 1000).toFixed(0)}K`}
          icon={<Calendar className="h-5 w-5" />}
          color="text-iw-slate-mid"
        />
      </div>

      {/* ARR by Industry */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">ARR by Industry</h3>
        <div className="space-y-2">
          {industries.slice(0, 8).map(([name, data]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-xs w-28 truncate">{name}</span>
              <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-iw-slate-mid rounded-full"
                  style={{ width: `${(data.arr / maxIndustryArr) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium w-20 text-right">
                ${(data.arr / 1000).toFixed(0)}K ({data.count})
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Initiative Portfolio */}
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Initiative Portfolio</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 bg-iw-forest/5 dark:bg-iw-forest/90/20 rounded">
              <p className="text-lg font-bold text-iw-forest-mid">{activeInitiatives.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-2 bg-iw-red/5 dark:bg-iw-red/90/20 rounded">
              <p className="text-lg font-bold text-iw-red">{blockedInitiatives.length}</p>
              <p className="text-xs text-muted-foreground">Blocked</p>
            </div>
            <div className="text-center p-2 bg-iw-slate/5 dark:bg-iw-slate/90/20 rounded">
              <p className="text-lg font-bold text-iw-slate-mid">{initiatives.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
          {activeInitiatives.slice(0, 5).map((init: any) => (
            <div
              key={init.id}
              className="flex items-center justify-between py-1.5 text-sm border-b last:border-0"
            >
              <span>{init.title || init.name || "Initiative"}</span>
              <span className="text-xs text-muted-foreground">{init.progress || 0}%</span>
            </div>
          ))}
        </div>

        {/* Renewals at Risk */}
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-iw-gold-light" /> Renewals at Risk
          </h3>
          {renewals90d.filter((a) => a.healthScore < 70).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No at-risk renewals in next 90 days
            </p>
          ) : (
            renewals90d
              .filter((a) => a.healthScore < 70)
              .map((a) => (
                <div
                  key={a.accountId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{a.accountName}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.daysToRenewal}d · ${(a.arr / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${a.healthScore < 40 ? "text-iw-red" : "text-iw-gold-light"}`}
                  >
                    {a.healthScore}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="p-5 border rounded-lg bg-card">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default StrategicAccountSuccess;
