"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

// Onboarding state machine: unconnected → connecting → ingesting → hydrated
export type OnboardingState = "unconnected" | "connecting" | "ingesting" | "hydrated"

export interface HomeState {
  onboarding_state: OnboardingState
  insights_ready: boolean
  connected_count: number
  first_connection_at?: string
  last_hydration_at?: string
}

const fetcher = async (): Promise<HomeState> => {
  const supabase = createClient()
  if (!supabase) {
    return { onboarding_state: "unconnected", insights_ready: false, connected_count: 0 }
  }

  // Check integrations table for connected providers
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("id, provider, status, last_sync_at, first_sync_at")
    .eq("status", "active")

  if (error || !integrations || integrations.length === 0) {
    return { onboarding_state: "unconnected", insights_ready: false, connected_count: 0 }
  }

  const connected_count = integrations.length
  const first_connection_at = integrations
    .map((i) => i.first_sync_at)
    .filter(Boolean)
    .sort()[0]
  const last_hydration_at = integrations
    .map((i) => i.last_sync_at)
    .filter(Boolean)
    .sort()
    .reverse()[0]

  // Check if any are currently syncing
  const { data: syncingLogs } = await supabase.from("loader_runs").select("id").eq("status", "running").limit(1)

  const isSyncing = syncingLogs && syncingLogs.length > 0

  // Check if we have SPINE data (hydrated)
  const { count: spineCount } = await supabase.from("spine_tasks").select("*", { count: "exact", head: true }).limit(1)

  const hasSpineData = (spineCount ?? 0) > 0

  let onboarding_state: OnboardingState = "unconnected"
  if (connected_count > 0) {
    if (isSyncing) {
      onboarding_state = "ingesting"
    } else if (hasSpineData) {
      onboarding_state = "hydrated"
    } else {
      onboarding_state = "connecting"
    }
  }

  return {
    onboarding_state,
    insights_ready: hasSpineData,
    connected_count,
    first_connection_at,
    last_hydration_at,
  }
}

export function useOnboardingState() {
  return useSWR<HomeState>("onboarding_state", fetcher, {
    refreshInterval: 5000, // Poll every 5s during onboarding
    revalidateOnFocus: true,
  })
}
