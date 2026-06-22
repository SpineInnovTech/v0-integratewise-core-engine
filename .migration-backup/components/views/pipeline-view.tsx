"use client"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Target, Plus, Calendar, User, IndianRupee, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const stages = [
  { id: "discovery", name: "Discovery", color: "bg-blue-500" },
  { id: "qualification", name: "Qualification", color: "bg-purple-500" },
  { id: "proposal", name: "Proposal", color: "bg-yellow-500" },
  { id: "negotiation", name: "Negotiation", color: "bg-orange-500" },
  { id: "closed_won", name: "Closed Won", color: "bg-green-500" },
  { id: "closed_lost", name: "Closed Lost", color: "bg-red-500" },
]

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("opportunities")
    .select(`
      *,
      client:clients(company_name),
      service:services(name, tier)
    `)
    .order("expected_close_date")
  if (error) throw error
  return data
}

function formatValue(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  return `₹${(value / 1000).toFixed(0)}K`
}

export function PipelineView() {
  const { data: opportunities, isLoading } = useSWR("opportunities", fetcher)

  const pipelineByStage = stages.map((stage) => {
    const stageOpps = opportunities?.filter((o: any) => o.stage === stage.id) || []
    const totalValue = stageOpps.reduce((sum: number, o: any) => sum + (o.value || 0), 0)
    const weightedValue = stageOpps.reduce(
      (sum: number, o: any) => sum + ((o.value || 0) * (o.probability || 0)) / 100,
      0,
    )
    return { ...stage, opportunities: stageOpps, totalValue, weightedValue, count: stageOpps.length }
  })

  const totalPipeline = pipelineByStage
    .filter((s) => !s.id.startsWith("closed"))
    .reduce((sum, s) => sum + s.totalValue, 0)
  const weightedPipeline = pipelineByStage
    .filter((s) => !s.id.startsWith("closed"))
    .reduce((sum, s) => sum + s.weightedValue, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track opportunities and deals</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Opportunity
        </Button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-4">
            <p className="text-sm opacity-80">Total Pipeline</p>
            <p className="text-2xl font-bold mt-1">{formatValue(totalPipeline)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Weighted Pipeline</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatValue(weightedPipeline)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Open Opportunities</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {opportunities?.filter((o: any) => !o.stage.startsWith("closed")).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Deal Size</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {opportunities?.length
                ? formatValue(totalPipeline / opportunities.filter((o: any) => !o.stage.startsWith("closed")).length)
                : "₹0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {pipelineByStage
          .filter((s) => !s.id.startsWith("closed"))
          .map((stage) => (
            <div key={stage.id} className="flex items-center">
              <div className="text-center px-4 py-2 bg-card rounded-lg border border-border min-w-[120px]">
                <div className={`h-2 w-full ${stage.color} rounded-full mb-2`} />
                <p className="text-xs text-muted-foreground">{stage.name}</p>
                <p className="text-lg font-bold text-foreground">{formatValue(stage.totalValue)}</p>
                <p className="text-xs text-muted-foreground">{stage.count} deals</p>
              </div>
              {stage.id !== "negotiation" && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
            </div>
          ))}
      </div>

      {/* Opportunities List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities
            ?.filter((o: any) => !o.stage.startsWith("closed"))
            .map((opp: any) => {
              const stage = stages.find((s) => s.id === opp.stage)
              return (
                <Card key={opp.id} className="bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl ${stage?.color}/10 flex items-center justify-center`}>
                          <Target className={`h-6 w-6 ${stage?.color?.replace("bg-", "text-")}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{opp.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>{opp.client?.company_name}</span>
                            {opp.service && (
                              <Badge variant="secondary" className="text-xs">
                                {opp.service.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground flex items-center">
                            <IndianRupee className="h-4 w-4" />
                            {formatValue(opp.value)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={opp.probability} className="w-16 h-1.5" />
                            <span className="text-xs text-muted-foreground">{opp.probability}%</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${stage?.color}/10 border-current`}>
                          {stage?.name}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {opp.expected_close_date
                            ? new Date(opp.expected_close_date).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })
                            : "TBD"}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {opp.owner || "Unassigned"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )
}
