"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Search, Plus, TrendingUp, IndianRupee, Activity, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  onboarding: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  prospect: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  churned: "bg-red-500/10 text-red-500 border-red-500/20",
  paused: "bg-slate-500/10 text-slate-500 border-slate-500/20",
}

const tierColors: Record<string, string> = {
  enterprise: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  advisory: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  growth: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  foundation: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  essentials: "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      client_engagements(count),
      sessions(count),
      client_projects(count)
    `)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export function ClientsView() {
  const { data: clients, isLoading, mutate } = useSWR("clients", fetcher)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    industry: "",
    size: "mid-market",
    tier: "foundation",
    primary_contact: "",
    primary_contact_title: "",
  })

  const supabase = createClient()

  const filteredClients = clients?.filter((client: any) => {
    const matchesSearch =
      !search ||
      client.company?.toLowerCase().includes(search.toLowerCase()) ||
      client.name?.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: clients?.length || 0,
    active: clients?.filter((c: any) => c.status === "active").length || 0,
    totalRevenue: clients?.reduce((sum: number, c: any) => sum + (c.total_revenue || 0), 0) || 0,
    avgHealth: clients?.length
      ? Math.round(clients.reduce((sum: number, c: any) => sum + (c.health_score || 0), 0) / clients.length)
      : 0,
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }

  async function createNewClient() {
    const { error } = await supabase.from("clients").insert({
      ...newClient,
      status: "onboarding",
      health_score: 100,
    })

    if (!error) {
      setShowNewClient(false)
      setNewClient({
        name: "",
        company: "",
        email: "",
        phone: "",
        industry: "",
        size: "mid-market",
        tier: "foundation",
        primary_contact: "",
        primary_contact_title: "",
      })
      mutate()
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Manage client engagements, sessions, and projects</p>
        </div>
        <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Company Name</Label>
                  <Input
                    value={newClient.company}
                    onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                    placeholder="TechCorp India"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Industry</Label>
                  <Select value={newClient.industry} onValueChange={(v) => setNewClient({ ...newClient, industry: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Banking">Banking</SelectItem>
                      <SelectItem value="Insurance">Insurance</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Primary Contact</Label>
                  <Input
                    value={newClient.primary_contact}
                    onChange={(e) =>
                      setNewClient({ ...newClient, primary_contact: e.target.value, name: e.target.value })
                    }
                    placeholder="Rajesh Kumar"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Title</Label>
                  <Input
                    value={newClient.primary_contact_title}
                    onChange={(e) => setNewClient({ ...newClient, primary_contact_title: e.target.value })}
                    placeholder="CTO"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <Input
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Company Size</Label>
                  <Select value={newClient.size} onValueChange={(v) => setNewClient({ ...newClient, size: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="mid-market">Mid-Market</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Service Tier</Label>
                  <Select value={newClient.tier} onValueChange={(v) => setNewClient({ ...newClient, tier: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essentials">Essentials</SelectItem>
                      <SelectItem value="foundation">Foundation</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="advisory">Advisory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createNewClient} className="w-full">
                Create Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Health</p>
              <p className="text-2xl font-bold text-foreground">{stats.avgHealth}/100</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["active", "onboarding", "prospect", "paused"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Clients List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients?.map((client: any) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="bg-card hover:bg-muted/50 transition-all cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{client.company}</h3>
                          <Badge variant="outline" className={statusColors[client.status]}>
                            {client.status}
                          </Badge>
                          {client.tier && (
                            <Badge variant="outline" className={tierColors[client.tier]}>
                              {client.tier}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>
                            {client.primary_contact} · {client.primary_contact_title}
                          </span>
                          {client.industry && (
                            <Badge variant="secondary" className="text-xs">
                              {client.industry}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">
                          {formatCurrency(client.total_revenue || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">
                          {client.client_engagements?.[0]?.count || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Engagements</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">{client.sessions?.[0]?.count || 0}</p>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-foreground">
                          {client.client_projects?.[0]?.count || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Projects</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Health</span>
                            <span
                              className={
                                client.health_score >= 80
                                  ? "text-emerald-400"
                                  : client.health_score >= 60
                                    ? "text-amber-400"
                                    : "text-red-400"
                              }
                            >
                              {client.health_score}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full">
                            <div
                              className={`h-1.5 rounded-full ${client.health_score >= 80 ? "bg-emerald-500" : client.health_score >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${client.health_score}%` }}
                            />
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filteredClients?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No clients found. Add your first client to get started.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
