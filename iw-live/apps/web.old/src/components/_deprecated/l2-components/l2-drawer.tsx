"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  X,
  ChevronUp,
  Search,
  Maximize2,
  Database,
  Brain,
  BookOpen,
  Activity,
  Zap,
  CheckSquare,
  Settings,
  Shield,
  BarChart3,
  Users,
  Bot,
  MessageSquare,
  SearchIcon,
  FileText,
  GitBranch,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpinePanel } from "@/components/l2/cognitive/panels/spine-panel";
import { useAuth } from "@/components/core/auth/auth-provider";

// L2 Surface Types (14 cognitive surfaces)
type L2Surface =
  | "spine"
  | "context"
  | "knowledge"
  | "evidence"
  | "signals"
  | "think"
  | "act"
  | "govern"
  | "adjust"
  | "audit"
  | "agent"
  | "twin"
  | "chat"
  | "search";

// Drawer State Machine (Canonical)
type DrawerState =
  | "CLOSED"
  | "OPENING"
  | "OPEN_ACTIVE"
  | "SWITCHING"
  | "SYNCING"
  | "FROZEN"
  | "CLOSING";

// Height states per spec: 32px, 68vh, 88vh, 100vh
type DrawerHeight = "collapsed" | "standard" | "deep" | "fullscreen";

// User cognitive mode
type CognitiveMode = "operator" | "analyst" | "architect";

// Context types
type ContextType = "entity" | "approval" | "situation" | "timeline" | "search";

// Flow types
type FlowType = "A" | "B" | "C";

interface DrawerContext {
  state: DrawerState;
  height: DrawerHeight;
  surface: L2Surface;
  mode: CognitiveMode;
  contextId: string | null;
  contextType: ContextType | null;
  isOpen: boolean;
  isFrozen: boolean;
  openDrawer: (params: OpenDrawerParams) => void;
  closeDrawer: () => void;
  switchSurface: (surface: L2Surface) => void;
  setHeight: (height: DrawerHeight) => void;
  syncDrawer: (reason: SyncReason) => void;
  freezeDrawer: (reason: FreezeReason) => void;
}

interface OpenDrawerParams {
  trigger: "keyboard" | "ui_click" | "system";
  contextType: ContextType;
  contextId: string;
  requestedSurface?: L2Surface;
  userMode?: CognitiveMode;
}

type SyncReason =
  | "interval"
  | "manual"
  | "context_update"
  | "flow_update"
  | "approval_state_change";
type FreezeReason =
  | "approval_generation"
  | "approval_open"
  | "audit_capture"
  | "export"
  | "replay_checkpoint";

const L2Context = createContext<DrawerContext | undefined>(undefined);

export function useL2Drawer() {
  const context = useContext(L2Context);
  if (!context) throw new Error("useL2Drawer must be used within L2DrawerProvider");
  return context;
}

