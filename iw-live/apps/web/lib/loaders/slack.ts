/**
 * Slack Loader
 * Fetches conversations, messages, and tasks from Slack
 * Maps to SPINE: Conversation, Task (from todo: lines)
 */

import { paginate, dedupeBySourceId, withRetry, RateLimiter, createWarning, validateTimeWindow } from "../loader-utils"
import { randomUUID } from "crypto"

// Inline type definitions
const SPINE_SCHEMA_VERSION = "1.0.0"

interface Task {
  id: string
  workspace_id: string
  source_id: string
  source_type: "slack"
  title: string
  description?: string
  status: "todo" | "in_progress" | "done" | "blocked"
  priority: "low" | "medium" | "high" | "critical"
  tags?: string[]
  spine_schema_version: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  data_class: "public" | "internal" | "confidential" | "pii"
}

interface Conversation {
  id: string
  workspace_id: string
  source_id: string
  source_type: "slack"
  channel_name?: string
  participants: Array<{ user_id?: string; email?: string; name?: string }>
  messages: Array<{
    message_id: string
    sender_id?: string
    sender_email?: string
    content: string
    timestamp: string
    thread_id?: string
    reactions?: Array<{ emoji: string; count: number }>
  }>
  spine_schema_version: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  data_class: "public" | "internal" | "confidential" | "pii"
}

interface LoaderAudit {
  pages_fetched: number
  items_transformed: number
  items_deduped: number
  items_written: number
  next_cursor?: string
  warnings: Array<{ code: string; message: string; entity_id?: string }>
  duration_ms: number
}

interface LoaderResult {
  workspace_id: string
  source: string
  time_window: { since: string; until: string }
  spine: {
    tasks: Task[]
    notes: any[]
    conversations: Conversation[]
    plans: any[]
    integrations: any[]
  }
  audit: LoaderAudit
}

export interface SlackLoaderOptions {
  workspace_id: string
  bot_token: string
  since: string
  until: string
  cursor?: string
  page_size?: number
  max_pages?: number
}

// Slack API types
interface SlackMessage {
  ts: string
  user?: string
  text: string
  thread_ts?: string
  reactions?: Array<{ name: string; count: number }>
}

interface SlackConversation {
  id: string
  name: string
  is_channel: boolean
  is_private: boolean
}

// Rate limiter for Slack (Tier 3: 50 requests/minute)
const slackRateLimiter = new RateLimiter({
  requests_per_minute: 50,
  backoff_strategy: "exponential",
})

export async function loadFromSlack(options: SlackLoaderOptions): Promise<LoaderResult> {
  const { workspace_id, bot_token, since, until, cursor, page_size = 100, max_pages = 10 } = options

  // Validate time window
  const time_window = validateTimeWindow(since, until)

  const warnings: LoaderAudit["warnings"] = []
  const start_time = Date.now()

  try {
    // Step 1: Fetch conversations (channels)
    const conversations = await fetchSlackConversations(bot_token)

    // Step 2: Fetch messages for each conversation
    const all_messages: SlackMessage[] = []
    let pages_fetched = 0

    for (const conv of conversations) {
      try {
        await slackRateLimiter.acquire()

        const { items, pages_fetched: conv_pages } = await paginate<SlackMessage>(
          async (cursor) => {
            const response = await withRetry(() => fetchSlackMessages(bot_token, conv.id, time_window, cursor))
            return response
          },
          { page_size, cursor, max_pages },
        )

        all_messages.push(...items)
        pages_fetched += conv_pages
      } catch (error) {
        warnings.push(
          createWarning("slack_fetch_error", `Failed to fetch messages from channel ${conv.name}: ${error}`, conv.id),
        )
      }
    }

    // Step 3: Transform to SPINE entities
    const spine_conversations = await transformToConversations(all_messages, conversations, workspace_id)
    const spine_tasks = extractTasksFromMessages(all_messages, workspace_id)

    // Step 4: Dedupe
    const { unique: unique_conversations, duplicates: dup_convs } = dedupeBySourceId(spine_conversations)
    const { unique: unique_tasks, duplicates: dup_tasks } = dedupeBySourceId(spine_tasks)

    const audit: LoaderAudit = {
      pages_fetched,
      items_transformed: all_messages.length,
      items_deduped: dup_convs + dup_tasks,
      items_written: unique_conversations.length + unique_tasks.length,
      next_cursor: cursor,
      warnings,
      duration_ms: Date.now() - start_time,
    }

    return {
      workspace_id,
      source: "slack",
      time_window,
      spine: {
        conversations: unique_conversations,
        tasks: unique_tasks,
        notes: [],
        plans: [],
        integrations: [],
      },
      audit,
    }
  } catch (error) {
    warnings.push(createWarning("slack_loader_error", `Loader failed: ${error}`))

    return {
      workspace_id,
      source: "slack",
      time_window,
      spine: {
        conversations: [],
        tasks: [],
        notes: [],
        plans: [],
        integrations: [],
      },
      audit: {
        pages_fetched: 0,
        items_transformed: 0,
        items_deduped: 0,
        items_written: 0,
        warnings,
        duration_ms: Date.now() - start_time,
      },
    }
  }
}

