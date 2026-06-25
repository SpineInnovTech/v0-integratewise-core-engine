import { createAdminClient } from "@/lib/supabase/server"

export type TriagePriority = "low" | "medium" | "high" | "urgent"
export type TriageCategory =
  | "question"
  | "bug_report"
  | "feature_request"
  | "support"
  | "feedback"
  | "urgent"
  | "general"
  | "spam"

export interface TriageResult {
  priority: TriagePriority
  category: TriageCategory
  confidence: number
  reasoning: string
  suggested_actions: string[]
  sentiment: "positive" | "neutral" | "negative"
  keywords: string[]
  assignee_suggestion?: string
  requires_immediate_attention: boolean
}

export interface TriageConfig {
  aiProvider?: "claude" | "deepseek"
  apiKey?: string
  enableAutoAssignment?: boolean
  enableAutoResponse?: boolean
}

/**
 * Analyze message content using AI to determine triage classification
 */
async function analyzeWithAI(
  content: string,
  context: Record<string, unknown>,
  config: TriageConfig,
): Promise<TriageResult> {
  const provider = config.aiProvider || "claude"

  const prompt = `You are a triage bot for a customer support and project management system. Analyze the following message and provide triage classification.

Message: "${content}"

Context:
- Platform: ${context.platform || "unknown"}
- Channel: ${context.channel || "unknown"}
- User: ${context.user || "unknown"}
- Timestamp: ${context.timestamp || "unknown"}

Analyze this message and respond with a JSON object containing:
1. priority: "low" | "medium" | "high" | "urgent"
2. category: "question" | "bug_report" | "feature_request" | "support" | "feedback" | "urgent" | "general" | "spam"
3. confidence: number (0-1, how confident you are in this classification)
4. reasoning: string (brief explanation of your classification)
5. suggested_actions: string[] (1-3 actionable next steps)
6. sentiment: "positive" | "neutral" | "negative"
7. keywords: string[] (3-5 key topics/terms from the message)
8. requires_immediate_attention: boolean (true if urgent/critical)

Classification guidelines:
- Priority "urgent": Security issues, service down, data loss, angry customers
- Priority "high": Bugs affecting multiple users, time-sensitive requests
- Priority "medium": Feature requests, minor bugs, questions needing response
- Priority "low": General feedback, suggestions, non-urgent questions
- Category "spam": Obvious marketing, off-topic, or automated messages
- Category "urgent": Anything requiring immediate action regardless of type

Respond ONLY with valid JSON, no additional text.`

  try {
    if (provider === "claude") {
      const apiKey = config.apiKey || process.env.CLAUDE_API_KEY

      if (!apiKey) {
        throw new Error("Claude API key not configured")
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.content[0].text

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      throw new Error("Failed to parse AI response")
    } else if (provider === "deepseek") {
      const apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY

      if (!apiKey) {
        throw new Error("DeepSeek API key not configured")
      }

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          response_format: { type: "json_object" },
        }),
      })

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      return JSON.parse(content)
    }

    throw new Error(`Unsupported AI provider: ${provider}`)
  } catch (error) {
    console.error("[Triage] AI analysis failed:", error)
    // Return rule-based fallback
    return analyzeWithRules(content, context)
  }
}

/**
 * Rule-based triage analysis (fallback when AI is unavailable)
 */
function analyzeWithRules(content: string, context: Record<string, unknown>): TriageResult {
  const lowerContent = content.toLowerCase()

  // Urgent keywords
  const urgentKeywords = [
    "urgent",
    "asap",
    "critical",
    "down",
    "broken",
    "not working",
    "security",
    "hack",
    "breach",
    "data loss",
    "emergency",
  ]

  // Bug keywords
  const bugKeywords = ["bug", "error", "issue", "problem", "broken", "crash", "fail", "doesn't work"]

  // Question keywords
  const questionKeywords = ["how", "what", "why", "when", "where", "can i", "is it possible", "?"]

  // Feature request keywords
  const featureKeywords = ["feature", "add", "implement", "would be nice", "suggestion", "could you", "enhancement"]

  // Spam keywords
  const spamKeywords = ["buy now", "click here", "limited offer", "act now", "free money", "winner"]

  // Sentiment analysis
  const positiveWords = ["thanks", "thank you", "great", "awesome", "love", "excellent", "perfect"]
  const negativeWords = ["angry", "frustrated", "terrible", "awful", "hate", "horrible", "disappointed", "worst"]

  // Determine category and priority
  let category: TriageCategory = "general"
  let priority: TriagePriority = "medium"
  let sentiment: "positive" | "neutral" | "negative" = "neutral"
  let requiresImmediateAttention = false

  // Check for spam
  if (spamKeywords.some((keyword) => lowerContent.includes(keyword))) {
    category = "spam"
    priority = "low"
  }
  // Check for urgent
  else if (urgentKeywords.some((keyword) => lowerContent.includes(keyword))) {
    category = "urgent"
    priority = "urgent"
    requiresImmediateAttention = true
  }
  // Check for bugs
  else if (bugKeywords.some((keyword) => lowerContent.includes(keyword))) {
    category = "bug_report"
    priority = negativeWords.some((word) => lowerContent.includes(word)) ? "high" : "medium"
  }
  // Check for feature requests
  else if (featureKeywords.some((keyword) => lowerContent.includes(keyword))) {
    category = "feature_request"
    priority = "low"
  }
  // Check for questions
  else if (questionKeywords.some((keyword) => lowerContent.includes(keyword))) {
    category = "question"
    priority = "medium"
  }

  // Sentiment analysis
  if (positiveWords.some((word) => lowerContent.includes(word))) {
    sentiment = "positive"
  } else if (negativeWords.some((word) => lowerContent.includes(word))) {
    sentiment = "negative"
    if (priority === "medium") priority = "high"
  }

  // Extract keywords (simple approach)
  const words = content.split(/\s+/)
  const keywords = words
    .filter((word) => word.length > 4)
    .slice(0, 5)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))

  // Suggested actions
  const suggestedActions: string[] = []
  if (category === "urgent") {
    suggestedActions.push("Notify on-call team immediately")
    suggestedActions.push("Escalate to senior support")
  } else if (category === "bug_report") {
    suggestedActions.push("Create ticket in issue tracker")
    suggestedActions.push("Request additional details if needed")
  } else if (category === "question") {
    suggestedActions.push("Check knowledge base for answer")
    suggestedActions.push("Respond within 2 hours")
  } else if (category === "feature_request") {
    suggestedActions.push("Add to feature request backlog")
    suggestedActions.push("Thank user for feedback")
  }

  return {
    priority,
    category,
    confidence: 0.6, // Lower confidence for rule-based
    reasoning: `Rule-based classification: detected ${category} based on keywords`,
    suggested_actions: suggestedActions,
    sentiment,
    keywords,
    requires_immediate_attention: requiresImmediateAttention,
  }
}