export function L2DrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrawerState>("CLOSED");
  const [height, setHeight] = useState<DrawerHeight>("standard");
  const [surface, setSurface] = useState<L2Surface>("chat");
  const [mode, setMode] = useState<CognitiveMode>("operator");
  const [contextId, setContextId] = useState<string | null>(null);
  const [contextType, setContextType] = useState<ContextType | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  // Keyboard shortcut ⌘J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        if (isOpen) {
          closeDrawer();
        } else {
          openDrawer({
            trigger: "keyboard",
            contextType: "entity",
            contextId: "current-page",
          });
        }
      }
      // ESC to close
      if (e.key === "Escape" && isOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const openDrawer = (params: OpenDrawerParams) => {
    setState("OPENING");
    setContextId(params.contextId);
    setContextType(params.contextType);
    if (params.requestedSurface) setSurface(params.requestedSurface);
    if (params.userMode) setMode(params.userMode);

    // Latency target: Open shell < 80ms
    setTimeout(() => {
      setState("OPEN_ACTIVE");
      setIsOpen(true);
    }, 60);
  };

  const closeDrawer = () => {
    setState("CLOSING");
    // Motion spec: 220ms
    setTimeout(() => {
      setState("CLOSED");
      setIsOpen(false);
    }, 220);
  };

  const switchSurface = (newSurface: L2Surface) => {
    setState("SWITCHING");
    // Performance target: Hot surface < 120ms
    setTimeout(() => {
      setSurface(newSurface);
      setState("OPEN_ACTIVE");
    }, 100);
  };

  const syncDrawer = (reason: SyncReason) => {
    if (isFrozen) {
      console.log("[v0] Sync forbidden: Drawer is frozen");
      return;
    }
    setState("SYNCING");
    // Tier 1 metadata sync < 80ms
    setTimeout(() => {
      setState("OPEN_ACTIVE");
      console.log("[v0] Drawer synced:", reason);
    }, 70);
  };

  const freezeDrawer = (reason: FreezeReason) => {
    setIsFrozen(true);
    setState("FROZEN");
    console.log("[v0] Drawer frozen:", reason);
  };

  // Height map per spec
  const heightStyles = {
    collapsed: { height: "32px", visible: false },
    standard: { height: "68vh", visible: true },
    deep: { height: "88vh", visible: true },
    fullscreen: { height: "100vh", visible: true },
  };

  const currentHeight = isOpen ? heightStyles[height] : heightStyles.collapsed;

  return (
    <L2Context.Provider
      value={{
        state,
        height,
        surface,
        mode,
        contextId,
        contextType,
        isOpen,
        isFrozen,
        openDrawer,
        closeDrawer,
        switchSurface,
        setHeight,
        syncDrawer,
        freezeDrawer,
      }}
    >
      {children}

      {/* L2 Drawer - Z-Index 900 per spec */}
      <div
        className="fixed bottom-0 left-0 right-0 transition-all"
        style={{
          zIndex: 900,
          height: currentHeight.height,
          transitionDuration: "220ms",
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: isOpen ? "0 -4px 32px rgba(0,0,0,0.12)" : "none",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          backgroundColor: "white",
        }}
      >
        {/* Collapsed Bar (32px) - Passive awareness */}
        {!isOpen && (
          <button
            onClick={() =>
              openDrawer({ trigger: "ui_click", contextType: "entity", contextId: "current" })
            }
            className="w-full h-8 flex items-center justify-center gap-2 bg-[#142E20] text-white hover:bg-[#2d5a3d] transition-colors text-sm font-medium"
            style={{ borderTopLeftRadius: "20px", borderTopRightRadius: "20px" }}
          >
            <Brain className="w-4 h-4" />
            <span>Cognitive Layer (⌘J)</span>
            <ChevronUp className="w-3 h-3" />
          </button>
        )}

        {/* Full Drawer */}
        {isOpen && (
          <div className="flex flex-col h-full">
            {/* Header (64px fixed per spec) - Z-920 */}
            <div
              className="h-16 flex items-center justify-between shrink-0"
              style={{
                paddingLeft: "32px",
                paddingRight: "32px",
                paddingTop: "16px",
                paddingBottom: "16px",
                borderBottom: "1px solid #E9E5DD",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2
                    className="text-lg font-semibold leading-6"
                    style={{ fontFamily: "Sora, sans-serif" }}
                  >
                    Cognitive Intelligence
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-xs">
                      {contextType || "entity"}
                    </Badge>
                    {isFrozen && (
                      <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                        Frozen
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">State: {state}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Surface search..."
                  className="w-48 h-8 text-xs"
                  onChange={() => {}}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const heights: DrawerHeight[] = ["standard", "deep", "fullscreen"];
                    const idx = heights.indexOf(height);
                    setHeight(heights[(idx + 1) % heights.length]);
                  }}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => syncDrawer("manual")}>
                  <Activity className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={closeDrawer}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Surface Tabs (48px per spec) - Z-930 */}
            <Tabs
              value={surface}
              onValueChange={(v: string) => switchSurface(v as L2Surface)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList
                className="h-12 rounded-none justify-start bg-transparent shrink-0"
                style={{
                  paddingLeft: "32px",
                  paddingRight: "32px",
                  gap: "24px",
                  borderBottom: "1px solid #E9E5DD",
                }}
              >
                <TabsTrigger
                  value="spine"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-medium">Spine</span>
                </TabsTrigger>
                <TabsTrigger
                  value="context"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm font-medium">Context</span>
                </TabsTrigger>
                <TabsTrigger
                  value="knowledge"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Knowledge</span>
                </TabsTrigger>
                <TabsTrigger
                  value="evidence"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Evidence</span>
                </TabsTrigger>
                <TabsTrigger
                  value="signals"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Signals</span>
                </TabsTrigger>
                <TabsTrigger
                  value="think"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-medium">Think</span>
                </TabsTrigger>
                <TabsTrigger
                  value="act"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Act</span>
                </TabsTrigger>
                <TabsTrigger
                  value="govern"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Govern</span>
                </TabsTrigger>
                <TabsTrigger
                  value="adjust"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Adjust</span>
                </TabsTrigger>
                <TabsTrigger
                  value="audit"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Audit</span>
                </TabsTrigger>
                <TabsTrigger
                  value="agent"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <Bot className="w-4 h-4" />
                  <span className="text-sm font-medium">Agent</span>
                </TabsTrigger>
                <TabsTrigger
                  value="twin"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Twin</span>
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Chat</span>
                </TabsTrigger>
                <TabsTrigger
                  value="search"
                  className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none bg-transparent px-2 py-3"
                >
                  <SearchIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Search</span>
                </TabsTrigger>
              </TabsList>

              {/* Content Region (Scrollable, independent scroll container) - Z-940 */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto" style={{ padding: "32px" }}>
                  <TabsContent value="spine" className="mt-0" style={{ marginTop: 0 }}>
                    <SurfaceSpine />
                  </TabsContent>
                  <TabsContent value="context" className="mt-0">
                    <SurfaceContext />
                  </TabsContent>
                  <TabsContent value="knowledge" className="mt-0">
                    <SurfaceKnowledge />
                  </TabsContent>
                  <TabsContent value="evidence" className="mt-0">
                    <SurfaceEvidence />
                  </TabsContent>
                  <TabsContent value="signals" className="mt-0">
                    <SurfaceSignals />
                  </TabsContent>
                  <TabsContent value="think" className="mt-0">
                    <SurfaceThink />
                  </TabsContent>
                  <TabsContent value="act" className="mt-0">
                    <SurfaceAct />
                  </TabsContent>
                  <TabsContent value="govern" className="mt-0">
                    <SurfaceGovern />
                  </TabsContent>
                  <TabsContent value="adjust" className="mt-0">
                    <SurfaceAdjust />
                  </TabsContent>
                  <TabsContent value="audit" className="mt-0">
                    <SurfaceAudit />
                  </TabsContent>
                  <TabsContent value="agent" className="mt-0">
                    <SurfaceAgent />
                  </TabsContent>
                  <TabsContent value="twin" className="mt-0">
                    <SurfaceTwin />
                  </TabsContent>
                  <TabsContent value="chat" className="mt-0">
                    <SurfaceChat />
                  </TabsContent>
                  <TabsContent value="search" className="mt-0">
                    <SurfaceSearch />
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </L2Context.Provider>
  );
}

// Evidence Card Component (Canonical Spec: min-height 120px, padding 20px, radius 12px, 8px grid system)
function EvidenceCard({
  flow,
  title,
  detail,
  source,
  timestamp,
  confidence,
}: {
  flow: FlowType;
  title: string;
  detail: string;
  source: string;
  timestamp: string;
  confidence?: number;
}) {
  // Flow color system per spec
  const flowStyles = {
    A: { border: "4px solid #9a7a34", bg: "#F5F3EF" }, // Indigo
    B: { border: "4px solid #9A7A34", bg: "#FAF4E6" }, // Purple
    C: { border: "4px solid #B8943F", bg: "#FAF4E6" }, // Amber
  };

  return (
    <div
      className="rounded-xl"
      style={{
        minHeight: "120px",
        padding: "20px",
        borderLeft: flowStyles[flow].border,
        backgroundColor: flowStyles[flow].bg,
        marginBottom: "16px", // Gap between cards per spec
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-6 h-6 text-gray-600" />
        <span className="text-xs font-medium text-gray-600">{source}</span>
      </div>
      <h4 className="text-base font-semibold mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
        {title}
      </h4>
      <p className="text-sm mb-4" style={{ fontSize: "14px", fontWeight: 400 }}>
        {detail}
      </p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>{timestamp}</span>
        <span>Flow {flow}</span>
        {confidence && <span>Confidence: {confidence}%</span>}
      </div>
    </div>
  );
}

// Surface Components (14 intelligence surfaces)
function SurfaceSpine() {
  const context = useL2Drawer();
  const auth = useAuth();

  return (
    <SpinePanel
      entityId={context.contextId || undefined}
      entityType="account"
      tenantId={auth.session?.user.id ?? undefined}
    />
  );
}

function SurfaceContext() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        Context Store (Flow B - Memory)
      </h3>
      <EvidenceCard
        flow="B"
        title="Session: Product Strategy QBR"
        detail="Discussion about Q2 roadmap priorities and API v3 expansion hypothesis with Stark Industries"
        source="Memory Bank"
        timestamp="Yesterday, 2:30 PM"
      />
      <EvidenceCard
        flow="B"
        title="Session: Customer Health Review"
        detail="Analyzed top 20 at-risk accounts, identified intervention patterns"
        source="Memory Bank"
        timestamp="2 days ago"
      />
    </div>
  );
}

function SurfaceKnowledge() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        Knowledge Bank
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 border border-gray-200 rounded-xl bg-white">
          <BookOpen className="w-8 h-8 text-indigo-600 mb-3" />
          <h4 className="font-semibold mb-1">Documentation</h4>
          <p className="text-sm text-gray-600">342 articles indexed</p>
        </div>
        <div className="p-5 border border-gray-200 rounded-xl bg-white">
          <Database className="w-8 h-8 text-purple-600 mb-3" />
          <h4 className="font-semibold mb-1">Session Archives</h4>
          <p className="text-sm text-gray-600">1,847 sessions stored</p>
        </div>
      </div>
    </div>
  );
}

function SurfaceEvidence() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        Evidence Timeline (All Flows)
      </h3>
      <EvidenceCard
        flow="C"
        title="SLA Breach Detected"
        detail="HubSpot webhook latency exceeded 30s threshold for tenant integratewise-demo"
        source="Live Signal Monitor"
        timestamp="15 minutes ago"
        confidence={92}
      />
      <EvidenceCard
        flow="A"
        title="Data Validation Complete"
        detail="All 1,240 customer health scores validated against source systems. Zero discrepancies."
        source="Spine Truth Store"
        timestamp="1 hour ago"
        confidence={100}
      />
      <EvidenceCard
        flow="B"
        title="Pattern Match: Expansion Signal"
        detail="Stark Industries inquiry matches 14 historical expansion patterns with 87% confidence"
        source="Memory Pattern Engine"
        timestamp="3 hours ago"
        confidence={87}
      />
    </div>
  );
}

