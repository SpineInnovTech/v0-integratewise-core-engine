"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, TrendingUp, Calendar, User, Building2, Target, CheckCircle2, Clock } from "lucide-react"

interface Deal {
  id: string
  name: string
  value: number
  currency: string
  stage: string
  probability: number
  expected_close_date: string
  notes: string
  lead: {
    id: string
    name: string
    email: string
    company: string
    title: string
  } | null
  product: {
    id: string
    name: string
    tier_name: string
  } | null
}

interface Client {
  id: string
  name: string
  company: string
  email: string
  industry: string
  status: string
  total_revenue: number
  health_score: number
}

interface Product {
  id: string
  name: string
  tier_name: string
  description: string
}

const fetchDeals = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("deals")
    .select(`
      *,
      lead:leads(id, name, email, company, title)
    `)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

const fetchClients = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.from("clients").select("*").order("company")
  if (error) throw error
  return data
}

const fetchProducts = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, name, tier_name, description")
    .eq("is_active", true)
    .order("tier")
  if (error) throw error
  return data
}

const fetchLeads = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, email, company, title")
    .in("status", ["new", "contacted", "qualified"])
    .order("score", { ascending: false })
  if (error) throw error
  return data
}

const stages = [
  { id: "discovery", label: "Discovery", color: "bg-slate-500", textColor: "text-slate-700", bgLight: "bg-slate-50" },
  { id: "qualified", label: "Qualified", color: "bg-blue-500", textColor: "text-blue-700", bgLight: "bg-blue-50" },
  { id: "proposal", label: "Proposal", color: "bg-amber-500", textColor: "text-amber-700", bgLight: "bg-amber-50" },
  {
    id: "negotiation",
    label: "Negotiation",
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgLight: "bg-orange-50",
  },
  { id: "closed_won", label: "Won", color: "bg-green-500", textColor: "text-green-700", bgLight: "bg-green-50" },
  { id: "closed_lost", label: "Lost", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50" },
]

const formatCurrency = (value: number, currency = "INR") => {
  if (!value) return currency === "INR" ? "₹0" : "$0"
  if (currency === "INR") {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
    return `₹${value.toLocaleString()}`
  }
  return `$${value.toLocaleString()}`
}

export function SalesHubView() {
  const { data: deals, isLoading: dealsLoading, mutate: mutateDeals } = useSWR("sales-deals", fetchDeals)
  const { data: clients } = useSWR("sales-clients", fetchClients)
  const { data: products } = useSWR("sales-products", fetchProducts)
  const { data: leads } = useSWR("sales-leads", fetchLeads)

  const [search, setSearch] = useState("")
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newDeal, setNewDeal] = useState({
    name: "",
    lead_id: "",
    product_id: "",
    value: "",
    currency: "INR",
    stage: "discovery",
    probability: "10",
    expected_close_date: "",
    notes: "",
  })

  const filteredDeals = deals?.filter((deal: Deal) => {
    const matchesSearch =
      deal.name.toLowerCase().includes(search.toLowerCase()) ||
      deal.lead?.company?.toLowerCase().includes(search.toLowerCase()) ||
      deal.lead?.name?.toLowerCase().includes(search.toLowerCase())
    const matchesStage = !selectedStage || deal.stage === selectedStage
    return matchesSearch && matchesStage
  })

  // Calculate stats
  const stats = {
    totalPipeline:
      deals
        ?.filter((d: Deal) => !d.stage.includes("closed"))
        .reduce((sum: number, d: Deal) => sum + (d.value || 0), 0) || 0,
    wonDeals:
      deals?.filter((d: Deal) => d.stage === "closed_won").reduce((sum: number, d: Deal) => sum + (d.value || 0), 0) ||
      0,
    activeDeals: deals?.filter((d: Deal) => !d.stage.includes("closed")).length || 0,
    wonCount: deals?.filter((d: Deal) => d.stage === "closed_won").length || 0,
    lostCount: deals?.filter((d: Deal) => d.stage === "closed_lost").length || 0,
  }

  const winRate =
    stats.wonCount + stats.lostCount > 0 ? Math.round((stats.wonCount / (stats.wonCount + stats.lostCount)) * 100) : 0

  const handleCreateDeal = async () => {
    const supabase = createClient()
    const { error } = await supabase.from("deals").insert({
      name: newDeal.name,
      lead_id: newDeal.lead_id || null,
      product_id: newDeal.product_id || null,
      value: Number.parseFloat(newDeal.value) || 0,
      currency: newDeal.currency,
      stage: newDeal.stage,
      probability: Number.parseInt(newDeal.probability) || 10,
      expected_close_date: newDeal.expected_close_date || null,
      notes: newDeal.notes,
    })
    if (!error) {
      mutateDeals()
      setIsCreateOpen(false)
      setNewDeal({
        name: "",
        lead_id: "",
        product_id: "",
        value: "",
        currency: "INR",
        stage: "discovery",
        probability: "10",
        expected_close_date: "",
        notes: "",
      })
    }
  }

  const updateDealStage = async (dealId: string, newStage: string) => {
    const supabase = createClient()
    const probability =
      newStage === "closed_won"
        ? 100
        : newStage === "closed_lost"
          ? 0
          : newStage === "negotiation"
            ? 70
            : newStage === "proposal"
              ? 50
              : newStage === "qualified"
                ? 30
                : 10

    await supabase
      .from("deals")
      .update({
        stage: newStage,
        probability,
        actual_close_date: newStage.includes("closed") ? new Date().toISOString() : null,
      })
      .eq("id", dealId)
    mutateDeals()
  }

  if (dealsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Hub</h1>
          <p className="text-sm text-muted-foreground">Track deals and link products to clients</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Deal Name</Label>
                <Input
                  placeholder="e.g., TechCorp MuleSoft Implementation"
                  value={newDeal.name}
                  onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lead / Contact</Label>
                  <Select value={newDeal.lead_id} onValueChange={(v) => setNewDeal({ ...newDeal, lead_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads?.map((lead: any) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name} - {lead.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Product / Service</Label>
                  <Select value={newDeal.product_id} onValueChange={(v) => setNewDeal({ ...newDeal, product_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    placeholder="500000"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={newDeal.currency} onValueChange={(v) => setNewDeal({ ...newDeal, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Probability %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newDeal.probability}
                    onChange={(e) => setNewDeal({ ...newDeal, probability: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select value={newDeal.stage} onValueChange={(v) => setNewDeal({ ...newDeal, stage: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages
                        .filter((s) => !s.id.includes("closed"))
                        .map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expected Close Date</Label>
                  <Input
                    type="date"
                    value={newDeal.expected_close_date}
                    onChange={(e) => setNewDeal({ ...newDeal, expected_close_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Deal notes..."
                  value={newDeal.notes}
                  onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDeal} disabled={!newDeal.name}>
                  Create Deal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalPipeline)}</p>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.wonDeals)}</p>
                <p className="text-sm text-muted-foreground">Won Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.activeDeals}</p>
                <p className="text-sm text-muted-foreground">Active Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{winRate}%</p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedStage === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStage(null)}
            className="h-8"
          >
            All ({deals?.length || 0})
          </Button>
          {stages.map((stage) => {
            const count = deals?.filter((d: Deal) => d.stage === stage.id).length || 0
            return (
              <Button
                key={stage.id}
                variant={selectedStage === stage.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                className="h-8"
              >
                <span className={`h-2 w-2 rounded-full ${stage.color} mr-1.5`} />
                {stage.label} ({count})
              </Button>
            )
          })}
        </div>
      </div>

      {/* Deals List */}
      <div className="space-y-3">
        {filteredDeals?.map((deal: Deal) => {
          const stage = stages.find((s) => s.id === deal.stage)
          return (
            <Card key={deal.id} className="border-border/50 hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{deal.name}</h3>
                      <Badge variant="outline" className={`text-xs ${stage?.bgLight} ${stage?.textColor} border-0`}>
                        {stage?.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {deal.lead && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {deal.lead.company}
                        </span>
                      )}
                      {deal.lead && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {deal.lead.name}
                        </span>
                      )}
                      {deal.expected_close_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Close: {new Date(deal.expected_close_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{formatCurrency(deal.value, deal.currency)}</p>
                      <p className="text-xs text-muted-foreground">{deal.probability}% probability</p>
                    </div>

                    {!deal.stage.includes("closed") && (
                      <Select value={deal.stage} onValueChange={(v) => updateDealStage(deal.id, v)}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              <span className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                                {s.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredDeals?.length === 0 && (
          <div className="text-center py-16">
            <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-1">No deals found</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first deal to start tracking sales</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Deal
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
