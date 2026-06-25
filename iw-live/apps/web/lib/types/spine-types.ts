/**
 * SPINE Types - Local type definitions
 * These types were moved from @iw/types to avoid zod dependency issues
 */

// Core SPINE entity types
export interface Task {
  id?: string
  workspace_id: string
  source_id: string
  source_type: string
  title: string
  description?: string
  status: "open" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "critical"
  due_date?: string
  assignee_id?: string
  assignee_name?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface Note {
  id?: string
  workspace_id: string
  source_id: string
  source_type: string
  title: string
  content: string
  content_type: "text" | "markdown" | "html"
  author_id?: string
  author_name?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface Conversation {
  id?: string
  workspace_id: string
  source_id: string
  source_type: string
  title?: string
  channel_id?: string
  channel_name?: string
  participants: Participant[]
  messages: Message[]
  message_count: number
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface Participant {
  id: string
  name: string
  email?: string
  avatar_url?: string
}

export interface Message {
  id: string
  author_id: string
  author_name: string
  content: string
  timestamp: string
  reactions?: Reaction[]
  attachments?: Attachment[]
}

export interface Reaction {
  emoji: string
  count: number
  users: string[]
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size?: number
}

export interface Plan {
  id?: string
  workspace_id: string
  source_id: string
  source_type: string
  title: string
  description?: string
  status: "draft" | "active" | "completed" | "archived"
  start_date?: string
  end_date?: string
  goals: Goal[]
  owner_id?: string
  owner_name?: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface Goal {
  id: string
  title: string
  description?: string
  status: "not_started" | "in_progress" | "completed"
  progress?: number
  due_date?: string
}

export interface Integration {
  id: string
  workspace_id: string
  type: string
  name: string
  status: "active" | "inactive" | "error"
  config?: Record<string, unknown>
  last_sync?: string
  error_count?: number
  last_error?: string
  created_at?: string
  updated_at?: string
}

export interface Approval {
  id: string
  workspace_id: string
  entity_type: "task" | "note" | "plan" | "artifact"
  entity_id: string
  status: "pending" | "approved" | "rejected"
  requested_by: string
  requested_at: string
  reviewed_by?: string
  reviewed_at?: string
  comments?: string
}

// Loader types
export interface LoaderResult {
  spine: {
    tasks: Task[]
    notes: Note[]
    conversations: Conversation[]
    plans: Plan[]
  }
  audit: LoaderAudit
}

export interface LoaderAudit {
  source: string
  pages_fetched: number
  items_transformed: number
  items_deduped: number
  warnings: string[]
  duration_ms: number
  cursor?: string
}

// SPINE Event types
export interface SpineEvent {
  id: string
  source: "stripe" | "slack" | "discord" | "notion" | "attio" | "github" | "custom"
  type: string
  timestamp: string
  payload: Record<string, unknown>
  metadata?: {
    raw_event_id?: string
    workspace_id?: string
    user_id?: string
  }
}

export interface ActionRequest {
  id: string
  type: string
  priority: "low" | "medium" | "high" | "critical"
  payload: Record<string, unknown>
  source_event_id?: string
  created_at: string
}
