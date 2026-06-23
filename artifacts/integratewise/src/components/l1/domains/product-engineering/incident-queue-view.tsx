/**
 * Product & Engineering — Incident Queue
 * First domain-specific Work module for PRODUCT_ENGINEERING.
 * L2: getInsights(incident-queue) — AI clusters, prioritization; base loader from Flow A when ready.
 * Data: Spine projection via useHydrateProjection("product_engineering") — incident/bug entities.
 */
import { useMemo } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Insights } from "@/hooks/use-l2";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles, Loader2 } from "lucide-react";

type IncidentItem = {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved";
  reportedAt: string;
  owner?: string;
};

const severityColors: Record<string, string> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export function IncidentQueueView() {
  const auth = useAuth();
  const userId = auth?.user?.id ?? "";
  const ctx = useMemo(
    () =>
      userId
        ? {
            userId,
            domain: "PRODUCT_ENGINEERING" as const,
            viewId: "incident-queue",
          }
        : null,
    [userId]
  );
  const { data: insights = [] } = useL2Insights(ctx);

  const { data: proj, loading } = useHydrateProjection<any>("product_engineering");
  const items: IncidentItem[] = useMemo(() => {
    if (!proj) return [];
    const raw = proj.incidents || proj.incident || proj.bugs || proj.bug || [];
    return (Array.isArray(raw) ? raw : []).map((r: any) => ({
      id: r.id || crypto.randomUUID(),
      title: r.title || r.name || r.summary || "Untitled incident",
      severity: r.severity || r.priority || "medium",
      status: r.status || "open",
      reportedAt: r.reportedAt || r.reported_at || r.created_at || new Date().toISOString(),
      owner: r.owner || r.assignee || r.team || undefined,
    }));
  }, [proj]);

  const openCount = items.filter((i) => i.status !== "resolved").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading incidents...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Incident Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and triage incidents. Wire to Jira/Linear/GitHub when connector is ready.
          </p>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Open incidents ({openCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No incidents found. Your incident queue is clear.
              </p>
            ) : (
              items.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-lg border p-4 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{row.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {row.reportedAt.slice(0, 10)} · {row.owner || "Unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        severityColors[row.severity] as "destructive" | "secondary" | "outline"
                      }
                    >
                      {row.severity}
                    </Badge>
                    <Badge variant="outline">{row.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      {insights.length > 0 && (
        <aside className="w-72 shrink-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((ins) => (
                <div
                  key={ins.id}
                  className="rounded-lg border border-border bg-muted/20 p-3 text-sm"
                >
                  <p className="font-medium">{ins.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{ins.body}</p>
                  {ins.severity && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {ins.severity}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      )}
    </div>
  );
}
