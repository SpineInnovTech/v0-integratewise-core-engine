/**
 * Schema-Driven Components
 *
 * Components that render UI based on schema from backend.
 * PRINCIPLE: Schema is Backend IP - Components NEVER see entity_type or field names.
 */

export { SchemaSection } from "./SchemaSection";
export { SchemaDashboard } from "./SchemaDashboard";

export type {
  // Re-export types from BFF transform for convenience
  UIField,
  UITransformedEntity,
  UISection,
  UIDashboardView,
} from "@integratewise/types";
