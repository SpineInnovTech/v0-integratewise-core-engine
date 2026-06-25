/**
 * HubSpot Loader
 * Fetches contacts, companies, deals, and engagements from HubSpot
 * Maps to SPINE: Task (engagements), Plan (deals), Note (companies)
 */

import {
  paginate,
  dedupeBySourceId,
  withRetry,
  RateLimiter,
  createWarning,
  validateTimeWindow,
  normalizeCurrency,
} from "../loader-utils"
import { randomUUID } from "crypto"

// Inline type definitions
interface Task {
  id: string
  workspace_id: string
  source_id: string
  source_type: "hubspot"
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

interface Note {
  id: string
  workspace_id: string
  source_id: string
  source_type: "hubspot"
  title: string
  content: string
  tags?: string[]
  spine_schema_version: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  data_class: "public" | "internal" | "confidential" | "pii"
}

interface Plan {
  id: string
  workspace_id: string
  source_id: string
  source_type: "hubspot"
  title: string
  description?: string
  goals?: string[]
  tasks?: string[]
  status: "planning" | "active" | "completed" | "cancelled"
  start_date?: string
  end_date?: string
  budget?: { amount: number; currency: string }
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
    plans: Plan[]
    integrations: any[]
  }
  audit: LoaderAudit
}

export interface HubSpotLoaderOptions {
  workspace_id: string
  api_key: string
  since: string
  until: string
  cursor?: string
  page_size?: number
  max_pages?: number
}

// HubSpot API types
interface HubSpotDeal {
  id: string
  properties: {
    dealname?: string
    amount?: string
    closedate?: string
    dealstage?: string
    pipeline?: string
    hs_lastmodifieddate?: string
  }
}

interface HubSpotEngagement {
  id: string
  properties: {
    hs_timestamp?: string
    hs_engagement_type?: string
    hs_body?: string
    hs_task_subject?: string
    hs_task_status?: string
    hs_task_priority?: string
  }
}

interface HubSpotCompany {
  id: string
  properties: {
    name?: string
    domain?: string
    industry?: string
    description?: string
    hs_lastmodifieddate?: string
  }
}

// Rate limiter for HubSpot (100 requests/10 seconds)
const hubspotRateLimiter = new RateLimiter({
  requests_per_minute: 60,
  backoff_strategy: "exponential",
})

