import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  Database,
  FileText,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { connector, apiFetch } from "@/lib/api-client";
import Nango from "@nangohq/frontend";
import { selectConnectors } from "@/lib/projection/connector-projection";

export interface ConnectorSelection {
  provider: string;
  flowType: "A" | "B" | "C";
}

interface ConnectorsStepProps {
  onComplete: (data: { connectors: ConnectorSelection[] }) => void;
  onBack: () => void;
  /** Resolved role (domain key) — drives connector relevance. */
  role?: string;
  /** Resolved industry vertical — drives connector relevance. */
  industry?: string;
}

interface ConnectorCapabilities {
  auth: boolean;
  webhook: boolean;
  mcp: string[];
  supportedEntities: string[];
}

interface CatalogConnector {
  id: string;
  name: string;
  status?: string;
  authType?: string;
  webhookSupport?: boolean;
  mcpTools?: string[];
  supportedEntities?: string[];
  category?: string;
  connectedAt?: string | null;
  supportedCapabilities?: ConnectorCapabilities;
  capabilities?: ConnectorCapabilities;
}

const CATEGORY_TO_FLOW: Record<string, "A" | "B" | "C"> = {
  crm: "A",
  accounting: "A",
  billing: "A",
  payments: "A",
  ecommerce: "A",
  analytics: "A",
  docs: "B",
  storage: "B",
  communication: "B",
  support: "B",
  productivity: "B",
  project_management: "B",
  source_control: "B",
  marketing: "B",
  llm: "C",
};

const CONNECTOR_LOGOS: Record<string, { slug: string; color?: string }> = {
  // CRM
  salesforce: { slug: "salesforce", color: "00A1E0" },
  hubspot: { slug: "hubspot", color: "FF7A59" },
  pipedrive: { slug: "pipedrive", color: "00B67A" },
  "zoho-crm": { slug: "zoho", color: "00A1E0" },
  freshsales: { slug: "freshworks", color: "0052CC" },
  close: { slug: "close", color: "00E676" },

  // Support
  zendesk: { slug: "zendesk", color: "03363D" },
  intercom: { slug: "intercom", color: "0057FF" },
  helpscout: { slug: "helpscout", color: "3197D6" },
  front: { slug: "front", color: "000000" },
  freshdesk: { slug: "freshworks", color: "0052CC" },
  kustomer: { slug: "kustomer", color: "23A393" },

  // Communication
  slack: { slug: "slack", color: "4A154B" },
  "microsoft-teams": { slug: "microsoftteams", color: "6264A7" },
  zoom: { slug: "zoom", color: "2D8CFF" },
  twilio: { slug: "twilio", color: "F22F46" },
  discord: { slug: "discord", color: "5865F2" },
  "whatsapp-business": { slug: "whatsapp", color: "25D366" },
  gmail: { slug: "gmail", color: "EA4335" },
  outlook: { slug: "microsoftoutlook", color: "0078D4" },
  "google-calendar": { slug: "googlecalendar", color: "4285F4" },

  // Marketing
  "hubspot-marketing": { slug: "hubspot", color: "FF7A59" },
  braze: { slug: "braze", color: "F52875" },
  sendgrid: { slug: "sendgrid", color: "1A82E2" },
  mailchimp: { slug: "mailchimp", color: "FFE01B" },
  marketo: { slug: "marketo", color: "3B7CFF" },
  "customer-io": { slug: "customerdotio", color: "FF6600" },
  segment: { slug: "segment", color: "52ADC8" },

  // Finance
  quickbooks: { slug: "quickbooks", color: "2CA01C" },
  xero: { slug: "xero", color: "13B5EA" },
  freshbooks: { slug: "freshbooks", color: "0075FF" },
  chargebee: { slug: "chargebee", color: "5423F2" },
  stripe: { slug: "stripe", color: "635BFF" },
  paddle: { slug: "paddle", color: "000000" },
  tally: { slug: "tally", color: "0077B5" },
  razorpay: { slug: "razorpay", color: "0B49CD" },

  // Analytics
  "google-analytics": { slug: "googleanalytics", color: "E37400" },
  amplitude: { slug: "amplitude", color: "1F2329" },
  heap: { slug: "heap", color: "4C00FF" },
  mixpanel: { slug: "mixpanel", color: "4F46E5" },
  metabase: { slug: "metabase", color: "509EE3" },
  tableau: { slug: "tableau", color: "E8762D" },

  // Engineering
  github: { slug: "github", color: "181717" },
  gitlab: { slug: "gitlab", color: "FC6D26" },
  bitbucket: { slug: "bitbucket", color: "0052CC" },
  jira: { slug: "jira", color: "0052CC" },
  linear: { slug: "linear", color: "5E6AD2" },

  // Productivity
  notion: { slug: "notion", color: "000000" },
  "google-drive": { slug: "googledrive", color: "4285F4" },
  "google-sheets": { slug: "googlesheets", color: "34A853" },
  dropbox: { slug: "dropbox", color: "0061FF" },
  onedrive: { slug: "microsoftonedrive", color: "0078D4" },
  airtable: { slug: "airtable", color: "185ADB" },
  calendly: { slug: "calendly", color: "006BFF" },

  // Commerce
  shopify: { slug: "shopify", color: "7AB55C" },
  woocommerce: { slug: "woocommerce", color: "96588A" },
  bigcommerce: { slug: "bigcommerce", color: "121118" },
  shiprocket: { slug: "shiprocket", color: "2F3E50" },

  // AI
  openai: { slug: "openai", color: "412991" },
  cohere: { slug: "cohere", color: "323539" },

  // Fallbacks & aliases
  google: { slug: "google", color: "4285F4" },
  googleads: { slug: "googleads", color: "4285F4" },
  "google-ads": { slug: "googleads", color: "4285F4" },
};

