"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export interface Connection {
  id: string
  provider: string
  status: "connected" | "disconnected" | "error" | "syncing"
  scopes: string[]
  first_sync_at?: string
  last_sync_at?: string
  records_synced?: number
  error_message?: string
}

export const PROVIDERS = [
  { id: "slack", name: "Slack", icon: "slack", color: "#4A154B", description: "Sync messages and channels" },
  { id: "hubspot", name: "HubSpot", icon: "hubspot", color: "#FF7A59", description: "Sync CRM data and deals" },
  { id: "notion", name: "Notion", icon: "notion", color: "#000000", description: "Sync pages and databases" },
  { id: "asana", name: "Asana", icon: "asana", color: "#F06A6A", description: "Sync tasks and projects" },
  { id: "gmail", name: "Gmail", icon: "gmail", color: "#EA4335", description: "Sync emails and threads" },
  { id: "sheets", name: "Google Sheets", icon: "sheets", color: "#0F9D58", description: "Sync spreadsheet data" },
] as const

const fetcher = async (): Promise<Connection[]> => {
  const supabase = createClient()
  if (!supabase) return []

  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching connections:", error)
    return []
  }

  // Check for active syncs
  const { data: activeSyncs } = await supabase.from("loader_runs").select("source").eq("status", "running")

  const syncingSources = new Set(activeSyncs?.map((s) => s.source) || [])

  return (integrations || []).map((integration) => ({
    id: integration.id,
    provider: integration.provider,
    status: syncingSources.has(integration.provider)
      ? "syncing"
      : integration.status === "active"
        ? "connected"
        : integration.status === "error"
          ? "error"
          : "disconnected",
    scopes: integration.scopes || [],
    first_sync_at: integration.first_sync_at,
    last_sync_at: integration.last_sync_at,
    records_synced: integration.records_synced,
    error_message: integration.error_message,
  }))
}

export function useConnections() {
  const { data, error, isLoading, mutate } = useSWR<Connection[]>("connections", fetcher, {
    refreshInterval: 3000,
  })

  const triggerSync = async (provider: string) => {
    try {
      const res = await fetch(`/api/loader/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fetch_params: {} }),
      })
      if (!res.ok) throw new Error("Sync failed")
      mutate()
      return { success: true }
    } catch (err) {
      return { success: false, error: err }
    }
  }

  const connect = async (provider: string) => {
    // In production, this would initiate OAuth flow
    // For now, we'll create a placeholder integration
    const supabase = createClient()
    if (!supabase) return { success: false }

    const { error } = await supabase.from("integrations").upsert(
      {
        provider,
        status: "active",
        scopes: ["read"],
        created_at: new Date().toISOString(),
      },
      { onConflict: "provider" },
    )

    if (error) return { success: false, error }

    mutate()
    return { success: true }
  }

  const disconnect = async (provider: string) => {
    const supabase = createClient()
    if (!supabase) return { success: false }

    const { error } = await supabase.from("integrations").update({ status: "inactive" }).eq("provider", provider)

    if (error) return { success: false, error }

    mutate()
    return { success: true }
  }

  return {
    connections: data || [],
    isLoading,
    error,
    mutate,
    triggerSync,
    connect,
    disconnect,
  }
}