// Fetch Slack conversations (channels)
async function fetchSlackConversations(bot_token: string): Promise<SlackConversation[]> {
  const response = await fetch("https://slack.com/api/conversations.list", {
    headers: {
      Authorization: `Bearer ${bot_token}`,
      "Content-Type": "application/json",
    },
  })

  const data = await response.json()
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }

  return data.channels || []
}

// Fetch Slack messages for a channel
async function fetchSlackMessages(
  bot_token: string,
  channel_id: string,
  time_window: { since: string; until: string },
  cursor?: string,
): Promise<{ items: SlackMessage[]; next_cursor?: string }> {
  const params = new URLSearchParams({
    channel: channel_id,
    oldest: (new Date(time_window.since).getTime() / 1000).toString(),
    latest: (new Date(time_window.until).getTime() / 1000).toString(),
    limit: "100",
  })

  if (cursor) {
    params.append("cursor", cursor)
  }

  const response = await fetch(`https://slack.com/api/conversations.history?${params}`, {
    headers: {
      Authorization: `Bearer ${bot_token}`,
      "Content-Type": "application/json",
    },
  })

  const data = await response.json()
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }

  return {
    items: data.messages || [],
    next_cursor: data.response_metadata?.next_cursor,
  }
}

// Transform Slack messages to SPINE Conversations
async function transformToConversations(
  messages: SlackMessage[],
  conversations: SlackConversation[],
  workspace_id: string,
): Promise<Conversation[]> {
  // Group messages by thread or channel
  const grouped = new Map<string, SlackMessage[]>()

  for (const msg of messages) {
    const key = msg.thread_ts || msg.ts
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(msg)
  }

  return Array.from(grouped.entries()).map(([thread_id, thread_messages]) => {
    const first_msg = thread_messages[0]
    const channel = conversations.find((c) => c.id === first_msg.user) // Simplified

    return {
      id: randomUUID(),
      workspace_id,
      source_id: thread_id,
      source_type: "slack",
      channel_name: channel?.name,
      participants: thread_messages
        .map((m) => ({
          user_id: m.user,
          email: undefined,
          name: undefined,
        }))
        .filter((p, i, arr) => arr.findIndex((a) => a.user_id === p.user_id) === i),
      messages: thread_messages.map((m) => ({
        message_id: m.ts,
        sender_id: m.user,
        sender_email: undefined,
        content: m.text,
        timestamp: new Date(Number.parseFloat(m.ts) * 1000).toISOString(),
        thread_id: m.thread_ts,
        reactions: m.reactions?.map((r) => ({ emoji: r.name, count: r.count })),
      })),
      spine_schema_version: SPINE_SCHEMA_VERSION,
      created_at: new Date(Number.parseFloat(first_msg.ts) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        raw: thread_messages,
      },
      data_class: "confidential",
    }
  })
}

// Extract tasks from "todo:" lines in Slack messages
function extractTasksFromMessages(messages: SlackMessage[], workspace_id: string): Task[] {
  const tasks: Task[] = []

  for (const msg of messages) {
    const todo_regex = /todo:\s*(.+)/gi
    let match

    while ((match = todo_regex.exec(msg.text)) !== null) {
      const title = match[1].trim()
      if (title) {
        tasks.push({
          id: randomUUID(),
          workspace_id,
          source_id: `${msg.ts}_todo_${tasks.length}`,
          source_type: "slack",
          title,
          status: "todo",
          priority: "medium",
          tags: ["slack", "extracted"],
          spine_schema_version: SPINE_SCHEMA_VERSION,
          created_at: new Date(Number.parseFloat(msg.ts) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            raw: { original_message: msg },
          },
          data_class: "internal",
        })
      }
    }
  }

  return tasks
}
