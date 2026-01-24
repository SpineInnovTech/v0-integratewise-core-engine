"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Deals Pipeline</h1>
          <p className="text-slate-500">Track and manage your sales opportunities</p>
        </div>
        <Button className="bg-teal-500 hover:bg-teal-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalPipeline)}</p>
                <p className="text-sm text-slate-500">Total Pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.weightedPipeline)}</p>
                <p className="text-sm text-slate-500">Weighted Pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.dealsCount}</p>
                <p className="text-sm text-slate-500">Active Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.avgDealSize)}</p>
                <p className="text-sm text-slate-500">Avg Deal Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-slate-200"
        />
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages
          .filter((s) => !s.id.includes("closed"))
          .map((stage) => {
            const stageDeals = dealsByStage[stage.id] || []
            const stageValue = stageDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0)

            return (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="font-medium text-slate-700">{stage.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {stageDeals.length}
                    </Badge>
                  </div>
                  <span className="text-sm text-slate-500">{formatCurrency(stageValue)}</span>
                </div>

                <div className="space-y-3">
                  {stageDeals.map((deal: any) => (
                    <Card
                      key={deal.id}
                      className="border-slate-200 hover:border-teal-300 cursor-pointer transition-colors"
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm text-slate-800 line-clamp-2">{deal.name}</h4>
                          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 -mt-1">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {deal.lead && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Building2 className="h-3 w-3" />
                            <span>{deal.lead.company}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-teal-600">
                            {formatCurrency(deal.value, deal.currency)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {deal.probability}%
                          </Badge>
                        </div>

                        {deal.expected_close_date && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>Close: {new Date(deal.expected_close_date).toLocaleDateString()}</span>
                          </div>
                        )}

                        {deal.lead && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                            <User className="h-3 w-3" />
                            <span>{deal.lead.name}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-slate-400">No deals</p>
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
