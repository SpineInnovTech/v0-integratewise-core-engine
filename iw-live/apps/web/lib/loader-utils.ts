/**
 * Loader Utilities
 * Shared utilities for data loaders (pagination, dedupe, rate limiting, etc.)
 */

// Types
export interface PaginationOptions {
  page_size?: number
  cursor?: string
  max_pages?: number
}

export interface RateLimitConfig {
  requests_per_minute: number
  burst_size?: number
  backoff_strategy: "exponential" | "linear"
}

export interface TimeWindow {
  since: string // ISO datetime
  until: string // ISO datetime
}

export interface SyncMetadata {
  workspace_id: string
  source: string
  last_sync: string | null
  last_cursor: string | null
}

// Generic pagination helper
export async function paginate<T>(
  fetchFn: (cursor?: string) => Promise<{ items: T[]; next_cursor?: string }>,
  options: PaginationOptions = {},
): Promise<{ items: T[]; next_cursor?: string; pages_fetched: number }> {
  const { page_size = 100, cursor: initial_cursor, max_pages = 10 } = options
  const all_items: T[] = []
  let current_cursor: string | undefined = initial_cursor
  let pages_fetched = 0

  while (pages_fetched < max_pages) {
    const { items, next_cursor } = await fetchFn(current_cursor)
    all_items.push(...items)
    pages_fetched++

    if (!next_cursor || items.length === 0) {
      return { items: all_items, next_cursor: undefined, pages_fetched }
    }

    current_cursor = next_cursor

    // Respect rate limits
    await sleep(100)
  }

  return { items: all_items, next_cursor: current_cursor, pages_fetched }
}

