/**
 * BizOps — Ops Command Center
 * Cross-functional view across pipeline, churn, incidents, and workflows.
 * All data sourced from Spine via Hydration Fabric.
 */
import { useMemo } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Insights, useL2Recommendations } from "@/hooks/use-l2";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Loader2, Database } from "lucide-react";

interface CommandCenterProjection {
  metrics?: {
    pipelineChurnRate?: string;
    openIncidents?: string;
    workflowsRunning?: string;
    costVsPlan?: string;
  };
  signals?: { id: string; title: string; description: string; domain: string }[];
}

const METRIC_CONFIG = [
  {
    key: "pipelineChurnRate",
    label: "Pipeline → Churn",
    icon: Activity,
    defaultStatus: "on-track",
  },
  {
    key: "openIncidents",
    label: "Open Incidents",
    icon: AlertTriangle,
    defaultStatus: "attention",
  },
  { key: "workflowsRunning", label: "Workflows Running", icon: CheckCircle, defaultStatus: "ok" },
  { key: "costVsPlan", label: "Cost vs Plan", icon: TrendingUp, defaultStatus: "on-track" },
] as const;

export function OpsCommandCenterView() {
  const auth = useAuth();
  const userId = auth?.user?.id ?? "";
  const ctx = useMemo(
    () => (userId ? { userId, domain: "BIZOPS" as const, viewId: "ops-command-center" } : null),
    [userId]
  );
  useL2Insights(ctx);
  useL2Recommendations(ctx);

  const {
    data: projection,
    loading,
    error,
  } = useHydrateProjection<CommandCenterProjection>("bizops");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !projection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Database className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Command Center data not available. Complete onboarding to populate.
          </p>
          {error && <p className="text-xs text-[var(--iw-danger)]">{error}</p>}
        </div>
      </div>
    );
  }

  const metrics = projection.metrics || {};
  const signals = projection.signals || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-semibold">Ops Command Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Cross-functional view across pipeline, churn, incidents, and workflows. One spine, one
          place.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_CONFIG.map((m) => {
          const Icon = m.icon;
          const value = (metrics as any)[m.key] ?? "—";
          const status = value === "—" ? "no-data" : m.defaultStatus;
          return (
            <Card key={m.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{value}</p>
                <Badge
                  variant={status === "attention" ? "destructive" : "secondary"}
                  className="mt-1 text-xs"
                >
                  {status === "no-data" ? "awaiting data" : status}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cross-domain signals</CardTitle>
        </CardHeader>
        <CardContent>
          {signals.length > 0 ? (
            <div className="space-y-2">
              {signals.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-secondary transition-colors"
                >
                  <Badge variant="secondary" className="text-[10px] mt-0.5">
                    {s.domain || "cross"}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No cross-functional signals yet. AI-generated insights will appear here once data
              flows through the Spine.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
