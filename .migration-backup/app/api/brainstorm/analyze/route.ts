import { createClient } from "@/lib/supabase/server"
import { generateObject } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

// AI Analysis endpoint for brainstorming sessions
export async function POST(request: Request) {
  try {
    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch the brainstorming session
    const { data: session, error: sessionError } = await supabase
      .from("brainstorm_sessions")
      .select("*")
      .eq("id", session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    console.log("[v0] Analyzing brainstorm session:", session.title)

    // Generate insights using AI
    const { object: analysis } = await generateObject({
      model: "openai/gpt-4o",
      schema: z.object({
        key_insights: z.array(z.string()).describe("3-5 key insights extracted from the brainstorming session"),
        action_items: z
          .array(
            z.object({
              type: z
                .enum(["task", "blog_post", "linkedin_post", "email_campaign", "pipeline_update", "knowledge_article"])
                .describe("Type of action to take"),
              title: z.string().describe("Brief title for the action"),
              content: z.string().describe("Detailed content or description"),
              priority: z.enum(["low", "medium", "high", "urgent"]),
              confidence: z.number().min(0).max(1).describe("AI confidence in this recommendation"),
              metadata: z.record(z.unknown()).optional(),
            }),
          )
          .describe("Specific actions that should be taken based on the brainstorming"),
        summary: z.string().describe("2-3 sentence summary of the brainstorming session"),
      }),
      prompt: `
Analyze this brainstorming session and extract actionable insights:

Title: ${session.title}
Type: ${session.session_type}
Content:
${session.context}

Extract:
1. Key insights (strategic takeaways)
2. Specific action items with types:
   - task: Something to do/build
   - blog_post: Content idea for the website/blog
   - linkedin_post: Social media content
   - email_campaign: Email marketing idea
   - pipeline_update: Sales pipeline action
   - knowledge_article: Documentation/guide to create

For each action item, provide:
- Clear title
- Detailed content/description
- Priority level
- Confidence score (how actionable/valuable is this?)
- Relevant metadata (assignee suggestions, due dates, etc.)

Focus on concrete, implementable actions that drive business results.
`,
    })

    console.log("[v0] AI analysis complete:", {
      insights: analysis.key_insights.length,
      actions: analysis.action_items.length,
    })

    // Update brainstorming session with insights
    await supabase
      .from("brainstorm_sessions")
      .update({
        key_insights: analysis.key_insights,
        action_items: analysis.action_items.map((a) => `${a.type}: ${a.title}`),
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id)

    // Create insight records
    const insightRecords = analysis.action_items.map((item) => ({
      session_id,
      insight_type: item.type,
      title: item.title,
      content: item.content,
      priority: item.priority,
      status: "pending",
      confidence_score: item.confidence,
      metadata: item.metadata || {},
    }))

    const { data: insights, error: insightsError } = await supabase
      .from("brainstorm_insights")
      .insert(insightRecords)
      .select()

    if (insightsError) {
      console.error("[v0] Error creating insights:", insightsError)
    }

    console.log("[v0] Created insights:", insights?.length)

    // Auto-execute high-confidence, high-priority actions
    const autoExecute = insights?.filter(
      (i) => i.priority === "urgent" || (i.priority === "high" && i.confidence_score > 0.85),
    )

    if (autoExecute && autoExecute.length > 0) {
      console.log("[v0] Auto-executing", autoExecute.length, "high-priority insights")

      for (const insight of autoExecute) {
        await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/brainstorm/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ insight_id: insight.id }),
        }).catch((err) => console.error("[v0] Error executing insight:", err))
      }
    }

    return NextResponse.json({
      success: true,
      session_id,
      insights: analysis.key_insights,
      actions: analysis.action_items.length,
      auto_executed: autoExecute?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze brainstorm session" }, { status: 500 })
  }
}
