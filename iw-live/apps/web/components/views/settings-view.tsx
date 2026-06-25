"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Webhook,
  Lock,
  Sparkles,
  Database,
  Bot,
  Send,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { AUTHORIZED_DESTINATIONS } from "@/lib/types/ssot"

export function SettingsView() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "profile"
  const [isPro, setIsPro] = useState(false) // Simulate paid tier

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Profile, integrations, destinations, and governance</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="destinations" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Destinations
          </TabsTrigger>
          <TabsTrigger value="model" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Model
          </TabsTrigger>
          <TabsTrigger value="governance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Governance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your identity and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" defaultValue="Demo User" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="demo@integratewise.online" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth (for Personal Insights)</Label>
                <Input id="dob" type="date" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Personal Insights
              </CardTitle>
              <CardDescription>Your numerology-based insights (Bliss card)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Enter your date of birth above to unlock Personal Insights
                </p>
                <Button variant="outline" size="sm">
                  Calculate Insights
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Default View</CardTitle>
              <CardDescription>Set your default view mode when logging in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {["personal", "work", "team", "business"].map((view) => (
                  <label
                    key={view}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                  >
                    <input type="radio" name="default-view" value={view} defaultChecked={view === "work"} />
                    <div>
                      <div className="font-medium capitalize">{view === "work" ? "Work / Freelance" : view}</div>
                      <div className="text-xs text-muted-foreground">
                        {view === "personal" && "My personal tasks and notes"}
                        {view === "work" && "Projects, clients, invoices"}
                        {view === "team" && "Shared boards and handoffs"}
                        {view === "business" && "Cross-team rollups and OKRs"}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab (Sources) */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
              <CardDescription>Connected tools for the AI Loader to ingest data from</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Slack", connected: true, icon: "💬" },
                { name: "Notion", connected: false, icon: "📝" },
                { name: "Gmail", connected: false, icon: "📧" },
                { name: "HubSpot", connected: false, icon: "🎯" },
                { name: "Google Sheets", connected: false, icon: "📊" },
                { name: "Discord", connected: false, icon: "🎮" },
                { name: "Asana", connected: false, icon: "✅" },
              ].map((source) => (
                <div key={source.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{source.icon}</span>
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {source.connected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Button variant={source.connected ? "outline" : "default"} size="sm">
                    {source.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="destinations" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Authorized Destinations</CardTitle>
              <CardDescription>
                Where AI can render outputs. Only these destinations are allowed for L2+ operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "notion", name: "Notion", connected: true, icon: "📝" },
                { id: "coda", name: "Coda", connected: false, icon: "📄" },
                { id: "google_sheets", name: "Google Sheets", connected: true, icon: "📊" },
                { id: "clickup", name: "ClickUp", connected: false, icon: "✅" },
                { id: "jira", name: "Jira", connected: false, icon: "🎯" },
                { id: "linear", name: "Linear", connected: false, icon: "📐" },
              ].map((dest) => (
                <div key={dest.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{dest.icon}</span>
                    <div>
                      <p className="font-medium">{dest.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dest.connected ? "Authorized" : "Not authorized"}
                      </p>
                    </div>
                    {AUTHORIZED_DESTINATIONS.includes(dest.id as any) && (
                      <Badge variant="outline" className="text-xs">
                        Allowed
                      </Badge>
                    )}
                  </div>
                  <Button variant={dest.connected ? "outline" : "default"} size="sm">
                    {dest.connected ? "Revoke" : "Authorize"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Render Schedule</CardTitle>
              <CardDescription>How often AI can auto-render to destinations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {[
                  { id: "none", label: "Manual Only", desc: "No scheduled renders", tier: "free" },
                  { id: "daily", label: "Daily", desc: "Once per day", tier: "pro" },
                  { id: "hourly", label: "Hourly", desc: "Once per hour", tier: "pro" },
                  { id: "realtime", label: "Realtime", desc: "As events occur", tier: "enterprise" },
                ].map((schedule) => (
                  <label
                    key={schedule.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50",
                      !isPro && schedule.tier !== "free" && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <input
                      type="radio"
                      name="render-schedule"
                      value={schedule.id}
                      defaultChecked={schedule.id === "none"}
                      disabled={!isPro && schedule.tier !== "free"}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{schedule.label}</span>
                        {schedule.tier !== "free" && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Lock className="h-3 w-3" />
                            {schedule.tier}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{schedule.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    BYOM - Bring Your Own Model
                  </CardTitle>
                  <CardDescription>Use your own AI model API keys for enhanced privacy</CardDescription>
                </div>
                {!isPro && (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Pro
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={!isPro ? "opacity-50 pointer-events-none" : ""}>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>OpenAI API Key</Label>
                    <Input type="password" placeholder="sk-..." disabled={!isPro} />
                    <p className="text-xs text-muted-foreground">GPT-4, GPT-4o, etc.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Anthropic API Key</Label>
                    <Input type="password" placeholder="sk-ant-..." disabled={!isPro} />
                    <p className="text-xs text-muted-foreground">Claude 3.5, Claude 3, etc.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Google AI API Key</Label>
                    <Input type="password" placeholder="AIza..." disabled={!isPro} />
                    <p className="text-xs text-muted-foreground">Gemini Pro, etc.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Groq API Key</Label>
                    <Input type="password" placeholder="gsk_..." disabled={!isPro} />
                    <p className="text-xs text-muted-foreground">Llama, Mixtral, etc.</p>
                  </div>
                </div>
              </div>
              {!isPro && (
                <Button className="w-full bg-transparent" variant="outline">
                  Upgrade to Pro to unlock BYOM
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    BYOT - Bring Your Own Templates
                  </CardTitle>
                  <CardDescription>Use custom templates and workflows</CardDescription>
                </div>
                {!isPro && (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Pro
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={!isPro ? "opacity-50 pointer-events-none" : ""}>
                <div className="p-4 rounded-lg border border-dashed text-center">
                  <p className="text-sm text-muted-foreground mb-2">Drop your template files here or click to upload</p>
                  <Button variant="outline" size="sm" disabled={!isPro}>
                    Upload Templates
                  </Button>
                </div>
              </div>
              {!isPro && (
                <Button className="w-full bg-transparent" variant="outline">
                  Upgrade to Pro to unlock BYOT
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Approval Queue</CardTitle>
              <CardDescription>Pending approvals for L2+ operations (render, execute, delete)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sample approval items */}
              {[
                { id: "1", type: "render", level: "L2", status: "pending", requested: "2 hours ago" },
                { id: "2", type: "execute", level: "L3", status: "pending", requested: "1 day ago" },
              ].length > 0 ? (
                [
                  {
                    id: "1",
                    type: "render",
                    level: "L2",
                    status: "pending",
                    requested: "2 hours ago",
                    desc: "Render weekly report to Notion",
                  },
                  {
                    id: "2",
                    type: "execute",
                    level: "L3",
                    status: "pending",
                    requested: "1 day ago",
                    desc: "Create tasks in Linear from insights",
                  },
                ].map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">{approval.desc}</p>
                        <p className="text-sm text-muted-foreground">
                          {approval.type} • {approval.level} • {approval.requested}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-red-500 bg-transparent">
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No pending approvals</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>History of AI agent runs and render outputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {[
                  { id: "1", action: "Insight generated", agent: "insight-agent", time: "10 min ago", success: true },
                  {
                    id: "2",
                    action: "Task created from Slack",
                    agent: "slack-loader",
                    time: "1 hour ago",
                    success: true,
                  },
                  {
                    id: "3",
                    action: "Render to Notion failed",
                    agent: "render-agent",
                    time: "2 hours ago",
                    success: false,
                  },
                ].map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      {log.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{log.action}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.agent}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                View Full Audit Log
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>PII Redaction Settings</CardTitle>
              <CardDescription>Control how sensitive data is handled</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-redact PII</p>
                  <p className="text-sm text-muted-foreground">Automatically redact emails, phone numbers, SSNs</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require approval for PII access</p>
                  <p className="text-sm text-muted-foreground">Manual approval needed to view redacted data</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Retention period</p>
                  <p className="text-sm text-muted-foreground">How long to keep audit logs</p>
                </div>
                <select className="rounded border px-2 py-1 text-sm">
                  <option>30 days</option>
                  <option>90 days</option>
                  <option>1 year</option>
                  <option>Forever</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
