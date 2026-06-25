"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export interface InsightCard {
  id: string
  title: string
  metric_id?: string
  value?: number | string
  trend?: "up" | "down" | "stable"
  confidence?: number
  source_refs: { provider: string; record_id: string; url?: string }[]
  recommended_actions: string[]
  category: "kpi" | "trend" | "risk" | "opportunity"
  priority: "high" | "medium" | "low"
  created_at: string
}

export interface KPIs {
  revenue: { value: number; trend: "up" | "down" | "stable"; change: number }
  pipeline: { value: number; trend: "up" | "down" | "stable"; change: number }
  active_projects: { value: number; trend: "up" | "down" | "stable"; change: number }
  visitors: { value: number; trend: "up" | "down" | "stable"; change: number }
  conversions: { value: number; trend: "up" | "down" | "stable"; change: number }
}

interface InsightsData {
  kpis: KPIs
  insights: InsightCard[]
  trends: InsightCard[]
  risks: InsightCard[]
  opportunities: InsightCard[]
}

const fetcher = async (): Promise<InsightsData> => {
  const supabase = createClient()
  if (!supabase) {
    return {
      kpis: {
        revenue: { value: 0, trend: "stable", change: 0 },
        pipeline: { value: 0, trend: "stable", change: 0 },
        active_projects: { value: 0, trend: "stable", change: 0 },
        visitors: { value: 0, trend: "stable", change: 0 },
        conversions: { value: 0, trend: "stable", change: 0 },
      },
      insights: [],
      trends: [],
      risks: [],
      opportunities: [],
    }
  }

  // Fetch daily insights
  const { data: dailyInsights } = await supabase
    .from("daily_insights")
    .select("*")
    .order("insight_date", { ascending: false })
    .limit(1)
    .single()

  // Fetch SPINE data for KPIs
  const { count: taskCount } = await supabase
    .from("spine_tasks")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: planCount } = await supabase
    .from("spine_plans")
    .select("*", { count: "exact", head: true })
    .eq("status", "open")

  // Build KPIs from SPINE data
  const kpis: KPIs = {
    revenue: {
      value: dailyInsights?.revenue_mtd || 0,
      trend: dailyInsights?.revenue_trend || "stable",
      change: dailyInsights?.revenue_change || 0,
    },
    pipeline: {
      value: planCount || 0,
      trend: "stable",
      change: 0,
    },
    active_projects: {
      value: taskCount || 0,
      trend: "stable",
      change: 0,
    },
    visitors: {
      value: dailyInsights?.visitors || 0,
      trend: dailyInsights?.visitors_trend || "stable",
      change: dailyInsights?.visitors_change || 0,
    },
    conversions: {
      value: dailyInsights?.conversions || 0,
      trend: dailyInsights?.conversions_trend || "stable",
      change: dailyInsights?.conversions_change || 0,
    },
  }

  // Fetch AI-generated insights
  const { data: aiInsights } = await supabase
    .from("brainstorm_insights")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  const insights: InsightCard[] = (aiInsights || []).map((i) => ({
    id: i.id,
    title: i.title,
    metric_id: i.metric_id,
    value: i.value,
    trend: i.trend,
    confidence: i.confidence_score,
    source_refs: i.source_refs || [],
    recommended_actions: i.recommended_actions || [],
    category: i.category || "trend",
    priority: i.priority || "medium",
    created_at: i.created_at,
  }))

  return {
    kpis,
    insights,
    trends: insights.filter((i) => i.category === "trend"),
    risks: insights.filter((i) => i.category === "risk"),
    opportunities: insights.filter((i) => i.category === "opportunity"),
  }
}

export function useInsights() {
  return useSWR<InsightsData>("insights", fetcher, {
    refreshInterval: 60000, // Refresh every minute
  })
}
