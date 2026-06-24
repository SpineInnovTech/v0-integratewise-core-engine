import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * schema_pool — the versioned registry of connector-driven schema DELTAS layered
 * on top of the canonical base schema (@workspace/spine-schema, base_version
 * "1.0.0"). The base is NEVER stored here or regenerated; only additive,
 * connector-driven deltas (e.g. Gmail person/activity field + mapping additions)
 * live in this pool, each lifecycle-managed and confidence-scored.
 *
 * lifecycle_state: proposed → reviewed → approved → active → deprecated
 * harmonization_group: the canonical entity_type a connector record harmonizes
 *   to (e.g. Gmail Sender → "person", Gmail Message → "activity").
 */
export const schemaPoolTable = pgTable(
  "schema_pool",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    connectorName: text("connector_name").notNull(),
    entityType: text("entity_type").notNull(),
    schemaVersion: text("schema_version").notNull(),
    baseVersion: text("base_version").notNull().default("1.0.0"),
    harmonizationGroup: text("harmonization_group").notNull(),
    // The delta schema body: added fields, types, descriptions (additive only).
    schemaBody: jsonb("schema_body")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    // Provider field path → canonical field name, e.g. { "sender_email": "email" }.
    canonicalMapping: jsonb("canonical_mapping")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    // proposed | reviewed | approved | active | deprecated
    lifecycleState: text("lifecycle_state").notNull().default("proposed"),
    confidenceScore: real("confidence_score").notNull().default(0),
    // Hash of the representative source payload that drove this delta (provenance).
    sourcePayloadHash: text("source_payload_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("schema_pool_conn_entity_version_uq").on(
      t.connectorName,
      t.entityType,
      t.schemaVersion,
    ),
    index("schema_pool_lifecycle_idx").on(t.lifecycleState),
    index("schema_pool_conn_idx").on(t.connectorName),
  ],
);

export type SchemaPoolRow = typeof schemaPoolTable.$inferSelect;
export type InsertSchemaPoolRow = typeof schemaPoolTable.$inferInsert;

/**
 * schema_delta_events — append-only audit log of every lifecycle transition /
 * proposal for a connector schema delta. This is the governance trail: who/what
 * proposed which additive change, the version it moved from→to, and the raw delta.
 */
export const schemaDeltaEventsTable = pgTable(
  "schema_delta_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schemaPoolId: uuid("schema_pool_id"),
    connectorName: text("connector_name").notNull(),
    entityType: text("entity_type").notNull(),
    // proposed | reviewed | approved | activated | deprecated | rejected
    eventType: text("event_type").notNull(),
    fromVersion: text("from_version"),
    toVersion: text("to_version"),
    delta: jsonb("delta").$type<Record<string, unknown>>().notNull().default({}),
    actor: text("actor").notNull().default("schema-ai"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("schema_delta_events_pool_idx").on(t.schemaPoolId),
    index("schema_delta_events_conn_entity_idx").on(
      t.connectorName,
      t.entityType,
    ),
  ],
);

export type SchemaDeltaEventRow = typeof schemaDeltaEventsTable.$inferSelect;
export type InsertSchemaDeltaEventRow =
  typeof schemaDeltaEventsTable.$inferInsert;

/**
 * spine_proposals — the idempotency + provenance ledger for governed Spine
 * hydration. Every canonical record proposed to the platform Spine
 * (memory.propose) is recorded here keyed by a stable idempotency hash over
 * (tenant, connector, entity_type, external_id, schema_version, payload_hash).
 * Re-running an ingest therefore never double-proposes: an existing row short-
 * circuits the write. The platform Spine remains the source of truth — this is
 * only Customer Zero's local record of what it has already proposed/approved.
 */
export const spineProposalsTable = pgTable(
  "spine_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // sha256(tenant|connector|entity_type|external_id|schema_version|payload_hash)
    idempotencyKey: text("idempotency_key").notNull(),
    tenantId: text("tenant_id").notNull(),
    connectorName: text("connector_name").notNull(),
    entityType: text("entity_type").notNull(),
    externalId: text("external_id").notNull(),
    schemaVersion: text("schema_version").notNull(),
    payloadHash: text("payload_hash").notNull(),
    // The proposal_id returned by the platform Spine (null if it returned none).
    proposalId: text("proposal_id"),
    // proposed | approved | rejected | pending_review
    status: text("status").notNull().default("proposed"),
    // Honest snapshot of the platform tool response (untrusted data, stored raw).
    spineResponse: jsonb("spine_response")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("spine_proposals_idem_uq").on(t.idempotencyKey),
    index("spine_proposals_entity_idx").on(t.entityType, t.externalId),
    index("spine_proposals_tenant_idx").on(t.tenantId),
  ],
);

export type SpineProposalRow = typeof spineProposalsTable.$inferSelect;
export type InsertSpineProposalRow = typeof spineProposalsTable.$inferInsert;
