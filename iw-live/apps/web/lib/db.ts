/**
 * Database Layer for SPINE Entities
 * Idempotent upserts and queries for SPINE data
 */

import { createClient } from "@/lib/supabase/server"
import type { Task, Note, Conversation, Plan } from "@/lib/types/spine-types"

// Upsert Task (idempotent by source_id + source_type)
export async function upsertTask(task: Task): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.from("spine_tasks").upsert(
    {
      ...task,
      metadata: task.metadata as any, // Type assertion for JSONB
    },
    {
      onConflict: "source_id,source_type",
      ignoreDuplicates: false,
    },
  )

  if (error) {
    console.error("[DB] Failed to upsert task:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Upsert Note
export async function upsertNote(note: Note): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.from("spine_notes").upsert(
    {
      ...note,
      metadata: note.metadata as any,
    },
    {
      onConflict: "source_id,source_type",
      ignoreDuplicates: false,
    },
  )

  if (error) {
    console.error("[DB] Failed to upsert note:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Upsert Conversation
export async function upsertConversation(conversation: Conversation): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.from("spine_conversations").upsert(
    {
      ...conversation,
      metadata: conversation.metadata as any,
      participants: conversation.participants as any,
      messages: conversation.messages as any,
    },
    {
      onConflict: "source_id,source_type",
      ignoreDuplicates: false,
    },
  )

  if (error) {
    console.error("[DB] Failed to upsert conversation:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Upsert Plan
export async function upsertPlan(plan: Plan): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.from("spine_plans").upsert(
    {
      ...plan,
      metadata: plan.metadata as any,
      goals: plan.goals as any,
    },
    {
      onConflict: "source_id,source_type",
      ignoreDuplicates: false,
    },
  )

  if (error) {
    console.error("[DB] Failed to upsert plan:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Batch upsert for performance
export async function batchUpsertTasks(
  tasks: Task[],
): Promise<{ success: boolean; written: number; errors: string[] }> {
  const results = await Promise.allSettled(tasks.map((task) => upsertTask(task)))

  const errors: string[] = []
  let written = 0

  results.forEach((result, idx) => {
    if (result.status === "fulfilled" && result.value.success) {
      written++
    } else if (result.status === "rejected" || !result.value.success) {
      errors.push(`Task ${idx}: ${result.status === "rejected" ? result.reason : result.value.error}`)
    }
  })

  return {
    success: errors.length === 0,
    written,
    errors,
  }
}

export async function batchUpsertNotes(
  notes: Note[],
): Promise<{ success: boolean; written: number; errors: string[] }> {
  const results = await Promise.allSettled(notes.map((note) => upsertNote(note)))

  const errors: string[] = []
  let written = 0

  results.forEach((result, idx) => {
    if (result.status === "fulfilled" && result.value.success) {
      written++
    } else if (result.status === "rejected" || !result.value.success) {
      errors.push(`Note ${idx}: ${result.status === "rejected" ? result.reason : result.value.error}`)
    }
  })

  return {
    success: errors.length === 0,
    written,
    errors,
  }
}

export async function batchUpsertConversations(
  conversations: Conversation[],
): Promise<{ success: boolean; written: number; errors: string[] }> {
  const results = await Promise.allSettled(conversations.map((conv) => upsertConversation(conv)))

  const errors: string[] = []
  let written = 0

  results.forEach((result, idx) => {
    if (result.status === "fulfilled" && result.value.success) {
      written++
    } else if (result.status === "rejected" || !result.value.success) {
      errors.push(`Conversation ${idx}: ${result.status === "rejected" ? result.reason : result.value.error}`)
    }
  })

  return {
    success: errors.length === 0,
    written,
    errors,
  }
}

export async function batchUpsertPlans(
  plans: Plan[],
): Promise<{ success: boolean; written: number; errors: string[] }> {
  const results = await Promise.allSettled(plans.map((plan) => upsertPlan(plan)))

  const errors: string[] = []
  let written = 0

  results.forEach((result, idx) => {
    if (result.status === "fulfilled" && result.value.success) {
      written++
    } else if (result.status === "rejected" || !result.value.success) {
      errors.push(`Plan ${idx}: ${result.status === "rejected" ? result.reason : result.value.error}`)
    }
  })

  return {
    success: errors.length === 0,
    written,
    errors,
  }
}

// Query helpers
export async function getTasksByWorkspace(workspace_id: string, limit = 50) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("spine_tasks")
    .select("*")
    .eq("workspace_id", workspace_id)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[DB] Failed to fetch tasks:", error)
    return []
  }

  return data || []
}

export async function getNotesByWorkspace(workspace_id: string, limit = 50) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("spine_notes")
    .select("*")
    .eq("workspace_id", workspace_id)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[DB] Failed to fetch notes:", error)
    return []
  }

  return data || []
}