function SurfaceSignals() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        Live Signals & Situations (Flow C)
      </h3>
      <EvidenceCard
        flow="C"
        title="Churn Risk: Cyberdyne Systems"
        detail="Health score dropped from 85 to 42 in 24 hours. Support tickets increased 3x. Last login 5 days ago."
        source="ChurnShield Agent"
        timestamp="Just now"
        confidence={94}
      />
      <EvidenceCard
        flow="C"
        title="Expansion Opportunity: Stark Industries"
        detail="CEO mentioned API v3 interest in QBR. ARR $25M. Pattern match confidence 87%."
        source="DealDesk Agent"
        timestamp="2 hours ago"
        confidence={87}
      />
    </div>
  );
}

function SurfaceThink() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        AI Reasoning Surface
      </h3>
      <div
        style={{
          padding: "24px",
          backgroundColor: "#F5F3EF",
          borderLeft: "4px solid #9a7a34",
          borderRadius: "12px",
          marginBottom: "16px",
        }}
      >
        <h4
          className="font-semibold text-lg mb-3"
          style={{ fontFamily: "Sora, sans-serif", fontSize: "20px", fontWeight: 600 }}
        >
          Expansion Hypothesis: Stark Industries
        </h4>
        <p
          className="text-sm leading-relaxed mb-4"
          style={{ fontSize: "13px", lineHeight: "20px" }}
        >
          <strong>Signal:</strong> Stark Industries CEO mentioned interest in the new API v3 layer
          during quarterly business review.
          <br />
          <br />
          <strong>Pattern Match:</strong> This signal matches 14 historical expansion opportunities
          with 87% confidence. Similar signals led to expansion within 90 days in 12 out of 14
          cases.
          <br />
          <br />
          <strong>Context:</strong> Current ARR $25M, API usage increased 40% in Q4, 3 new
          integrations requested.
          <br />
          <br />
          <strong>Recommendation:</strong> Schedule technical deep-dive within 2 weeks. Estimated
          expansion ARR: $8-12M.
        </p>
        <div className="flex gap-2">
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
            High Confidence: 87%
          </Badge>
          <Badge variant="secondary">api-v3</Badge>
          <Badge variant="secondary">expansion</Badge>
        </div>
      </div>
    </div>
  );
}

