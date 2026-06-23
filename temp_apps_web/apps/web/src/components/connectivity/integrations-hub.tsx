import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plug,
  Check,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Search,
  Settings,
  Clock,
  Zap,
  ExternalLink,
  Plus,
  X,
  ChevronRight,
  Database,
  Brain,
  Bot,
  Layers,
  Activity,
  Shield,
  Loader2,
  LinkIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch, connector as connectorApi } from "@/lib/api-client";

interface ConnectorEntry {
  id: string;
  name: string;
  icon: string;
  domain: string;
  category: string;
  status: "connected" | "available" | "error" | "syncing";
  lastSync: string | null;
  entitiesSynced: number;
  description: string;
  authType: string;
  capabilities: {
    auth: boolean;
    webhook: boolean;
    mcp: string[];
    supportedEntities: string[];
  };
}

interface ConnectorResponse {
  connectors: ConnectorEntry[];
  summary: {
    total: number;
    connected: number;
    available: number;
    totalEntitiesSynced: number;
  };
}

const STATUS_CONFIG = {
  connected: {
    label: "Connected",
    color: "bg-iw-forest-bright",
    textColor: "text-iw-forest",
    bgColor: "bg-iw-forest/10",
  },
  syncing: {
    label: "Syncing",
    color: "bg-iw-gold",
    textColor: "text-iw-gold",
    bgColor: "bg-iw-gold/10",
  },
  error: { label: "Error", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" },
  available: {
    label: "Available",
    color: "bg-gray-300",
    textColor: "text-gray-600",
    bgColor: "bg-gray-50",
  },
};

const DOMAIN_COLORS: Record<string, string> = {
  crm: "bg-iw-forest-bright",
  communication: "bg-iw-gold",
  support: "bg-iw-forest-bright",
  billing: "bg-iw-forest",
  engineering: "bg-gray-800",
  analytics: "bg-iw-gold",
  knowledge: "bg-gray-700",
  "project-management": "bg-iw-red",
  hr: "bg-teal-500",
  marketing: "bg-pink-500",
  finance: "bg-iw-gold",
  design: "bg-fuchsia-500",
  security: "bg-red-700",
  devops: "bg-cyan-600",
};

function getConnectorColor(entry: ConnectorEntry): string {
  const domainKey = (entry.domain || entry.category || "").toLowerCase().replace(/\s+/g, "-");
  return DOMAIN_COLORS[domainKey] || "bg-slate-500";
}

export function IntegrationsHub() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "connected" | "available">("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [selectedIntegration, setSelectedIntegration] = useState<ConnectorEntry | null>(null);
  const [connectors, setConnectors] = useState<ConnectorEntry[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    connected: 0,
    available: 0,
    totalEntitiesSynced: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const fetchConnectors = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch<ConnectorResponse>(
        "/api/v1/workspace/connectors",
        {},
        "WorkspaceConnectors"
      );
      setConnectors(data.connectors || []);
      setSummary(data.summary || { total: 0, connected: 0, available: 0, totalEntitiesSynced: 0 });
    } catch (err: any) {
      console.error("[IntegrationsHub] Failed to fetch connectors:", err);
      setError(err.message || "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  const filtered = connectors.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.domain || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "connected"
        ? ["connected", "syncing", "error"].includes(i.status)
        : i.status === "available");
    const matchDomain =
      domainFilter === "all" ||
      (i.category || "").toLowerCase() === domainFilter ||
      (i.domain || "").toLowerCase() === domainFilter;
    return matchSearch && matchFilter && matchDomain;
  });

  // Extract unique categories for domain filter
  const domains = Array.from(
    new Set(connectors.map((c) => c.category || c.domain || "other").filter(Boolean))
  ).sort();

  /**
   * Connect a tool via Nango.
   * 1. Call backend for a short-lived session token.
   * 2. Redirect to Nango's hosted Connect UI.
   * 3. After auth, Nango fires webhook → connector row in Supabase → Creamy sync.
   * 4. User lands back on this page (Nango redirects to callback_url).
   */
  const handleConnect = async (entry: ConnectorEntry) => {
    setConnectingId(entry.id);
    try {
      const { session_token } = await connectorApi.nangoSession(entry.id);
      const callbackUrl = encodeURIComponent(`${window.location.origin}/app/integrations`);
      const nangoHost = (import.meta.env.VITE_NANGO_HOST as string) || "https://app.nango.dev";
      window.location.href = `${nangoHost}/oauth/connect?session_token=${session_token}&callback_url=${callbackUrl}`;
    } catch (err: any) {
      console.error("[IntegrationsHub] Nango session failed:", err);
      // Fallback: show error inline
      setError(`Failed to connect ${entry.name}: ${err.message || "Unknown error"}`);
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (entry: ConnectorEntry) => {
    try {
      await connectorApi.nangoDisconnect(entry.id);
      await fetchConnectors();
    } catch (err: any) {
      console.error("[IntegrationsHub] Disconnect failed:", err);
    }
  };

  const formatLastSync = (lastSync: string | null): string => {
    if (!lastSync) return "Never";
    const diff = Date.now() - new Date(lastSync).getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(lastSync).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-medium">Failed to load integrations</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              fetchConnectors();
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations & Data Sync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your tools. IntegrateWise unifies them into a single intelligent operating
            system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-none shadow-sm bg-gradient-to-br from-[#2d5a3d] to-[#142e20] text-white overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-4 relative">
              <Database className="absolute -right-2 -bottom-2 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity" />
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-white/80" />
                <h3 className="text-sm font-bold">Data Spine</h3>
              </div>
              <p className="text-[10px] text-white/60 mb-3">
                Your single source of truth. All tools unify into canonical entities with full
                provenance tracking.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-iw-forest-bright" />
                  <span className="text-[10px] font-bold">Healthy</span>
                </div>
                <span className="text-[10px] text-white/40">
                  {summary.totalEntitiesSynced > 0
                    ? `${(summary.totalEntitiesSynced / 1000).toFixed(1)}K entities`
                    : "No data yet"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-br from-[#3d7a50] to-[#2d5a3d] text-white overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-4 relative">
              <Layers className="absolute -right-2 -bottom-2 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity" />
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-white/80" />
                <h3 className="text-sm font-bold">Context Engine</h3>
              </div>
              <p className="text-[10px] text-white/60 mb-3">
                Maps every data point to your goals, department context, and dual-lens (vendor +
                client) alignment.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-iw-forest-bright" />
                  <span className="text-[10px] font-bold">{summary.connected} Contexts Active</span>
                </div>
                <span className="text-[10px] text-white/40">Dual-lens</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-br from-[#c79f4a] to-[#b8943f] text-white overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-4 relative">
              <Bot className="absolute -right-2 -bottom-2 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity" />
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-white/80" />
                <h3 className="text-sm font-bold">AI Intelligence</h3>
              </div>
              <p className="text-[10px] text-white/60 mb-3">
                Edge corrections, anomaly detection, goal-aligned insights, and human-in-the-loop
                approvals.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-iw-forest-bright animate-pulse" />
                  <span className="text-[10px] font-bold">HITL Gated</span>
                </div>
                <span className="text-[10px] text-white/40">
                  {connectors.filter((c) => c.capabilities?.mcp?.length > 0).length} MCP-enabled
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              label: "Sync All",
              icon: RefreshCw,
              desc: "Force re-sync all sources",
              action: fetchConnectors,
            },
            { label: "Schema Audit", icon: Shield, desc: "Check for drift" },
            { label: "Data Health", icon: Activity, desc: "Full diagnostics" },
            { label: "Add Source", icon: Plus, desc: "Connect new tool" },
          ].map((accel, i) => (
            <button
              key={i}
              onClick={accel.action}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2d5a3d]/10 flex items-center justify-center group-hover:bg-[#2d5a3d]/20 transition-colors">
                <accel.icon className="w-4 h-4 text-[#2d5a3d]" />
              </div>
              <div>
                <div className="text-xs font-semibold">{accel.label}</div>
                <div className="text-[9px] text-muted-foreground">{accel.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-iw-forest/10 flex items-center justify-center">
                <Plug className="w-5 h-5 text-iw-forest-bright" />
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.connected}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">
                  Connected
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-iw-forest/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-iw-forest-bright" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {summary.totalEntitiesSynced > 0
                    ? `${(summary.totalEntitiesSynced / 1000).toFixed(1)}K`
                    : "0"}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">
                  Entities Synced
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-iw-gold/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-iw-gold" />
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">
                  Total Connectors
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              className="pl-8 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {(["all", "connected", "available"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filter === f ? "bg-[#2d5a3d] text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                {f === "all"
                  ? `All (${summary.total})`
                  : f === "connected"
                    ? `Connected (${summary.connected})`
                    : `Available (${summary.available})`}
              </button>
            ))}
          </div>
          {/* Domain filter */}
          {domains.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setDomainFilter("all")}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all ${domainFilter === "all" ? "bg-[#2d5a3d] text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                All domains
              </button>
              {domains.map((d) => (
                <button
                  key={d}
                  onClick={() => setDomainFilter(d.toLowerCase())}
                  className={`px-2.5 py-1 text-xs rounded-lg capitalize transition-all ${domainFilter === d.toLowerCase() ? "bg-[#2d5a3d] text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No integrations match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((connector) => {
              const statusCfg = STATUS_CONFIG[connector.status] || STATUS_CONFIG.available;
              const color = getConnectorColor(connector);
              return (
                <motion.div
                  key={connector.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className={`border shadow-sm hover:shadow-md transition-all cursor-pointer group ${connector.status === "error" ? "border-red-200" : ""}`}
                    onClick={() => setSelectedIntegration(connector)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white text-lg`}
                          >
                            {connector.icon || connector.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{connector.name}</h3>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">
                              {connector.category || connector.domain}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.bgColor} ${statusCfg.textColor}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${statusCfg.color} ${connector.status === "syncing" ? "animate-pulse" : ""}`}
                          />
                          {statusCfg.label}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {connector.capabilities?.supportedEntities?.length > 0
                          ? connector.capabilities.supportedEntities.join(", ")
                          : connector.description || connector.name}
                      </p>
                      {connector.status !== "available" ? (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatLastSync(connector.lastSync)}
                          </span>
                          <span className="font-bold text-foreground">
                            {(connector.entitiesSynced || 0).toLocaleString()} entities
                          </span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-7 gap-1"
                          disabled={connectingId === connector.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(connector);
                          }}
                        >
                          {connectingId === connector.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          {connectingId === connector.id ? "Connecting..." : "Connect"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {selectedIntegration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setSelectedIntegration(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card rounded-2xl shadow-2xl border w-full max-w-lg mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl ${getConnectorColor(selectedIntegration)} flex items-center justify-center text-white text-xl`}
                    >
                      {selectedIntegration.icon || selectedIntegration.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{selectedIntegration.name}</h2>
                      <span className="text-xs text-muted-foreground">
                        {selectedIntegration.category || selectedIntegration.domain}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIntegration(null)}
                    className="p-1 rounded-md hover:bg-secondary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedIntegration.status !== "available" && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        Entities
                      </div>
                      <div className="text-lg font-bold">
                        {(selectedIntegration.entitiesSynced || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        Last Sync
                      </div>
                      <div className="text-lg font-bold">
                        {formatLastSync(selectedIntegration.lastSync)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  {selectedIntegration.capabilities?.supportedEntities?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                        Supported Entities
                      </h4>
                      {selectedIntegration.capabilities.supportedEntities.map((entity, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm py-0.5">
                          <Check className="w-3.5 h-3.5 text-iw-forest-bright" />
                          {entity}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedIntegration.capabilities?.webhook && (
                      <Badge variant="outline" className="text-[10px]">
                        <Zap className="w-3 h-3 mr-1" /> Webhooks
                      </Badge>
                    )}
                    {selectedIntegration.capabilities?.mcp?.length > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        <Bot className="w-3 h-3 mr-1" /> MCP Tools (
                        {selectedIntegration.capabilities.mcp.length})
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {selectedIntegration.authType === "oauth2"
                        ? "OAuth 2.0"
                        : selectedIntegration.authType || "API Key"}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  {selectedIntegration.status === "available" ? (
                    <Button
                      className="flex-1 bg-[#2d5a3d] hover:bg-[#2d5a3d]"
                      disabled={connectingId === selectedIntegration.id}
                      onClick={() => handleConnect(selectedIntegration)}
                    >
                      {connectingId === selectedIntegration.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-1" />
                      )}
                      {connectingId === selectedIntegration.id
                        ? "Connecting..."
                        : `Connect ${selectedIntegration.name}`}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => fetchConnectors()}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Re-sync
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Settings className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
