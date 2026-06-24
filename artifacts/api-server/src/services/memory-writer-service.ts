import { createHash } from "node:crypto";
import {
  type InsertMemoryAtomRow,
  type MemoryAtomRow,
  type MemoryProvenance,
  type MemorySource,
  type SubjectRef,
} from "@workspace/db";
import { insertAtomIdempotent } from "../repositories/memory-atoms";
import { embed } from "./embedding-service";

// memory-writer-service.remember() is the single doorway through which the
// contextual memory GROWS. Every connector (Gmail), the Twin, and manual notes
// funnel through here so the memory compounds in ONE shape and never duplicates:
// the idempotency_key (tenant|subject|kind|connector|external_id|body_hash) means
// re-ingesting the same fact deepens coverage instead of inflating it.

const DEFAULT_TENANT = process.env["SPINE_TENANT_ID"] ?? "iw-customer-zero";

export type MemoryKind =
  | "fact"
  | "interaction"
  | "decision"
  | "signal"
  | "preference";

export interface RememberInput {
  tenantId?: string;
  subjectRef: SubjectRef;
  kind: MemoryKind;
  title: string;
  body: string;
  source?: MemorySource;
  goalRefs?: string[];
  salience?: number;
  entityRef?: Record<string, unknown> | null;
  expiresAt?: string | null;
}

export interface RememberResult {
  atom: MemoryAtomRow;
  created: boolean;
  embedding: { available: boolean; reason: string };
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function buildIdempotencyKey(
  tenantId: string,
  subjectType: string,
  subjectId: string,
  kind: string,
  source: MemorySource,
  bodyHash: string,
): string {
  const connector = source.connector ?? "manual";
  const ext = source.external_id ?? source.source_id ?? "";
  return sha256(
    [tenantId, subjectType, subjectId, kind, connector, ext, bodyHash].join("|"),
  );
}

export async function remember(input: RememberInput): Promise<RememberResult> {
  const tenantId = input.tenantId ?? input.subjectRef.tenant_id ?? DEFAULT_TENANT;
  const subjectType = input.subjectRef.entity_type;
  const subjectId = input.subjectRef.entity_id;
  const source = input.source ?? {};
  const bodyHash = sha256(input.body);
  const idempotencyKey = buildIdempotencyKey(
    tenantId,
    subjectType,
    subjectId,
    input.kind,
    source,
    bodyHash,
  );

  // Best-effort embedding; honest about availability, never blocks the write.
  const emb = await embed(`${input.title}\n${input.body}`);

  const provenance: MemoryProvenance = {
    evidence_chain: [
      `connector=${source.connector ?? "manual"}`,
      source.external_id
        ? `external_id=${source.external_id}`
        : `source_id=${source.source_id ?? "n/a"}`,
      `body_sha256=${bodyHash.slice(0, 12)}`,
      `embedding=${emb.available ? "vector" : "lexical-fallback"}`,
    ],
  };

  const values: InsertMemoryAtomRow = {
    tenantId,
    subjectType,
    subjectId,
    subjectRef: { ...input.subjectRef, tenant_id: tenantId },
    entityRef: input.entityRef ?? null,
    kind: input.kind,
    title: input.title,
    body: input.body,
    source,
    goalRefs: input.goalRefs ?? [],
    salience: input.salience ?? 0.5,
    embedding: emb.vector,
    provenance,
    idempotencyKey,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  };

  const { row, created } = await insertAtomIdempotent(values);
  return {
    atom: row,
    created,
    embedding: { available: emb.available, reason: emb.reason },
  };
}