/**
 * Triage a Slack message
 */
export async function triageMessage(
  messageId: string,
  content: string,
  context: {
    platform: string
    channel?: string
    channelId?: string
    user?: string
    userId?: string
    teamId?: string
    timestamp?: string
    metadata?: Record<string, unknown>
  },
  config: TriageConfig = {},
): Promise<TriageResult> {
  // Skip if message is too short or looks automated
  if (content.length < 10 || content.startsWith("Bot:") || content.startsWith("Automated:")) {
    return {
      priority: "low",
      category: "general",
      confidence: 0.9,
      reasoning: "Message appears to be automated or too short for triage",
      suggested_actions: [],
      sentiment: "neutral",
      keywords: [],
      requires_immediate_attention: false,
    }
  }

  // Analyze with AI (or fallback to rules)
  const result = await analyzeWithAI(content, context, config)

  // Store triage result in database
  const supabase = createAdminClient()
  if (supabase) {
    await supabase.from("triage_results").insert({
      message_id: messageId,
      platform: context.platform,
      channel_id: context.channelId,
      user_id: context.userId,
      team_id: context.teamId,
      content,
      priority: result.priority,
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning,
      suggested_actions: result.suggested_actions,
      sentiment: result.sentiment,
      keywords: result.keywords,
      assignee_suggestion: result.assignee_suggestion,
      requires_immediate_attention: result.requires_immediate_attention,
      metadata: {
        ...context.metadata,
        timestamp: context.timestamp,
      },
    })

    // If urgent and auto-response enabled, create a task
    if (result.requires_immediate_attention && config.enableAutoResponse) {
      await supabase.from("tasks").insert({
        title: `[URGENT] Slack message requires attention`,
        description: content,
        priority: "critical",
        status: "todo",
        source: "triage_bot",
        metadata: {
          message_id: messageId,
          triage_result: result,
          channel_id: context.channelId,
          user_id: context.userId,
        },
      })
    }
  }

  return result
}

/**
 * Batch triage multiple messages
 */
export async function batchTriageMessages(
  messages: Array<{
    id: string
    content: string
    context: {
      platform: string
      channel?: string
      channelId?: string
      user?: string
      userId?: string
      teamId?: string
      timestamp?: string
      metadata?: Record<string, unknown>
    }
  }>,
  config: TriageConfig = {},
): Promise<TriageResult[]> {
  const results: TriageResult[] = []

  for (const message of messages) {
    const result = await triageMessage(message.id, message.content, message.context, config)
    results.push(result)

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return results
}

/**
 * Get triage statistics
 */
export async function getTriageStats(
  filters: {
    platform?: string
    startDate?: string
    endDate?: string
  } = {},
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return null
  }

  let query = supabase.from("triage_results").select("*")

  if (filters.platform) {
    query = query.eq("platform", filters.platform)
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("[Triage] Failed to get stats:", error)
    return null
  }

  // Calculate statistics
  const total = data.length
  const byPriority = data.reduce(
    (acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const byCategory = data.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const bySentiment = data.reduce(
    (acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const urgentCount = data.filter((item) => item.requires_immediate_attention).length
  const avgConfidence = data.reduce((sum, item) => sum + item.confidence, 0) / total

  return {
    total,
    urgent: urgentCount,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    byPriority,
    byCategory,
    bySentiment,
  }
}
