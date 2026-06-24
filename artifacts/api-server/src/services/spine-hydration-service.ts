import { createHash } from "node:crypto";
import { callSpineToolGoverned, SpineError } from "../connectors/spine";
import type { CanonicalRecord } from "@workspace/spine-schema";
import {
  findByIdempotencyKey,
  insertProposal,
  updateProposalStatus,
} from "../repositories/spine-proposals";

const TENANT_ID = process.env["SPINE_TENANT_ID"] ?? "iw-customer-zero";

// The live Spine memory.propose content_type is a fixed enum. We classify each
// canonical record into the closest valid memory class: a human is a
// `relationship`; everything else ingested from a connector is an
// `external_signal`. (Verified against the platform's rejection of "entity".)
const PERSON_ENTITIES = new Set(["contact", "person", "customer", "lead"]);
function contentTypeFor(entityType: string): string {
  return PERSON_ENTITIES.has(entityType) ? "relationship" : "external_signal";
}

export interface HydrateOptions {
  tenantId?: string;
  dryRun?: boolean;
  approve?: boolean;
}

type HydrationStatus =
  | "would_propose"
  | "already_proposed"
  | "proposed"
  | "approved"
  | "error";

export interface HydrationItem {
  entity_type: string;
  external_id: string;
  idempotency_key: string;
  status: HydrationStatus;
  proposal_id: string | null;
  detail: string;
  propose_args?: Record<string, unknown>;
}

export interface HydrationReport {
  tenant_id: string;
  mode: "dry_run" | "propose" | "propose_approve";
  total: number;
  proposed: number;
  already: number;
  approved: number;
  errors: number;
  items: HydrationItem[];
}

/** Stable hash of the extracted field VALUES (order-independent). */
function payloadHash(rec: CanonicalRecord): string {
  const sorted = Object.keys(rec.priority_fields)
    .sort()
    .reduce<Record<string, unknown>>((o, k) => {
      o[k] = rec.priority_fields[k];
      return o;
    }, {});
  return createHash("sha256").update(JSON.stringify(sorted)).digest("hex");
}

function idemKey(tenantId: string, rec: CanonicalRecord, pHash: string): string {
  return createHash("sha256")
    .update(
      [
        tenantId,
        rec.source.connector,
        rec.entity_type,
        rec.external_id,
        rec.schema_version,
        pHash,
      ].join("|"),
    )
    .digest("hex");
}

function buildProposeArgs(
  tenantId: string,
  rec: CanonicalRecord,
): Record<string, unknown> {
  const label =
    rec.priority_fields["full_name"] ??
    rec.priority_fields["subject"] ??
    rec.external_id;
  return {
    tenant_id: tenantId,
    content_type: contentTypeFor(rec.entity_type),
    title: `${rec.entity_type}: ${String(label)}`,
    body: JSON.stringify({
      entity_type: rec.entity_type,
      external_id: rec.external_id,
      schema_version: rec.schema_version,
      fields: rec.priority_fields,
    }),
    target_layer: "entity",
    target_entity_type: rec.entity_type,
    target_entity_id: rec.external_id,
    confidence: 0.9,
    source_context: `connector=${rec.source.connector} source_id=${rec.source.source_id} schema=${rec.schema_version} dept=${rec.department} industry=${rec.industry_relevance}`,
    evidence_chain: [
      `connector=${rec.source.connector}`,
      `source_id=${rec.source.source_id}`,
      `schema_version=${rec.schema_version}`,
      `external_id=${rec.external_id}`,
    ],
    tags: ["customer-zero", rec.source.connector, rec.entity_type],
  };
}

/** The MCP tools/call result is untrusted — parse defensively for a proposal id. */
function extractProposalId(result: unknown): string | null {
  const fromObj = (o: unknown): string | null => {
    if (o && typeof o === "object") {
      const rec = o as Record<string, unknown>;
      for (const k of ["proposal_id", "proposalId", "id"]) {
        const v = rec[k];
        if (typeof v === "string") return v;
        if (typeof v === "number") return String(v);
      }
    }
    return null;
  };
  const r = result as Record<string, unknown> | null;
  let id = fromObj(r) ?? fromObj(r?.["structuredContent"]);
  if (id) return id;
  const content = r?.["content"];
  if (Array.isArray(content)) {
    for (const part of content) {
      const p = part as Record<string, unknown>;
      if (p?.["type"] === "text" && typeof p["text"] === "string") {
        try {
          id = fromObj(JSON.parse(p["text"] as string));
          if (id) return id;
        } catch {
          // non-JSON text content — ignore
        }
      }
    }
  }
  return null;
}