function getConnectorLogoUrl(id: string): string {
  const normalizedId = id.toLowerCase();
  const config = CONNECTOR_LOGOS[normalizedId];
  if (config) {
    return `https://cdn.simpleicons.org/${config.slug}/${config.color || ""}`;
  }
  return `https://cdn.simpleicons.org/${normalizedId}`;
}

interface ConnectorLogoProps {
  id: string;
  name: string;
  category?: string;
  className?: string;
}

export function ConnectorLogo({ id, name, category, className = "w-4 h-4" }: ConnectorLogoProps) {
  const [error, setError] = useState(false);

  if (error) {
    if (
      category === "crm" ||
      category === "accounting" ||
      category === "billing" ||
      category === "payments" ||
      category === "ecommerce" ||
      category === "analytics"
    ) {
      return <Database className={`${className} text-muted-foreground/70`} />;
    }
    if (
      category === "docs" ||
      category === "storage" ||
      category === "productivity" ||
      category === "project_management" ||
      category === "source_control"
    ) {
      return <FileText className={`${className} text-muted-foreground/70`} />;
    }
    return <Sparkles className={`${className} text-muted-foreground/70`} />;
  }

  return (
    <img
      src={getConnectorLogoUrl(id)}
      alt={`${name} logo`}
      className={`${className} object-contain shrink-0`}
      onError={() => setError(true)}
    />
  );
}

function getFlowForConnector(c: CatalogConnector): "A" | "B" | "C" {
  return CATEGORY_TO_FLOW[c.category || ""] || "A";
}

// ── Connection Mechanism ─────────────────────────────────────────────────────
// IntegrateWise supports exactly four connection mechanisms. Every connector
// in the tray reaches the Spine through one of these. Nango is a first-class
// mechanism — it brokers OAuth for the majority of SaaS tools.
export type ConnectionMethod = "mcp" | "ai_provider" | "nango" | "api_wrapper";

const CONNECTION_METHOD_META: Record<
  ConnectionMethod,
  { label: string; pill: string; description: string }
> = {
  mcp: {
    label: "MCP",
    pill: "bg-iw-slate/10 text-iw-slate border-iw-slate/20",
    description: "Native Model Context Protocol server",
  },
  ai_provider: {
    label: "AI Provider",
    pill: "bg-iw-gold/10 text-iw-gold border-iw-gold/20",
    description: "AI / LLM provider integration",
  },
  nango: {
    label: "Nango",
    pill: "bg-iw-forest/10 text-iw-forest border-iw-forest/20",
    description: "OAuth brokered via Nango",
  },
  api_wrapper: {
    label: "API",
    pill: "bg-iw-gold/10 text-iw-gold border-iw-gold/20",
    description: "Direct API wrapper",
  },
};

// AI/LLM providers connect via the AI Provider mechanism.
const AI_PROVIDER_IDS = new Set([
  "openai",
  "openrouter",
  "anthropic",
  "claude",
  "gemini",
  "grok",
  "mistral",
  "perplexity",
  "chatgpt",
]);

