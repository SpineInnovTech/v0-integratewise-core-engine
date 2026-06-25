import { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Database,
  Link2,
  Cpu,
  History,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/l2/spine/page-header";
import { Card } from "@/components/common/layouts/page-layouts";
import { cn } from "@/lib/utils";

interface ActionItem {
  id: string;
  name: string;
  target: string;
  time: string;
  status: "complete" | "failed";
}

interface QueueItem {
  name: string;
  value: number;
  total: number;
}

interface ConnectorItem {
  name: string;
  status: "syncing" | "degraded" | "online";
  lastSync: string;
  records: number;
}

export function ExecutionPage() {
  const [actions, setActions] = useState<ActionItem[]>([
    {
      id: "a1",
      name: "HubSpot task created",
      target: "Acme renewal followup",
      time: "2m ago",
      status: "complete",
    },
    {
      id: "a2",
      name: "Slack message sent",
      target: "TechFlow CSM channel",
      time: "14m ago",
      status: "complete",
    },
    {
      id: "a3",
      name: "Jira ticket failed",
      target: "GlobalRetail resolution path",
      time: "1h ago",
      status: "failed",
    },
  ]);

  const queues: QueueItem[] = [
    { name: "pipeline-process", value: 847, total: 1000 },
    { name: "intelligence-act", value: 2, total: 10 },
    { name: "knowledge-ingest", value: 12, total: 50 },
  ];

  const connectors: ConnectorItem[] = [
    { name: "HubSpot", status: "syncing", lastSync: "3m ago", records: 847 },
    { name: "Jira", status: "degraded", lastSync: "47m ago", records: 320 },
    { name: "Stripe", status: "online", lastSync: "12m ago", records: 114 },
  ];

  const handleRetry = (id: string) => {
    setActions(
      actions.map((a) => (a.id === id ? { ...a, status: "complete", time: "Just now" } : a))
    );
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Console"
        title="Execution Console"
        description="Monitor system queue status, connector health, and active action execution audit trails."
      />

      <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        {/* Left: Recent Actions */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Recent Actions</h3>
            <div className="divide-y divide-border">
              {actions.map((act) => (
                <div
                  key={act.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {act.status === "complete" ? (
                      <CheckCircle className="size-4.5 text-iw-forest-bright shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="size-4.5 text-iw-red shrink-0 mt-0.5 animate-pulse" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-foreground">{act.name}</p>
                      <p className="text-[11.5px] text-muted-foreground truncate">
                        Target: {act.target}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{act.time}</span>
                    {act.status === "failed" ? (
                      <button
                        onClick={() => handleRetry(act.id)}
                        className="rounded-sm bg-iw-red/10 hover:bg-iw-red/20 px-2.5 py-1 text-[11px] font-bold text-iw-red dark:text-iw-red transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="size-3" /> Retry / Escalate
                      </button>
                    ) : (
                      <span className="rounded bg-iw-forest/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-iw-forest-bright dark:text-iw-forest-bright">
                        Complete
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Telemetry & Connectors */}
        <div className="space-y-6">
          {/* Queue Telemetry */}
          <Card>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Queue Telemetry</h3>
            <div className="space-y-4">
              {queues.map((q) => {
                const pct = (q.value / q.total) * 100;
                return (
                  <div key={q.name} className="space-y-1.5">
                    <div className="flex justify-between text-[12px]">
                      <span className="font-mono text-foreground">{q.name}</span>
                      <span className="text-muted-foreground font-semibold">
                        {q.value}/{q.total} active
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full bg-primary",
                          q.name === "intelligence-act" && "bg-iw-gold",
                          q.name === "knowledge-ingest" && "bg-iw-gold"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Connector Status */}
          <Card>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Connector Status</h3>
            <div className="space-y-3.5">
              {connectors.map((c) => (
                <div
                  key={c.name}
                  className="rounded-md border border-border bg-background/40 p-3 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                      {c.name}
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          c.status === "syncing" && "bg-primary animate-pulse",
                          c.status === "degraded" && "bg-iw-red",
                          c.status === "online" && "bg-iw-forest-bright"
                        )}
                      />
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      last: {c.lastSync} · {c.records} records
                    </p>
                  </div>
                  {c.status === "degraded" && (
                    <button className="rounded border border-border bg-background hover:bg-accent px-2 py-1 text-[10.5px] font-bold text-foreground">
                      Force sync
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ExecutionPage;
