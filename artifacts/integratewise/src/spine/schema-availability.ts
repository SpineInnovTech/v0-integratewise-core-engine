import type { SchemaGroup, SchemaState } from "./types";

/**
 * Schema availability — what backing data actually exists for the org.
 *
 *   live   — backed by a real source (the api-server relay): renders live data.
 *   seeded — backed by sample/stub data: renders, flagged as sample.
 *   off    — no backing schema: module degrades to an explicit seed/empty state.
 *
 * Leads / Clients / Deals are served by the live relay → person/company/deal
 * are "live". The remaining groups are stub-backed today → "seeded". Flipping
 * a group to "off" is the single switch that degrades every module and Home
 * section depending on it — gracefully, with no crash.
 */
export const DEFAULT_SCHEMA_AVAILABILITY: Record<SchemaGroup, SchemaState> = {
  person: "live",
  company: "live",
  deal: "live",
  activity: "seeded",
  document: "seeded",
  campaign: "seeded",
  product: "seeded",
  service: "seeded",
  project: "seeded",
  metric: "seeded",
  platform: "seeded",
};

export const SCHEMA_GROUP_LABEL: Record<SchemaGroup, string> = {
  person: "People",
  company: "Companies",
  deal: "Deals",
  activity: "Activities",
  document: "Documents",
  campaign: "Campaigns",
  product: "Products",
  service: "Services",
  project: "Projects",
  metric: "Metrics",
  platform: "Platform",
};

export type SchemaMap = Record<SchemaGroup, SchemaState>;

/** A module is renderable when at least one of its required groups is not "off". */
export function isSchemaAvailable(schema: SchemaMap, required?: SchemaGroup[]): boolean {
  if (!required || required.length === 0) return true;
  return required.some((g) => schema[g] !== "off");
}

/** Best state across a module's required groups: live > seeded > off. */
export function resolveSchemaState(schema: SchemaMap, required?: SchemaGroup[]): SchemaState {
  if (!required || required.length === 0) return "live";
  if (required.some((g) => schema[g] === "live")) return "live";
  if (required.some((g) => schema[g] === "seeded")) return "seeded";
  return "off";
}
