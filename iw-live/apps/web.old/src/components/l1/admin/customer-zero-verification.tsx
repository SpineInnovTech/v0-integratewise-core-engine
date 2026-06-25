/**
 * Customer Zero Verification Dashboard
 *
 * Founder-only mission control for the real data chain.
 * Shows exactly where a tenant's onboarding/hydration/continuity/twin stops.
 *
 * NOT customer facing. Pure observability.
 */

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

interface VerificationState {
  tenantId: string;
  generatedAt: string;
  identity: any;
  connectors: any[];
  hydration: any;
  spine: Record<string, number>;
  memory: any;
  continuity: any;
  twin: any;
}

export function CustomerZeroVerification({
  defaultTenant = "iw-customer-zero",
}: {
  defaultTenant?: string;
}) {
  const [tenantId, setTenantId] = useState(defaultTenant);
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (tid: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<any>(
        `/api/v1/workspace/verification?tenant_id=${encodeURIComponent(tid)}`,
        {},
        "CustomerZeroVerification"
      );
      setState(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load verification state");
      setState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tenantId);
  }, []);

  const handleLoad = () => load(tenantId);

  const checklist = state?.checklist || [];
  const stages = state?.stages || {};

  return (
    <div className="p-6 max-w-5xl mx-auto font-iw-sans text-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-iw-forest">Customer Zero Verification</h1>
          <p className="text-muted-foreground mt-1">
            Instrumentation surface. Find exactly where the real chain stops.
          </p>
        </div>
        <div className="text-xs px-3 py-1 rounded bg-iw-gold/10 text-iw-gold">Founder only</div>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="border border-border rounded px-3 py-2 flex-1 font-mono text-xs"
          placeholder="tenant_id"
        />
        <button
          onClick={handleLoad}
          disabled={loading}
          className="px-4 py-2 bg-iw-forest text-white rounded hover:bg-iw-forest-mid disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-iw-red/10 border border-iw-red/30 text-iw-red rounded">
          {error}
        </div>
      )}

      {state && (
        <>
          {/* Journey summary - founder-level at a glance */}
          {state.journey && (
            <div className="mb-6 p-4 border border-iw-forest bg-iw-forest/5 rounded-xl text-sm">
              <div className="font-semibold text-iw-forest mb-2">Customer Zero Journey</div>
              <div>Started: {state.journey.started}</div>
              <div>
                Current Stage: <span className="font-medium">{state.journey.currentStage}</span>
              </div>
              <div>Last Successful Stage: {state.journey.lastSuccessfulStage}</div>
              <div>
                Current Blocker: <span className="text-iw-red">{state.journey.currentBlocker}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Elapsed:{" "}
                {Math.floor((Date.now() - new Date(state.generatedAt).getTime()) / 1000 / 60)}m
                (auto on refresh)
              </div>
            </div>
          )}

          {/* Top-level checklist - the control tower */}
          <div className="mb-8 p-4 border border-iw-forest/20 bg-iw-forest/5 rounded-xl">
            <div className="font-semibold mb-3 text-iw-forest">Customer Zero Status</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {checklist.map((item: any) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border ${item.done ? "bg-iw-forest-bright/10 border-iw-forest-bright text-iw-forest" : "bg-white border-border text-muted-foreground"}`}
                >
                  <span>{item.done ? "✅" : "⬜"}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              Overall: {state.overallStatus}
            </div>
          </div>

          {/* Stage 1 - Identity */}
          <Stage title="Stage 1 — Identity" status={stages.identity?.status}>
            {stages.identity?.data ? (
              <div className="text-xs space-y-1">
                <div>
                  <strong>Schema Version:</strong> {stages.identity.data.schemaVersion}
                </div>
                <div>
                  <strong>Industry:</strong> {stages.identity.data.industry}
                </div>
                <div>
                  <strong>Department:</strong> {stages.identity.data.department}
                </div>
                <div>
                  <strong>Connector Priorities:</strong>{" "}
                  {JSON.stringify(stages.identity.data.connectorPriorities)}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">
                Complete profile step to populate.
              </div>
            )}
          </Stage>

          {/* Stage 2 - Connectors */}
          <Stage title="Stage 2 — Connectors" status={stages.connectors?.status}>
            {stages.connectors?.data?.length > 0 ? (
              stages.connectors.data.map((c: any, i: number) => (
                <div key={i} className="text-xs border p-2 rounded mb-1">
                  {c.provider} — {c.flowType} — {c.connected ? "Connected" : "Pending"} (last:{" "}
                  {c.lastSync})
                </div>
              ))
            ) : (
              <div className="text-muted-foreground text-xs">
                Connect at least one real tool (Nango/MCP).
              </div>
            )}
          </Stage>

          {/* Stage 3 - Hydration with Last Creamy Job */}
          <Stage title="Stage 3 — Hydration" status={stages.hydration?.status}>
            {stages.hydration?.data?.lastCreamyJob ? (
              <div className="border p-3 rounded text-xs bg-muted/30">
                <div className="font-semibold mb-1">Last Creamy Job</div>
                <div>Job ID: {stages.hydration.data.lastCreamyJob.jobId}</div>
                <div>Tenant: {stages.hydration.data.lastCreamyJob.tenant}</div>
                <div>Connector: {stages.hydration.data.lastCreamyJob.connector}</div>
                <div>Started: {stages.hydration.data.lastCreamyJob.started}</div>
                <div>Finished: {stages.hydration.data.lastCreamyJob.finished}</div>
                <div>
                  Records Fetched: {stages.hydration.data.lastCreamyJob.recordsFetched ?? "—"}
                </div>
                <div>
                  Records Normalized: {stages.hydration.data.lastCreamyJob.recordsNormalized ?? "—"}
                </div>
                <div>
                  Records Written: {stages.hydration.data.lastCreamyJob.recordsWritten ?? "—"}
                </div>
                <div>
                  Errors: {JSON.stringify(stages.hydration.data.lastCreamyJob.errors || [])}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">
                Trigger after connector. Watch for creamy job.
              </div>
            )}
          </Stage>

          {/* Stage 4 - Spine */}
          <Stage title="Stage 4 — Spine" status={stages.spine?.status}>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {Object.entries(stages.spine?.data || {}).map(([k, v]: any) => (
                <div key={k} className="border p-2 rounded">
                  <div className="text-[10px]">{k}</div>
                  <div className="font-mono text-lg">{v}</div>
                </div>
              ))}
            </div>
          </Stage>

          {/* Last Normalizer Batch */}
          <Stage title="Last Normalizer Batch" status={stages.lastNormalizer?.status}>
            {stages.lastNormalizer?.data ? (
              <div className="border p-3 rounded text-xs bg-muted/30">
                <div>Batch ID: {stages.lastNormalizer.data.batchId}</div>
                <div>Tenant: {stages.lastNormalizer.data.tenant}</div>
                <div>Source: {stages.lastNormalizer.data.source}</div>
                <div>Input Records: {stages.lastNormalizer.data.inputRecords ?? "—"}</div>
                <div>Output Records: {stages.lastNormalizer.data.outputRecords ?? "—"}</div>
                <div>Rejected Records: {stages.lastNormalizer.data.rejectedRecords ?? "—"}</div>
                <div>Last Write: {stages.lastNormalizer.data.lastWrite}</div>
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">
                Appears after normalizer processes creamy data.
              </div>
            )}
          </Stage>

          {/* Stage 5 — Memory */}
          <Stage title="Stage 5 — Memory" status={stages.memory?.status}>
            <div className="text-xs text-muted-foreground">{stages.memory?.data?.note}</div>
            <div>Promotion Audit Count: {stages.memory?.data?.promotionAuditCount || 0}</div>
          </Stage>

          {/* Stage 6 — Continuity */}
          <Stage title="Stage 6 — Continuity (Preview)" status={stages.continuity?.status}>
            <div className="text-xs text-muted-foreground">{stages.continuity?.data?.preview}</div>
          </Stage>

          {/* Stage 7 — Twin (real gate) */}
          <Stage title="Stage 7 — Twin" status={stages.twin?.status}>
            {stages.twin?.data && (
              <div className="border p-3 rounded text-xs bg-muted/30">
                <div>Activated: {stages.twin.data.activated ? "true" : "false"}</div>
                <div className="mt-2">Threshold:</div>
                <div className="pl-2">minMemories: {stages.twin.data.threshold?.minMemories}</div>
                <div className="pl-2">
                  currentMemories: {stages.twin.data.threshold?.currentMemories}
                </div>
                <div className="mt-1">Signals:</div>
                <div className="pl-2">required: {stages.twin.data.signals?.required}</div>
                <div className="pl-2">current: {stages.twin.data.signals?.current}</div>
                {stages.twin.data.reason && (
                  <div className="mt-1">Reason: {stages.twin.data.reason}</div>
                )}
                {stages.twin.data.lastInsight && (
                  <div className="mt-2 border-t pt-1">
                    Last Insight:
                    <br />
                    <span className="text-iw-forest">"{stages.twin.data.lastInsight}"</span>
                  </div>
                )}
              </div>
            )}
          </Stage>

          <div className="text-[10px] text-muted-foreground mt-6 pt-4 border-t">
            Generated {state.generatedAt}. Refresh after each real step.
          </div>
        </>
      )}
    </div>
  );
}

function Stage({
  title,
  status,
  children,
}: {
  title: string;
  status?: string;
  children: React.ReactNode;
}) {
  const color =
    status === "ok" ? "text-iw-forest" : status === "error" ? "text-iw-red" : "text-iw-gold";
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-semibold">{title}</span>
        {status && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${color} bg-current/10`}>{status}</span>
        )}
      </div>
      <div className="pl-1">{children}</div>
    </div>
  );
}

export default CustomerZeroVerification;