function SurfaceAct() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { getHITLQueue } = await import("@/lib/l2-client");
        const data = await getHITLQueue();
        if (!cancelled) setItems(data);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleApprove = async (id: string) => {
    setActionStatus((prev) => ({ ...prev, [id]: "approving" }));
    try {
      const { approveHITLAction } = await import("@/lib/l2-client");
      await approveHITLAction(id, "approve");
      setActionStatus((prev) => ({ ...prev, [id]: "approved" }));
    } catch {
      setActionStatus((prev) => ({ ...prev, [id]: "error" }));
    }
  };

  if (loading) {
    return (
      <div style={{ marginBottom: "24px" }}>
        <h3
          className="text-sm font-semibold uppercase tracking-wider text-gray-500"
          style={{ marginBottom: "12px" }}
        >
          Action Queue
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 border border-gray-200 rounded-xl bg-white animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ marginBottom: "24px" }}>
        <h3
          className="text-sm font-semibold uppercase tracking-wider text-gray-500"
          style={{ marginBottom: "12px" }}
        >
          Action Queue
        </h3>
        <div className="p-8 text-center text-gray-400">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No pending actions</p>
          <p className="text-xs mt-1">Approved and pending actions will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        Action Queue
      </h3>
      <div className="space-y-3">
        {items.map((item: any) => {
          const s = actionStatus[item.id];
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-5 border border-gray-200 rounded-xl bg-white"
            >
              <div className="flex items-center gap-3 flex-1">
                <CheckSquare className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium mb-1">
                    {item.action_type || item.title || "Pending action"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.payload?.description || item.target_tool || ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={item.status === "pending_approval" ? "default" : "secondary"}>
                  {item.status || "pending"}
                </Badge>
                {s === "approved" ? (
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                ) : s === "approving" ? (
                  <Badge variant="secondary">Approving...</Badge>
                ) : (
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleApprove(item.id)}
                  >
                    Approve
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SurfaceGovern() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        Governance & Policies
      </h3>
      <div className="p-5 border border-gray-200 rounded-xl bg-white mb-4">
        <Shield className="w-8 h-8 text-emerald-600 mb-3" />
        <h4 className="font-semibold mb-3">Active Governance Rules</h4>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <div>
              <p className="font-medium">Freeze Required</p>
              <p className="text-xs text-gray-600">
                Evidence must be frozen on approval creation/open
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <div>
              <p className="font-medium">Sync Forbidden When Frozen</p>
              <p className="text-xs text-gray-600">
                No background updates allowed on frozen evidence
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <div>
              <p className="font-medium">Data Retention</p>
              <p className="text-xs text-gray-600">Minimum 2 years for compliance</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

function SurfaceAdjust() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        System Adjustments & Tuning
      </h3>
      <div className="space-y-4">
        {[
          { param: "Confidence Threshold", value: 75, min: 50, max: 95, unit: "%" },
          { param: "Sync Frequency", value: 5, min: 1, max: 30, unit: " min" },
          { param: "Alert Sensitivity", value: 70, min: 0, max: 100, unit: "%" },
        ].map((item, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-sm">{item.param}</span>
              <span className="text-sm text-indigo-600 font-semibold">
                {item.value}
                {item.unit}
              </span>
            </div>
            <input
              type="range"
              min={item.min}
              max={item.max}
              value={item.value}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #9a7a34 0%, #9a7a34 ${((item.value - item.min) / (item.max - item.min)) * 100}%, #E9E5DD ${((item.value - item.min) / (item.max - item.min)) * 100}%, #E9E5DD 100%)`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SurfaceAudit() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { getAuditTrail } = await import("@/lib/l2-client");
        const data = await getAuditTrail(50);
        if (!cancelled) setEntries(data);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function formatTime(ts: string): string {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  if (loading) {
    return (
      <div style={{ marginBottom: "24px" }}>
        <h3
          className="text-sm font-semibold uppercase tracking-wider text-gray-500"
          style={{ marginBottom: "12px" }}
        >
          Audit Trail
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={{ marginBottom: "24px" }}>
        <h3
          className="text-sm font-semibold uppercase tracking-wider text-gray-500"
          style={{ marginBottom: "12px" }}
        >
          Audit Trail
        </h3>
        <div className="p-8 text-center text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No audit entries yet</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        Audit Trail
      </h3>
      <div className="space-y-3">
        {entries.map((log: any, i: number) => (
          <div
            key={log.id || i}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-1">
              <p className="font-medium text-sm mb-1">{log.action || log.event || "Action"}</p>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500">
                  by {log.user_id || log.user || log.source || "System"}
                </p>
                <Badge variant="outline" className="text-xs">
                  {log.source || log.type || "system"}
                </Badge>
              </div>
            </div>
            <span className="text-xs text-gray-500">{formatTime(log.created_at || log.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SurfaceAgent() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        AI Agent Configuration
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: "ChurnShield", status: "Active", tasks: 12, color: "red" },
          { name: "DealDesk", status: "Active", tasks: 8, color: "green" },
          { name: "SuccessPilot", status: "Idle", tasks: 0, color: "gray" },
        ].map((agent, i) => (
          <div key={i} className="p-5 border border-gray-200 rounded-xl bg-white">
            <div className="flex items-center justify-between mb-3">
              <Bot className="w-6 h-6 text-indigo-600" />
              <Badge
                variant={agent.status === "Active" ? "default" : "secondary"}
                className="text-xs"
              >
                {agent.status}
              </Badge>
            </div>
            <h4 className="font-semibold mb-1">{agent.name}</h4>
            <p className="text-xs text-gray-500">{agent.tasks} active tasks</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Button size="sm" variant="outline" className="w-full text-xs bg-transparent">
                Configure
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SurfaceTwin() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        Digital Twin Simulations
      </h3>
      <div
        style={{
          padding: "24px",
          backgroundColor: "#FAF4E6",
          borderLeft: "4px solid #9A7A34",
          borderRadius: "12px",
          marginBottom: "16px",
        }}
      >
        <h4
          className="font-semibold text-lg mb-3"
          style={{ fontFamily: "Sora, sans-serif", fontSize: "20px", fontWeight: 600 }}
        >
          What-If Scenario: API v3 Launch
        </h4>
        <p className="text-sm mb-4" style={{ fontSize: "13px", lineHeight: "20px" }}>
          <strong>Hypothesis:</strong> If we launch API v3 in Q2 2025
          <br />
          <br />
          <strong>Projected Impact:</strong>
          <br />
          • Expansion revenue: $420K from 14 qualifying accounts
          <br />
          • Adoption rate: 65% within 90 days
          <br />
          • Support load: +15% (manageable)
          <br />
          <br />
          <strong>Confidence:</strong> 87% based on 14 historical pattern matches
        </p>
        <div className="flex gap-2">
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">Simulation</Badge>
          <Badge variant="secondary">Q2-2025</Badge>
          <Badge variant="secondary">87% confidence</Badge>
        </div>
      </div>
    </div>
  );
}

function SurfaceChat() {
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; content: string }>>([
    {
      role: "assistant",
      content:
        "Hello! I'm your cognitive assistant. I can help you understand evidence, trace decisions, and explore signals across all 14 surfaces. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(68vh - 112px)" }}>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
              )}
              <div
                className={`flex-1 max-w-2xl p-4 rounded-lg ${
                  msg.role === "user" ? "bg-indigo-50 text-gray-900" : "bg-gray-50 text-gray-900"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <Input
            placeholder="Ask anything about your workspace..."
            className="flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                setMessages([...messages, { role: "user", content: input }]);
                setInput("");
              }
            }}
          />
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SurfaceSearch() {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        className="text-sm font-semibold uppercase tracking-wider text-gray-500"
        style={{ marginBottom: "12px" }}
      >
        Universal Search
      </h3>
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search across all 14 cognitive surfaces..."
          className="pl-12 h-14 text-base"
        />
      </div>
      <div className="text-center py-12 text-gray-500 text-sm">
        <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Search across Spine, Context, Knowledge, Evidence, Signals,</p>
        <p>Think, Act, Govern, Adjust, Audit, Agent, Twin, Chat, and all cognitive surfaces</p>
      </div>
    </div>
  );
}
