import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { NextResponse } from "next/server"

// Execute AI-generated insights (create tasks, blog posts, etc.)
export async function POST(request: Request) {
  try {
    const { insight_id } = await request.json()

    if (!insight_id) {
      return NextResponse.json({ error: "insight_id is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch the insight
    const { data: insight, error: insightError } = await supabase
      .from("brainstorm_insights")
      .select("*")
      .eq("id", insight_id)
      .single()

    if (insightError || !insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 })
    }

    console.log("[v0] Executing insight:", insight.insight_type, insight.title)

    let result_id = null
    let result_type = null

    // Execute based on insight type
    switch (insight.insight_type) {
      case "task": {
        // Create task automatically
        const { data: task } = await supabase
          .from("tasks")
          .insert({
            title: insight.title,
            description: insight.content,
            priority: insight.priority,
            status: "todo",
            due_date: insight.target_date,
            assignee: insight.assigned_to,
            tags: ["from_brainstorm"],
            metadata: { brainstorm_insight_id: insight.id, confidence: insight.confidence_score },
          })
          .select()
          .single()

        if (task) {
          result_id = task.id
          result_type = "task"
          console.log("[v0] Created task:", task.id)
        }
        break
      }

      case "knowledge_article": {
        // Generate and save knowledge article
        const { text: article_content } = await generateText({
          model: "openai/gpt-4o",
          prompt: `
Write a comprehensive knowledge base article based on this outline:

Title: ${insight.title}
Brief: ${insight.content}

Create a complete, well-structured article with:
- Introduction
- Main sections with headers
- Practical examples
- Best practices
- Conclusion

Format in Markdown. Target length: 800-1200 words.
`,
        })

        const { data: doc } = await supabase
          .from("documents")
          .insert({
            title: insight.title,
            content: article_content,
            category: insight.metadata?.document_category || "strategy",
            description: insight.content.substring(0, 200),
            icon: "FileText",
            metadata: { brainstorm_insight_id: insight.id, auto_generated: true },
          })
          .select()
          .single()

        if (doc) {
          result_id = doc.id
          result_type = "document"
          console.log("[v0] Created knowledge article:", doc.id)
        }
        break
      }

      case "blog_post": {
        // Generate blog post and save to content library
        const { text: blog_content } = await generateText({
          model: "openai/gpt-4o",
          prompt: `
Write a blog post based on this outline:

Title: ${insight.title}
Brief: ${insight.content}
Target Platform: ${insight.metadata?.target_platform || "website"}
Target Length: ${insight.metadata?.target_length || 1000} words

Create an engaging blog post with:
- Attention-grabbing intro
- Clear structure with subheadings
- Real-world examples
- Call-to-action

Format in Markdown.
`,
        })

        const { data: content } = await supabase
          .from("content_library")
          .insert({
            title: insight.title,
            content: blog_content,
            type: "article",
            status: "draft",
            category: "thought_leadership",
            platform: "blog",
            tags: ["brainstorm", "auto_generated"],
            metadata: { brainstorm_insight_id: insight.id },
          })
          .select()
          .single()

        if (content) {
          result_id = content.id
          result_type = "content"
          console.log("[v0] Created blog post:", content.id)
        }
        break
      }

      case "linkedin_post": {
        // Generate LinkedIn post
        const { data: content } = await supabase
          .from("content_library")
          .insert({
            title: insight.title,
            content: insight.content,
            type: "article",
            status: "draft",
            category: "social_proof",
            platform: "linkedin",
            tags: ["linkedin", "brainstorm"],
            metadata: { brainstorm_insight_id: insight.id, post_type: "announcement" },
          })
          .select()
          .single()

        if (content) {
          result_id = content.id
          result_type = "content"
          console.log("[v0] Created LinkedIn post:", content.id)
        }
        break
      }

      case "email_campaign": {
        // Create email campaign
        const { data: campaign } = await supabase
          .from("campaigns")
          .insert({
            name: insight.title,
            type: "email",
            status: "draft",
            description: insight.content,
            channel: "email",
            content: { body: insight.content },
            metadata: { brainstorm_insight_id: insight.id },
          })
          .select()
          .single()

        if (campaign) {
          result_id = campaign.id
          result_type = "campaign"
          console.log("[v0] Created email campaign:", campaign.id)
        }
        break
      }

      case "pipeline_update": {
        // Create/update deal in pipeline
        const { data: deal } = await supabase
          .from("deals")
          .insert({
            name: insight.title,
            notes: insight.content,
            stage: "discovery",
            source: "brainstorm",
            metadata: { brainstorm_insight_id: insight.id },
          })
          .select()
          .single()

        if (deal) {
          result_id = deal.id
          result_type = "deal"
          console.log("[v0] Created pipeline deal:", deal.id)
        }
        break
      }
    }

    // Update insight with execution result
    await supabase
      .from("brainstorm_insights")
      .update({
        status: result_id ? "completed" : "failed",
        executed_at: new Date().toISOString(),
        result_id,
        result_type,
      })
      .eq("id", insight_id)

    // Create activity
    if (result_id) {
      await supabase.from("activities").insert({
        activity_type: "insight_executed",
        title: `Auto-executed: ${insight.insight_type}`,
        description: insight.title,
        icon: "Zap",
        color: "purple",
        related_entity_type: result_type,
        related_entity_id: result_id,
        actor_name: "AI System",
      })
    }

    return NextResponse.json({
      success: true,
      insight_id,
      result_id,
      result_type,
      executed: !!result_id,
    })
  } catch (error) {
    console.error("[v0] Execution error:", error)
    return NextResponse.json({ error: "Failed to execute insight" }, { status: 500 })
  }
}
