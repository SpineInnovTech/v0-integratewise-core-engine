import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Gather context from the database
    const [metricsRes, documentsRes, tasksRes] = await Promise.all([
      supabase.from("metrics").select("metric_name, metric_value, change_percentage, change_direction").limit(10),
      supabase.from("documents").select("title, category, description").limit(20),
      supabase.from("tasks").select("title, status, priority, due_date").limit(10),
    ])

    const metrics = metricsRes.data || []
    const documents = documentsRes.data || []
    const tasks = tasksRes.data || []

    // Build context string
    const contextString = `
You are an AI assistant for IntegrateWise OS, a business command center.

Current Business Metrics:
${metrics.map((m) => `- ${m.metric_name}: ${m.metric_value} (${m.change_direction} ${m.change_percentage}%)`).join("\n")}

Available Documents (${documents.length}):
${documents.map((d) => `- ${d.title} (${d.category}): ${d.description}`).join("\n")}

Current Tasks (${tasks.length}):
${tasks.map((t) => `- ${t.title} [${t.status}] - ${t.priority} priority, due: ${t.due_date || "no date"}`).join("\n")}

User Question: ${message}

Provide a helpful, concise response based on the available business data. If you don't have specific information, say so and offer to help in another way.
`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: contextString,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json(
      {
        response:
          "I'm having trouble processing your request right now. Please try again or check that all integrations are properly configured.",
      },
      { status: 200 },
    )
  }
}
