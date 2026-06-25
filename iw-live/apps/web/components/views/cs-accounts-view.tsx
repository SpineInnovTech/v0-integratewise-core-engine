"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import Link from "next/link"
import { CognitiveTwinChat } from "@/components/cognitive-twin-chat"

// Mock data - replace with actual Spine entity queries
const mockAccounts = [
  {
    id: "1",
    name: "DataFlow Inc",
    segment: "Enterprise",
    industry: "Technology",
    csm: "Sarah Kim",
    arr: 320000,
    health: 9.1,
    status: "healthy",
    renewalDate: "2026-03-10",
    lastTouch: "2025-10-30",
  },
  {
    id: "2",
    name: "Nexlify",
    segment: "Mid-Market",
    industry: "SaaS",
    csm: "Sarah Kim",
    arr: 240000,
    health: 8.2,
    status: "healthy",
    renewalDate: "2026-01-15",
    lastTouch: "2025-10-28",
  },
  {
    id: "3",
    name: "TechCorp",
    segment: "Mid-Market",
    industry: "FinTech",
    csm: "Mike Lee",
    arr: 180000,
    health: 6.5,
    status: "at-risk",
    renewalDate: "2025-12-20",
    lastTouch: "2025-10-25",
  },
  {
    id: "4",
    name: "CloudScale",
    segment: "Enterprise",
    industry: "Cloud",
    csm: "Sarah Kim",
    arr: 450000,
    health: 9.5,
    status: "healthy",
    renewalDate: "2026-06-01",
    lastTouch: "2025-10-29",
  },
  {
    id: "5",
    name: "StartupXYZ",
    segment: "SMB",
    industry: "Startup",
    csm: "Mike Lee",
    arr: 85000,
    health: 5.2,
    status: "at-risk",
    renewalDate: "2025-11-15",
    lastTouch: "2025-09-15",
  },
]

type HealthStatus = "healthy" | "at-risk" | "active" | "churned"

export function CSAccountsView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<HealthStatus | "all">("all")

  const kpis = useMemo(() => {
    const totalAccounts = mockAccounts.length
    const totalARR = mockAccounts.reduce((sum, acc) => sum + acc.arr, 0)
    const avgHealth = mockAccounts.reduce((sum, acc) => sum + acc.health, 0) / totalAccounts
    const atRisk = mockAccounts.filter((acc) => acc.status === "at-risk").length
    const renewals90d = mockAccounts.filter((acc) => {
      const renewal = new Date(acc.renewalDate)
      const today = new Date()
      const daysUntil = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 90 && daysUntil > 0
    })
    const renewalValue = renewals90d.reduce((sum, acc) => sum + acc.arr, 0)
    return { totalAccounts, totalARR, avgHealth: avgHealth.toFixed(1), atRisk, renewals90d: renewals90d.length, renewalValue }
  }, [])

  const filteredAccounts = useMemo(() => {
    return mockAccounts.filter((account) => {
      const matchesSearch =
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.csm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.industry.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === "all" || account.status === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [searchQuery, filterStatus])

  const statusCounts = useMemo(() => {
    return {
      all: mockAccounts.length,
      healthy: mockAccounts.filter((a) => a.status === "healthy").length,
      "at-risk": mockAccounts.filter((a) => a.status === "at-risk").length,
      active: mockAccounts.filter((a) => a.status === "active").length,
      churned: mockAccounts.filter((a) => a.status === "churned").length,
    }
  }, [])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const getHealthColor = (health: number) => {
    if (health >= 8) return "text-green-600"
    if (health >= 6) return "text-amber-600"
    return "text-red-600"
  }

  const getStatusBadge = (status: string) => {
    const classes = {
      healthy: "bg-green-100 text-green-800 border-green-500",
      "at-risk": "bg-amber-100 text-amber-800 border-amber-500",
      active: "bg-blue-100 text-blue-800 border-blue-500",
      churned: "bg-red-100 text-red-800 border-red-500",
    }
    return classes[status as keyof typeof classes] || "bg-muted text-muted-foreground border-border"
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      {/* Cognitive Twin Chat - Floating in CS View */}
      <div className="fixed bottom-6 right-6 z-50 w-96">
        <CognitiveTwinChat />
      </div>
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Accounts Hub
        </h1>
        <p className="text-base text-muted-foreground max-w-3xl">
          Comprehensive overview of all customer accounts with health metrics and revenue tracking
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <Card className="relative overflow-hidden border-t-4 border-t-primary/80 bg-gradient-to-br from-card to-card/95">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Total Accounts
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">{kpis.totalAccounts}</div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">+2 This Quarter</div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-t-4 border-t-primary">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Total ARR</div>
              <div className="text-3xl font-bold text-foreground mb-2">{formatCurrency(kpis.totalARR)}</div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">+15% YoY</div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-t-4 border-t-primary">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Avg Health</div>
              <div className="text-3xl font-bold text-foreground mb-2">{kpis.avgHealth}</div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">+0.3 This Month</div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-t-4 border-t-primary">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">At Risk</div>
              <div className="text-3xl font-bold text-foreground mb-2">{kpis.atRisk}</div>
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">+1 This Week</div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-t-4 border-t-primary">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Renewals (90d)
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">{kpis.renewals90d}</div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(kpis.renewalValue)} Value
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by account name, CSM, or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-10"
                />
              </div>
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                className="h-12 px-6"
              >
                All ({statusCounts.all})
              </Button>
              <Button
                variant={filterStatus === "healthy" ? "default" : "outline"}
                onClick={() => setFilterStatus("healthy")}
                className="h-12 px-6"
              >
                Healthy ({statusCounts.healthy})
              </Button>
              <Button
                variant={filterStatus === "at-risk" ? "default" : "outline"}
                onClick={() => setFilterStatus("at-risk")}
                className="h-12 px-6"
              >
                At Risk ({statusCounts["at-risk"]})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>CSM</TableHead>
                  <TableHead>ARR</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Renewal Date</TableHead>
                  <TableHead>Last Touch</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow
                    key={account.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => (window.location.href = `/cs/accounts/${account.id}`)}
                  >
                    <TableCell>
                      <div className="font-semibold text-foreground text-base">{account.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {account.segment} · {account.industry}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{account.csm}</TableCell>
                    <TableCell>
                      <div className="font-bold text-foreground text-base">{formatCurrency(account.arr)}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold text-lg ${getHealthColor(account.health)}`}>
                        {account.health}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusBadge(account.status)} border-2`}>
                        {account.status === "at-risk"
                          ? "At Risk"
                          : account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(account.renewalDate)}</TableCell>
                    <TableCell>{formatDate(account.lastTouch)}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-xl">⋮</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
