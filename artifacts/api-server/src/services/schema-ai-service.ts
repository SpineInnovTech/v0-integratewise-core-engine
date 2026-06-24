import { createHash } from "node:crypto";
import {
  BASE_SCHEMA_VERSION,
  resolveSpineConfig,
  CUSTOMER_ZERO_IDENTITY,
} from "@workspace/spine-schema";
import type { NormalizedEmail } from "../connectors/gmail";
import { upsertDelta, recordDeltaEvent } from "../repositories/schema-pool";

export const GMAIL_CONNECTOR = "gmail";
export const GMAIL_DELTA_VERSION = "1.1.0";
export const CONTACT_LINK_FIELD = "contact_external_id";

/**
 * Universal identity/provenance fields present on EVERY canonical entity. A
 * connector delta may MAP onto these but must never redefine them — doing so
 * would be a base-schema modification, which is forbidden (additive-only).
 */
const UNIVERSAL_BASE_FIELDS = new Set<string>([
  "id",
  "external_id",
  "name",
  "full_name",
  "email",
  "created_at",
  "updated_at",
  "source",
  "tenant_id",
]);

interface AddedField {
  type: string;
  description: string;
}

/**
 * The connector's DESIRED harmonization intent, expressed independently of any
 * one (industry, department). The generator resolves each `role` to the canonical
 * entity_type that actually exists in the resolved Spine config — so Gmail lands
 * as `contact`+`engagement` under Customer Success, but would land as
 * `contact`+`activity` under a Sales identity. Schema = f(industry, department).
 */
interface DesiredHarmonization {
  role: "person" | "interaction";
  entityCandidates: string[];
  fallbackEntity: string;
  /** Gmail source field → canonical field name. */
  mapping: Record<string, string>;
  /** Canonical field → constant value the connector always sets. */
  literals: Record<string, unknown>;
  /** If true, the normalizer stamps a stable link back to the person entity. */
  linkToPerson?: boolean;
}

const GMAIL_HARMONIZATIONS: DesiredHarmonization[] = [
  {
    role: "person",
    entityCandidates: ["contact", "person", "customer", "lead"],
    fallbackEntity: "contact",
    mapping: {
      sender_email: "email",
      sender_name: "full_name",
      received_at: "last_contacted",
    },
    literals: { preferred_channel: "email" },
  },
  {
    role: "interaction",
    entityCandidates: ["engagement", "activity", "interaction", "ticket"],
    fallbackEntity: "activity",
    mapping: {
      subject: "subject",
      preview: "summary",
      received_at: "occurred_at",
      id: "source_message_id",
      threadId: "source_thread_id",
      is_read: "is_read",
      is_starred: "is_starred",
    },
    literals: { channel: "email" },
    linkToPerson: true,
  },
];

function inferFieldType(name: string): AddedField {
  if (name.endsWith("_at") || name === "last_contacted")
    return { type: "datetime", description: `${name} (ISO timestamp).` };
  if (name.startsWith("is_"))
    return { type: "boolean", description: `${name} flag from the connector.` };
  if (name.endsWith("_id"))
    return { type: "string", description: `${name} (connector provenance id).` };
  return { type: "string", description: `${name} (connector-provided value).` };
}

export interface DeltaValidation {
  ok: boolean;
  errors: string[];
}

/**
 * Enforce the additive-only invariant against the resolved canonical config:
 *  1. No declared additive field may collide with a base field (would redefine).
 *  2. Every mapping/literal target must resolve to a base field or a declared
 *     additive field (no dangling/unknown targets).
 */
export function validateAdditive(
  entityType: string,
  basePriority: string[],
  addedFields: Record<string, AddedField>,
  mapping: Record<string, string>,
  literals: Record<string, unknown>,
): DeltaValidation {
  const errors: string[] = [];
  const baseFields = new Set<string>([...UNIVERSAL_BASE_FIELDS, ...basePriority]);
  const addedKeys = new Set(Object.keys(addedFields));

  for (const f of addedKeys) {
    if (baseFields.has(f))
      errors.push(
        `additive field "${f}" redefines a base field on ${entityType} — not additive`,
      );
  }
  const targets = [...Object.values(mapping), ...Object.keys(literals)];
  for (const t of targets) {
    if (!baseFields.has(t) && !addedKeys.has(t))
      errors.push(
        `mapping target "${t}" on ${entityType} is neither a base field nor a declared additive field`,
      );
  }
  return { ok: errors.length === 0, errors };
}

export interface GeneratedDelta {
  entity_type: string;
  role: "person" | "interaction";
  schema_version: string;
  base_version: string;
  harmonization_group: string;
  canonical_mapping: Record<string, string>;
  added_fields: Record<string, AddedField>;
  literals: Record<string, unknown>;
  confidence: number;
  lifecycle_state: string;
  validation: DeltaValidation;
}

export interface GmailDeltaResult {
  connector: string;
  identity: { industry: string; department: string };
  base_version: string;
  schema_version: string;
  generator: "deterministic";
  source_shape_hash: string | null;
  deltas: GeneratedDelta[];
  rejected: { entity_type: string; errors: string[] }[];
}