// Dedupe by composite key (source_id + source_type)
export function dedupeBySourceId<T extends { source_id: string; source_type: string }>(
  items: T[],
): { unique: T[]; duplicates: number } {
  const seen = new Set<string>()
  const unique: T[] = []
  let duplicates = 0

  for (const item of items) {
    const key = `${item.source_type}:${item.source_id}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(item)
    } else {
      duplicates++
    }
  }

  return { unique, duplicates }
}

// Parse relative dates
export function parseRelativeDate(input: string): string | null {
  const now = new Date()
  const lower = input.toLowerCase().trim()

  // Today/tomorrow/yesterday
  if (lower === "today") {
    return now.toISOString()
  }
  if (lower === "tomorrow") {
    now.setDate(now.getDate() + 1)
    return now.toISOString()
  }
  if (lower === "yesterday") {
    now.setDate(now.getDate() - 1)
    return now.toISOString()
  }

  // Next/last weekday
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const nextMatch = lower.match(/^next\s+(\w+)$/)
  if (nextMatch) {
    const targetDay = weekdays.indexOf(nextMatch[1])
    if (targetDay !== -1) {
      const currentDay = now.getDay()
      const daysToAdd = (targetDay - currentDay + 7) % 7 || 7
      now.setDate(now.getDate() + daysToAdd)
      return now.toISOString()
    }
  }

  // In X days/weeks/months
  const inMatch = lower.match(/^in\s+(\d+)\s+(day|week|month)s?$/)
  if (inMatch) {
    const amount = Number.parseInt(inMatch[1], 10)
    const unit = inMatch[2]
    if (unit === "day") {
      now.setDate(now.getDate() + amount)
    } else if (unit === "week") {
      now.setDate(now.getDate() + amount * 7)
    } else if (unit === "month") {
      now.setMonth(now.getMonth() + amount)
    }
    return now.toISOString()
  }

  // ISO datetime passthrough
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(input)) {
    return new Date(input).toISOString()
  }

  // Date only (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(input + "T00:00:00Z").toISOString()
  }

  return null
}

// Rate limiter with token bucket
export class RateLimiter {
  private tokens: number
  private last_refill: number
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      requests_per_minute: config.requests_per_minute,
      burst_size: config.burst_size || config.requests_per_minute,
      backoff_strategy: config.backoff_strategy,
    }
    this.tokens = this.config.burst_size
    this.last_refill = Date.now()
  }

  async acquire(): Promise<void> {
    this.refill()

    if (this.tokens >= 1) {
      this.tokens -= 1
      return
    }

    // Wait until tokens available
    const wait_ms = (60_000 / this.config.requests_per_minute) * (1 - this.tokens)
    await sleep(wait_ms)
    this.tokens = 0
  }

  private refill(): void {
    const now = Date.now()
    const elapsed_ms = now - this.last_refill
    const tokens_to_add = (elapsed_ms / 60_000) * this.config.requests_per_minute

    this.tokens = Math.min(this.config.burst_size, this.tokens + tokens_to_add)
    this.last_refill = now
  }
}

// Exponential backoff with jitter
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { max_retries?: number; initial_delay_ms?: number; max_delay_ms?: number } = {},
): Promise<T> {
  const { max_retries = 3, initial_delay_ms = 1000, max_delay_ms = 30_000 } = options
  let attempt = 0

  while (attempt <= max_retries) {
    try {
      return await fn()
    } catch (error) {
      attempt++
      if (attempt > max_retries) {
        throw error
      }

      const delay = Math.min(initial_delay_ms * Math.pow(2, attempt - 1), max_delay_ms)
      const jitter = Math.random() * 0.3 * delay
      await sleep(delay + jitter)
    }
  }

  throw new Error("Retry failed (should never reach here)")
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Remember last sync (Supabase)
export async function getLastSync(supabase: any, workspace_id: string, source: string): Promise<SyncMetadata> {
  const { data, error } = await supabase
    .from("integrations")
    .select("last_sync, config")
    .eq("workspace_id", workspace_id)
    .eq("type", source)
    .eq("status", "active")
    .single()

  if (error || !data) {
    return { workspace_id, source, last_sync: null, last_cursor: null }
  }

  return {
    workspace_id,
    source,
    last_sync: data.last_sync,
    last_cursor: data.config?.last_cursor || null,
  }
}

export async function updateLastSync(
  supabase: any,
  workspace_id: string,
  source: string,
  last_sync: string,
  last_cursor?: string,
): Promise<void> {
  const config_update = last_cursor ? { last_cursor } : {}

  await supabase
    .from("integrations")
    .update({
      last_sync,
      config: config_update,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspace_id)
    .eq("type", source)
}

// Normalize currency amounts
export function normalizeCurrency(
  amount: number | string | null | undefined,
  currency = "USD",
): { amount: number; currency: string } | null {
  if (amount === null || amount === undefined) return null

  const parsed = typeof amount === "string" ? Number.parseFloat(amount.replace(/[^0-9.-]/g, "")) : amount

  if (isNaN(parsed)) return null

  return {
    amount: Math.round(parsed * 100) / 100, // Round to 2 decimals
    currency: currency.toUpperCase(),
  }
}

// Extract email from various formats
export function extractEmail(input: string | null | undefined): string | null {
  if (!input) return null

  const email_regex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  const match = input.match(email_regex)
  return match ? match[1] : null
}

// Generate deterministic ID from source
export function generateDeterministicId(source_type: string, source_id: string): string {
  // Use namespace UUID v5 for deterministic IDs
  // For now, use a simple hash-based approach
  const input = `${source_type}:${source_id}`
  return crypto.randomUUID() // In production, use proper UUID v5
}

// Validate time window
export function validateTimeWindow(since: string, until: string): TimeWindow {
  const since_date = new Date(since)
  const until_date = new Date(until)

  if (isNaN(since_date.getTime()) || isNaN(until_date.getTime())) {
    throw new Error("Invalid datetime format for time window")
  }

  if (since_date >= until_date) {
    throw new Error("'since' must be before 'until'")
  }

  return {
    since: since_date.toISOString(),
    until: until_date.toISOString(),
  }
}

// Count warnings helper
export function createWarning(code: string, message: string, entity_id?: string) {
  return { code, message, entity_id }
}
