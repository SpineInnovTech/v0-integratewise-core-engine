import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { NextResponse } from "next/server"

// Generate daily insights from all brainstorming sessions (run via cron)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split("T")[0]

    console.log("[v0] Generating daily insights for:", today)

    // Check if already generated for today
    const { data: existing } = await supabase.from("daily_insights").select("*").eq("insight_date", today).single()

    if (existing) {
      return NextResponse.json({ message: "Daily insights already generated", data: existing })
    }

    // Get today's brainstorming sessions
    const { data: sessions } = await supabase
      .from("brainstorm_sessions")
      .select("*")
      .gte("session_date", `${today}T00:00:00`)
      .lte("session_date", `${today}T23:59:59`)

    // Get today's insights
    const { data: insights } = await supabase
      .from("brainstorm_insights")
      .select("*")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)

    // Get current metrics
    const { data: metrics } = await supabase
      .from("metrics")
      .select("metric_name, metric_value")
      .order("recorded_at", { ascending: false })
      .limit(10)

    const sessionsCount = sessions?.length || 0
    const insightsCount = insights?.length || 0
    const tasksCreated = insights?.filter((i) => i.insight_type === "task" && i.status === "completed").length || 0
    const contentGenerated =
      insights?.filter(
        (i) =>
          (i.insight_type === "blog_post" ||
            i.insight_type === "linkedin_post" ||
            i.insight_type === "knowledge_article") &&
          i.status === "completed",
      ).length || 0
    const pipelineUpdates = insights?.filter((i) => i.insight_type === "pipeline_update").length || 0

    console.log("[v0] Stats:", { sessionsCount, insightsCount, tasksCreated, contentGenerated })

    // Generate AI summary
    const { text: summary } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `
Generate a daily business intelligence summary for IntegrateWise OS based on today's data:

Brainstorming Sessions Today: ${sessionsCount}
${sessions?.map((s) => `- ${s.title}: ${s.key_insights?.join(", ")}`).join("\n")}

AI-Generated Insights: ${insightsCount}
- Tasks created: ${tasksCreated}
- Content generated: ${contentGenerated}
- Pipeline updates: ${pipelineUpdates}

Current Metrics:
${metrics?.map((m) => `- ${m.metric_name}: ${m.metric_value}`).join("\n")}

Generate:
1. A 2-3 sentence executive summary
2. List 3-5 priority actions that need immediate attention

Be concise, actionable, and business-focused.
`,
    })

    // Extract key actions (simple parsing)
    const lines = summary.split("\n")
    const key_actions = lines
      .filter((line) => line.trim().match(/^[-•*]\s/) || line.trim().match(/^\d+\./))
      .map((line) =>
        line
          .replace(/^[-•*]\s/, "")
          .replace(/^\d+\.\s/, "")
          .trim(),
      )
      .filter((line) => line.length > 10)
      .slice(0, 5)

    const summaryText =
      lines.find((line) => line.length > 50 && !line.trim().match(/^[-•*]\s/) && !line.trim().match(/^\d+\./)) ||
      summary.split("\n")[0]

    // Store daily insights
    const { data: dailyInsight, error } = await supabase
      .from("daily_insights")
      .insert({
        insight_date: today,
        summary: summaryText,
        key_actions,
        metrics_snapshot: metrics ? Object.fromEntries(metrics.map((m) => [m.metric_name, m.metric_value])) : {},
        brainstorm_count: sessionsCount,
        tasks_created: tasksCreated,
        content_generated: contentGenerated,
        pipeline_updates: pipelineUpdates,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving daily insights:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Daily insights generated:", dailyInsight.id)

    return NextResponse.json({ success: true, data: dailyInsight })
  } catch (error) {
    console.error("[v0] Daily insights error:", error)
    return NextResponse.json({ error: "Failed to generate daily insights" }, { status: 500 })
  }
}

// GET endpoint to retrieve today's insights
export async function GET() {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase.from("daily_insights").select("*").eq("insight_date", today).single()

    if (error || !data) {
      return NextResponse.json({ message: "No insights for today yet" }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Fetch daily insights error:", error)
    return NextResponse.json({ error: "Failed to fetch daily insights" }, { status: 500 })
  }
}
