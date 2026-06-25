import type { HandoffPackage } from "@integratewise/types";
import type { HandoffAdapter, DispatchResult } from "./types.js";

/**
 * JSON Handoff Adapter — serializes the canonical HandoffPackage to JSON
 * and dispatches via download or HTTP POST to an endpoint.
 */
export const JsonAdapter: HandoffAdapter = {
  name: "json",

  serialize(pkg: HandoffPackage): string {
    return JSON.stringify(pkg, null, 2);
  },

  async dispatch(
    pkg: HandoffPackage,
    target: { mode: "download" | "endpoint"; url?: string }
  ): Promise<DispatchResult> {
    if (target.mode === "download") {
      return {
        kind: "download",
        filename: `handoff-${pkg.package_id}.json`,
        body: this.serialize(pkg),
      };
    }

    if (!target.url) {
      throw new Error("endpoint mode requires url");
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
