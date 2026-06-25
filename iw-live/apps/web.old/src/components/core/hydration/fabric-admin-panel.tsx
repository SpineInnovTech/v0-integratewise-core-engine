/**
 * Fabric Admin Panel — Real-time Visualization & Editing
 *
 * Provides a comprehensive admin interface for the Hydration Fabric:
 *   1. Provider Health — live status cards for each registered provider
 *   2. Slot Bindings — table of all slot→provider mappings with inline edit
 *   3. Role Gates — visualize role-based access rules
 *   4. Manifest Inspector — raw JSON view with refresh
 *   5. Doppler Config — shows Doppler-configurable slots
 *
 * Accessible from the workspace via Settings or a dedicated admin route.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  Activity,
  Shield,
  Database,
  Plug,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Search,
  Edit3,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Copy,
  Filter,
  Layers,
  GitBranch,
} from "lucide-react";

import { useFabric, useFabricSubscribe } from "./fabric-engine";
import CustomerZeroVerification from "@/components/l1/admin/customer-zero-verification";

import type {
  FabricManifest,
  FabricStatus,
  SlotBinding,
  RoleBinding,
  ProviderConfig,
  HealthStatus,
  HydrationPhase,
  ProviderType,
} from "./types";

// ─── Supabase disconnected — admin panel works with local manifest only ──────

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "health" | "slots" | "roles" | "manifest" | "doppler" | "cz-verification";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function phaseColor(phase: HydrationPhase): string {
  switch (phase) {
    case "complete":
      return "text-emerald-600 bg-emerald-50";
    case "skeleton":
      return "text-amber-600 bg-amber-50";
    case "partial":
      return "text-iw-forest bg-[var(--iw-forest)]/10";
    case "error":
      return "text-red-600 bg-red-50";
    case "stale":
      return "text-orange-600 bg-orange-50";
    case "idle":
      return "text-gray-500 bg-gray-50";
    case "config":
      return "text-iw-gold bg-[var(--iw-gold)]/10";
    default:
      return "text-gray-500 bg-gray-50";
  }
}

function providerBadgeColor(type: ProviderType): string {
  switch (type) {
    case "spine":
      return "bg-emerald-100 text-emerald-700";
    case "rest":
      return "bg-[var(--iw-forest)]/15 text-iw-forest";
    case "doppler":
      return "bg-[var(--iw-gold)]/15 text-iw-gold";
    case "static":
      return "bg-gray-100 text-gray-700";
    case "kv":
      return "bg-amber-100 text-amber-700";
    case "graphql":
      return "bg-pink-100 text-pink-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Tab Definitions ─────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { id: "health", label: "Provider Health", icon: <Activity className="w-4 h-4" /> },
  { id: "slots", label: "Slot Bindings", icon: <Plug className="w-4 h-4" /> },
  { id: "roles", label: "Role Gates", icon: <Shield className="w-4 h-4" /> },
  { id: "manifest", label: "Manifest", icon: <Database className="w-4 h-4" /> },
  { id: "doppler", label: "Doppler Config", icon: <Settings className="w-4 h-4" /> },
  { id: "cz-verification", label: "CZ Verification", icon: <Eye className="w-4 h-4" /> },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FabricStatus }) {
  if (status.initializing) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs">
        <Loader2 className="w-3 h-3 animate-spin" />
        Initializing
      </span>
    );
  }
  if (status.error) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs">
        <AlertTriangle className="w-3 h-3" />
        Error
      </span>
    );
  }
  if (status.initialized) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 text-xs">
      <Clock className="w-3 h-3" />
      Idle
    </span>
  );
}

// ─── Provider Health Tab ─────────────────────────────────────────────────────

function ProviderHealthTab({
  manifest,
  status,
}: {
  manifest: FabricManifest | null;
  status: FabricStatus;
}) {
  const [healthData, setHealthData] = useState<Record<string, HealthStatus>>({});
  const [checking, setChecking] = useState(false);
  const fabric = useFabric();

  const runHealthCheck = useCallback(async () => {
    setChecking(true);
    try {
      const result = await fabric.getProviderHealth();
      setHealthData(result as Record<string, HealthStatus>);
    } catch {
      // Health check failed silently
    }
    setChecking(false);
  }, [fabric]);

  const providers = useMemo(() => {
    if (!manifest) return [];
    return Object.entries(manifest.providers).map(([type, config]) => ({
      type: type as ProviderType,
      config,
      health: healthData[type] || null,
    }));
  }, [manifest, healthData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {status.healthyProviders}/{status.totalProviders} providers registered
          </p>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={checking}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {checking ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Check Health
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {providers.map(({ type, config, health }) => (
          <div
            key={type}
            className={`rounded-lg border p-4 transition-colors ${
              config.enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${providerBadgeColor(type)}`}
              >
                {type}
              </span>
              {config.enabled ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <X className="w-4 h-4 text-gray-400" />
              )}
            </div>

            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Status</span>
                <span className={config.enabled ? "text-emerald-600" : "text-gray-400"}>
                  {config.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              {config.baseUrl && (
                <div className="flex justify-between">
                  <span>Base URL</span>
                  <span className="text-gray-800 truncate max-w-[140px]">
                    {config.baseUrl || "—"}
                  </span>
                </div>
              )}
              {config.timeout && (
                <div className="flex justify-between">
                  <span>Timeout</span>
                  <span>{config.timeout}ms</span>
                </div>
              )}
              {health && (
                <>
                  <div className="border-t border-gray-100 my-1.5" />
                  <div className="flex justify-between">
                    <span>Healthy</span>
                    <span className={health.healthy ? "text-emerald-600" : "text-red-600"}>
                      {health.healthy ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latency</span>
                    <span>{health.latencyMs}ms</span>
                  </div>
                  {health.errorMessage && (
                    <p className="text-red-500 mt-1">{health.errorMessage}</p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No manifest loaded — providers unavailable.
        </div>
      )}
    </div>
  );
}

// ─── Slot Bindings Tab ───────────────────────────────────────────────────────

function SlotBindingsTab({ manifest }: { manifest: FabricManifest | null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const fabric = useFabric();

  const slots = useMemo(() => {
    if (!manifest) return [];
    return Object.values(manifest.slots)
      .filter((slot) => {
        if (searchTerm && !slot.slotId.toLowerCase().includes(searchTerm.toLowerCase()))
          return false;
        if (filterProvider !== "all" && slot.provider !== filterProvider) return false;
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
  }, [manifest, searchTerm, filterProvider]);

  const providerTypes = useMemo(() => {
    if (!manifest) return [];
    const types = new Set(Object.values(manifest.slots).map((s) => s.provider));
    return Array.from(types);
  }, [manifest]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search slots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="text-sm rounded-md border border-gray-200 px-2 py-1.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          >
            <option value="all">All Providers</option>
            {providerTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Slot count */}
      <p className="text-xs text-gray-400">
        {slots.length} slot{slots.length !== 1 ? "s" : ""} found
      </p>

      {/* Slot List */}
      <div className="space-y-1">
        {slots.map((slot) => {
          const expanded = expandedSlot === slot.slotId;
          const slotState = fabric.getSlotState(slot.slotId);

          return (
            <div key={slot.slotId} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSlot(expanded ? null : slot.slotId)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <code className="text-sm text-gray-800 flex-1 truncate">{slot.slotId}</code>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs ${providerBadgeColor(slot.provider)}`}
                >
                  {slot.provider}
                </span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs ${phaseColor(slotState.phase)}`}
                >
                  {slotState.phase}
                </span>
              </button>

              {expanded && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Endpoint</span>
                      <code className="text-gray-800">{slot.endpoint}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">TTL</span>
                      <span>{slot.ttl > 0 ? `${slot.ttl / 1000}s` : "No cache"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Priority</span>
                      <span>{slot.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method</span>
                      <span>{slot.method || "GET"}</span>
                    </div>
                    {slot.fallbackProvider && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fallback</span>
                        <span
                          className={`px-1.5 py-0.5 rounded ${providerBadgeColor(slot.fallbackProvider)}`}
                        >
                          {slot.fallbackProvider}
                        </span>
                      </div>
                    )}
                    {slot.transform && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Transform</span>
                        <code>{slot.transform}</code>
                      </div>
                    )}
                    {slot.tags && slot.tags.length > 0 && (
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-500">Tags</span>
                        <div className="flex gap-1">
                          {slot.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {slot.retryPolicy && (
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <p className="text-gray-500 mb-1">Retry Policy</p>
                      <div className="flex gap-4">
                        <span>Max: {slot.retryPolicy.maxRetries}</span>
                        <span>Backoff: {slot.retryPolicy.backoffMs}ms</span>
                        <span>×{slot.retryPolicy.backoffMultiplier}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {slots.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          {manifest ? "No slots match the current filter." : "No manifest loaded."}
        </div>
      )}
    </div>
  );
}

// ─── Role Gates Tab ──────────────────────────────────────────────────────────

function RoleGatesTab({ manifest }: { manifest: FabricManifest | null }) {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const roleBindings = useMemo(() => {
    if (!manifest) return [];
    return Object.entries(manifest.roleBindings).map(([key, binding]) => ({
      key,
      ...binding,
    }));
  }, [manifest]);

  return (
    <div className="space-y-3">
      {roleBindings.map((binding) => {
        const expanded = expandedRole === binding.key;

        return (
          <div key={binding.key} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedRole(expanded ? null : binding.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              )}
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm text-gray-800 flex-1">{binding.roleId}</span>
              <span className="text-xs text-gray-500">{binding.domain}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700">
                <Zap className="w-3 h-3" />
                {binding.hydrationStrategy}
              </span>
            </button>

            {expanded && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 text-xs space-y-3">
                {/* Allowed Slots */}
                <div>
                  <p className="text-gray-500 mb-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" /> Allowed Slots
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {binding.allowedSlots.map((s) => (
                      <code key={s} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {s}
                      </code>
                    ))}
                  </div>
                </div>

                {/* Denied Slots */}
                {binding.deniedSlots && binding.deniedSlots.length > 0 && (
                  <div>
                    <p className="text-gray-500 mb-1.5 flex items-center gap-1">
                      <X className="w-3 h-3 text-red-500" /> Denied Slots
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {binding.deniedSlots.map((s) => (
                        <code key={s} className="px-2 py-0.5 rounded bg-red-50 text-red-700">
                          {s}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preload Slots */}
                {binding.preloadSlots && binding.preloadSlots.length > 0 && (
                  <div>
                    <p className="text-gray-500 mb-1.5 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" /> Preload Slots
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {binding.preloadSlots.map((s) => (
                        <code key={s} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                          {s}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {/* Config */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-gray-100 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Concurrent</span>
                    <span>{binding.maxConcurrent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Strategy</span>
                    <span>{binding.hydrationStrategy}</span>
                  </div>
                </div>

                {/* Overrides */}
                {binding.overrides && binding.overrides.length > 0 && (
                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-gray-500 mb-1.5 flex items-center gap-1">
                      <GitBranch className="w-3 h-3" /> Slot Overrides
                    </p>
                    <div className="space-y-1">
                      {binding.overrides.map((o) => (
                        <div
                          key={o.slotId}
                          className="flex items-center gap-2 px-2 py-1 rounded bg-white border border-gray-100"
                        >
                          <code className="flex-1">{o.slotId}</code>
                          {o.provider && (
                            <span
                              className={`px-1.5 py-0.5 rounded ${providerBadgeColor(o.provider)}`}
                            >
                              {o.provider}
                            </span>
                          )}
                          {o.ttl !== undefined && <span>TTL: {o.ttl / 1000}s</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {roleBindings.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">No role bindings configured.</div>
      )}
    </div>
  );
}

// ─── Manifest Inspector Tab ──────────────────────────────────────────────────

function ManifestInspectorTab({ manifest }: { manifest: FabricManifest | null }) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const fabric = useFabric();

  const handleCopy = useCallback(() => {
    if (manifest) {
      copyToClipboard(JSON.stringify(manifest, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [manifest]);

  const handleRefresh = useCallback(async () => {
    await fabric.refreshManifest();
  }, [fabric]);

  if (!manifest) {
    return <div className="text-center py-8 text-gray-400 text-sm">No manifest loaded.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Manifest Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm text-gray-800">
            Version{" "}
            <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{manifest.version}</code>
          </p>
          <p className="text-xs text-gray-500">
            Source: {manifest.configSource} · Generated:{" "}
            {new Date(manifest.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {showRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showRaw ? "Summary" : "Raw JSON"}
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {showRaw ? (
        <pre className="p-4 rounded-lg bg-gray-900 text-gray-100 text-xs overflow-auto max-h-[500px] font-mono">
          {JSON.stringify(manifest, null, 2)}
        </pre>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              label="Slots"
              value={Object.keys(manifest.slots).length}
              icon={<Plug className="w-4 h-4" />}
            />
            <SummaryCard
              label="Providers"
              value={Object.keys(manifest.providers).length}
              icon={<Layers className="w-4 h-4" />}
            />
            <SummaryCard
              label="Role Bindings"
              value={Object.keys(manifest.roleBindings).length}
              icon={<Shield className="w-4 h-4" />}
            />
            <SummaryCard
              label="Transforms"
              value={Object.keys(manifest.transforms).length}
              icon={<GitBranch className="w-4 h-4" />}
            />
          </div>

          {/* Transforms */}
          {Object.keys(manifest.transforms).length > 0 && (
            <div>
              <h4 className="text-sm text-gray-600 mb-2">Transforms</h4>
              <div className="space-y-1">
                {Object.values(manifest.transforms).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md border border-gray-100 bg-white text-xs"
                  >
                    <code className="text-gray-800">{t.id}</code>
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {t.type}
                    </span>
                    <span className="text-gray-500 flex-1">{t.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl text-gray-800">{value}</p>
    </div>
  );
}

// ─── Doppler Config Tab ──────────────────────────────────────────────────────

function DopplerConfigTab({ manifest }: { manifest: FabricManifest | null }) {
  if (!manifest) {
    return <div className="text-center py-8 text-gray-400 text-sm">No manifest loaded.</div>;
  }

  const dopplerConfig = manifest.providers.doppler;
  const dopplerMeta = manifest.dopplerMeta;
  const dopplerSlots = Object.values(manifest.slots).filter((s) => s.provider === "doppler");

  return (
    <div className="space-y-4">
      {/* Doppler Provider Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm text-gray-800 flex items-center gap-2">
            <Settings className="w-4 h-4 text-iw-gold" />
            Doppler Provider
          </h4>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
              dopplerConfig?.enabled
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {dopplerConfig?.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {dopplerMeta ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Project</span>
              <code className="text-gray-800">{dopplerMeta.project}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Config</span>
              <code className="text-gray-800">{dopplerMeta.config}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Environment</span>
              <code className="text-gray-800">{dopplerMeta.environment}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Synced</span>
              <span>{new Date(dopplerMeta.lastSyncedAt).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            No Doppler metadata available — provider is not configured or manifest was built without
            Doppler integration.
          </p>
        )}
      </div>

      {/* Doppler-Sourced Slots */}
      <div>
        <h4 className="text-sm text-gray-600 mb-2">
          Doppler-Sourced Slots ({dopplerSlots.length})
        </h4>
        {dopplerSlots.length > 0 ? (
          <div className="space-y-1">
            {dopplerSlots.map((slot) => (
              <div
                key={slot.slotId}
                className="flex items-center gap-3 px-3 py-2 rounded-md border border-gray-100 bg-white text-xs"
              >
                <code className="text-gray-800 flex-1">{slot.slotId}</code>
                <code className="text-gray-500 truncate max-w-[200px]">{slot.endpoint}</code>
                <span className="text-gray-400">
                  {slot.ttl > 0 ? `${slot.ttl / 1000}s TTL` : "No cache"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg">
            No slots currently use the Doppler provider.
            <br />
            Slots can be configured to use Doppler by updating the manifest.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main FabricAdminPanel Component ─────────────────────────────────────────

export function FabricAdminPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("health");
  const fabric = useFabric();
  const { status, manifest } = fabric;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Hydration Fabric Admin
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage providers, slot bindings, role gates, and configuration
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Status Bar */}
      {status.error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {status.error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "health" && <ProviderHealthTab manifest={manifest} status={status} />}
        {activeTab === "slots" && <SlotBindingsTab manifest={manifest} />}
        {activeTab === "roles" && <RoleGatesTab manifest={manifest} />}
        {activeTab === "manifest" && <ManifestInspectorTab manifest={manifest} />}
        {activeTab === "doppler" && <DopplerConfigTab manifest={manifest} />}
        {activeTab === "cz-verification" && <CustomerZeroVerification />}
      </div>
    </div>
  );
}
