/**
 * JSON Handoff Adapter
 *
 * Serializes a HandoffPackage to canonical JSON for:
 * - Direct download as .json file
 * - HTTP POST to a customer-supplied endpoint
 *
 * Preserves governance stamp byte-for-byte (JSON.stringify is deterministic
 * for the same input object structure).
 *
 * Phase 5 Task 19
 * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6
 */

import type { HandoffPackage } from "@integratewise/types/handoff";
import type { HandoffAdapter, DispatchTarget, DispatchResult } from "./types";

export const JsonAdapter: HandoffAdapter = {
  name: "json",

  serialize(pkg: HandoffPackage): string {
    return JSON.stringify(pkg, null, 2);
  },

  async dispatch(pkg: HandoffPackage, target: DispatchTarget): Promise<DispatchResult> {
    if (target.mode === "download") {
      return {
        kind: "download",
        filename: `handoff-${pkg.package_id}.json`,
        body: this.serialize(pkg),
      };
    }

    if (!target.url) {
      throw new Error("endpoint mode requires a url");
    }

    const res = await fetch(target.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": pkg.idempotency_key,
      },
      body: this.serialize(pkg),
    });

    return {
      kind: "endpoint",
      status: res.status,
      dispatched_at: new Date().toISOString(),
    };
  },
};
