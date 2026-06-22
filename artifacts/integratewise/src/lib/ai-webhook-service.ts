// Client-side stub - server functionality handled by API routes
export type AIInsightType = "recommendation" | "alert" | "summary"

export interface AIInsight {
  recommendations: string[]
  alerts: string[]
  summary: string
}

export async function getAIInsights(): Promise<AIInsight> {
  return {
    recommendations: [],
    alerts: [],
    summary: "AI insights are available in the full version.",
  }
}
