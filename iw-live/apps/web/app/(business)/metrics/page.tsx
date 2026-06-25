"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Metrics {
  mrr: number
  arr: number
  activeClients: number
  newClients: number
  churnRate: number
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    mrr: 0,
    arr: 0,
    activeClients: 0,
    newClients: 0,
    churnRate: 0,
  })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchMetrics()
  }, [])

  async function fetchMetrics() {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Fetch subscriptions for MRR/ARR
    const { data: subs } = await supabase.from("subscriptions").select("mrr, arr")

    // Fetch clients for count
    const { data: clients } = await supabase.from("clients").select("id, created_at")

    const mrr = subs?.reduce((sum: number, s: { mrr?: number }) => sum + (s.mrr || 0), 0) || 0
    const arr = subs?.reduce((sum: number, s: { arr?: number }) => sum + (s.arr || 0), 0) || 0
    const activeClients = clients?.length || 0

    setMetrics({
      mrr,
      arr,
      activeClients,
      newClients: 0,
      churnRate: 0,
    })
    setLoading(false)
  }

  const metricCards = [
    { label: "Monthly Recurring Revenue", value: `$${metrics.mrr.toLocaleString()}`, color: "text-green-600" },
    { label: "Annual Recurring Revenue", value: `$${metrics.arr.toLocaleString()}`, color: "text-blue-600" },
    { label: "Active Clients", value: metrics.activeClients, color: "text-purple-600" },
    { label: "Churn Rate", value: `${metrics.churnRate.toFixed(1)}%`, color: "text-red-600" },
  ]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Key Metrics
        </h1>
        <p className="text-foreground/60 mt-2">Track your business health</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <div className="md:col-span-2 lg:col-span-4">
            <Card>
              <CardContent className="pt-6 text-center text-foreground/60">Loading metrics...</CardContent>
            </Card>
          </div>
        ) : (
          metricCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground/60">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
