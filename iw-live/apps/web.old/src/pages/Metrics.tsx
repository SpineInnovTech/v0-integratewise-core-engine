/**
 * Founder Metrics — Cloudflare Stack Monitoring
 *
 * The "systems view nobody sees": the full edge topology (Workers, data-layer
 * bindings, Spine partitions, memory lifecycle, two-layer security model) with
 * LIVE status overlaid from the real admin/health contract:
 *
 *   GET /api/v1/health            → gateway + binding probes (public-ish)
 *   GET /admin/v1/workers/health  → per-worker status, latency, version (founder)
 *   GET /admin/v1/system/stats    → tenant / spine / memory counts (founder)
 *
 * Design: resilient. The static topology always renders so the founder sees the
 * whole stack even when an endpoint is unauthorized or down; live data lights up
 * each cell as it arrives. Polls every 15s.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  Brain,
  Database,
  GitBranch,
  HardDrive,
  Layers,
  Lock,
  RefreshCw,
  Server,
  Shield,
  Workflow,
  Zap,
} from "lucide-react";
import { gatewayClient } from "../lib/gateway-client";

// ─────────────────────────────────────────────────────────────────────────────
// Types — intentionally loose. The contract may add fields; we degrade, not crash.
// ─────────────────────────────────────────────────────────────────────────────

type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

interface WorkerHealth {
  name?: string;
  service?: string;
  status?: string;
  latency_ms?: number;
  latencyMs?: number;
  version?: string;
  error?: string;
}

interface WorkersHealthResponse {
  workers?: WorkerHealth[];
  services?: WorkerHealth[] | Record<string, WorkerHealth>;
  healthy?: number;
  total?: number;
  timestamp?: string;
}

interface SystemStats {
  tenants?: number;
  tenant_count?: number;
  users?: number;
  user_count?: number;
  entities?: number;
  entity_count?: number;
  signals?: number;
  partitions?: Record<string, number>;
  spine?: Record<string, number>;
  memory?: Record<string, number>;
}

interface GatewayHealth {
  status?: string;
  version?: string;
  edge_region?: string;
  colo?: string;
  region?: string;
  services?: Record<string, { status?: string; latency_ms?: number }>;
  bindings?: Record<string, boolean | string>;
  checks?: Record<string, boolean | string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static stack topology — verified from services/*/wrangler.toml. This is the
// canonical edge map; live status overlays onto it.
// ─────────────────────────────────────────────────────────────────────────────

const WORKERS: { key: string; label: string; role: string; icon: typeof Server }[] = [
  { key: "gateway", label: "Gateway", role: "The Contract · auth · routing", icon: Shield },
  { key: "pipeline", label: "Pipeline", role: "Sole Spine writer · normalize", icon: GitBranch },
  { key: "intelligence", label: "Intelligence", role: "Reasoning · model router", icon: Brain },
  { key: "knowledge", label: "Knowledge", role: "Memory · triage · consolidate", icon: Layers },
  { key: "continuity", label: "Continuity", role: "Memory lifecycle engine", icon: Activity },
  { key: "connector", label: "Connector", role: "Tool ingestion", icon: Workflow },
  { key: "mcp-connector", label: "MCP Connector", role: "MCP server · Zero Trust", icon: Boxes },
  { key: "iw-agent-runtime", label: "Agent Runtime", role: "Twin · Durable Objects", icon: Server },
  { key: "webhook-ingress", label: "Webhook Ingress", role: "Inbound event capture", icon: Zap },
];

const DATA_LAYER: { key: string; label: string; detail: string; icon: typeof Database }[] = [
  { key: "d1", label: "D1 · Spine", detail: "integratewise-spine-cache (canonical truth)", icon: Database },
  { key: "kv", label: "KV", detail: "Sessions · rate limits · hot projections", icon: HardDrive },
  { key: "r2", label: "R2", detail: "Raw payloads · artifacts · audit logs", icon: HardDrive },
  { key: "vectorize", label: "Vectorize", detail: "Embeddings · semantic index", icon: Boxes },
  { key: "queues", label: "Queues", detail: "memory-consolidation · knowledge-ingest", icon: Workflow },
  { key: "do", label: "Durable Objects", detail: "TwinAgent · TenantBrainDO", icon: Brain },
  { key: "ai_search", label: "AI Search", detail: "Full-text + vector RAG", icon: Layers },
];

