/**
 * Gateway leads contract — the CRM/Leads vertical slice migrated to the
 * platform gateway.
 *
 * @gateway-contract v0-unverified
 * Shape is provisional: inferred from the integratewise-live platform context
 * and the local relay schema. It will be corrected empirically on the first
 * authenticated round-trip once a platform JWT is supplied via the connection
 * pill in the topbar.
 *
 * Doctrine: if this contract is wrong, the GatewayError reveals the actual
 * response shape so it can be corrected here. No silent fallbacks.
 */

import { useQuery } from "@tanstack/react-query";
import { usePlatform } from "./platform-context";
import { GatewayError } from "./gateway-client";
import type { DomainResource } from "./data-source";
import type { Lead } from "@workspace/api-client-react";
import { getListLeadsQueryKey } from "@workspace/api-client-react";

// ---------------------------------------------------------------------------
// Provisional gateway contract — v0, unverified
// ---------------------------------------------------------------------------

/**
 * The shape the platform gateway returns for a contact/lead record.
 *
 * @gateway-contract v0-unverified
 * Will be corrected on first authenticated read. If the real gateway returns
 * a different shape, the GatewayError body exposes the actual payload so the
 * adapter can be updated to match.
 */
export interface GatewayContact {
  id: string;
  /** Full name, or split into first_name / last_name depending on gateway version. */
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  company?: string | null;
  /** Apollo / platform field name for job title. */
  title?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  score?: number | null;
  status?: string | null;
  source?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  owner_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * The gateway endpoint for the contacts/leads list.
 *
 * @provisional Override via VITE_GATEWAY_LEADS_PATH once the real path is confirmed
 * from an authenticated round-trip.
 */
export const GATEWAY_LEADS_PATH: string =
  (import.meta.env.VITE_GATEWAY_LEADS_PATH as string) || "/v1/contacts";

/**
 * Stable query key for the gateway leads query.
 * Export so mutation handlers can invalidate it alongside the relay key.
 */
export const GATEWAY_LEADS_QUERY_KEY = ["gateway", "leads"] as const;

// ---------------------------------------------------------------------------
// Shape adapter — gateway → relay schema
// ---------------------------------------------------------------------------

/**
 * Normalise a gateway contact into the relay Lead schema so the view layer
 * stays shape-stable regardless of which source is active.
 *
 * This is the single place to update when the gateway contract is corrected.
 */
export function toLocalLead(c: GatewayContact): Lead {
  const firstName =
    c.first_name ?? (c.name ? c.name.split(" ")[0] : "Unknown");
  const lastName =
    c.last_name ??
    (c.name && c.name.includes(" ") ? c.name.split(" ").slice(1).join(" ") : null);

  const location = [c.city, c.state, c.country].filter(Boolean).join(", ") || null;

  return {
    id: c.id,
    firstName,
    lastName: lastName ?? null,
    company: c.company ?? null,
    jobTitle: c.title ?? null,
    email: c.email ?? null,
    phone: c.phone ?? null,
    linkedinUrl: c.linkedin_url ?? null,
    score: typeof c.score === "number" ? c.score : 0,
    status: c.status ?? "new",
    source: c.source ?? "gateway",
    tags: c.tags ?? null,
    notes: c.notes
      ? [c.notes, location].filter(Boolean).join(" · ")
      : location,
    owner: null,
    clientId: null,
    convertedDealId: null,
    createdAt: c.created_at ?? new Date().toISOString(),
    updatedAt: c.updated_at ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Domain hook — gateway-first, relay fallback
// ---------------------------------------------------------------------------

/**
 * The single hook for the Leads vertical slice.
 *
 * Routing logic:
 *   connected          → reads from the platform gateway;   source = "gateway"
 *   not_authenticated  → reads from the local relay;        source = "local-relay"
 *   offline            → reads from the local relay;        source = "local-relay"
 *   checking           → shows loading; relay pre-fetches in background
 *
 * Mutations (create, qualify, convert) still route through the relay and are
 * governed separately (M5). The view must invalidate both GATEWAY_LEADS_QUERY_KEY
 * and the relay key after any write so both caches refresh correctly.
 *
 * @gateway-contract v0-unverified — the gateway path and shape are provisional.
 */
export function useLeads(): DomainResource<Lead[]> {
  const { client, gateway } = usePlatform();
  const isConnected = gateway.state === "connected";

  // Gateway query — only runs when we have a confirmed live session.
  const gatewayQuery = useQuery({
    queryKey: GATEWAY_LEADS_QUERY_KEY,
    queryFn: ({ signal }) =>
      client.get<GatewayContact[]>(GATEWAY_LEADS_PATH, { signal }),
    enabled: isConnected,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    // Do NOT retry — GatewayErrors are typed and revealing. Surfacing the
    // exact failure (wrong path, bad token, unexpected shape) is how the
    // v0 contract gets pinned to the real one.
    retry: false,
  });

  // Relay query — disabled when gateway is live to avoid a redundant round-trip.
  // Using useQuery directly so we control the `enabled` flag without fighting
  // the orval-generated type (which requires queryKey in the options object).
  const relayQuery = useQuery<Lead[], Error>({
    queryKey: getListLeadsQueryKey(),
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/leads", { signal });
      if (!res.ok) throw new Error(`Relay HTTP ${res.status}`);
      return res.json() as Promise<Lead[]>;
    },
    enabled: !isConnected,
    staleTime: 30_000,
  });

  // ── Gateway path ──────────────────────────────────────────────────────────
  if (isConnected) {
    if (gatewayQuery.isPending) {
      return { data: null, source: "gateway", state: "loading" };
    }
    if (gatewayQuery.isError) {
      const err = gatewayQuery.error;
      return {
        data: null,
        source: "gateway",
        state: "error",
        error:
          err instanceof GatewayError
            ? `Gateway ${err.status ? `HTTP ${err.status} — ` : ""}${err.message}`
            : "Gateway fetch failed.",
      };
    }
    const contacts = gatewayQuery.data ?? [];
    const leads = contacts.map(toLocalLead);
    return {
      data: leads,
      source: "gateway",
      state: leads.length > 0 ? "ready" : "empty",
    };
  }

  // ── Relay path (not connected / offline / checking) ───────────────────────
  if (gateway.state === "checking") {
    // Still probing — relay will hydrate once state settles.
    return { data: null, source: "local-relay", state: "loading" };
  }

  if (relayQuery.isPending) {
    return { data: null, source: "local-relay", state: "loading" };
  }
  if (relayQuery.isError) {
    return {
      data: null,
      source: "local-relay",
      state: "error",
      error: "Local relay unavailable.",
    };
  }

  const leads = relayQuery.data ?? [];
  return {
    data: leads,
    source: "local-relay",
    state: leads.length > 0 ? "ready" : "empty",
  };
}
