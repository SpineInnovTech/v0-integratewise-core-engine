"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Shield,
  MessageSquare,
  Zap,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Lock,
  Eye,
  Activity,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock governance data
const mockAuditLog = [
  {
    id: "audit-001",
    timestamp: "2025-11-01T10:30:00Z",
    actor: "Nirmal",
    action: "write-back",
    entity: "HubSpot Contact",
    status: "approved",
    gateway: "AI-Relay",
    details: "Updated contact email for TechCorp",
  },
  {
    id: "audit-002",
    timestamp: "2025-11-01T09:15:00Z",
    actor: "Sarah Kim",
    action: "ai-query",
    entity: "OpenAI GPT-4",
    status: "completed",
    gateway: "AI-Relay",
    details: "Generated account health analysis",
  },
  {
    id: "audit-003",
    timestamp: "2025-11-01T08:45:00Z",
    actor: "System",
    action: "slack-intake",
    entity: "Governor Slack",
    status: "pending",
    gateway: "Governor Slack",
    details: "New task request from #cs-team",
  },
]

const mockPolicyGates = [
  {
    name: "PII Protection",
    status: "enforced",
    rules: 8,
    lastAudit: "1 week ago",
  },
  {
    name: "Write-Back Controls",
    status: "enforced",
    rules: 12,
    lastAudit: "3 days ago",
  },
  {
    name: "RBAC",
    status: "enforced",
    rules: 6,
    lastAudit: "2 days ago",
  },
  {
    name: "AI Usage Limits",
    status: "enforced",
    rules: 5,
    lastAudit: "1 day ago",
  },
]

export function GovernanceView() {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary flex-shrink-0" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Governance
          </h1>
        </div>
        <p className="text-base text-muted-foreground max-w-3xl">
          Trust layer: Governor Slack, AI-Relay Gateway, Audit Trail, and Policy Gates
        </p>
      </div>

      {/* Governance Overview Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Governor Slack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="text-sm font-medium">3 requests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="text-sm font-medium">12 processed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              AI-Relay Gateway
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">Online</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="text-sm font-medium">47 calls</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Blocked</span>
                <span className="text-sm font-medium">2 (policy)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <span className="text-sm font-medium">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="text-sm font-medium">89 events</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Retention</span>
                <span className="text-sm font-medium">7 years</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" />
              Policy Gates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="text-sm font-medium">4 policies</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rules</span>
                <span className="text-sm font-medium">31 rules</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Enforced</span>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">100%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Audit Trail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Audit Log
              </span>
              <Button variant="outline" size="sm">
                View All
              </Button>
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
                {mockAuditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(entry.timestamp)}</TableCell>
                    <TableCell className="font-medium">{entry.actor}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.gateway}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          entry.status === "approved" || entry.status === "completed"
                            ? "bg-green-100 text-green-800 border-green-500"
                            : entry.status === "pending"
                            ? "bg-amber-100 text-amber-800 border-amber-500"
                            : "bg-red-100 text-red-800 border-red-500",
                        )}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Policy Gates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Policy Gates
              </span>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockPolicyGates.map((policy) => (
                <div key={policy.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{policy.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {policy.rules} rules • Last audit: {policy.lastAudit}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-2",
                      policy.status === "enforced"
                        ? "bg-green-100 text-green-800 border-green-500"
                        : "bg-amber-100 text-amber-800 border-amber-500",
                    )}
                  >
                    {policy.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Governance Principles */}
      <Card>
        <CardHeader>
          <CardTitle>Governance Principles (v11.0)</CardTitle>
          <CardDescription>Security, auditability, and policy enforcement built into every stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Governor Slack</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Slack Triage Center for real-time oversight, intake, and approvals. Human-in-the-loop control plane.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">AI-Relay Gateway</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Single audited gateway for all AI calls and integrations. Ensures traceability and policy compliance.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">Audit Trail (AuditLog)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Immutable history of every action: actor, entity, diffs, timestamps, metadata. 7-year retention.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold">Policy Gates</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                RBAC, PII controls, write-back restrictions. All outbound writes go through approval gates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
