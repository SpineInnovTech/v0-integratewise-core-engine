"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Shield,
  Settings,
  UserPlus,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Database,
  Server,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mockUsers = [
  {
    id: "1",
    name: "Nirmal",
    email: "nirmal@integratewise.com",
    role: "Owner",
    status: "active",
    lastActive: "2 min ago",
    permissions: "Full access",
  },
  {
    id: "2",
    name: "Sarah Kim",
    email: "sarah@integratewise.com",
    role: "Admin",
    status: "active",
    lastActive: "1 hour ago",
    permissions: "Full access + user management",
  },
  {
    id: "3",
    name: "Mike Lee",
    email: "mike@integratewise.com",
    role: "Manager",
    status: "active",
    lastActive: "3 hours ago",
    permissions: "Data access + limited settings",
  },
  {
    id: "4",
    name: "Tom Chen",
    email: "tom@integratewise.com",
    role: "Member",
    status: "active",
    lastActive: "5 hours ago",
    permissions: "Standard access",
  },
  {
    id: "5",
    name: "Ana Ruiz",
    email: "ana@integratewise.com",
    role: "Viewer",
    status: "inactive",
    lastActive: "2 days ago",
    permissions: "Read-only access",
  },
]

const systemSettings = [
  { category: "Authentication", items: 3, status: "configured" },
  { category: "Database", items: 5, status: "healthy" },
  { category: "Integrations", items: 12, status: "active" },
  { category: "Security", items: 8, status: "enforced" },
  { category: "Backups", items: 2, status: "scheduled" },
]

export function AdminView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"users" | "settings" | "system">("users")

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      Owner: "bg-primary/10 text-primary border-primary/30",
      Admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      Manager: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
      Member: "bg-muted text-muted-foreground border-border",
      Viewer: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    }
    return variants[role] || variants.Member
  }

  const getStatusIcon = (status: string) => {
    return status === "active" ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground" />
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary flex-shrink-0" />
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Admin Panel
              </h1>
            </div>
            <p className="text-base text-muted-foreground max-w-3xl">
              User management, permissions, and system settings
            </p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-4">
          {[
            { id: "users", label: "Users & Roles", icon: Users },
            { id: "settings", label: "System Settings", icon: Settings },
            { id: "system", label: "System Health", icon: Activity },
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

      <div className="space-y-6">
        {activeTab === "users" && (
          <div className="space-y-8">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline">Filter by Role</Button>
                  <Button variant="outline">Filter by Status</Button>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("border-2", getRoleBadge(user.role))}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(user.status)}
                            <span className="capitalize">{user.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.permissions}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.lastActive}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Role Permissions Matrix */}
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { role: "Owner", permissions: ["Full access", "Billing", "Delete workspace", "User management"] },
                    { role: "Admin", permissions: ["Full access", "User management", "Settings"] },
                    { role: "Manager", permissions: ["Data access", "Limited settings", "Team management"] },
                    { role: "Member", permissions: ["Standard access", "Assigned lens"] },
                    { role: "Viewer", permissions: ["Read-only access"] },
                    { role: "Guest", permissions: ["Limited access", "Specific entities"] },
                  ].map((role) => (
                    <div key={role.role} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-24">
                        <Badge variant="outline" className={cn("border-2", getRoleBadge(role.role))}>
                          {role.role}
                        </Badge>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-2">
                        {role.permissions.map((perm, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {systemSettings.map((setting) => (
                <Card key={setting.category}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{setting.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {setting.items} items
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-2",
                          setting.status === "configured" || setting.status === "healthy" || setting.status === "active"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                        )}
                      >
                        {setting.status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">Healthy</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Connections</span>
                      <span className="text-sm font-medium">24/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Backup</span>
                      <span className="text-sm font-medium">2 hours ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    API Server
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">Online</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Uptime</span>
                      <span className="text-sm font-medium">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Response Time</span>
                      <span className="text-sm font-medium">45ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">SSL</span>
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">Valid</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">2FA</span>
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">Enabled</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Audit</span>
                      <span className="text-sm font-medium">1 week ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
