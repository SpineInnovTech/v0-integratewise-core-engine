import { callSpineTool, SpineError } from "../connectors/spine";
import type { CanonicalRecord } from "@workspace/spine-schema";
import { listProposalsByEntity } from "../repositories/spine-proposals";

const TENANT_ID = process.env["SPINE_TENANT_ID"] ?? "iw-customer-zero";

type VerificationState =
  | "materialized"
  | "approved_pending_materialization"
  | "proposed_pending_review"
  | "not_proposed"
  | "unknown";

export interface VerificationItem {
  entity_type: string;
  external_id: string;
  state: VerificationState;
  detail: string;
  spine_hit: boolean;
}

export interface VerificationReport {
  tenant_id: string;
  spine_reachable: boolean;
  checked: number;
  materialized: number;
  pending: number;
  not_proposed: number;
  items: VerificationItem[];
  detail: string;
}

function resultMentions(result: unknown, needle: string): boolean {
  try {
    return JSON.stringify(result).toLowerCase().includes(needle.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Honest read-back: try to find each record in the platform Spine via
 * spine.entity.search. If found → materialized. If only a local proposal exists,
 * report it as approved-but-pending or pending-review — NEVER claim success the
 * platform hasn't confirmed. If the read path is down, say so.
 */
export async function verifyRecords(
  records: CanonicalRecord[],
  tenantId: string = TENANT_ID,
): Promise<VerificationReport> {
  const items: VerificationItem[] = [];
  let spineReachable = true;
  let reachDetail = "";

  for (const rec of records) {
    const proposals = await listProposalsByEntity(
      rec.entity_type,
      rec.external_id,
    );
    const latest = proposals[0];

    let hit = false;
    try {
      const result = await callSpineTool("spine.entity.search", {
        tenant_id: tenantId,
        q: rec.external_id,
        entity_type: rec.entity_type,
        limit: 5,
      });
      hit = resultMentions(result, rec.external_id);
    } catch (err) {
      spineReachable = false;
      reachDetail =
        err instanceof SpineError ? err.message : "spine read-back unavailable";
    }

    let state: VerificationState;
    let detail: string;
    if (hit) {
      state = "materialized";
      detail = "found in Spine via spine.entity.search";
    } else if (latest?.status === "approved") {
      state = "approved_pending_materialization";
      detail =
        "proposal approved but not yet visible as a Spine entity (platform may lag)";
    } else if (latest) {
      state = "proposed_pending_review";
      detail = `proposal ${latest.proposalId ?? "(no id)"} awaiting HITL approval`;
    } else {
      state = "not_proposed";
      detail = "no local proposal recorded for this entity";
    }

    items.push({
      entity_type: rec.entity_type,
      external_id: rec.external_id,
      state,
      detail,
      spine_hit: hit,
    });
  }

  return {
    tenant_id: tenantId,
    spine_reachable: spineReachable,
    checked: items.length,
    materialized: items.filter((i) => i.state === "materialized").length,
    pending: items.filter(
      (i) =>
        i.state === "approved_pending_materialization" ||
        i.state === "proposed_pending_review",
    ).length,
    not_proposed: items.filter((i) => i.state === "not_proposed").length,
    items,
    detail: spineReachable
      ? "read-back via spine.entity.search"
      : `read-back degraded: ${reachDetail}`,
  };
}
