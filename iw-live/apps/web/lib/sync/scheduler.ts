/**
 * Sync Scheduler Service
 * Manages recurring sync schedules based on membership plans
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export interface SyncScheduleConfig {
  workspaceId: string
  connectorId: string
  scheduleType: "manual" | "hourly" | "daily" | "weekly" | "monthly"
  scheduleTime?: string // HH:MM format
  scheduleDay?: number // Day of week (0-6) or day of month (1-31)
  timezone?: string
  syncConfig: {
    syncType: "incremental" | "full"
    lookbackDays?: number
    entities: Record<string, boolean>
    filters?: Record<string, any>
  }
  membershipTier: "free" | "starter" | "growth" | "scale" | "enterprise"
}

/**
 * Plan-based frequency limits
 */
const PLAN_LIMITS = {
  free: {
    maxConnectors: 1,
    allowedFrequencies: ["manual"],
    maxRecordsPerSync: 100,
  },
  starter: {
    maxConnectors: 3,
    allowedFrequencies: ["manual", "weekly"],
    maxRecordsPerSync: 1000,
  },
  growth: {
    maxConnectors: 10,
    allowedFrequencies: ["manual", "daily", "weekly"],
    maxRecordsPerSync: 10000,
  },
  scale: {
    maxConnectors: 25,
    allowedFrequencies: ["manual", "hourly", "daily", "weekly"],
    maxRecordsPerSync: 50000,
  },
  enterprise: {
    maxConnectors: Infinity,
    allowedFrequencies: ["manual", "hourly", "daily", "weekly", "monthly"],
    maxRecordsPerSync: Infinity,
  },
}

/**
 * Create or update sync schedule
 */
