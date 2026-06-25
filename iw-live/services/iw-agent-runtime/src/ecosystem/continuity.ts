/**
 * Twin → Continuity client (spine-hydration-lifecycle Wave 6 / R8, R20).
 *
 * The Twin reads its PRIMARY operating context from governed Continuity
 * (assembled from promoted Memory in the continuity service), never from raw
 * connector/tool APIs. This module calls the continuity assembler endpoint.
 */

import type { Env } from "../types";

export type ContinuityScope = "org" | "team" | "role" | "personal";

export interface ContinuityMemory {
  id: string;
  topic: string;
  category: string;
  content: string;
  confidence: number | null;
  updatedAt: string;
  lineageRef: string | null;
}

export interface ContinuityBundle {
  tenantId: string;
  role: string | null;
  scopes: Record<ContinuityScope, ContinuityMemory[]>;
  counts: Record<ContinuityScope, number>;
  totalMemories: number;
  generatedAt: string;
  twinContext?: Record<string, unknown>;
  activationThresholds?: { minMemories: number; minSignals: number; requireCreamy: boolean };
}

export async function assembleContinuity(
  env: Env,
  tenantId: string,
  opts?: { userId?: string; role?: string; limit?: number }
): Promise<ContinuityBundle | null> {
  if (!env.CONTINUITY) return null;
  const qs = new URLSearchParams();
  if (opts?.userId) qs.set("user_id", opts.userId);
  if (opts?.role) qs.set("role", opts.role);
  if (opts?.limit) qs.set("limit", String(opts.limit));

  try {
    const res = await env.CONTINUITY.fetch(
      `http://internal/v1/continuity/assemble?${qs.toString()}`,
      {
        method: "GET",
        headers: {
          "x-tenant-id": tenantId,
          ...(opts?.userId ? { "x-user-id": opts.userId } : {}),
        },
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as ContinuityBundle;
  } catch {
    return null;
  }
}

/**
 * Format a Continuity bundle into grounding text for the Twin's system prompt.
 * Empty bundle → "" (the caller reports the gap rather than inventing context).
 */
export function continuityContext(bundle: ContinuityBundle | null): string {
  if (!bundle || bundle.totalMemories === 0) return "";
  const lines: string[] = ["Continuity (governed memory — primary grounding):"];
  const sections: Array<[ContinuityScope, string]> = [
    ["org", "Org memory"],
    ["role", "Role memory"],
    ["team", "Team memory"],
    ["personal", "Personal memory"],
  ];
  for (const [scope, label] of sections) {
    const items = bundle.scopes[scope] || [];
    if (!items.length) continue;
    lines.push(`- ${label} (${items.length}):`);
    for (const m of items.slice(0, 8)) {
      lines.push(`  • [${m.category}] ${m.topic}: ${m.content}`);
    }
  }
  return lines.join("\n");
}
