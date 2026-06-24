import {
  resolveCanonicalIndustry,
  CUSTOMER_ZERO_IDENTITY,
  type CanonicalRecord,
} from "@workspace/spine-schema";
import type { SchemaPoolRow } from "@workspace/db";
import type { NormalizedEmail } from "../connectors/gmail";
import { getActiveDeltas } from "../repositories/schema-pool";
import { GMAIL_CONNECTOR, CONTACT_LINK_FIELD } from "./schema-ai-service";

export interface NormalizeIdentity {
  industry: string;
  department: string;
}

export interface NormalizeResult {
  identity: {
    industry: string;
    canonical_industry: string | null;
    department: string;
  };
  applied_deltas: { role: string; entity_type: string; schema_version: string }[];
  people: CanonicalRecord[];
  interactions: CanonicalRecord[];
  skipped: { role: string; reason: string }[];
}

/** Apply an active delta's canonical_mapping + literals to a single email. */
function applyDelta(
  email: NormalizedEmail,
  delta: SchemaPoolRow,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const src = email as unknown as Record<string, unknown>;
  for (const [from, to] of Object.entries(delta.canonicalMapping)) {
    const v = src[from];
    if (v !== undefined && v !== null && v !== "") out[to] = v;
  }
  const literals = (delta.schemaBody["literals"] ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(literals)) out[k] = v;
  return out;
}

function roleOf(delta: SchemaPoolRow): string {
  return String(delta.schemaBody["role"] ?? "");
}

/**
 * Schema-first normalization: apply the ACTIVE Gmail deltas to a batch of
 * emails, producing canonical records harmonized to the entity types the
 * resolved Spine config actually declares (e.g. contact + engagement). People
 * are deduped by sender email; interactions are 1:1 with messages and carry a
 * stable link back to their person. If a role has no active delta, that branch
 * is honestly skipped (run schema generation first).
 */
export async function normalizeGmail(
  emails: NormalizedEmail[],
  identity: NormalizeIdentity = CUSTOMER_ZERO_IDENTITY,
): Promise<NormalizeResult> {
  const canonicalIndustry = resolveCanonicalIndustry(identity.industry);
  const industryRelevance = canonicalIndustry ?? identity.industry;
  const active = await getActiveDeltas(GMAIL_CONNECTOR);
  const personDelta = active.find((d) => roleOf(d) === "person");
  const interactionDelta = active.find((d) => roleOf(d) === "interaction");

  const applied: NormalizeResult["applied_deltas"] = [];
  const skipped: NormalizeResult["skipped"] = [];
  const people: CanonicalRecord[] = [];
  const interactions: CanonicalRecord[] = [];

  const personEntity = personDelta?.entityType ?? "contact";
  const personExternalId = (emailLower: string): string =>
    `${GMAIL_CONNECTOR}:${personEntity}:${emailLower}`;

  // ---- people (dedupe by sender email) ----
  if (personDelta) {
    applied.push({
      role: "person",
      entity_type: personDelta.entityType,
      schema_version: personDelta.schemaVersion,
    });
    const byEmail = new Map<string, NormalizedEmail[]>();
    for (const e of emails) {
      const key = (e.sender_email ?? "").trim().toLowerCase();
      if (!key) continue;
      const arr = byEmail.get(key);
      if (arr) arr.push(e);
      else byEmail.set(key, [e]);
    }
    for (const [key, group] of byEmail) {
      const newest = group.reduce((a, b) =>
        a.received_at >= b.received_at ? a : b,
      );
      people.push({
        entity_type: personDelta.entityType,
        priority_fields: applyDelta(newest, personDelta),
        department: identity.department,
        industry_relevance: industryRelevance,
        schema_version: personDelta.schemaVersion,
        external_id: personExternalId(key),
        source: { connector: GMAIL_CONNECTOR, source_id: key },
      });
    }
  } else {
    skipped.push({
      role: "person",
      reason: "no active gmail person delta — POST /api/schema/deltas/gmail/generate first",
    });
  }

  // ---- interactions (one per message) ----
  if (interactionDelta) {
    applied.push({
      role: "interaction",
      entity_type: interactionDelta.entityType,
      schema_version: interactionDelta.schemaVersion,
    });
    const linkField =
      (interactionDelta.schemaBody["link_field"] as string | undefined) ??
      CONTACT_LINK_FIELD;
    const seen = new Set<string>();
    for (const e of emails) {
      if (!e.id || seen.has(e.id)) continue;
      seen.add(e.id);
      const fields = applyDelta(e, interactionDelta);
      const emailLower = (e.sender_email ?? "").trim().toLowerCase();
      if (emailLower) fields[linkField] = personExternalId(emailLower);
      interactions.push({
        entity_type: interactionDelta.entityType,
        priority_fields: fields,
        department: identity.department,
        industry_relevance: industryRelevance,
        schema_version: interactionDelta.schemaVersion,
        external_id: `${GMAIL_CONNECTOR}:${interactionDelta.entityType}:${e.id}`,
        source: { connector: GMAIL_CONNECTOR, source_id: e.id },
      });
    }
  } else {
    skipped.push({
      role: "interaction",
      reason:
        "no active gmail interaction delta — POST /api/schema/deltas/gmail/generate first",
    });
  }

  return {
    identity: {
      industry: identity.industry,
      canonical_industry: canonicalIndustry,
      department: identity.department,
    },
    applied_deltas: applied,
    people,
    interactions,
    skipped,
  };
}
