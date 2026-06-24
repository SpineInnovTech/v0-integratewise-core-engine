
import { useState } from "react"
import useSWR from "swr"
import { Link } from "wouter"
import { cn } from "@/lib/utils"
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
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Manage client engagements, sessions, and projects</p>
        </div>
        <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-full px-6 shadow-md transition-all hover:shadow-lg font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-[600px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground text-xl font-light tracking-tight">Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company Name</Label>
                  <Input
                    value={newClient.company}
                    onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                    placeholder="TechCorp India"
                    className="bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Industry</Label>
                  <Select value={newClient.industry} onValueChange={(v) => setNewClient({ ...newClient, industry: v })}>
                    <SelectTrigger className="bg-muted/30 focus:bg-background transition-colors">
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
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Contact</Label>
                  <Input
                    value={newClient.primary_contact}
                    onChange={(e) =>
                      setNewClient({ ...newClient, primary_contact: e.target.value, name: e.target.value })
                    }
                    placeholder="Rajesh Kumar"
                    className="bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                  <Input
                    value={newClient.primary_contact_title}
                    onChange={(e) => setNewClient({ ...newClient, primary_contact_title: e.target.value })}
                    placeholder="CTO"
                    className="bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</Label>
                  <Input
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company Size</Label>
                  <Select value={newClient.size} onValueChange={(v) => setNewClient({ ...newClient, size: v })}>
                    <SelectTrigger className="bg-muted/30 focus:bg-background transition-colors">
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
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Service Tier</Label>
                  <Select value={newClient.tier} onValueChange={(v) => setNewClient({ ...newClient, tier: v })}>
                    <SelectTrigger className="bg-muted/30 focus:bg-background transition-colors">
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
              <Button onClick={createNewClient} className="w-full rounded-full h-12 font-bold tracking-wide mt-4">
                Create Client Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-light text-foreground mt-2">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active</p>
                <p className="text-3xl font-light text-emerald-600 mt-2">{stats.active}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-light text-teal-600 mt-2">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Health</p>
                <div className="flex items-end gap-1 mt-2">
                  <p className="text-3xl font-light text-blue-600">{stats.avgHealth}</p>
                  <p className="text-base text-blue-600/60 pb-1">/100</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-secondary/30 p-4 rounded-2xl border border-border/50">
        <div className="relative flex-1 w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-10 bg-background border-border rounded-xl focus:ring-4 focus:ring-primary/10 transition-all w-full"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
            className="rounded-full px-5 whitespace-nowrap"
          >
            All
          </Button>
          {["active", "onboarding", "prospect", "paused"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              className={cn(
                "capitalize rounded-full px-5 whitespace-nowrap transition-all",
                statusFilter !== status && "bg-background border-border/50 hover:bg-muted"
              )}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Clients List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients?.map((client: any) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="bg-card hover:bg-muted/30 transition-all cursor-pointer group border border-border/60 hover:border-primary/30 rounded-2xl hover:shadow-md overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-5 flex-1 min-w-0">
                      <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center shadow-sm shrink-0">
                        <Building2 className="h-6 w-6 text-foreground/50" />
                      </div>
                      <div className="min-w-0 flex-1 py-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {client.company}
                          </h3>
                          <Badge variant="outline" className={cn("uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 border-none", statusColors[client.status])}>
                            {client.status}
                          </Badge>
                          {client.tier && (
                            <Badge variant="outline" className={cn("uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 border-none", tierColors[client.tier])}>
                              {client.tier}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm font-medium text-muted-foreground">
                          <span className="bg-background border border-border/50 px-2 py-0.5 rounded-md">
                            {client.primary_contact} <span className="text-muted-foreground/60 mx-1">•</span> {client.primary_contact_title}
                          </span>
                          {client.industry && (
                            <Badge variant="secondary" className="text-xs bg-secondary/80">
                              {client.industry}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-6 lg:gap-8 pt-4 border-t border-border/50 lg:pt-0 lg:border-t-0 lg:pl-6 lg:border-l">
                      <div className="text-center lg:text-left min-w-[100px]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Revenue</p>
                        <p className="text-xl font-light text-foreground">
                          {formatCurrency(client.total_revenue || 0)}
                        </p>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Engagements</p>
                          <p className="text-xl font-light text-foreground">{client.client_engagements?.[0]?.count || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Sessions</p>
                          <p className="text-xl font-light text-foreground">{client.sessions?.[0]?.count || 0}</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Projects</p>
                          <p className="text-xl font-light text-foreground">{client.client_projects?.[0]?.count || 0}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 ml-auto lg:ml-0">
                        <div className="w-20 hidden md:block">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                            <span className="text-muted-foreground">Health</span>
                            <span
                              className={
                                client.health_score >= 80
                                  ? "text-emerald-500"
                                  : client.health_score >= 60
                                    ? "text-amber-500"
                                    : "text-red-500"
                              }
                            >
                              {client.health_score}
                            </span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${client.health_score >= 80 ? "bg-emerald-500" : client.health_score >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${client.health_score}%` }}
                            />
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filteredClients?.length === 0 && (
            <div className="bg-card border border-dashed border-border/60 rounded-3xl p-16 text-center flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Building2 className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No clients found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
                You don't have any clients matching this criteria yet. Add a new client to get started.
              </p>
              <Button onClick={() => setShowNewClient(true)} className="rounded-full px-8 py-6 h-auto font-semibold text-base shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Client
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
