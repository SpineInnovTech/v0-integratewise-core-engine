"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useConnections } from "./use-connections"

export type Sector = "b2b_saas" | "agency" | "ecommerce" | "consulting" | "startup" | "enterprise"

export interface VisibilityRules {
  sector: Sector
  apps: string[]
  enabled_hubs: string[]
  nav_order: string[]
}

// Hub visibility rules based on sector and connected apps
const HUB_RULES: Record<string, { requiredApps: string[]; sectors: Sector[] }> = {
  "/dashboard": {
    requiredApps: [],
    sectors: ["b2b_saas", "agency", "ecommerce", "consulting", "startup", "enterprise"],
  },
  "/brainstorming": {
    requiredApps: [],
    sectors: ["b2b_saas", "agency", "ecommerce", "consulting", "startup", "enterprise"],
  },
  "/strategy": { requiredApps: [], sectors: ["b2b_saas", "consulting", "startup", "enterprise"] },
  "/metrics": { requiredApps: [], sectors: ["b2b_saas", "ecommerce", "consulting", "enterprise"] },
  "/sales": { requiredApps: ["hubspot"], sectors: ["b2b_saas", "agency", "consulting", "enterprise"] },
  "/leads": { requiredApps: ["hubspot"], sectors: ["b2b_saas", "agency", "consulting"] },
  "/pipeline": { requiredApps: ["hubspot"], sectors: ["b2b_saas", "agency", "consulting", "enterprise"] },
  "/deals": { requiredApps: ["hubspot"], sectors: ["b2b_saas", "agency", "consulting", "enterprise"] },
  "/clients": { requiredApps: [], sectors: ["agency", "consulting"] },
  "/sessions": { requiredApps: [], sectors: ["agency", "consulting"] },
  "/projects": { requiredApps: ["asana", "notion"], sectors: ["agency", "consulting", "startup"] },
  "/tasks": {
    requiredApps: ["asana", "notion", "slack"],
    sectors: ["b2b_saas", "agency", "ecommerce", "consulting", "startup", "enterprise"],
  },
  "/content": { requiredApps: [], sectors: ["b2b_saas", "agency", "ecommerce"] },
  "/campaigns": { requiredApps: ["hubspot"], sectors: ["b2b_saas", "agency", "ecommerce"] },
  "/products": { requiredApps: [], sectors: ["ecommerce", "b2b_saas"] },
  "/services": { requiredApps: [], sectors: ["agency", "consulting"] },
  "/website": { requiredApps: [], sectors: ["b2b_saas", "agency", "ecommerce", "startup"] },
  "/knowledge": {
    requiredApps: [],
    sectors: ["b2b_saas", "agency", "ecommerce", "consulting", "startup", "enterprise"],
  },
  "/data-sources": {
    requiredApps: [],
    sectors: ["b2b_saas", "agency", "ecommerce", "consulting", "startup", "enterprise"],
  },
  "/integrations": {
    requiredApps: [],
    sectors: ["b2b_saas", "agency", "ecommerce", "consulting", "startup", "enterprise"],
  },
  "/settings": {
    requiredApps: [],
    sectors: ["b2b_saas", "agency", "ecommerce", "consulting", "startup", "enterprise"],
  },
}

const DEFAULT_NAV_ORDER = [
  "/dashboard",
  "/brainstorming",
  "/strategy",
  "/metrics",
  "/sales",
  "/leads",
  "/pipeline",
  "/deals",
  "/clients",
  "/sessions",
  "/projects",
  "/tasks",
  "/content",
  "/campaigns",
  "/products",
  "/services",
  "/website",
  "/knowledge",
  "/data-sources",
  "/integrations",
  "/settings",
]

const fetcher = async (connectedApps: string[]): Promise<VisibilityRules> => {
  const supabase = createClient()

  // Try to get user profile with sector
  let sector: Sector = "b2b_saas" // Default
  if (supabase) {
    const { data: profile } = await supabase.from("profiles").select("sector").single()
    if (profile?.sector) {
      sector = profile.sector as Sector
    }
  }

  // Calculate enabled hubs based on sector and connected apps
  const enabled_hubs = Object.entries(HUB_RULES)
    .filter(([_, rules]) => {
      // Check sector match
      if (!rules.sectors.includes(sector)) return false
      // Check required apps (if any required, at least one must be connected)
      if (rules.requiredApps.length > 0) {
        return rules.requiredApps.some((app) => connectedApps.includes(app))
      }
      return true
    })
    .map(([hub]) => hub)

  // Sort by nav order
  const nav_order = DEFAULT_NAV_ORDER.filter((hub) => enabled_hubs.includes(hub))

  return {
    sector,
    apps: connectedApps,
    enabled_hubs,
    nav_order,
  }
}

export function useVisibilityRules() {
  const { connections } = useConnections()
  const connectedApps = connections
    .filter((c) => c.status === "connected" || c.status === "syncing")
    .map((c) => c.provider)

  return useSWR<VisibilityRules>(["visibility_rules", connectedApps.join(",")], () => fetcher(connectedApps), {
    revalidateOnFocus: false,
  })
}

export function isHubEnabled(hub: string, rules: VisibilityRules | undefined): boolean {
  if (!rules) return false
  return rules.enabled_hubs.includes(hub)
}