// Tools whose primary path is a native MCP server.
const MCP_NATIVE_IDS = new Set([
  "jira",
  "github",
  "gitlab",
  "linear",
  "notion",
  "confluence",
  "figma",
]);

/**
 * Resolve which of the four supported mechanisms a connector uses.
 * Priority: AI Provider → MCP (native) → Nango (OAuth) → API wrapper.
 */
function getConnectionMethod(c: CatalogConnector): ConnectionMethod {
  const id = (c.id || "").toLowerCase();
  const caps = c.capabilities || c.supportedCapabilities;

  if (AI_PROVIDER_IDS.has(id) || c.category === "llm") return "ai_provider";

  // OAuth-based SaaS tools (incl. GitHub) are brokered through Nango for data ingestion.
  // MCP is a surface protocol for AI clients to READ the Spine; connection for population uses auth.
  if (caps?.auth || c.authType === "oauth") return "nango";

  // Native MCP declared explicitly (rare for pure data sources).
  const hasMcp = (caps?.mcp && caps.mcp.length > 0) || (c.mcpTools && c.mcpTools.length > 0);
  if (MCP_NATIVE_IDS.has(id) && hasMcp) return "mcp";

  // Database / webhook-only / custom → direct API wrapper.
  return "api_wrapper";
}

interface FlowCategory {
  id: string;
  label: string;
  flowType: "A" | "B" | "C";
  flowLabel: string;
  flowColor: string;
  flowPillClass: string;
  selectedClass: string;
  icon: React.ComponentType<{ className?: string }>;
  matchFlowType: string;
}

const FLOW_CATEGORIES: FlowCategory[] = [
  {
    id: "structured",
    label: "Structured Data",
    flowType: "A",
    flowLabel: "Flow A",
    flowColor: "text-iw-gold",
    flowPillClass: "bg-iw-gold/10 text-iw-gold",
    selectedClass: "border-primary bg-primary/5 text-foreground shadow-xs",
    icon: Database,
    matchFlowType: "A",
  },
  {
    id: "unstructured",
    label: "Unstructured Data",
    flowType: "B",
    flowLabel: "Flow B",
    flowColor: "text-iw-forest",
    flowPillClass: "bg-iw-forest/10 text-iw-forest",
    selectedClass: "border-primary bg-primary/5 text-foreground shadow-xs",
    icon: FileText,
    matchFlowType: "B",
  },
  {
    id: "ai-chats",
    label: "AI Chats",
    flowType: "C",
    flowLabel: "Flow C",
    flowColor: "text-iw-slate",
    flowPillClass: "bg-iw-slate/10 text-iw-slate",
    selectedClass: "border-primary bg-primary/5 text-foreground shadow-xs",
    icon: Sparkles,
    matchFlowType: "C",
  },
];