/** Hash the SHAPE (sorted keys) of the sample, never its contents. */
function shapeHash(sample?: NormalizedEmail[]): string | null {
  if (!sample?.length) return null;
  const first = sample[0] as unknown as Record<string, unknown>;
  const keys = Object.keys(first).sort().join(",");
  return createHash("sha256").update(keys).digest("hex");
}

/**
 * Deterministically generate the additive, versioned Gmail deltas (one per
 * harmonization role) ON TOP OF the canonical base 1.0.0 for the given identity.
 * The base is NEVER regenerated. Each valid delta is upserted into schema_pool
 * as `active` (idempotent) and an audit event is appended.
 */
export async function generateGmailDeltas(
  sample?: NormalizedEmail[],
  identity: { industry: string; department: string } = CUSTOMER_ZERO_IDENTITY,
): Promise<GmailDeltaResult> {
  const config = resolveSpineConfig(identity.industry, identity.department);
  const sourceHash = shapeHash(sample);

  const personEntity =
    GMAIL_HARMONIZATIONS[0]!.entityCandidates.find((c) =>
      config.entity_types.includes(c),
    ) ?? GMAIL_HARMONIZATIONS[0]!.fallbackEntity;

  const deltas: GeneratedDelta[] = [];
  const rejected: { entity_type: string; errors: string[] }[] = [];

  for (const h of GMAIL_HARMONIZATIONS) {
    const entityType =
      h.entityCandidates.find((c) => config.entity_types.includes(c)) ??
      h.fallbackEntity;
    const basePriority = config.priority_fields[entityType] ?? [];
    const baseFields = new Set<string>([
      ...UNIVERSAL_BASE_FIELDS,
      ...basePriority,
    ]);

    // Targets the connector wants to populate; classify each as base or additive.
    const targets = new Set<string>([
      ...Object.values(h.mapping),
      ...Object.keys(h.literals),
    ]);
    if (h.linkToPerson) targets.add(CONTACT_LINK_FIELD);

    const addedFields: Record<string, AddedField> = {};
    for (const t of targets) if (!baseFields.has(t)) addedFields[t] = inferFieldType(t);

    const validation = validateAdditive(
      entityType,
      basePriority,
      addedFields,
      h.mapping,
      h.literals,
    );

    if (!validation.ok) {
      rejected.push({ entity_type: entityType, errors: validation.errors });
      await recordDeltaEvent({
        connectorName: GMAIL_CONNECTOR,
        entityType,
        eventType: "rejected",
        fromVersion: BASE_SCHEMA_VERSION,
        toVersion: GMAIL_DELTA_VERSION,
        delta: { role: h.role, added_fields: addedFields, mapping: h.mapping },
        actor: "schema-ai",
        notes: validation.errors.join("; "),
      });
      continue;
    }

    const schemaBody: Record<string, unknown> = {
      role: h.role,
      added_fields: addedFields,
      literals: h.literals,
      harmonization_group: entityType,
      base_version: BASE_SCHEMA_VERSION,
      generator: "deterministic",
      link_field: h.linkToPerson ? CONTACT_LINK_FIELD : undefined,
      person_entity_type: h.role === "interaction" ? personEntity : undefined,
      description: `Gmail → canonical ${entityType} (${h.role}). Additive-only delta on base ${BASE_SCHEMA_VERSION}; connector fields are mapped onto canonical/additive fields without modifying any base field.`,
    };

    const row = await upsertDelta({
      connectorName: GMAIL_CONNECTOR,
      entityType,
      schemaVersion: GMAIL_DELTA_VERSION,
      baseVersion: BASE_SCHEMA_VERSION,
      harmonizationGroup: entityType,
      schemaBody,
      canonicalMapping: h.mapping,
      lifecycleState: "active",
      confidenceScore: 1,
      sourcePayloadHash: sourceHash,
    });

    await recordDeltaEvent({
      schemaPoolId: row.id,
      connectorName: GMAIL_CONNECTOR,
      entityType,
      eventType: "activated",
      fromVersion: BASE_SCHEMA_VERSION,
      toVersion: GMAIL_DELTA_VERSION,
      delta: schemaBody,
      actor: "schema-ai",
      notes: "deterministic additive delta upserted active",
    });

    deltas.push({
      entity_type: entityType,
      role: h.role,
      schema_version: GMAIL_DELTA_VERSION,
      base_version: BASE_SCHEMA_VERSION,
      harmonization_group: entityType,
      canonical_mapping: h.mapping,
      added_fields: addedFields,
      literals: h.literals,
      confidence: 1,
      lifecycle_state: "active",
      validation,
    });
  }

  return {
    connector: GMAIL_CONNECTOR,
    identity: { industry: identity.industry, department: identity.department },
    base_version: BASE_SCHEMA_VERSION,
    schema_version: GMAIL_DELTA_VERSION,
    generator: "deterministic",
    source_shape_hash: sourceHash,
    deltas,
    rejected,
  };
}
