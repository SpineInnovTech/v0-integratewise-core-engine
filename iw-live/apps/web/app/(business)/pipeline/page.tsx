"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DealsByStage {
  stage: string
  count: number
  value: number
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<DealsByStage[]>([])
  const [totalPipeline, setTotalPipeline] = useState(0)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchPipeline()
  }, [])

  async function fetchPipeline() {
    const { data, error } = await supabase
      .from("deals")
      .select("stage, value")
      .in("stage", ["Qualified", "Proposal", "Negotiation", "Closed"])

    if (!error && data) {
      const byStage: Record<string, { count: number; value: number }> = {}

      data.forEach((deal: any) => {
        if (!byStage[deal.stage]) {
          byStage[deal.stage] = { count: 0, value: 0 }
        }
        byStage[deal.stage].count += 1
        byStage[deal.stage].value += deal.value || 0
      })

      const pipelineData = Object.entries(byStage).map(([stage, data]) => ({
        stage,
        ...data,
      }))

      setDeals(pipelineData)
      setTotalPipeline(pipelineData.reduce((sum, d) => sum + d.value, 0))
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Sales Pipeline
        </h1>
        <p className="text-foreground/60 mt-2">Track deals through stages</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">${totalPipeline.toLocaleString()}</div>
            <p className="text-xs text-foreground/60 mt-2">{deals.reduce((sum, d) => sum + d.count, 0)} deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">30%</div>
            <p className="text-xs text-foreground/60 mt-2">Industry average</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">Loading pipeline...</CardContent>
          </Card>
        ) : deals.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">No deals in pipeline</CardContent>
          </Card>
        ) : (
          deals.map((stage) => (
            <Card key={stage.stage}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{stage.stage}</h3>
                  <span className="text-sm text-foreground/60">${stage.value.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-foreground/60">
                  <span>{stage.count} deals</span>
                  <span>{Math.round((stage.value / totalPipeline) * 100)}% of total</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