export function ConnectorsStep({ onComplete, onBack, role, industry }: ConnectorsStepProps) {
  const [catalog, setCatalog] = useState<CatalogConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConnectors, setSelectedConnectors] = useState<Map<string, "A" | "B" | "C">>(
    new Map()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<
    Record<string, "pending" | "connecting" | "connected" | "failed">
  >({});

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      setLoading(true);
      setError(null);
      try {
        // Full Nango catalog via the CF Gateway — no hardcoded injection (spec R1).
        let loaded: CatalogConnector[] = [];
        try {
          const data = await apiFetch<{ connectors: CatalogConnector[] }>(
            "/api/v1/workspace/connectors",
            {},
            "ConnectorsStep"
          );
          loaded = data.connectors || [];
        } catch {
          const fallbackData = await apiFetch<{ connectors: CatalogConnector[] }>(
            "/api/v1/connectors/catalog",
            {},
            "ConnectorsStep-Fallback"
          );
          loaded = fallbackData.connectors || [];
        }
        if (!cancelled) setCatalog(loaded);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Unable to load connectors");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  // Project exactly five connectors matched to role + industry (randomized among ties).
  const projected = React.useMemo(() => {
    const picked = selectConnectors({
      catalog: catalog.map((c) => ({
        id: c.id,
        provider: c.id,
        label: c.name,
        category: c.category || "",
      })),
      role: role || "",
      industry: industry || "",
    });
    const byId = new Set(picked.map((p) => p.id));
    return catalog.filter((c) => byId.has(c.id));
  }, [catalog, role, industry]);

  const connectorsByFlow = FLOW_CATEGORIES.map((cat) => ({
    ...cat,
    connectors: projected.filter((c) => getFlowForConnector(c) === cat.matchFlowType),
  }));

  const toggleConnector = useCallback(
    (provider: string, flowType: "A" | "B" | "C") => {
      const next = new Map(selectedConnectors);
      if (next.has(provider)) {
        next.delete(provider);
        setOauthStatus((prev) => {
          const copy = { ...prev };
          delete copy[provider];
          return copy;
        });
      } else {
        next.set(provider, flowType);
      }
      setSelectedConnectors(next);
    },
    [selectedConnectors]
  );

  // ── Detect OAuth return from redirect ──────────────────────────────────
  useEffect(() => {
    const lastConnected = sessionStorage.getItem("iw_onboarding_last_connected_provider");
    if (lastConnected) {
      setOauthStatus((prev) => ({ ...prev, [lastConnected]: "connected" }));
      // Re-select the connector if it was selected before redirect
      const lastFlow = sessionStorage.getItem("iw_onboarding_last_connected_flow") as
        | "A"
        | "B"
        | "C"
        | null;
      if (lastFlow) {
        setSelectedConnectors((prev) => {
          const next = new Map(prev);
          next.set(lastConnected, lastFlow);
          return next;
        });
      }
      sessionStorage.removeItem("iw_onboarding_last_connected_provider");
      sessionStorage.removeItem("iw_onboarding_last_connected_flow");
      sessionStorage.removeItem("iw_onboarding_last_connected_at");
    }
  }, []);

  const initiateOAuth = useCallback(
    async (provider: string, _flowType: "A" | "B" | "C"): Promise<boolean> => {
      // Nango Connect (DECISION 22): Nango brokers OAuth for 800+ providers — no
      // per-provider client secret in our env, no full-page redirect (an in-app modal).
      // On success Nango fires connection.created → webhook-ingress → pipeline → creamy.
      try {
        setOauthStatus((prev) => ({ ...prev, [provider]: "connecting" }));
        const { session_token } = await connector.nangoSession(provider);

        return await new Promise<boolean>((resolve) => {
          const nangoHost = (import.meta.env.VITE_NANGO_HOST as string) || undefined;
          const nango = nangoHost ? new Nango({ host: nangoHost }) : new Nango();
          let settled = false;
          const finish = (ok: boolean, status: "connected" | "pending" | "failed") => {
            if (settled) return;
            settled = true;
            setOauthStatus((prev) => ({ ...prev, [provider]: status }));
            resolve(ok);
          };
          const ui = nango.openConnectUI({
            onEvent: (event) => {
              if (event.type === "connect") {
                try {
                  ui.close();
                } catch {
                  /* ignore */
                }
                finish(true, "connected");
              } else if (event.type === "close") {
                finish(false, "pending");
              } else if (event.type === "error") {
                finish(false, "failed");
              }
            },
          });
          ui.setSessionToken(session_token);
        });
      } catch (err) {
        console.warn(`[ConnectorsStep] Nango connect failed for ${provider}:`, err);
        setOauthStatus((prev) => ({ ...prev, [provider]: "failed" }));
        return false;
      }
    },
    []
  );

  const handleLaunch = async () => {
    setIsSubmitting(true);

    const dbProviders = catalog.filter((c) => c.authType === "database").map((c) => c.id);
    const connected: ConnectorSelection[] = [];

    // Open the Nango Connect modal for each selected OAuth connector, in order.
    // Database/API-key, AI Providers (key-based), MCP, and already-connected providers pass straight through.
    // AI providers register capability for inference / MCP surfaces (no Nango OAuth).
    for (const [provider, flowType] of selectedConnectors.entries()) {
      const catEntry = catalog.find((c) => c.id === provider);
      const method = catEntry ? getConnectionMethod(catEntry) : "nango";
      if (
        dbProviders.includes(provider) ||
        oauthStatus[provider] === "connected" ||
        method === "ai_provider" ||
        method === "mcp"
      ) {
        setOauthStatus((prev) => ({ ...prev, [provider]: "connected" }));
        connected.push({ provider, flowType });
        continue;
      }
      const ok = await initiateOAuth(provider, flowType);
      if (ok) connected.push({ provider, flowType });
    }

    // Proceed with whatever connected — creamy hydration runs for those providers.
    onComplete({ connectors: connected });
    setIsSubmitting(false);
  };

  const handleSkip = () => {
    onComplete({ connectors: [] });
  };

  const selectedCount = selectedConnectors.size;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto w-full pt-2 flex flex-col items-center justify-center py-20 font-iw-sans">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Loading available connectors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto w-full pt-2 font-iw-sans">
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Unable to Load Connectors</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="h-[44px] px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-iw-forest-bright transition-all flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Retry
            </button>
            <button
              onClick={handleSkip}
              className="h-[44px] px-6 rounded-xl border border-border text-foreground font-semibold hover:bg-muted bg-card transition-all"
            >
              Skip for Now
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-6 text-center max-w-md">
            You can connect tools later from the workspace settings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full pt-2 font-iw-sans">
      <div className="text-center mb-8">
        <h2 className="text-[28px] md:text-[36px] leading-[1.08] font-iw-serif text-primary mb-3 tracking-[-0.02em]">
          Connect your data sources
        </h2>
        <p className="text-[16px] md:text-[18px] leading-[1.12] text-muted-foreground font-medium mb-4">
          Select tools to integrate (you can add more later)
        </p>
        {/* Connection mechanisms — IntegrateWise supports exactly these four */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {(["mcp", "ai_provider", "nango", "api_wrapper"] as ConnectionMethod[]).map((m) => {
            const meta = CONNECTION_METHOD_META[m];
            return (
              <span
                key={m}
                className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${meta.pill}`}
                title={meta.description}
              >
                {meta.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-6 mb-6">
        {connectorsByFlow.map((category) => {
          if (category.connectors.length === 0) return null;
          const Icon = category.icon;

          return (
            <div key={category.id}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${category.flowColor}`} />
                <span className="font-semibold text-foreground text-sm">{category.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${category.flowPillClass}`}
                >
                  {category.flowLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {category.connectors.map((c) => {
                  const isSelected = selectedConnectors.has(c.id);
                  const status = oauthStatus[c.id];
                  const isAlreadyConnected = c.status === "connected";
                  const caps = c.capabilities;

                  return (
                    <motion.button
                      key={c.id}
                      onClick={() => toggleConnector(c.id, category.flowType)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`min-h-[48px] px-4 py-2 rounded-xl border text-[14px] font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? category.selectedClass
                          : isAlreadyConnected
                            ? "border-iw-forest bg-iw-forest-bright/10 text-iw-forest"
                            : "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isSelected && status === "connecting" && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        {isSelected && status !== "connecting" && (
                          <Check className="w-4 h-4" strokeWidth={3} />
                        )}
                        {isAlreadyConnected && !isSelected && (
                          <Check className="w-3.5 h-3.5 text-iw-forest-mid" strokeWidth={3} />
                        )}
                        <ConnectorLogo
                          id={c.id}
                          name={c.name}
                          category={c.category}
                          className="w-4 h-4"
                        />
                        {c.name}
                      </span>
                      {(() => {
                        const method = getConnectionMethod(c);
                        const meta = CONNECTION_METHOD_META[method];
                        const displayCaps = isAlreadyConnected ? caps : c.supportedCapabilities;
                        return (
                          <span className="flex gap-1 flex-wrap justify-center">
                            {/* Connection mechanism — always shown (MCP | AI Provider | Nango | API) */}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full border ${meta.pill}`}
                              title={meta.description}
                            >
                              {meta.label}
                            </span>
                            {displayCaps?.webhook && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  isAlreadyConnected
                                    ? "bg-iw-forest/10 text-iw-forest"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                Webhooks
                              </span>
                            )}
                            {displayCaps && displayCaps.mcp.length > 0 && method !== "mcp" && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  isAlreadyConnected
                                    ? "bg-iw-gold/10 text-iw-gold"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                MCP tools
                              </span>
                            )}
                          </span>
                        );
                      })()}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl mb-6">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <p className="text-sm text-primary">
            <strong>
              {selectedCount} connector{selectedCount !== 1 ? "s" : ""} selected
            </strong>{" "}
            — OAuth authentication and initial sync will begin after setup
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={onBack}
          className="h-[48px] min-w-[100px] flex items-center justify-center gap-2 px-5 text-foreground border border-border hover:bg-muted font-semibold rounded-xl bg-card transition-all text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={handleLaunch}
          disabled={isSubmitting}
          className={`h-[48px] flex-1 rounded-xl text-[15px] font-bold transition-all flex items-center justify-center gap-2 ${
            isSubmitting
              ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
              : "bg-primary text-primary-foreground hover:bg-iw-forest-bright"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Launch Workspace
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={handleSkip}
          className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          Skip — I'll connect tools later
        </button>
      </div>
    </div>
  );
}

export default ConnectorsStep;
