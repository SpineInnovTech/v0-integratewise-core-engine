import {
  Shield, MessageSquare, Zap, FileText, Activity, Settings, Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const AUDIT_LOG = [
  { id: "a1", timestamp: "2025-06-25T10:30:00Z", actor: "Nirmal", action: "write-back", entity: "HubSpot Contact", status: "approved", gateway: "AI-Relay", details: "Updated contact email for TechCorp" },
  { id: "a2", timestamp: "2025-06-25T09:15:00Z", actor: "Sarah Kim", action: "ai-query", entity: "OpenAI GPT-4", status: "completed", gateway: "AI-Relay", details: "Generated account health analysis" },
  { id: "a3", timestamp: "2025-06-25T08:45:00Z", actor: "System", action: "slack-intake", entity: "Governor Slack", status: "pending", gateway: "Governor Slack", details: "New task request from #cs-team" },
];

const POLICY_GATES = [
  { name: "PII Protection", status: "enforced", rules: 8, lastAudit: "1 week ago" },
  { name: "Write-Back Controls", status: "enforced", rules: 12, lastAudit: "3 days ago" },
  { name: "RBAC", status: "enforced", rules: 6, lastAudit: "2 days ago" },
  { name: "AI Usage Limits", status: "enforced", rules: 5, lastAudit: "1 day ago" },
];

const statusBadge = (status: string) => {
  if (status === "approved" || status === "completed") return "bg-green-100 text-green-800 border-green-500";
  if (status === "pending") return "bg-amber-100 text-amber-800 border-amber-500";
  return "bg-red-100 text-red-800 border-red-500";
};

export function GovernanceView() {
  const fmt = (d: string) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary flex-shrink-0" />
          <h1 className="text-3xl font-bold tracking-tight">Governance</h1>
        </div>
        <p className="text-base text-muted-foreground max-w-3xl">
          Trust layer: Governor Slack, AI-Relay Gateway, Audit Trail, and Policy Gates.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { icon: MessageSquare, iconColor: "text-blue-500", label: "Governor Slack", rows: [["Status", <Badge key="s" className="bg-green-500/10 text-green-600 border-green-500/30">Active</Badge>], ["Pending", "3 requests"], ["Today", "12 processed"]] },
          { icon: Zap, iconColor: "text-purple-500", label: "AI-Relay Gateway", rows: [["Status", <Badge key="s" className="bg-green-500/10 text-green-600 border-green-500/30">Online</Badge>], ["Today", "47 calls"], ["Blocked", "2 (policy)"]] },
          { icon: FileText, iconColor: "text-amber-500", label: "Audit Trail", rows: [["Total Events", "1,247"], ["Today", "89 events"], ["Retention", "7 years"]] },
          { icon: Lock, iconColor: "text-red-500", label: "Policy Gates", rows: [["Active", "4 policies"], ["Rules", "31 rules"], ["Enforced", <Badge key="e" className="bg-green-500/10 text-green-600 border-green-500/30">100%</Badge>]] },
        ].map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <card.icon className={cn("h-5 w-5", card.iconColor)} />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {card.rows.map(([label, value]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    {typeof value === "string" ? <span className="text-sm font-medium">{value}</span> : value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Activity className="h-5 w-5" />Recent Audit Log</span>
              <Button variant="outline" size="sm">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {AUDIT_LOG.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground">{fmt(entry.timestamp)}</TableCell>
                    <TableCell className="font-medium">{entry.actor}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{entry.action}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.gateway}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs border", statusBadge(entry.status))}>{entry.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Settings className="h-5 w-5" />Policy Gates</span>
              <Button variant="outline" size="sm">Configure</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {POLICY_GATES.map((policy) => (
                <div key={policy.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{policy.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{policy.rules} rules · Last audit: {policy.lastAudit}</div>
                  </div>
                  <Badge variant="outline" className="border-2 bg-green-100 text-green-800 border-green-500">{policy.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Governance Principles (v11.0)</CardTitle>
          <CardDescription>Security, auditability, and policy enforcement built into every stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: MessageSquare, color: "text-blue-500", title: "Governor Slack", desc: "Slack Triage Center for real-time oversight, intake, and approvals. Human-in-the-loop control plane." },
              { icon: Zap, color: "text-purple-500", title: "AI-Relay Gateway", desc: "Single audited gateway for all AI calls and integrations. Ensures traceability and policy compliance." },
              { icon: FileText, color: "text-amber-500", title: "Audit Trail (AuditLog)", desc: "Immutable history of every action: actor, entity, diffs, timestamps, metadata. 7-year retention." },
              { icon: Lock, color: "text-red-500", title: "Policy Gates", desc: "RBAC, PII controls, write-back restrictions. All outbound writes go through approval gates." },
            ].map((item) => (
              <div key={item.title} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={cn("h-5 w-5", item.color)} />
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
