"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Activity, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminDashboardViewProps {
  userEmail: string
}

export function AdminDashboardView({ userEmail }: AdminDashboardViewProps) {
  const [stats, setStats] = useState({
    totalUsers: 156,
    activeUsers: 142,
    totalIntegrations: 12,
    healthyIntegrations: 10,
    degradedIntegrations: 2,
    downIntegrations: 0,
    policyViolations: 3,
    auditLogsToday: 2847,
    systemUptime: 99.97,
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        <p className="text-muted-foreground">Governance, user management, and system health monitoring</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active ({((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrations Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.healthyIntegrations}/{stats.totalIntegrations}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="default" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                {stats.healthyIntegrations} healthy
              </Badge>
              {stats.degradedIntegrations > 0 && (
                <Badge variant="default" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  {stats.degradedIntegrations} degraded
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policy Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.policyViolations}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemUptime}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Health Status</CardTitle>
              <CardDescription>Monitor all connected integrations and their health metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Slack", status: "healthy", lastSync: "2 minutes ago", responseTime: 145 },
                { name: "GitHub", status: "healthy", lastSync: "5 minutes ago", responseTime: 230 },
                { name: "Notion", status: "healthy", lastSync: "8 minutes ago", responseTime: 180 },
                { name: "HubSpot", status: "degraded", lastSync: "45 minutes ago", responseTime: 3200 },
                { name: "Google Workspace", status: "healthy", lastSync: "1 minute ago", responseTime: 120 },
                { name: "Discord", status: "healthy", lastSync: "3 minutes ago", responseTime: 160 },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        integration.status === "healthy" ? "bg-green-500" : "bg-yellow-500",
                      )}
                    />
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">Last sync: {integration.lastSync}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {integration.responseTime}ms
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { email: "admin@integratewise.online", role: "Super Admin", status: "active", lastLogin: "Just now" },
                  { email: "demo@integratewise.online", role: "Admin", status: "active", lastLogin: "5 minutes ago" },
                ].map((user) => (
                  <div key={user.email} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {user.role}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">Last login: {user.lastLogin}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Governance Tab */}
        <TabsContent value="governance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Policies</CardTitle>
                <CardDescription>Governance rules and compliance policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Data Access Control", type: "Security", status: "active" },
                  { name: "API Rate Limiting", type: "Performance", status: "active" },
                  { name: "PII Protection", type: "Compliance", status: "active" },
                ].map((policy) => (
                  <div key={policy.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{policy.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {policy.type}
                      </Badge>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Violations</CardTitle>
                <CardDescription>Recent violations requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.policyViolations === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No violations detected</p>
                  </div>
                ) : (
                  [
                    { description: "API rate limit exceeded", severity: "medium", time: "10 minutes ago" },
                    { description: "Unauthorized data access attempt", severity: "high", time: "2 hours ago" },
                    { description: "Failed authentication attempts", severity: "low", time: "5 hours ago" },
                  ].map((violation, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{violation.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{violation.time}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          violation.severity === "high" && "border-red-500 text-red-600",
                          violation.severity === "medium" && "border-yellow-500 text-yellow-600",
                          violation.severity === "low" && "border-blue-500 text-blue-600",
                        )}
                      >
                        {violation.severity}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>{stats.auditLogsToday.toLocaleString()} events logged today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { action: "User login", user: "admin@integratewise.online", status: "success", time: "Just now" },
                  {
                    action: "Integration connected",
                    user: "demo@integratewise.online",
                    status: "success",
                    time: "5m ago",
                  },
                  {
                    action: "Policy updated",
                    user: "admin@integratewise.online",
                    status: "success",
                    time: "15m ago",
                  },
                  {
                    action: "Settings changed",
                    user: "admin@integratewise.online",
                    status: "success",
                    time: "1h ago",
                  },
                ].map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.user}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        {log.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "Maintenance Mode", description: "Enable system maintenance mode", enabled: false },
                { key: "Auto Sync", description: "Automatically sync data from integrations", enabled: true },
                { key: "Email Notifications", description: "Send email alerts for system events", enabled: true },
                { key: "Debug Logging", description: "Enable detailed debug logging", enabled: false },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{setting.key}</p>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  <Badge variant={setting.enabled ? "default" : "outline"}>
                    {setting.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