const PARTITIONS: { key: string; label: string; domain: string }[] = [
  { key: "decide_data", label: "decide_data", domain: "Strategy · OKR · decisions" },
  { key: "build_data", label: "build_data", domain: "Work · tasks · documents" },
  { key: "grow_data", label: "grow_data", domain: "Revenue · accounts · tickets" },
  { key: "run_data", label: "run_data", domain: "Operations · metrics" },
  { key: "cross_data", label: "cross_data", domain: "Signals · episodes · learnings" },
];

const MEMORY_STAGES: { key: string; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "triaged", label: "Triaged" },
  { key: "promoted", label: "Promoted" },
  { key: "org_memory", label: "Org Memory" },
  { key: "aging", label: "Aging" },
  { key: "archived", label: "Archived" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function normStatus(raw?: string): HealthStatus {
  if (!raw) return "unknown";
  const s = raw.toLowerCase();
  if (["healthy", "ok", "up", "ready", "live", "active", "true"].includes(s)) return "healthy";
  if (["degraded", "warning", "partial", "slow"].includes(s)) return "degraded";
  if (["down", "error", "unhealthy", "fail", "failed", "false"].includes(s)) return "down";
  return "unknown";
}

function statusStyles(s: HealthStatus): { dot: string; text: string; chip: string } {
  switch (s) {
    case "healthy":
      return { dot: "bg-iw-forest-bright", text: "text-iw-forest", chip: "bg-iw-forest/10 text-iw-forest" };
    case "degraded":
      return { dot: "bg-iw-gold", text: "text-iw-gold", chip: "bg-iw-gold/15 text-iw-gold" };
    case "down":
      return { dot: "bg-iw-red", text: "text-iw-red", chip: "bg-iw-red/10 text-iw-red" };
    default:
      return { dot: "bg-iw-rule", text: "text-iw-slate", chip: "bg-iw-paper-deep text-iw-slate" };
  }
}

function num(...vals: (number | undefined)[]): number | undefined {
  for (const v of vals) if (typeof v === "number" && !Number.isNaN(v)) return v;
  return undefined;
}

/** Flatten the various worker-health shapes into a name→record map. */
function indexWorkers(resp?: WorkersHealthResponse): Record<string, WorkerHealth> {
  const out: Record<string, WorkerHealth> = {};
  if (!resp) return out;
  const list: WorkerHealth[] = [];
  if (Array.isArray(resp.workers)) list.push(...resp.workers);
  if (Array.isArray(resp.services)) list.push(...resp.services);
  else if (resp.services && typeof resp.services === "object") {
    for (const [k, v] of Object.entries(resp.services)) list.push({ name: k, ...(v as WorkerHealth) });
  }
  for (const w of list) {
    const name = (w.name || w.service || "").toString().toLowerCase().replace(/^integratewise-/, "");
    if (name) out[name] = w;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function Metrics() {
  const [gateway, setGateway] = useState<GatewayHealth | null>(null);
  const [workers, setWorkers] = useState<Record<string, WorkerHealth>>({});
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (isPoll = false) => {
    if (isPoll) setRefreshing(true);
    const errs: string[] = [];

    const [gw, wk, st] = await Promise.allSettled([
      gatewayClient.get<GatewayHealth>("/api/v1/health"),
      gatewayClient.get<WorkersHealthResponse>("/admin/v1/workers/health"),
      gatewayClient.get<SystemStats>("/admin/v1/system/stats"),
    ]);

    if (gw.status === "fulfilled") setGateway(gw.value);
    else errs.push("Gateway health unavailable");

    if (wk.status === "fulfilled") setWorkers(indexWorkers(wk.value));
    else errs.push("Worker health requires founder access");

    if (st.status === "fulfilled") setStats(st.value);
    else errs.push("System stats require founder access");

    setErrors(errs);
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
    timer.current = setInterval(() => fetchAll(true), 15_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [fetchAll]);

  // Derived KPIs
  const workerStatuses = WORKERS.map((w) => normStatus(workers[w.key]?.status));
  const healthyCount = workerStatuses.filter((s) => s === "healthy").length;
  const liveCount = Object.keys(workers).length;
  const gatewayStatus = normStatus(gateway?.status);
  const partitionData = stats?.partitions || stats?.spine || {};
  const memoryData = stats?.memory || {};
  const totalEntities = num(stats?.entities, stats?.entity_count);
  const totalTenants = num(stats?.tenants, stats?.tenant_count);

  const avgLatency = (() => {
    const ls = WORKERS.map((w) => num(workers[w.key]?.latency_ms, workers[w.key]?.latencyMs)).filter(
      (v): v is number => typeof v === "number"
    );
    if (!ls.length) return undefined;
    return Math.round(ls.reduce((a, b) => a + b, 0) / ls.length);
  })();

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-9 w-72 bg-iw-rule-light rounded-md animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-iw-paper-warm/60 border border-iw-rule-light rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-iw-paper-warm/40 border border-iw-rule-light rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-iw-sans">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-2xs uppercase tracking-widest text-iw-gold font-iw-mono font-bold">
            <span className="w-1 h-1 rounded-full bg-iw-gold" /> Founder · Tenant 0
          </div>
          <h1 className="text-3xl font-bold text-iw-ink tracking-tight mt-1">Cloudflare Stack</h1>
          <p className="text-sm text-iw-slate-mid mt-1">
            Edge topology and live health across Workers, data bindings, and the Spine.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-2xs text-iw-slate font-iw-mono uppercase">
            <span className="relative flex h-2 w-2">
              {gatewayStatus === "healthy" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-iw-forest opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${statusStyles(gatewayStatus).dot}`} />
            </span>
            Gateway {gatewayStatus}
          </div>
          <button
            onClick={() => fetchAll(true)}
            className="flex items-center gap-1.5 text-xs text-iw-slate-mid hover:text-iw-ink transition-colors font-iw-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Refresh"}
          </button>
        </div>
      </div>

      {/* Access notices (degrade gracefully) */}
      {errors.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-iw-gold/30 bg-iw-gold/5">
          <AlertTriangle className="w-4 h-4 text-iw-gold mt-0.5 shrink-0" />
          <div className="text-sm text-iw-slate-mid">
            <span className="font-semibold text-iw-ink">Partial telemetry.</span> Showing static topology for:{" "}
            {errors.join(" · ")}. Sign in as founder for full live data.
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          label="Workers Healthy"
          value={liveCount > 0 ? `${healthyCount}/${WORKERS.length}` : `—/${WORKERS.length}`}
          icon={Server}
          tone={healthyCount === WORKERS.length ? "good" : healthyCount > 0 ? "warn" : "neutral"}
        />
        <Kpi
          label="Avg Latency"
          value={avgLatency !== undefined ? `${avgLatency}ms` : "—"}
          icon={Zap}
          tone={avgLatency === undefined ? "neutral" : avgLatency < 150 ? "good" : "warn"}
        />
        <Kpi label="Tenants" value={totalTenants !== undefined ? `${totalTenants}` : "—"} icon={Boxes} tone="neutral" />
        <Kpi
          label="Spine Entities"
          value={totalEntities !== undefined ? totalEntities.toLocaleString() : "—"}
          icon={Database}
          tone="neutral"
        />
      </div>

      {/* Workers grid */}
      <Section title="Edge Workers" sub="Service mesh · internal bindings only">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WORKERS.map((w) => {
            const live = workers[w.key];
            const s = normStatus(live?.status);
            const st = statusStyles(s);
            const latency = num(live?.latency_ms, live?.latencyMs);
            const Icon = w.icon;
            return (
              <div
                key={w.key}
                className="p-4 rounded-xl border border-iw-rule bg-iw-paper-warm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-iw-forest/10 text-iw-forest">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-iw-ink text-sm leading-tight">{w.label}</div>
                      <div className="text-3xs text-iw-slate opacity-70 font-iw-mono">{w.key}</div>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-2xs font-bold uppercase px-2 py-0.5 rounded ${st.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {s}
                  </span>
                </div>
                <div className="mt-3 text-xs text-iw-slate-mid">{w.role}</div>
                <div className="mt-2 flex items-center justify-between text-3xs font-iw-mono text-iw-slate opacity-70">
                  <span>{latency !== undefined ? `${latency}ms` : "—"}</span>
                  <span>{live?.version ? `v${live.version}` : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Data layer */}
      <Section title="Data Layer" sub="Durable & owned · Cloudflare-native bindings">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DATA_LAYER.map((d) => {
            const bind = gateway?.bindings || gateway?.checks || {};
            const raw = (bind as Record<string, unknown>)[d.key] ?? (bind as Record<string, unknown>)[d.key.toUpperCase()];
            const s: HealthStatus = raw === undefined ? "unknown" : normStatus(String(raw));
            const st = statusStyles(s);
            const Icon = d.icon;
            return (
              <div key={d.key} className="p-4 rounded-xl border border-iw-rule bg-iw-paper-warm">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-iw-slate/10 text-iw-slate-mid">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                </div>
                <div className="mt-3 font-semibold text-iw-ink text-sm">{d.label}</div>
                <div className="mt-1 text-3xs text-iw-slate-mid leading-snug">{d.detail}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Spine partitions */}
      <Section title="Spine Partitions" sub="5 physical D1 partitions · resolved by getDomainForType()">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PARTITIONS.map((p) => {
            const count = (partitionData as Record<string, number>)[p.key];
            return (
              <div key={p.key} className="p-4 rounded-xl border border-iw-rule bg-iw-paper-warm">
                <div className="text-2xl font-bold text-iw-ink tracking-tight">
                  {typeof count === "number" ? count.toLocaleString() : "—"}
                </div>
                <div className="text-2xs font-iw-mono text-iw-forest mt-1">{p.label}</div>
                <div className="text-3xs text-iw-slate-mid mt-1 leading-snug">{p.domain}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Memory lifecycle */}
      <Section title="Memory Lifecycle" sub="Intake → triage → promote → org memory → aging → archive">
        <div className="flex flex-wrap items-stretch gap-2">
          {MEMORY_STAGES.map((m, i) => {
            const count = (memoryData as Record<string, number>)[m.key];
            return (
              <div key={m.key} className="flex items-center gap-2">
                <div className="px-4 py-3 rounded-xl border border-iw-rule bg-iw-paper-warm min-w-[110px]">
                  <div className="text-xl font-bold text-iw-ink tracking-tight">
                    {typeof count === "number" ? count.toLocaleString() : "—"}
                  </div>
                  <div className="text-2xs uppercase tracking-wider text-iw-slate-mid font-semibold mt-0.5">
                    {m.label}
                  </div>
                </div>
                {i < MEMORY_STAGES.length - 1 && <span className="text-iw-rule text-lg">→</span>}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Two-layer security model */}
      <Section title="Memory Architecture" sub="Two-layer model · Pipeline is the only bridge">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-iw-forest/30 bg-iw-forest/5">
            <div className="flex items-center gap-2 text-iw-forest">
              <Activity className="w-4 h-4" />
              <span className="font-bold text-sm">Operations Layer · Cloudflare</span>
            </div>
            <p className="text-xs text-iw-slate-mid mt-2 leading-relaxed">
              Edge cache + org memory. Readable by external surface agents and models. Live, consolidated, the
              single DB today.
            </p>
            <div className="mt-3 flex items-center gap-2 text-2xs font-iw-mono">
              <span className={`w-2 h-2 rounded-full ${statusStyles(gatewayStatus).dot}`} />
              <span className={statusStyles(gatewayStatus).text}>{gatewayStatus}</span>
            </div>
          </div>
          <div className="p-5 rounded-xl border border-iw-rule bg-iw-paper-deep/40">
            <div className="flex items-center gap-2 text-iw-slate">
              <Lock className="w-4 h-4" />
              <span className="font-bold text-sm">Fortress Layer · usage-gated</span>
            </div>
            <p className="text-xs text-iw-slate-mid mt-2 leading-relaxed">
              Canonical truth with zero direct public access — written only via Pipeline. Allotted by usage, not
              at signup. Hidden by design.
            </p>
            <div className="mt-3 flex items-center gap-2 text-2xs font-iw-mono text-iw-slate opacity-70">
              <span className="w-2 h-2 rounded-full bg-iw-rule" />
              not exposed
            </div>
          </div>
        </div>
      </Section>

      <div className="text-3xs text-iw-slate opacity-50 font-iw-mono text-center pt-4">
        Edge region {gateway?.edge_region || gateway?.colo || gateway?.region || "—"} · gateway v
        {gateway?.version || "—"} · polling 15s
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-iw-forest rounded-full" />
        <div>
          <h2 className="text-lg font-bold text-iw-ink tracking-tight leading-none">{title}</h2>
          {sub && <p className="text-2xs text-iw-slate-mid font-iw-mono mt-1">{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Server;
  tone: "good" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "bg-iw-forest/10 text-iw-forest"
      : tone === "warn"
        ? "bg-iw-gold/15 text-iw-gold"
        : "bg-iw-slate/10 text-iw-slate-mid";
  return (
    <div className="relative p-5 rounded-xl border border-iw-rule bg-iw-paper-warm shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold tracking-tight text-iw-ink">{value}</div>
          <div className="text-2xs text-iw-slate mt-1 uppercase tracking-wider font-semibold opacity-70">
            {label}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${toneClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
