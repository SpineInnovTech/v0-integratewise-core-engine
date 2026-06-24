/**
 * Data provenance — the honest answer to "where did this come from?".
 *
 * Doctrine: never show fake data as real. Every surface that renders data must
 * be able to declare its true source, so a "Relay" or "Demo" read is never
 * mistaken for live platform data.
 *
 *   gateway      — live from the IntegrateWise platform gateway (the real backend).
 *   local-relay  — live from the owned local relay (dev backend) — real rows, but
 *                  NOT the platform. Distinct on purpose so the two are never conflated.
 *   demo         — sample/stub data; nothing live behind it.
 *   unavailable  — no backing source; there is genuinely nothing to show.
 */

import type { SchemaState } from "@/spine/types";

export type DataSource = "gateway" | "local-relay" | "demo" | "unavailable";

interface SourceStyle {
  /** Short chip label. */
  label: string;
  /** Honest one-sentence explanation, used as a tooltip. */
  description: string;
  fg: string;
  bg: string;
}

export const SOURCE_META: Record<DataSource, SourceStyle> = {
  gateway: {
    label: "Platform live",
    description: "Live from the IntegrateWise platform gateway.",
    fg: "var(--iw-success)",
    bg: "var(--iw-success-50)",
  },
  "local-relay": {
    label: "Relay",
    description: "Live from the owned local relay (dev backend) — real data, not the platform gateway.",
    fg: "var(--iw-blue)",
    bg: "var(--iw-blue-50)",
  },
  demo: {
    label: "Demo",
    description: "Sample data — not connected to a live source.",
    fg: "var(--iw-warning)",
    bg: "var(--iw-warning-50)",
  },
  unavailable: {
    label: "Off",
    description: "No backing source — nothing to show.",
    fg: "var(--muted-foreground)",
    bg: "var(--secondary)",
  },
};

/**
 * Honest provenance for a schema group based on its configured availability.
 *
 * IMPORTANT: a "live" group is served by the LOCAL RELAY today. It only becomes
 * `gateway`-sourced once its reads are actually migrated to the gateway — being
 * connected to the gateway never, by itself, implies the data came from there.
 */
export function groupSource(state: SchemaState): DataSource {
  if (state === "off") return "unavailable";
  if (state === "live") return "local-relay";
  return "demo";
}

/**
 * The uniform shape every domain read returns, so provenance and load state are
 * declared consistently across the product. Domain hooks (CRM, deals, etc.)
 * resolve to this — `source` reports the TRUE origin of `data`.
 */
export type ResourceState = "loading" | "ready" | "empty" | "error" | "unavailable";

export interface DomainResource<T> {
  data: T | null;
  source: DataSource;
  state: ResourceState;
  error?: string;
}
