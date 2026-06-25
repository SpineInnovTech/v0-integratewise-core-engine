/**
 * Notion Loader
 * Fetches databases and pages from Notion
 * Maps to SPINE: Task (database rows with status/priority), Note (pages/docs)
 */

import { paginate, dedupeBySourceId, RateLimiter, createWarning, validateTimeWindow } from "../loader-utils"
import { randomUUID } from "crypto"
import { Client } from "@notionhq/client"

// Inline type definitions
interface Task {
  id: string
  workspace_id: string
  source_id: string
  source_type: "notion"
  title: string
  description?: string
  status: "todo" | "in_progress" | "done" | "blocked"
  priority: "low" | "medium" | "high" | "critical"
  due_date?: string
  tags?: string[]
  spine_schema_version: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  data_class: "public" | "internal" | "confidential" | "pii"
}

interface Note {
  id: string
  workspace_id: string
  source_id: string
  source_type: "notion"
  title: string
  content: string
  tags?: string[]
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
    notes: Note[]
    conversations: any[]
    plans: any[]
    integrations: any[]
  }
  audit: LoaderAudit
}

// Rate limiter for Notion (3 requests/second)
const notionRateLimiter = new RateLimiter({
  requests_per_minute: 180,
  backoff_strategy: "exponential",
})

export async function loadFromNotion(options: any): Promise<LoaderResult> {
  const {
    workspace_id,
    notion_token,
    database_ids = [],
    since,
    until,
    cursor,
    page_size = 100,
    max_pages = 10,
  } = options

  const time_window = validateTimeWindow(since, until)
  const warnings: LoaderAudit["warnings"] = []
  const start_time = Date.now()

  try {
    const notion = new Client({ auth: notion_token })
    let pages_fetched = 0

    const all_tasks: Task[] = []
    const all_notes: Note[] = []

    // Fetch from each database
    for (const db_id of database_ids) {
      await notionRateLimiter.acquire()

      try {
        const { items, pages_fetched: db_pages } = await paginate(
          async (cursor) => {
            const response = await notion.databases.query({
              database_id: db_id,
              start_cursor: cursor,
              page_size,
            })

            return {
              items: response.results,
              next_cursor: response.next_cursor || undefined,
            }
          },
          { cursor, max_pages },
        )

        pages_fetched += db_pages

        // Transform based on schema detection
        for (const page of items) {
          if ("properties" in page) {
            const entity = await transformNotionPage(page as any, workspace_id, notion)

            if (entity.type === "task") {
              all_tasks.push(entity.data as Task)
            } else {
              all_notes.push(entity.data as Note)
            }
          }
        }
      } catch (error) {
        warnings.push(createWarning("notion_db_error", `Failed to fetch database ${db_id}: ${error}`, db_id))
      }
    }

    // Dedupe
    const { unique: unique_tasks, duplicates: dup_tasks } = dedupeBySourceId(all_tasks)
    const { unique: unique_notes, duplicates: dup_notes } = dedupeBySourceId(all_notes)

    const audit: LoaderAudit = {
      pages_fetched,
      items_transformed: all_tasks.length + all_notes.length,
      items_deduped: dup_tasks + dup_notes,
      items_written: unique_tasks.length + unique_notes.length,
      next_cursor: cursor,
      warnings,
      duration_ms: Date.now() - start_time,
    }

    return {
      workspace_id,
      source: "notion",
      time_window,
      spine: {
        tasks: unique_tasks,
        notes: unique_notes,
        conversations: [],
        plans: [],
        integrations: [],
      },
      audit,
    }
  } catch (error) {
    warnings.push(createWarning("notion_loader_error", `Loader failed: ${error}`))

    return {
      workspace_id,
      source: "notion",
      time_window,
      spine: {
        tasks: [],
        notes: [],
        conversations: [],
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

// Transform Notion page to SPINE entity (Task or Note)
async function transformNotionPage(
  page: any,
  workspace_id: string,
  notion: Client,
): Promise<{ type: "task" | "note"; data: Task | Note }> {
  const props = page.properties
  const has_status = Object.keys(props).some((k) => k.toLowerCase().includes("status"))
  const has_priority = Object.keys(props).some((k) => k.toLowerCase().includes("priority"))

  // If has status/priority fields, treat as Task
  if (has_status || has_priority) {
    const title_prop = props.Name || props.Title || props.name || props.title
    const title = extractText(title_prop) || "Untitled Task"

    const status_prop = Object.values(props).find((p: any) => p.type === "status")
    const priority_prop = Object.values(props).find((p: any) => p.type === "select")
    const due_date_prop = Object.values(props).find((p: any) => p.type === "date")

    return {
      type: "task",
      data: {
        id: randomUUID(),
        workspace_id,
        source_id: page.id,
        source_type: "notion",
        title,
        status: mapNotionStatus(status_prop),
        priority: mapNotionPriority(priority_prop),
        due_date: due_date_prop?.date?.start,
        tags: ["notion"],
        spine_schema_version: "1.0.0",
        created_at: page.created_time,
        updated_at: page.last_edited_time,
        metadata: { raw: page },
        data_class: "internal",
      },
    }
  }

  // Otherwise, treat as Note
  const title_prop = props.Name || props.Title || props.name || props.title
  const title = extractText(title_prop)

  // Fetch page content
  let content = ""
  try {
    const blocks = await notion.blocks.children.list({ block_id: page.id })
    content = blocks.results
      .map((block: any) => {
        if (block.type === "paragraph") {
          return extractText(block.paragraph)
        }
        return ""
      })
      .join("\n")
  } catch {
    content = "Content unavailable"
  }

  return {
    type: "note",
    data: {
      id: randomUUID(),
      workspace_id,
      source_id: page.id,
      source_type: "notion",
      title,
      content: content || title || "Untitled Note",
      tags: ["notion"],
      spine_schema_version: "1.0.0",
      created_at: page.created_time,
      updated_at: page.last_edited_time,
      metadata: { raw: page },
      data_class: "internal",
    },
  }
}

// Extract text from Notion rich text
function extractText(prop: any): string {
  if (!prop) return ""
  if (prop.rich_text) {
    return prop.rich_text.map((rt: any) => rt.plain_text).join("")
  }
  if (prop.title) {
    return prop.title.map((t: any) => t.plain_text).join("")
  }
  return ""
}

// Map Notion status to SPINE status
function mapNotionStatus(status_prop: any): Task["status"] {
  if (!status_prop?.status?.name) return "todo"
  const lower = status_prop.status.name.toLowerCase()
  if (lower.includes("done") || lower.includes("complete")) return "done"
  if (lower.includes("progress") || lower.includes("doing")) return "in_progress"
  if (lower.includes("block")) return "blocked"
  return "todo"
}

// Map Notion priority to SPINE priority
function mapNotionPriority(priority_prop: any): Task["priority"] {
  if (!priority_prop?.select?.name) return "medium"
  const lower = priority_prop.select.name.toLowerCase()
  if (lower.includes("high") || lower.includes("urgent")) return "high"
  if (lower.includes("critical")) return "critical"
  if (lower.includes("low")) return "low"
  return "medium"
}