function asRecord(result: unknown): Record<string, unknown> {
  return result && typeof result === "object"
    ? (result as Record<string, unknown>)
    : { raw: String(result) };
}

/**
 * Governed hydration: turn canonical records into Spine proposals via the ONLY
 * sanctioned write path (memory.propose), recording each in the local
 * idempotency ledger so re-runs never double-propose. With approve=true it also
 * runs proposal.approve (HITL relaxed until Customer Zero is live). dryRun emits
 * the would-be proposal args without any write.
 */
export async function hydrateRecords(
  records: CanonicalRecord[],
  opts: HydrateOptions = {},
): Promise<HydrationReport> {
  const tenantId = opts.tenantId ?? TENANT_ID;
  const dryRun = opts.dryRun ?? false;
  const approve = opts.approve ?? false;
  const mode: HydrationReport["mode"] = dryRun
    ? "dry_run"
    : approve
      ? "propose_approve"
      : "propose";
  const items: HydrationItem[] = [];

  for (const rec of records) {
    const pHash = payloadHash(rec);
    const key = idemKey(tenantId, rec, pHash);
    const proposeArgs = buildProposeArgs(tenantId, rec);

    const existing = await findByIdempotencyKey(key);
    if (existing) {
      items.push({
        entity_type: rec.entity_type,
        external_id: rec.external_id,
        idempotency_key: key,
        status: "already_proposed",
        proposal_id: existing.proposalId ?? null,
        detail: `idempotent: already ${existing.status}`,
      });
      continue;
    }

    if (dryRun) {
      items.push({
        entity_type: rec.entity_type,
        external_id: rec.external_id,
        idempotency_key: key,
        status: "would_propose",
        proposal_id: null,
        detail: "dry run — no Spine write performed",
        propose_args: proposeArgs,
      });
      continue;
    }

    try {
      const result = await callSpineToolGoverned("memory.propose", proposeArgs);
      const proposalId = extractProposalId(result);
      const row = await insertProposal({
        idempotencyKey: key,
        tenantId,
        connectorName: rec.source.connector,
        entityType: rec.entity_type,
        externalId: rec.external_id,
        schemaVersion: rec.schema_version,
        payloadHash: pHash,
        proposalId,
        status: "proposed",
        spineResponse: asRecord(result),
      });

      let status: HydrationStatus = "proposed";
      let detail = proposalId
        ? `proposed ${proposalId}`
        : "proposed (platform returned no id)";

      if (approve && proposalId) {
        try {
          const appr = await callSpineToolGoverned("proposal.approve", {
            tenant_id: tenantId,
            proposal_id: proposalId,
            review_notes:
              "Customer Zero governed ingest auto-approval (doctrine relaxed until live).",
          });
          await updateProposalStatus(row.id, "approved", asRecord(appr));
          status = "approved";
          detail = `approved ${proposalId}`;
        } catch (err) {
          detail = `proposed ${proposalId}; approve failed: ${err instanceof SpineError ? err.message : "error"}`;
        }
      }

      items.push({
        entity_type: rec.entity_type,
        external_id: rec.external_id,
        idempotency_key: key,
        status,
        proposal_id: proposalId,
        detail,
      });
    } catch (err) {
      items.push({
        entity_type: rec.entity_type,
        external_id: rec.external_id,
        idempotency_key: key,
        status: "error",
        proposal_id: null,
        detail:
          err instanceof SpineError
            ? `${err.code}: ${err.message}`
            : "memory.propose failed",
      });
    }
  }

  return {
    tenant_id: tenantId,
    mode,
    total: items.length,
    proposed: items.filter((i) => i.status === "proposed").length,
    already: items.filter((i) => i.status === "already_proposed").length,
    approved: items.filter((i) => i.status === "approved").length,
    errors: items.filter((i) => i.status === "error").length,
    items,
  };
}
