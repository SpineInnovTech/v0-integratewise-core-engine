/**
 * CSM Accounts Hub — Daily operating view
 * Account Success Product Family
 */
import React from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Heart,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";
import type { AccountMaster } from "../csm-intelligence-data";

function StatCard({
  title,
  value,
  icon,
  color = "text-muted-foreground",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{title}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export function CSMAccountsHub() {
  const { data: batch, isLoading } = useWorkspaceEntitiesBatch([
    "account_master",
    "task_item",
    "engagement_log",
    "risk",
    "generated_insight",
  ]);
  const accounts = (batch.account_master ?? []) as AccountMaster[];
  const tasks = batch.task_item ?? [];
  const engagements = batch.engagement_log ?? [];
  const risks = batch.risk ?? [];
  const insights = batch.generated_insight ?? [];

  const healthyAccounts = accounts.filter((a) => a.healthScore >= 70);
  const atRiskAccounts = accounts.filter((a) => a.healthScore >= 40 && a.healthScore < 70);
  const criticalAccounts = accounts.filter((a) => a.healthScore < 40);
  const avgHealth = accounts.length
    ? Math.round(accounts.reduce((s, a) => s + (a.healthScore || 0), 0) / accounts.length)
    : 0;
  const totalArr = accounts.reduce((s, a) => s + (a.arr || 0), 0);
  const renewals30d = accounts.filter((a) => a.daysToRenewal > 0 && a.daysToRenewal <= 30);
  const tasksDue = tasks.filter((t: any) => t.status !== "completed");
  const openRisks = risks.filter((r: any) => r.status === "open" || r.status === "active");

  const [healthFilter, setHealthFilter] = React.useState<
    "all" | "healthy" | "at-risk" | "critical"
  >("all");
  const filteredAccounts =
    healthFilter === "all"
      ? accounts
      : healthFilter === "healthy"
        ? healthyAccounts
        : healthFilter === "at-risk"
          ? atRiskAccounts
          : criticalAccounts;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading Accounts Hub...
      </div>
    );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold">My Day</h2>
        <p className="text-sm text-muted-foreground">CSM daily operating view</p>
      </div>

      {/* My Day Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Engagements Today"
          value={engagements.length}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Tasks Due"
          value={tasksDue.length}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Open Risks"
          value={openRisks.length}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="text-iw-gold-light"
        />
        <StatCard
          title="Renewals (30d)"
          value={renewals30d.length}
          icon={<Activity className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
      </div>

      {/* My KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          title="Avg Health Score"
          value={avgHealth}
          icon={<Heart className="h-4 w-4" />}
          color={avgHealth >= 70 ? "text-iw-forest-bright" : "text-iw-gold-light"}
        />
        <StatCard
          title="Total ARR"
          value={`$${(totalArr / 1000).toFixed(0)}K`}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <StatCard title="Accounts" value={accounts.length} icon={<Users className="h-4 w-4" />} />
      </div>

      {/* Health Filter */}
      <div className="flex gap-2">
        {(["all", "healthy", "at-risk", "critical"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setHealthFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg capitalize ${healthFilter === f ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            {f}{" "}
            {f === "all"
              ? `(${accounts.length})`
              : f === "healthy"
                ? `(${healthyAccounts.length})`
                : f === "at-risk"
                  ? `(${atRiskAccounts.length})`
                  : `(${criticalAccounts.length})`}
          </button>
        ))}
      </div>

      {/* Account List */}
      <div className="border rounded-lg divide-y">
        {filteredAccounts
          .sort((a, b) => (a.healthScore || 0) - (b.healthScore || 0))
          .map((account) => (
            <div
              key={account.accountId}
              className="p-4 flex items-center justify-between hover:bg-muted/50"
            >
              <div>
                <p className="font-medium text-sm">{account.accountName}</p>
                <p className="text-xs text-muted-foreground">
                  {account.industryVertical} · {account.customerSuccessManager}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  ${(account.arr / 1000).toFixed(0)}K ARR
                </span>
                <span
                  className={`text-sm font-bold ${account.healthScore >= 70 ? "text-iw-forest-mid" : account.healthScore >= 40 ? "text-iw-gold-light" : "text-iw-red"}`}
                >
                  {account.healthScore}
                </span>
              </div>
            </div>
          ))}
        {filteredAccounts.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No accounts match filter
          </div>
        )}
      </div>

      {/* AI Signals */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-iw-slate-mid" /> AI Signals
          </h3>
          <div className="space-y-2">
            {insights.slice(0, 5).map((insight: any, i: number) => (
              <div
                key={i}
                className="p-3 border rounded-lg text-sm bg-iw-slate-mid/5 dark:bg-iw-slate-mid/90/10"
              >
                {insight.title || insight.content || insight.summary || "Signal detected"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CSMAccountsHub;
