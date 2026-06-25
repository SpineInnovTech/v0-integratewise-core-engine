import { useState } from "react";
import {
  GitBranch, Rocket, CheckCircle, Clock, XCircle, Code, Globe,
  Server, GitCommit, Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const RELEASES = [
  { id: "v2.4.1", version: "2.4.1", branch: "main", status: "deployed", environment: "production", deployedAt: "2025-11-01T10:30:00Z", deployedBy: "Nirmal", commit: "a3f2b1c", changes: 12, rollback: false },
  { id: "v2.4.0", version: "2.4.0", branch: "main", status: "deployed", environment: "production", deployedAt: "2025-10-28T14:20:00Z", deployedBy: "Nirmal", commit: "b2e1a0d", changes: 45, rollback: false },
  { id: "v2.3.9", version: "2.3.9", branch: "staging", status: "pending", environment: "staging", deployedAt: null, deployedBy: null, commit: "c1d0e9f", changes: 8, rollback: false },
  { id: "v2.3.8", version: "2.3.8", branch: "main", status: "failed", environment: "production", deployedAt: "2025-10-25T09:15:00Z", deployedBy: "Nirmal", commit: "d0c9e8a", changes: 23, rollback: true },
];

const DEPLOYMENTS = [
  { id: "dep-001", version: "v2.4.1", environment: "production", status: "success", startedAt: "2025-11-01T10:25:00Z", duration: "5m 12s", buildTime: "3m 45s", deployTime: "1m 27s" },
  { id: "dep-002", version: "v2.4.0", environment: "production", status: "success", startedAt: "2025-10-28T14:15:00Z", duration: "5m 8s", buildTime: "3m 52s", deployTime: "1m 16s" },
  { id: "dep-003", version: "v2.3.9", environment: "staging", status: "in-progress", startedAt: "2025-11-01T15:00:00Z", duration: "2m 34s", buildTime: "2m 34s", deployTime: null },
];

const ENVS = [
  { name: "Production", url: "https://os.integratewise.online", version: "v2.4.1", lastDeploy: "2 hours ago", health: "healthy" },
  { name: "Staging", url: "https://staging.integratewise.online", version: "v2.3.9", lastDeploy: "5 hours ago", health: "healthy" },
  { name: "Development", url: "https://dev.integratewise.online", version: "v2.4.2-dev", lastDeploy: "1 hour ago", health: "healthy" },
];

const statusVariant: Record<string, { cls: string; icon: any }> = {
  deployed: { cls: "bg-green-100 text-green-800 border-green-500", icon: CheckCircle },
  success: { cls: "bg-green-100 text-green-800 border-green-500", icon: CheckCircle },
  pending: { cls: "bg-amber-100 text-amber-800 border-amber-500", icon: Clock },
  failed: { cls: "bg-red-100 text-red-800 border-red-500", icon: XCircle },
  "in-progress": { cls: "bg-blue-100 text-blue-800 border-blue-500", icon: Clock },
};

function StatusBadge({ status }: { status: string }) {
  const v = statusVariant[status] || statusVariant.pending;
  return (
    <Badge variant="outline" className={cn("border flex items-center gap-1 w-fit", v.cls)}>
      <v.icon className="h-3 w-3" />{status}
    </Badge>
  );
}

const fmtDate = (d: string | null) => !d ? "—" : new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export function ReleaseControlView() {
  const [tab, setTab] = useState<"releases" | "deployments" | "environments">("releases");

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-2 pb-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <GitBranch className="h-8 w-8 text-primary flex-shrink-0" />
              <h1 className="text-3xl font-bold tracking-tight">Release Control Panel</h1>
            </div>
            <p className="text-base text-muted-foreground">Version management, deployments, and environment control</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Code className="h-4 w-4 mr-2" />View Code</Button>
            <Button><Rocket className="h-4 w-4 mr-2" />Deploy</Button>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-4">
          {([["releases", Tag, "Releases"], ["deployments", Rocket, "Deployments"], ["environments", Server, "Environments"]] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
                tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {tab === "releases" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Current Production Release
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-500">Live</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {[["Version", "v2.4.1"], ["Deployed", "Nov 1, 2025"], ["Commit", "a3f2b1c"], ["Changes", "12 commits"]].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-sm text-muted-foreground mb-1">{label}</div>
                    <div className={cn("font-medium", label === "Commit" && "font-mono text-sm")}>{value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Release History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead><TableHead>Branch</TableHead><TableHead>Status</TableHead>
                    <TableHead>Environment</TableHead><TableHead>Deployed</TableHead><TableHead>By</TableHead>
                    <TableHead>Commit</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RELEASES.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-medium">{r.version}</span>
                          {r.rollback && <Badge variant="outline" className="text-xs bg-red-50 text-red-800 border-red-500">Rollback</Badge>}
                        </div>
                      </TableCell>
                      <TableCell><div className="flex items-center gap-1"><GitBranch className="h-3 w-3 text-muted-foreground" />{r.branch}</div></TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.environment}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(r.deployedAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.deployedBy || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GitCommit className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-xs">{r.commit}</span>
                          <span className="text-xs text-muted-foreground">({r.changes})</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "pending" && <Button size="sm" variant="outline">Deploy</Button>}
                        {r.status === "deployed" && <Button size="sm" variant="outline" className="text-red-600">Rollback</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "deployments" && (
        <Card>
          <CardHeader><CardTitle>Deployment History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead><TableHead>Environment</TableHead><TableHead>Status</TableHead>
                  <TableHead>Started</TableHead><TableHead>Duration</TableHead><TableHead>Build</TableHead>
                  <TableHead>Deploy</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEPLOYMENTS.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono font-medium">{d.version}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{d.environment}</Badge></TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(d.startedAt)}</TableCell>
                    <TableCell className="text-sm font-medium">{d.duration}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.buildTime}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.deployTime || "—"}</TableCell>
                    <TableCell className="text-right">
                      {d.status === "in-progress"
                        ? <Button size="sm" variant="outline" disabled><Clock className="h-3 w-3 mr-1" />In Progress</Button>
                        : <Button size="sm" variant="outline">View Logs</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === "environments" && (
        <div className="grid md:grid-cols-3 gap-6">
          {ENVS.map((env) => (
            <Card key={env.name}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2"><Globe className="h-5 w-5" />{env.name}</div>
                  <Badge variant="outline" className="border-2 bg-green-100 text-green-800 border-green-500">{env.health}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[["URL", env.url], ["Version", env.version], ["Last Deploy", env.lastDeploy]].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-xs text-muted-foreground mb-1">{label}</div>
                    <div className={cn("text-sm", (label === "URL" || label === "Version") && "font-mono")}>{value}</div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2">View Details</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
