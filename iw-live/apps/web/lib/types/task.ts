export type TaskScope = "personal" | "team" | "business" | "customer"
export type TaskSource = "manual" | "brainstorming" | "slack" | "asana" | "jira" | "hubspot" | "notion" | "gmail"

export interface Task {
  task_id: string
  title: string
  description?: string
  status: "todo" | "in_progress" | "done" | "blocked"
  priority: "low" | "medium" | "high" | "urgent"

  // Scope determines which view(s) can see this task
  scope: TaskScope

  // Ownership
  owner_user_id: string
  team_id?: string | null
  project_id?: string | null
  client_id?: string | null

  // Source tracking for sync
  source: TaskSource
  source_ref?: string | null // External system pointer

  // Visibility ACL
  visibility_acl: string[] // User IDs who can see/edit

  // Dates
  due_date?: string | null
  created_at: string
  updated_at: string

  // Relationships (not copies)
  depends_on?: string[] // Task IDs this blocks
  blocked_by?: string[] // Task IDs blocking this
  milestone_id?: string | null // Shared milestone
}

// Task with view-specific computed fields
export interface TaskWithView extends Task {
  // Computed based on current view
  view_label?: string // "My Task" vs "Team Task" etc.
  can_edit: boolean
  is_handoff: boolean // CS → Engineering handoff
  handoff_status?: "pending" | "accepted" | "completed"
}

// Filter tasks by view mode
export function filterTasksByView(
  tasks: Task[],
  viewMode: "personal" | "work" | "team" | "business",
  userId: string,
): Task[] {
  switch (viewMode) {
    case "personal":
      return tasks.filter((t) => t.scope === "personal" && t.owner_user_id === userId)
    case "work":
      return tasks.filter(
        (t) =>
          (t.scope === "personal" || t.scope === "business") &&
          (t.owner_user_id === userId || t.visibility_acl.includes(userId)),
      )
    case "team":
      return tasks.filter(
        (t) => t.scope === "team" && (t.owner_user_id === userId || t.visibility_acl.includes(userId)),
      )
    case "business":
      return tasks // Business view sees all tasks
    default:
      return tasks
  }
}
