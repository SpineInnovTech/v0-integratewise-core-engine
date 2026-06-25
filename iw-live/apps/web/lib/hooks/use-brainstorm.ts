"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export type BrainstormStatus = "idea" | "decision" | "task"

export interface BrainstormItem {
  id: string
  source_type: string
  source_ref: string
  title: string
  body: string
  tags: string[]
  owner?: string
  status: BrainstormStatus
  linked_record_ref?: string
  hub?: string
  created_at: string
  updated_at: string
}

export interface BrainstormFilters {
  source_type?: string
  hub?: string
  status?: BrainstormStatus
  owner?: string
  tag?: string
  search?: string
}

const fetcher = async (filters: BrainstormFilters): Promise<BrainstormItem[]> => {
  const supabase = createClient()
  if (!supabase) return []

  let query = supabase.from("brainstorm_sessions").select("*").order("created_at", { ascending: false })

  if (filters.source_type) {
    query = query.eq("source_type", filters.source_type)
  }
  if (filters.status) {
    query = query.eq("status", filters.status)
  }
  if (filters.hub) {
    query = query.eq("hub", filters.hub)
  }
  if (filters.owner) {
    query = query.eq("owner", filters.owner)
  }
  if (filters.tag) {
    query = query.contains("tags", [filters.tag])
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,body.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error("[v0] Error fetching brainstorm items:", error)
    return []
  }

  return (data || []).map((item) => ({
    id: item.id,
    source_type: item.source_type || item.session_type || "manual",
    source_ref: item.source_ref || item.context || "",
    title: item.title,
    body: item.description || item.context || "",
    tags: item.tags || [],
    owner: item.owner || item.participants?.[0],
    status: (item.status as BrainstormStatus) || "idea",
    linked_record_ref: item.linked_record_ref,
    hub: item.hub,
    created_at: item.created_at || item.session_date,
    updated_at: item.updated_at || item.created_at,
  }))
}

export function useBrainstorm(filters: BrainstormFilters = {}) {
  const filterKey = JSON.stringify(filters)

  const { data, error, isLoading, mutate } = useSWR<BrainstormItem[]>(
    ["brainstorm", filterKey],
    () => fetcher(filters),
    { revalidateOnFocus: true },
  )

  const convertItem = async (id: string, to: BrainstormStatus) => {
    const supabase = createClient()
    if (!supabase) return { success: false }

    const { error } = await supabase
      .from("brainstorm_sessions")
      .update({ status: to, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) return { success: false, error }

    mutate()
    return { success: true }
  }

  return {
    items: data || [],
    isLoading,
    error,
    mutate,
    convertItem,
  }
}
