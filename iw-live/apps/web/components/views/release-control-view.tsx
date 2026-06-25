"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  GitBranch,
  Rocket,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Code,
  Package,
  Globe,
  Server,
  GitCommit,
  Tag,
  Calendar,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mockReleases = [
  {
    id: "v2.4.1",
    version: "2.4.1",
    branch: "main",
    status: "deployed",
    environment: "production",
    deployedAt: "2025-11-01T10:30:00Z",
    deployedBy: "Nirmal",
    commit: "a3f2b1c",
    changes: 12,
    rollback: false,
  },
  {
    id: "v2.4.0",
    version: "2.4.0",
    branch: "main",
    status: "deployed",
    environment: "production",
    deployedAt: "2025-10-28T14:20:00Z",
    deployedBy: "Nirmal",
    commit: "b2e1a0d",
    changes: 45,
    rollback: false,
  },
  {
    id: "v2.3.9",
    version: "2.3.9",
    branch: "staging",
    status: "pending",
    environment: "staging",
    deployedAt: null,
    deployedBy: null,
    commit: "c1d0e9f",
    changes: 8,
    rollback: false,
  },
  {
    id: "v2.3.8",
    version: "2.3.8",
    branch: "main",
    status: "failed",
    environment: "production",
    deployedAt: "2025-10-25T09:15:00Z",
    deployedBy: "Nirmal",
    commit: "d0c9e8a",
    changes: 23,
    rollback: true,
  },
]

const mockDeployments = [
  {
    id: "dep-001",
    version: "v2.4.1",
    environment: "production",
    status: "success",
    startedAt: "2025-11-01T10:25:00Z",
    completedAt: "2025-11-01T10:30:00Z",
    duration: "5m 12s",
    buildTime: "3m 45s",
    deployTime: "1m 27s",
  },
  {
    id: "dep-002",
    version: "v2.4.0",
    environment: "production",
    status: "success",
    startedAt: "2025-10-28T14:15:00Z",
    completedAt: "2025-10-28T14:20:00Z",
    duration: "5m 8s",
    buildTime: "3m 52s",
    deployTime: "1m 16s",
  },
  {
    id: "dep-003",
    version: "v2.3.9",
    environment: "staging",
    status: "in-progress",
    startedAt: "2025-11-01T15:00:00Z",
    completedAt: null,
    duration: "2m 34s",
    buildTime: "2m 34s",
    deployTime: null,
  },
]

export function ReleaseControlView() {
  const [activeTab, setActiveTab] = useState<"releases" | "deployments" | "environments">("releases")

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      deployed: { color: "bg-green-100 text-green-800 border-green-500", icon: CheckCircle },
      pending: { color: "bg-amber-100 text-amber-800 border-amber-500", icon: Clock },
      failed: { color: "bg-red-100 text-red-800 border-red-500", icon: XCircle },
      "in-progress": { color: "bg-blue-100 text-blue-800 border-blue-500", icon: Clock },
      success: { color: "bg-green-100 text-green-800 border-green-500", icon: CheckCircle },
    }
    const variant = variants[status] || variants.pending
    const Icon = variant.icon
    return (
      <Badge variant="outline" className={cn("border-2 flex items-center gap-1", variant.color)}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <GitBranch className="h-8 w-8 text-primary flex-shrink-0" />
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Release Control Panel
              </h1>
            </div>
            <p className="text-base text-muted-foreground max-w-3xl">Version management, deployments, and environment control</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Code className="h-4 w-4 mr-2" />
              View Code
            </Button>
            <Button>
              <Rocket className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-4">
          {[
            { id: "releases", label: "Releases", icon: Tag },
            { id: "deployments", label: "Deployments", icon: Rocket },
            { id: "environments", label: "Environments", icon: Server },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === "releases" && (
          <div className="space-y-6">
            {/* Current Release Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Current Production Release</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-500">
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Version</div>
                    <div className="text-2xl font-bold">v2.4.1</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Deployed</div>
                    <div className="font-medium">Nov 1, 2025</div>
                    <div className="text-xs text-muted-foreground">10:30 AM</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Commit</div>
                    <div className="font-mono text-sm">a3f2b1c</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Changes</div>
                    <div className="font-medium">12 commits</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Releases Table */}
            <Card>
              <CardHeader>
                <CardTitle>Release History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Deployed</TableHead>
                      <TableHead>Deployed By</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReleases.map((release) => (
                      <TableRow key={release.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono font-medium">{release.version}</span>
                            {release.rollback && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-800 border-red-500">
                                Rollback
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{release.branch}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(release.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {release.environment}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(release.deployedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {release.deployedBy || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <GitCommit className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-mono">{release.commit}</span>
                            <span className="text-xs text-muted-foreground">({release.changes})</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {release.status === "pending" && (
                              <Button size="sm" variant="outline">
                                Deploy
                              </Button>
                            )}
                            {release.status === "deployed" && (
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                Rollback
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "deployments" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Build Time</TableHead>
                      <TableHead>Deploy Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDeployments.map((deployment) => (
                      <TableRow key={deployment.id}>
                        <TableCell className="font-mono font-medium">{deployment.version}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {deployment.environment}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(deployment.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(deployment.startedAt)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{deployment.duration}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{deployment.buildTime}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {deployment.deployTime || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {deployment.status === "in-progress" ? (
                            <Button size="sm" variant="outline" disabled>
                              <Clock className="h-3 w-3 mr-1" />
                              In Progress
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              View Logs
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "environments" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Production",
                  url: "https://os.integratewise.online",
                  status: "live",
                  version: "v2.4.1",
                  lastDeploy: "2 hours ago",
                  health: "healthy",
                },
                {
                  name: "Staging",
                  url: "https://staging.integratewise.online",
                  status: "live",
                  version: "v2.3.9",
                  lastDeploy: "5 hours ago",
                  health: "healthy",
                },
                {
                  name: "Development",
                  url: "https://dev.integratewise.online",
                  status: "live",
                  version: "v2.4.2-dev",
                  lastDeploy: "1 hour ago",
                  health: "healthy",
                },
              ].map((env) => (
                <Card key={env.name}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        <span>{env.name}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-2",
                          env.health === "healthy"
                            ? "bg-green-100 text-green-800 border-green-500"
                            : "bg-red-100 text-red-800 border-red-500",
                        )}
                      >
                        {env.health}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">URL</div>
                      <div className="text-sm font-mono">{env.url}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Version</div>
                      <div className="text-sm font-mono font-medium">{env.version}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Last Deploy</div>
                      <div className="text-sm">{env.lastDeploy}</div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
