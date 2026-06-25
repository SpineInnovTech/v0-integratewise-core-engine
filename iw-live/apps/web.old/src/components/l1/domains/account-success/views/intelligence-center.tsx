/**
 * Intelligence Center — Portfolio management for managers and leaders
 * Account Success Product Family
 */
import React from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import { BarChart3, Heart, DollarSign, AlertTriangle, Users, Zap, TrendingUp } from "lucide-react";
import type { AccountMaster, PeopleTeam } from "../csm-intelligence-data";

export function IntelligenceCenter() {
  const { data: batch, isLoading } = useWorkspaceEntitiesBatch([
    "account_master",
    "people_team",
    "risk",
    "generated_insight",
  ]);
  const accounts = (batch.account_master ?? []) as AccountMaster[];
  const team = (batch.people_team ?? []) as PeopleTeam[];
  const risks = batch.risk ?? [];
  const insights = batch.generated_insight ?? [];

  const avgHealth = accounts.length
    ? Math.round(accounts.reduce((s, a) => s + (a.healthScore || 0), 0) / accounts.length)
    : 0;
  const totalArr = accounts.reduce((s, a) => s + (a.arr || 0), 0);
  const atRisk = accounts.filter((a) => a.healthScore < 70);
  const atRiskArr = atRisk.reduce((s, a) => s + (a.arr || 0), 0);
  const renewals30d = accounts.filter((a) => a.daysToRenewal > 0 && a.daysToRenewal <= 30);
  const healthy = accounts.filter((a) => a.healthScore >= 70);
  const critical = accounts.filter((a) => a.healthScore < 40);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading Intelligence Center...
      </div>
    );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-iw-slate-mid" /> Intelligence Center
        </h2>
        <p className="text-sm text-muted-foreground">Portfolio management for CS leaders</p>
      </div>

      {/* 6 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI
          label="Avg Health"
          value={avgHealth}
          icon={<Heart className="h-4 w-4" />}
          color={avgHealth >= 70 ? "text-iw-forest-bright" : "text-iw-gold-light"}
        />
        <KPI
          label="Total ARR"
          value={`$${(totalArr / 1000000).toFixed(1)}M`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPI
          label="At-Risk"
          value={`${atRisk.length} ($${(atRiskArr / 1000).toFixed(0)}K)`}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-iw-gold-light"
        />
        <KPI
          label="Renewals 30d"
          value={renewals30d.length}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPI
          label="Open Risks"
          value={risks.length}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-iw-red"
        />
        <KPI
          label="AI Signals"
          value={insights.length}
          icon={<Zap className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
      </div>

      {/* Health Distribution */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Health Distribution</h3>
        <div className="flex h-6 rounded-full overflow-hidden">
          {healthy.length > 0 && (
            <div
              className="bg-iw-forest-bright"
              style={{ width: `${(healthy.length / accounts.length) * 100}%` }}
              title={`Healthy: ${healthy.length}`}
            />
          )}
          {atRisk.length > 0 && (
            <div
              className="bg-orange-400"
              style={{ width: `${(atRisk.length / accounts.length) * 100}%` }}
              title={`At Risk: ${atRisk.length}`}
            />
          )}
          {critical.length > 0 && (
            <div
              className="bg-iw-red"
              style={{ width: `${(critical.length / accounts.length) * 100}%` }}
              title={`Critical: ${critical.length}`}
            />
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-iw-forest-bright" /> Healthy ({healthy.length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400" /> At Risk ({atRisk.length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-iw-red" /> Critical ({critical.length})
          </span>
        </div>
      </div>

      {/* Team Performance */}
      {team.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Team Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-2">CSM</th>
                  <th className="text-right">Accounts</th>
                  <th className="text-right">Avg Health</th>
                  <th className="text-right">ARR</th>
                  <th className="text-right">At Risk</th>
                </tr>
              </thead>
              <tbody>
                {team
                  .filter((t) => t.activeStatus === "Active")
                  .map((csm) => {
                    const csmAccounts = accounts.filter(
                      (a) => a.customerSuccessManager === csm.fullName
                    );
                    const csmHealth = csmAccounts.length
                      ? Math.round(
                          csmAccounts.reduce((s, a) => s + (a.healthScore || 0), 0) /
                            csmAccounts.length
                        )
                      : 0;
                    const csmArr = csmAccounts.reduce((s, a) => s + (a.arr || 0), 0);
                    const csmAtRisk = csmAccounts.filter((a) => a.healthScore < 70).length;
                    return (
                      <tr key={csm.personId} className="border-b hover:bg-muted/50">
                        <td className="py-2 font-medium">{csm.fullName}</td>
                        <td className="text-right">{csmAccounts.length}</td>
                        <td
                          className={`text-right font-medium ${csmHealth >= 70 ? "text-iw-forest-mid" : "text-iw-gold-light"}`}
                        >
                          {csmHealth}
                        </td>
                        <td className="text-right">${(csmArr / 1000).toFixed(0)}K</td>
                        <td
                          className={`text-right ${csmAtRisk > 0 ? "text-iw-red font-medium" : ""}`}
                        >
                          {csmAtRisk}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accounts Needing Attention */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Accounts Needing Attention</h3>
        <div className="space-y-2">
          {[...critical, ...atRisk].slice(0, 8).map((a) => (
            <div
              key={a.accountId}
              className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium">{a.accountName}</p>
                <p className="text-xs text-muted-foreground">
                  {a.customerSuccessManager} · {a.renewalRiskLevel} risk
                </p>
              </div>
              <span
                className={`text-sm font-bold ${a.healthScore < 40 ? "text-iw-red" : "text-iw-gold-light"}`}
              >
                {a.healthScore}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  icon,
  color = "text-muted-foreground",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-3 border rounded-lg bg-card">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

export default IntelligenceCenter;