export async function createSyncSchedule(
  supabase: SupabaseClient,
  config: SyncScheduleConfig
): Promise<string> {
  const limits = PLAN_LIMITS[config.membershipTier]

  // Validate frequency is allowed for plan
  if (!limits.allowedFrequencies.includes(config.scheduleType)) {
    throw new Error(
      `Schedule type '${config.scheduleType}' not allowed for ${config.membershipTier} plan. Allowed: ${limits.allowedFrequencies.join(", ")}`
    )
  }

  // Check connector count limit
  const { data: existingSchedules } = await supabase
    .from("sync_schedules")
    .select("connector_id")
    .eq("workspace_id", config.workspaceId)
    .eq("enabled", true)

  const uniqueConnectors = new Set(existingSchedules?.map((s) => s.connector_id) || [])
  if (!uniqueConnectors.has(config.connectorId)) {
    uniqueConnectors.add(config.connectorId)
  }

  if (uniqueConnectors.size > limits.maxConnectors) {
    throw new Error(
      `Maximum ${limits.maxConnectors} connectors allowed for ${config.membershipTier} plan`
    )
  }

  // Calculate next run time
  const nextRunAt = calculateNextRunTime(
    config.scheduleType,
    config.scheduleTime,
    config.scheduleDay,
    config.timezone
  )

  // Check if schedule already exists
  const { data: existing } = await supabase
    .from("sync_schedules")
    .select("sync_schedule_id")
    .eq("workspace_id", config.workspaceId)
    .eq("connector_id", config.connectorId)
    .single()

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("sync_schedules")
      .update({
        schedule_type: config.scheduleType,
        schedule_time: config.scheduleTime || null,
        schedule_day: config.scheduleDay || null,
        timezone: config.timezone || "UTC",
        sync_config: config.syncConfig,
        membership_tier: config.membershipTier,
        allowed_frequencies: limits.allowedFrequencies,
        next_run_at: nextRunAt,
        enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("sync_schedule_id", existing.sync_schedule_id)
      .select()
      .single()

    if (error) throw error
    return data.sync_schedule_id
  } else {
    // Create new
    const { data, error } = await supabase
      .from("sync_schedules")
      .insert({
        workspace_id: config.workspaceId,
        connector_id: config.connectorId,
        schedule_type: config.scheduleType,
        schedule_time: config.scheduleTime || null,
        schedule_day: config.scheduleDay || null,
        timezone: config.timezone || "UTC",
        sync_config: config.syncConfig,
        membership_tier: config.membershipTier,
        allowed_frequencies: limits.allowedFrequencies,
        next_run_at: nextRunAt,
        enabled: true,
      })
      .select()
      .single()

    if (error) throw error
    return data.sync_schedule_id
  }
}

/**
 * Calculate next run time based on schedule
 */
function calculateNextRunTime(
  scheduleType: string,
  scheduleTime?: string,
  scheduleDay?: number,
  timezone: string = "UTC"
): string {
  const now = new Date()

  switch (scheduleType) {
    case "manual":
      return now.toISOString() // Manual schedules don't auto-run

    case "hourly":
      // Next hour
      now.setHours(now.getHours() + 1)
      now.setMinutes(0)
      now.setSeconds(0)
      return now.toISOString()

    case "daily":
      // Next day at specified time
      const [hours, minutes] = scheduleTime ? scheduleTime.split(":").map(Number) : [2, 0]
      now.setDate(now.getDate() + 1)
      now.setHours(hours)
      now.setMinutes(minutes)
      now.setSeconds(0)
      return now.toISOString()

    case "weekly":
      // Next week on specified day
      const targetDay = scheduleDay !== undefined ? scheduleDay : 1 // Monday default
      const currentDay = now.getDay()
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7
      now.setDate(now.getDate() + daysUntilTarget)
      const [weekHours, weekMinutes] = scheduleTime ? scheduleTime.split(":").map(Number) : [2, 0]
      now.setHours(weekHours)
      now.setMinutes(weekMinutes)
      now.setSeconds(0)
      return now.toISOString()

    case "monthly":
      // Next month on specified day
      now.setMonth(now.getMonth() + 1)
      if (scheduleDay) {
        now.setDate(scheduleDay)
      }
      const [monthHours, monthMinutes] = scheduleTime ? scheduleTime.split(":").map(Number) : [2, 0]
      now.setHours(monthHours)
      now.setMinutes(monthMinutes)
      now.setSeconds(0)
      return now.toISOString()

    default:
      return now.toISOString()
  }
}

/**
 * Get schedules ready to run
 */
export async function getSchedulesReadyToRun(supabase: SupabaseClient): Promise<any[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("sync_schedules")
    .select("*")
    .eq("enabled", true)
    .lte("next_run_at", now)
    .neq("schedule_type", "manual")
    .order("next_run_at", { ascending: true })

  if (error) {
    console.error("Failed to get schedules ready to run:", error)
    return []
  }

  return data || []
}

/**
 * Update schedule after run
 */
export async function updateScheduleAfterRun(
  supabase: SupabaseClient,
  scheduleId: string,
  status: "success" | "partial" | "failed" | "skipped",
  jobId?: string
): Promise<void> {
  const schedule = await supabase
    .from("sync_schedules")
    .select("*")
    .eq("sync_schedule_id", scheduleId)
    .single()

  if (!schedule.data) return

  const nextRunAt = calculateNextRunTime(
    schedule.data.schedule_type,
    schedule.data.schedule_time,
    schedule.data.schedule_day,
    schedule.data.timezone
  )

  const updates: any = {
    last_run_at: new Date().toISOString(),
    last_run_status: status,
    last_run_job_id: jobId || null,
    next_run_at: nextRunAt,
    updated_at: new Date().toISOString(),
  }

  if (status === "failed") {
    updates.consecutive_failures = (schedule.data.consecutive_failures || 0) + 1

    // Auto-disable after max failures
    if (updates.consecutive_failures >= (schedule.data.max_consecutive_failures || 3)) {
      updates.enabled = false
    }
  } else {
    updates.consecutive_failures = 0
  }

  await supabase.from("sync_schedules").update(updates).eq("sync_schedule_id", scheduleId)
}
