/**
 * Gmail Loader
 * Fetches email threads and messages from Gmail
 * Maps to SPINE: Conversation (threads), Task ("Action Required" subjects)
 */

import { createWarning, validateTimeWindow } from "../loader-utils"

// Inline type definitions
interface Task {
  id: string
  workspace_id: string
  source_id: string
  source_type: string
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
  source_type: string
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

export interface GmailLoaderOptions {
  workspace_id: string
  access_token: string
  since: string
  until: string
  max_results?: number
}

export async function loadFromGmail(options: GmailLoaderOptions): Promise<LoaderResult> {
  const { workspace_id, access_token, since, until, max_results = 100 } = options

  const time_window = validateTimeWindow(since, until)
  const warnings: LoaderAudit["warnings"] = []
  const start_time = Date.now()

  // Simplified placeholder implementation
  // In production, use Gmail API client
  warnings.push(createWarning("gmail_not_implemented", "Gmail loader not fully implemented - placeholder only"))

  return {
    workspace_id,
    source: "gmail",
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
