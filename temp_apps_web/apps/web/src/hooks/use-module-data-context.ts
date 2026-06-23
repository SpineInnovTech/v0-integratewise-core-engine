/**
 * useModuleDataContext — Bridges SpineProvider readiness into ModuleData
 * for the ContentRouter density scorer.
 *
 * Returns ModuleData when readiness is available, undefined otherwise.
 * Dashboard modules are excluded (always render).
 */
import { useMemo } from "react";
import { useSpine } from "@/components/l2/spine/spine-client";
import type { ModuleData } from "@/components/l1/workspace/data-density-scorer";

const ALWAYS_RENDER_MODULES = new Set(["dashboard", "settings", "fabric-admin"]);

export function useModuleDataContext(domain: string, moduleId: string): ModuleData | undefined {
  const { readiness } = useSpine();

  return useMemo(() => {
    // Dashboard and system modules always render — skip density check
    if (ALWAYS_RENDER_MODULES.has(moduleId)) return undefined;

    // No readiness data yet — skip density check (let module render)
    if (!readiness) return undefined;

    // Find the department readiness for this domain
    const deptKey = domain === "PERSONAL" ? "PERSONAL" : domain;
    const dept = readiness[deptKey] || readiness[deptKey.toLowerCase()];
    if (!dept) return undefined;

    // Map readiness buckets to ModuleData shape
    const liveBuckets = dept.buckets.filter((b) => b.state === "live" || b.state === "seeded");
    const addingBuckets = dept.buckets.filter((b) => b.state === "adding");

    // Entities: approximate from bucket scores (each live bucket ≈ entities present)
    const entityProxy = liveBuckets.map((b) => ({ id: b.capability, score: b.score }));
    // Metrics: buckets with score > 50 likely have metrics
    const metricProxy = liveBuckets.filter((b) => b.score >= 50).map((b) => ({ id: b.capability }));
    // Goal links: not tracked per-bucket, use overall score as proxy
    const goalProxy = dept.overallScore >= 60 ? [{ id: "goal" }] : [];
    // Freshness: use current time if any bucket is live, otherwise stale
    const lastUpdate =
      liveBuckets.length > 0 || addingBuckets.length > 0 ? Date.now() : Date.now() - 8 * 86400000; // 8 days ago = stale

    return {
      entities: entityProxy,
      metrics: metricProxy,
      goalLinks: goalProxy,
      lastUpdate,
    };
  }, [readiness, domain, moduleId]);
}
