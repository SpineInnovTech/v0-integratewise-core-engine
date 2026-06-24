
import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plus, DollarSign, TrendingUp, Calendar, User, Building2, MoreHorizontal, Target } from "lucide-react"

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("deals")
    .select(`
      *,
      lead:leads(name, email, company, title)
    `)
    .order("expected_close_date", { ascending: true })
  if (error) throw error
  return data
}

const stages = [
  { id: "discovery", label: "Discovery", color: "bg-slate-500" },
  { id: "qualified", label: "Qualified", color: "bg-blue-500" },
  { id: "proposal", label: "Proposal", color: "bg-yellow-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { id: "closed_won", label: "Closed Won", color: "bg-green-500" },
  { id: "closed_lost", label: "Closed Lost", color: "bg-red-500" },
]

const formatCurrency = (value: number, currency = "INR") => {
  if (currency === "INR") {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }
  return `$${value.toLocaleString()}`
}

export function DealsView() {
  const { data: deals, isLoading } = useSWR("deals", fetcher)
  const [search, setSearch] = useState("")

  const filteredDeals = deals?.filter((deal: any) => {
    const matchesSearch =
      deal.name.toLowerCase().includes(search.toLowerCase()) ||
      deal.lead?.company?.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  // Group deals by stage
  const dealsByStage = stages.reduce((acc: any, stage) => {
    acc[stage.id] = filteredDeals?.filter((d: any) => d.stage === stage.id) || []
    return acc
  }, {})

  // Calculate stats
  const stats = {
    totalPipeline:
      deals?.filter((d: any) => !d.stage.includes("closed")).reduce((sum: number, d: any) => sum + (d.value || 0), 0) ||
      0,
    weightedPipeline:
      deals
        ?.filter((d: any) => !d.stage.includes("closed"))
        .reduce((sum: number, d: any) => sum + ((d.value || 0) * (d.probability || 0)) / 100, 0) || 0,
    dealsCount: deals?.filter((d: any) => !d.stage.includes("closed")).length || 0,
    avgDealSize: deals?.length ? deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0) / deals.length : 0,
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-96 w-72 flex-shrink-0" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Deals Pipeline</h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Track and manage your sales opportunities</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-full px-6 shadow-md transition-all hover:shadow-lg font-semibold">
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Pipeline</p>
                <p className="text-3xl font-light text-foreground mt-2">{formatCurrency(stats.totalPipeline)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Weighted Pipeline</p>
                <p className="text-3xl font-light text-blue-600 mt-2">{formatCurrency(stats.weightedPipeline)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Deals</p>
                <p className="text-3xl font-light text-primary mt-2">{stats.dealsCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Deal Size</p>
                <p className="text-3xl font-light text-violet-600 mt-2">{formatCurrency(stats.avgDealSize)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          placeholder="Search deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-10 bg-background border-border rounded-xl focus:ring-4 focus:ring-primary/10 transition-all w-full"
        />
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar">
        {stages
          .filter((s) => !s.id.includes("closed"))
          .map((stage) => {
            const stageDeals = dealsByStage[stage.id] || []
            const stageValue = stageDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)

            return (
              <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", stage.color)} />
                    <span className="font-bold uppercase tracking-wider text-sm text-foreground">{stage.label}</span>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 rounded-md bg-secondary/80">
                      {stageDeals.length}
                    </Badge>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{formatCurrency(stageValue)}</span>
                </div>

                <div className="space-y-4 flex-1 bg-secondary/20 p-3 rounded-2xl border border-border/50">
                  {stageDeals.map((deal: any) => (
                    <Card
                      key={deal.id}
                      className="border-border/60 hover:border-primary/50 cursor-pointer transition-all hover:shadow-md rounded-xl bg-card group"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">{deal.name}</h4>
                          <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-secondary">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        {deal.lead && (
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md w-fit">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate max-w-[180px]">{deal.lead.company}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-lg font-bold text-foreground">
                            {formatCurrency(deal.value, deal.currency)}
                          </span>
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-none",
                            deal.probability >= 80 ? "bg-emerald-500/10 text-emerald-600" :
                            deal.probability >= 50 ? "bg-blue-500/10 text-blue-600" :
                            "bg-amber-500/10 text-amber-600"
                          )}>
                            {deal.probability}%
                          </Badge>
                        </div>

                        <div className="pt-3 mt-1 border-t border-border/50 flex flex-col gap-2">
                          {deal.expected_close_date && (
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{new Date(deal.expected_close_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          )}

                          {deal.lead && (
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                                {deal.lead.name.charAt(0)}
                              </div>
                              <span className="truncate">{deal.lead.name}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center flex flex-col items-center justify-center h-32 opacity-60">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
