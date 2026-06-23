import {
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Key,
  Database,
  CloudLightning,
} from "lucide-react";
import { PageHeader } from "@/components/l2/spine/page-header";
import { Card } from "@/components/common/layouts/page-layouts";
import { cn } from "@/lib/utils";

interface HealthItem {
  name: string;
  status: "live" | "warning";
  latency: string;
}

interface TokenItem {
  name: string;
  status: "valid" | "warning";
  daysLeft: number;
}

export function ContinuityPage() {
  const healthItems: HealthItem[] = [
    { name: "Gateway", status: "live", latency: "p99: 8ms" },
    { name: "Pipeline", status: "live", latency: "p99: 23ms" },
    { name: "Intelligence", status: "live", latency: "p99: 41ms" },
    { name: "Vectorize", status: "warning", latency: "index pending" },
  ];

  const tokens: TokenItem[] = [
    { name: "HubSpot", status: "valid", daysLeft: 47 },
    { name: "Stripe", status: "valid", daysLeft: 89 },
    { name: "Jira", status: "warning", daysLeft: 3 },
  ];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Operations"
        title="Operations Status"
        description="Verify system uptime, API authorization token lifespans, memory loop indices, and automated backups."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* System Health */}
          <Card>
            <h3 className="font-semibold text-foreground mb-4 text-sm">System Health</h3>
            <div className="space-y-4">
              {healthItems.map((item) => (
                <div
                  key={item.name}
                  className="rounded-md border border-border bg-background/30 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Server className="size-4.5 text-muted-foreground/75" />
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">{item.name}</p>
                      <p className="text-[11.5px] text-muted-foreground">Latency: {item.latency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        item.status === "live" ? "bg-iw-forest-bright" : "bg-iw-gold animate-pulse"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider",
                        item.status === "live"
                          ? "text-iw-forest-bright dark:text-iw-forest-bright"
                          : "text-iw-gold dark:text-iw-gold-light"
                      )}
                    >
                      {item.status === "live" ? "live" : "warning"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Token Status */}
          <Card>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Token Status</h3>
            <div className="space-y-4">
              {tokens.map((token) => (
                <div
                  key={token.name}
                  className="rounded-md border border-border bg-background/30 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Key className="size-4.5 text-muted-foreground/75" />
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">
                        {token.name} Integration
                      </p>
                      <p className="text-[11.5px] text-muted-foreground">
                        Expires in {token.daysLeft} days
                      </p>
                    </div>
                  </div>
                  {token.status === "warning" ? (
                    <button className="rounded-sm bg-iw-red/10 hover:bg-iw-red/20 px-2.5 py-1 text-[11px] font-bold text-iw-red dark:text-iw-red transition-colors flex items-center gap-1">
                      Refresh Token
                    </button>
                  ) : (
                    <span className="rounded bg-iw-forest/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-iw-forest-bright dark:text-iw-forest-bright">
                      ✓ Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Memory Loop */}
          <Card>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Memory Loop</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded border border-border bg-background p-3.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Conversational
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">1,959</p>
                </div>
                <div className="rounded border border-border bg-background p-3.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Organizational
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">879</p>
                </div>
              </div>

              <div className="rounded-md border border-iw-gold/20 bg-iw-gold/[0.03] p-3.5 flex items-start gap-3">
                <AlertTriangle className="size-4.5 text-iw-gold shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-foreground leading-tight">
                    Vectorize 0 indexed
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Index synchronization requires manual execution.
                  </p>
                  <button className="mt-2.5 rounded border border-iw-gold/30 hover:bg-iw-gold/10 px-2.5 py-1 text-[11px] font-bold text-iw-gold dark:text-iw-gold-light transition-colors">
                    Trigger reindex
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Backup */}
          <Card>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Fortress Backup</h3>
            <div className="rounded-md border border-iw-gold/20 bg-iw-gold/[0.03] p-3.5 flex items-start gap-3">
              <AlertTriangle className="size-4.5 text-iw-gold shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-foreground leading-tight">
                  Last Backup: never
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Path:{" "}
                  <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded text-[10px]">
                    spine-backup/
                  </code>
                </p>
                <button className="mt-2.5 rounded border border-border bg-background hover:bg-accent px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors">
                  Schedule Backup
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ContinuityPage;