export async function loadFromHubSpot(options: HubSpotLoaderOptions): Promise<LoaderResult> {
  const { workspace_id, api_key, since, until, cursor, page_size = 100, max_pages = 10 } = options

  // Validate time window
  const time_window = validateTimeWindow(since, until)

  const warnings: LoaderAudit["warnings"] = []
  const start_time = Date.now()

  try {
    let pages_fetched = 0

    // Step 1: Fetch deals (Plans)
    await hubspotRateLimiter.acquire()
    const { items: deals, pages_fetched: deal_pages } = await paginate<HubSpotDeal>(
      async (cursor) => {
        const response = await withRetry(() => fetchHubSpotDeals(api_key, time_window, cursor))
        return response
      },
      { page_size, cursor, max_pages },
    )
    pages_fetched += deal_pages

    // Step 2: Fetch engagements (Tasks)
    await hubspotRateLimiter.acquire()
    const { items: engagements, pages_fetched: eng_pages } = await paginate<HubSpotEngagement>(
      async (cursor) => {
        const response = await withRetry(() => fetchHubSpotEngagements(api_key, time_window, cursor))
        return response
      },
      { page_size, cursor, max_pages },
    )
    pages_fetched += eng_pages

    // Step 3: Fetch companies (Notes)
    await hubspotRateLimiter.acquire()
    const { items: companies, pages_fetched: comp_pages } = await paginate<HubSpotCompany>(
      async (cursor) => {
        const response = await withRetry(() => fetchHubSpotCompanies(api_key, time_window, cursor))
        return response
      },
      { page_size, cursor, max_pages },
    )
    pages_fetched += comp_pages

    // Step 4: Transform to SPINE entities
    const spine_plans = transformDealsToPlans(deals, workspace_id)
    const spine_tasks = transformEngagementsToTasks(engagements, workspace_id)
    const spine_notes = transformCompaniesToNotes(companies, workspace_id)

    // Step 5: Dedupe
    const { unique: unique_plans, duplicates: dup_plans } = dedupeBySourceId(spine_plans)
    const { unique: unique_tasks, duplicates: dup_tasks } = dedupeBySourceId(spine_tasks)
    const { unique: unique_notes, duplicates: dup_notes } = dedupeBySourceId(spine_notes)

    const audit: LoaderAudit = {
      pages_fetched,
      items_transformed: deals.length + engagements.length + companies.length,
      items_deduped: dup_plans + dup_tasks + dup_notes,
      items_written: unique_plans.length + unique_tasks.length + unique_notes.length,
      next_cursor: cursor,
      warnings,
      duration_ms: Date.now() - start_time,
    }

    return {
      workspace_id,
      source: "hubspot",
      time_window,
      spine: {
        plans: unique_plans,
        tasks: unique_tasks,
        notes: unique_notes,
        conversations: [],
        integrations: [],
      },
      audit,
    }
  } catch (error) {
    warnings.push(createWarning("hubspot_loader_error", `Loader failed: ${error}`))

    return {
      workspace_id,
      source: "hubspot",
      time_window,
      spine: {
        plans: [],
        tasks: [],
        notes: [],
        conversations: [],
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

// Fetch HubSpot deals
async function fetchHubSpotDeals(
  api_key: string,
  time_window: { since: string; until: string },
  cursor?: string,
): Promise<{ items: HubSpotDeal[]; next_cursor?: string }> {
  const params = new URLSearchParams({
    limit: "100",
    properties: "dealname,amount,closedate,dealstage,pipeline,hs_lastmodifieddate",
  })

  if (cursor) {
    params.append("after", cursor)
  }

  const response = await fetch(`https://api.hubapi.com/crm/v3/objects/deals?${params}`, {
    headers: {
      Authorization: `Bearer ${api_key}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`)
  }

  const data = await response.json()
  const filtered = (data.results || []).filter((deal: HubSpotDeal) => {
    const lastmod = deal.properties.hs_lastmodifieddate
    if (!lastmod) return false
    const lastmod_date = new Date(lastmod)
    return lastmod_date >= new Date(time_window.since) && lastmod_date <= new Date(time_window.until)
  })

  return {
    items: filtered,
    next_cursor: data.paging?.next?.after,
  }
}

// Fetch HubSpot engagements
async function fetchHubSpotEngagements(
  api_key: string,
  time_window: { since: string; until: string },
  cursor?: string,
): Promise<{ items: HubSpotEngagement[]; next_cursor?: string }> {
  const params = new URLSearchParams({
    limit: "100",
  })

  if (cursor) {
    params.append("after", cursor)
  }

  const response = await fetch(`https://api.hubapi.com/crm/v3/objects/tasks?${params}`, {
    headers: {
      Authorization: `Bearer ${api_key}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`)
  }

  const data = await response.json()
  const filtered = (data.results || []).filter((eng: HubSpotEngagement) => {
    const ts = eng.properties.hs_timestamp
    if (!ts) return false
    const ts_date = new Date(ts)
    return ts_date >= new Date(time_window.since) && ts_date <= new Date(time_window.until)
  })

  return {
    items: filtered,
    next_cursor: data.paging?.next?.after,
  }
}

// Fetch HubSpot companies
async function fetchHubSpotCompanies(
  api_key: string,
  time_window: { since: string; until: string },
  cursor?: string,
): Promise<{ items: HubSpotCompany[]; next_cursor?: string }> {
  const params = new URLSearchParams({
    limit: "100",
    properties: "name,domain,industry,description,hs_lastmodifieddate",
  })

  if (cursor) {
    params.append("after", cursor)
  }

  const response = await fetch(`https://api.hubapi.com/crm/v3/objects/companies?${params}`, {
    headers: {
      Authorization: `Bearer ${api_key}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`)
  }

  const data = await response.json()
  const filtered = (data.results || []).filter((comp: HubSpotCompany) => {
    const lastmod = comp.properties.hs_lastmodifieddate
    if (!lastmod) return false
    const lastmod_date = new Date(lastmod)
    return lastmod_date >= new Date(time_window.since) && lastmod_date <= new Date(time_window.until)
  })

  return {
    items: filtered,
    next_cursor: data.paging?.next?.after,
  }
}

// Transform HubSpot deals to SPINE Plans
function transformDealsToPlans(deals: HubSpotDeal[], workspace_id: string): Plan[] {
  return deals.map((deal) => {
    const amount_parsed = normalizeCurrency(deal.properties.amount)

    return {
      id: randomUUID(),
      workspace_id,
      source_id: deal.id,
      source_type: "hubspot",
      title: deal.properties.dealname || "Untitled Deal",
      description: `Pipeline: ${deal.properties.pipeline || "Unknown"}`,
      goals: [],
      tasks: [],
      status: mapDealStageToStatus(deal.properties.dealstage),
      end_date: deal.properties.closedate,
      budget: amount_parsed ? { amount: amount_parsed, currency: "USD" } : undefined,
      spine_schema_version: "1.0.0",
      created_at: new Date().toISOString(),
      updated_at: deal.properties.hs_lastmodifieddate || new Date().toISOString(),
      metadata: {
        raw: deal,
      },
      data_class: "internal",
    }
  })
}

// Transform HubSpot engagements to SPINE Tasks
function transformEngagementsToTasks(engagements: HubSpotEngagement[], workspace_id: string): Task[] {
  return engagements.map((eng) => ({
    id: randomUUID(),
    workspace_id,
    source_id: eng.id,
    source_type: "hubspot",
    title: eng.properties.hs_task_subject || "Untitled Task",
    description: eng.properties.hs_body,
    status: mapTaskStatus(eng.properties.hs_task_status),
    priority: mapTaskPriority(eng.properties.hs_task_priority),
    tags: ["hubspot", eng.properties.hs_engagement_type || "task"],
    spine_schema_version: "1.0.0",
    created_at: eng.properties.hs_timestamp || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      raw: eng,
    },
    data_class: "internal",
  }))
}

// Transform HubSpot companies to SPINE Notes
function transformCompaniesToNotes(companies: HubSpotCompany[], workspace_id: string): Note[] {
  return companies.map((comp) => ({
    id: randomUUID(),
    workspace_id,
    source_id: comp.id,
    source_type: "hubspot",
    title: comp.properties.name || "Untitled Company",
    content:
      comp.properties.description ||
      `Company: ${comp.properties.name}\nDomain: ${comp.properties.domain || "N/A"}\nIndustry: ${comp.properties.industry || "N/A"}`,
    tags: ["hubspot", "company", comp.properties.industry || "general"],
    spine_schema_version: "1.0.0",
    created_at: new Date().toISOString(),
    updated_at: comp.properties.hs_lastmodifieddate || new Date().toISOString(),
    metadata: {
      raw: comp,
    },
    data_class: "internal",
  }))
}

// Map HubSpot deal stage to SPINE status
function mapDealStageToStatus(stage?: string): Plan["status"] {
  if (!stage) return "planning"
  const lower = stage.toLowerCase()
  if (lower.includes("closed") || lower.includes("won")) return "completed"
  if (lower.includes("lost")) return "cancelled"
  return "active"
}

// Map HubSpot task status
function mapTaskStatus(status?: string): Task["status"] {
  if (!status) return "todo"
  const lower = status.toLowerCase()
  if (lower.includes("complete") || lower.includes("done")) return "done"
  if (lower.includes("progress")) return "in_progress"
  return "todo"
}

// Map HubSpot task priority
function mapTaskPriority(priority?: string): Task["priority"] {
  if (!priority) return "medium"
  const lower = priority.toLowerCase()
  if (lower.includes("high") || lower.includes("urgent")) return "high"
  if (lower.includes("low")) return "low"
  return "medium"
}
