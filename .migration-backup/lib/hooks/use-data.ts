"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

// Generic fetcher for Supabase
async function fetcher<T>(
  table: string,
  options?: {
    select?: string
    order?: { column: string; ascending?: boolean }
    limit?: number
    filters?: { column: string; value: unknown }[]
  },
): Promise<T[]> {
  let query = supabase.from(table).select(options?.select || "*")

  if (options?.filters) {
    options.filters.forEach((f) => {
      query = query.eq(f.column, f.value)
    })
  }

  if (options?.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? false,
    })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data as T[]
}

// Tasks hook
export function useTasks() {
  return useSWR("tasks", () =>
    fetcher("tasks", {
      order: { column: "due_date", ascending: true },
    }),
  )
}

// Calendar events hook
export function useCalendarEvents(date?: Date) {
  const dateKey = date?.toISOString().split("T")[0] || "today"
  return useSWR(`calendar_events_${dateKey}`, () =>
    fetcher("calendar_events", {
      order: { column: "start_time", ascending: true },
    }),
  )
}

// Emails hook
export function useEmails(folder = "inbox") {
  return useSWR(`emails_${folder}`, () =>
    fetcher("emails", {
      filters: [{ column: "folder", value: folder }],
      order: { column: "received_at", ascending: false },
      limit: 20,
    }),
  )
}

// Drive files hook
export function useDriveFiles() {
  return useSWR("drive_files", () =>
    fetcher("drive_files", {
      order: { column: "updated_at", ascending: false },
      limit: 20,
    }),
  )
}

// Activities hook
export function useActivities(limit = 10) {
  return useSWR(`activities_${limit}`, () =>
    fetcher("activities", {
      order: { column: "created_at", ascending: false },
      limit,
    }),
  )
}

// Documents hook
export function useDocuments(category?: string) {
  const key = category ? `documents_${category}` : "documents"
  return useSWR(key, () =>
    fetcher("documents", {
      ...(category && { filters: [{ column: "category", value: category }] }),
      order: { column: "updated_at", ascending: false },
    }),
  )
}

// Metrics hook
export function useMetrics() {
  return useSWR("metrics", () =>
    fetcher("metrics", {
      order: { column: "recorded_at", ascending: false },
    }),
  )
}

// Interactions hook
export function useInteractions(source?: string, limit = 50) {
  const key = source ? `interactions_${source}_${limit}` : `interactions_${limit}`
  return useSWR(key, () =>
    fetcher("interactions", {
      ...(source && { filters: [{ column: "source", value: source }] }),
      order: { column: "created_at", ascending: false },
      limit,
    }),
  )
}

// Search hook
export function useSearch(query: string) {
  return useSWR(
    query ? `/api/search?q=${encodeURIComponent(query)}` : null,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Search failed")
      return res.json()
    },
    { dedupingInterval: 500 },
  )
}
