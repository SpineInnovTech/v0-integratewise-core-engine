/**
 * Service — SLA Dashboard
 * First domain-specific Work module for SERVICE. L2-wired: insights (e.g. top SLA risks).
 * Data: Spine projection via useHydrateProjection("service") — sla_metric entities.
 */
import { useMemo } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Insights, useL2Recommendations } from "@/hooks/use-l2";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type SLAMetric = {
  id?: string;
  name: string;
  target: string;
  actual: string;
  status: string;
};

export function ServiceSLADashboardView() {
  const auth = useAuth();
  const userId = auth?.user?.id ?? "";
  const ctx = useMemo(
    () => (userId ? { userId, domain: "SERVICE" as const, viewId: "sla-dashboard" } : null),
    [userId]
  );
  useL2Insights(ctx);
  useL2Recommendations(ctx);

  const { data: proj, loading } = useHydrateProjection<any>("service");
  const slaMetrics: SLAMetric[] = useMemo(() => {
    if (!proj) return [];
    const raw = proj.sla_metrics || proj.sla_metric || proj.slas || [];
    return (Array.isArray(raw) ? raw : []).map((r: any) => ({
      id: r.id,
      name: r.name || r.metric_name || "SLA Metric",
      target: r.target || r.target_value || "—",
      actual: r.actual || r.actual_value || "—",
      status: r.status || (r.breached ? "breach" : "ok"),
    }));
  }, [proj]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading SLA metrics...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-semibold">SLA Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track response and resolution SLAs. AI-identified backlog risks and recurring issues can
          be routed here for approval.
        </p>
      </div>
      {slaMetrics.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">No SLA data yet</h3>
          <p className="text-xs text-muted-foreground">
            Connect your service tools to track SLA metrics here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {slaMetrics.map((row) => (
            <Card key={row.name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{row.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Target: {row.target} · Actual: {row.actual}
                </p>
                <Badge variant={row.status === "breach" ? "destructive" : "secondary"}>
                  {row.status === "breach" ? "Breach" : "Within SLA"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
