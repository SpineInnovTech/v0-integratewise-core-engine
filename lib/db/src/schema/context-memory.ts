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
 * The contextual-memory substrate — the LOCAL realization of the moat: ONE
 * contextual memory of the user/org that compounds as tools connect. This is
 * deliberately the SINGLE memory shape (memory_atoms), replacing the platform's
 * scattered-memory anti-pattern (≥6 stores, two conversational shapes). Goals +
 * metrics are the anchor that makes accumulated memory *mean* something, with R1
 * ("no metric without a goal") enforced as a hard DB invariant.
 *
 * Nothing here owns truth. memory_atoms is a provenance-tagged projection that
 * the context-assembler composes alongside structured records and best-effort
 * remote Spine reads into one ContextPacket.
 */

/**
 * Canonical subject identity. Everything in the contextual memory partitions by
 * a subject_ref so leads / contacts / clients / Gmail people / Spine entities can
 * converge without forcing them into org/person prematurely.
 */
export type SubjectRef = {
  tenant_id: string;
  entity_type: string; // lead | client | deal | contact | person | org | ...
  entity_id: string;
  source?: string; // connector that introduced this subject, if any
  external_id?: string; // provider id, if any
};

/** Where a memory atom came from — its connector + provider coordinates. */
export type MemorySource = {
  connector?: string; // gmail | manual | twin | relay | ...
  source_id?: string;
  entity_type?: string;
  external_id?: string;
};

/** Honest evidence trail for a memory atom (never executed, only displayed). */
export type MemoryProvenance = {
  evidence_chain?: string[];
  note?: string;
  [k: string]: unknown;
};

/**
 * memory_atoms — the ONE unified memory shape. Each atom is a normalized unit of
 * context (a fact, an interaction, a decision, a signal, a preference) keyed to a
 * subject, optionally anchored to goals, optionally embedded for semantic recall.
 * The idempotency_key keeps the memory compounding without duplicating: re-running
 * an ingest deepens coverage instead of inflating it.
 */
export const memoryAtomsTable = pgTable(
  "memory_atoms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull().default("iw-customer-zero"),
    // Indexed identity columns (fast filter) alongside the full subject_ref blob.
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    subjectRef: jsonb("subject_ref").$type<SubjectRef>().notNull(),
    // Optional finer focus when the subject is org-level but the atom is about a
    // specific lead/activity/etc.
    entityRef: jsonb("entity_ref").$type<Record<string, unknown>>(),
    // fact | interaction | decision | signal | preference
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    source: jsonb("source").$type<MemorySource>().notNull().default({}),
    // IDs of spine_goals this atom advances (anchor links).
    goalRefs: jsonb("goal_refs").$type<string[]>().notNull().default([]),
    // 0..1 importance used to rank when semantic embeddings are unavailable.
    salience: real("salience").notNull().default(0.5),
    // Embedding stored as a jsonb float[] (pgvector NOT required for the MVP;
    // semantic search degrades to keyword + salience + recency). A later pass can
    // promote this to a pgvector column + index.
    embedding: jsonb("embedding").$type<number[]>(),
    provenance: jsonb("provenance")
      .$type<MemoryProvenance>()
      .notNull()
      .default({}),
    // sha256 over (tenant|subject_type|subject_id|kind|connector|external_id|body_hash)
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Optional decay horizon; null = durable.
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("memory_atoms_idem_uq").on(t.idempotencyKey),
    index("memory_atoms_subject_idx").on(
      t.tenantId,
      t.subjectType,
      t.subjectId,
    ),
    index("memory_atoms_kind_idx").on(t.kind),
  ],
);

export type MemoryAtomRow = typeof memoryAtomsTable.$inferSelect;
export type InsertMemoryAtomRow = typeof memoryAtomsTable.$inferInsert;

/**
 * spine_goals — the anchor. A goal is what the org/person is trying to achieve in
 * a domain. Metrics MUST reference one (R1), so memory and metrics always ladder
 * up to an intent rather than free-floating.
 */
export const spineGoalsTable = pgTable(
  "spine_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull().default("iw-customer-zero"),
    // VENDOR (IntegrateWise's own goals) | CLIENT | PERSONAL
    type: text("type").notNull(),
    domain: text("domain").notNull(), // department/domain key
    name: text("name").notNull(),
    description: text("description"),
    target: jsonb("target").$type<Record<string, unknown>>().notNull().default(
      {},
    ),
    cadence: text("cadence"), // weekly | monthly | quarterly
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("spine_goals_tenant_idx").on(t.tenantId),
    index("spine_goals_domain_idx").on(t.domain),
  ],
);

export type SpineGoalRow = typeof spineGoalsTable.$inferSelect;
export type InsertSpineGoalRow = typeof spineGoalsTable.$inferInsert;

/**
 * spine_metrics — the measurable expression of a goal. goal_id is NOT NULL with a
 * FK to spine_goals: the database itself refuses a metric that does not ladder up
 * to a goal. That is rule R1, enforced as an invariant rather than convention.
 */
export const spineMetricsTable = pgTable(
  "spine_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull().default("iw-customer-zero"),
    name: text("name").notNull(),
    domain: text("domain").notNull(),
    formula: text("formula"),
    unit: text("unit"),
    threshold: jsonb("threshold")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    cadence: text("cadence"),
    // R1: every metric ladders up to a goal. Hard DB invariant.
    goalId: uuid("goal_id")
      .notNull()
      .references(() => spineGoalsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("spine_metrics_tenant_idx").on(t.tenantId),
    index("spine_metrics_domain_idx").on(t.domain),
    index("spine_metrics_goal_idx").on(t.goalId),
  ],
);

export type SpineMetricRow = typeof spineMetricsTable.$inferSelect;
export type InsertSpineMetricRow = typeof spineMetricsTable.$inferInsert;
