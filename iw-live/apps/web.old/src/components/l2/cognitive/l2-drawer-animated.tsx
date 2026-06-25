"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Brain,
  ChevronUp,
  Crosshair,
  GitBranch,
  Layers,
  RefreshCw,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpinePanel, ContextPanel } from "@/components/l2/cognitive/panels";
import { TwinInsightsSurface } from "@/components/l2/insights/twin-insights-surface";
import { openTwinWorkbench } from "@/lib/twin-handoff";
import type { CTXEnum } from "@/components/l2/spine/types";
import {
  SignalsPanel,
  KnowledgePanel,
  ThinkPanel,
  MemoryPanel,
  CorrectRedoPanel,
  PolicyPanel,
  EvidencePanel,
  AuditPanel,
  ProactiveTwinPanel,
  WorkflowsPanel,
} from "@/components/_deprecated/l2-removed/panels-index-full";

export type L2Surface =
  | "spine"
  | "context"
  | "knowledge"
  | "entity360"
  | "think"
  | "act"
  | "adjust"
  | "twin"
  | "twin-handoff"
  | "signals";

type DrawerHeight = "standard" | "deep" | "fullscreen";
type TriggerSource =
  | "keyboard"
  | "ui_click"
  | "signal"
  | "agent"
  | "evidence"
  | "approval"
  | "system"
  | "twin";

interface OpenDrawerParams {
  trigger: TriggerSource;
  contextType?: string;
  contextId?: string;
  requestedSurface?: L2Surface;
  title?: string;
  confidence?: number;
  relatedContext?: string;
  entityName?: string;
  domain?: CTXEnum;
}

interface L2Intent {
  title: string;
  confidence: number;
  relatedContext: string;
  trigger: TriggerSource;
}

interface DrawerContextValue {
  isOpen: boolean;
  surface: L2Surface;
  height: DrawerHeight;
  contextId: string | null;
  contextType: string | null;
  entityName: string | null;
  domain: CTXEnum | null;
  intent: L2Intent;
  openDrawer: (params: OpenDrawerParams) => void;
  closeDrawer: () => void;
  setSurface: (surface: L2Surface) => void;
  setHeight: (height: DrawerHeight) => void;
}

const L2Context = createContext<DrawerContextValue | undefined>(undefined);

export function useL2Drawer() {
  const context = useContext(L2Context);
  if (!context) throw new Error("useL2Drawer must be used within L2DrawerProvider");
  return context;
}

interface SurfaceDef {
  id: L2Surface;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  flow: "ab" | "c";
}

const SURFACES: SurfaceDef[] = [
  { id: "spine", label: "Spine", icon: GitBranch, flow: "ab" },
  { id: "context", label: "Context", icon: Layers, flow: "ab" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, flow: "ab" },
  { id: "entity360", label: "Entity 360", icon: Crosshair, flow: "ab" },
  { id: "think", label: "HITL (Think)", icon: Brain, flow: "c" },
  { id: "act", label: "Act", icon: Zap, flow: "c" },
  { id: "adjust", label: "Adjust", icon: RefreshCw, flow: "c" },
  { id: "twin", label: "Twin Insights", icon: Sparkles, flow: "c" },
];

const FLOW_AB_SURFACES = SURFACES.filter((s) => s.flow === "ab");
const FLOW_C_SURFACES = SURFACES.filter((s) => s.flow === "c");

const HEIGHT_VARIANTS: Record<DrawerHeight, string> = {
  standard: "68vh",
  deep: "80vh",
  fullscreen: "96vh",
};

const DEFAULT_INTENT: L2Intent = {
  title: "Signal requires review",
  confidence: 82,
  relatedContext: "Current workspace entity",
  trigger: "system",
};

export function L2DrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [surface, setSurface] = useState<L2Surface>("spine");
  const [height, setHeight] = useState<DrawerHeight>("standard");
  const [contextId, setContextId] = useState<string | null>(null);
  const [contextType, setContextType] = useState<string | null>(null);
  const [entityName, setEntityName] = useState<string | null>(null);
  const [domain, setDomain] = useState<CTXEnum | null>(null);
  const [intent, setIntent] = useState<L2Intent>(DEFAULT_INTENT);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const closeDrawer = () => setIsOpen(false);

  const openDrawer = (params: OpenDrawerParams) => {
    if (params.requestedSurface) setSurface(params.requestedSurface);
    setContextId(params.contextId || "current");
    setContextType(params.contextType || "entity");
    setEntityName(params.entityName || null);
    setDomain(params.domain || null);
    setIntent({
      title: params.title || "Signal requires review",
      confidence: params.confidence ?? 82,
      relatedContext: params.relatedContext || "Current workspace entity",
      trigger: params.trigger,
    });
    setIsOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        if (isOpen) {
          closeDrawer();
        } else {
          openDrawer({ trigger: "keyboard", requestedSurface: "spine" });
        }
      }
      if (e.key === "Escape" && isOpen) closeDrawer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const onOpenGeneric = () => openDrawer({ trigger: "ui_click", requestedSurface: "spine" });
    const onEvidenceOpen = (e: Event) => {
      const detail = (e as CustomEvent<Record<string, unknown>>).detail || {};
      openDrawer({
        trigger: "evidence",
        requestedSurface: "entity360",
        contextId: String(detail.entityId || "current"),
        contextType: String(detail.entityType || "entity"),
        title: "Evidence needs verification",
        confidence: 90,
        relatedContext: String(detail.context || "Evidence chain"),
      });
    };
    const onCognitiveOpen = (e: Event) => {
      const detail = (e as CustomEvent<Record<string, unknown>>).detail || {};
      const surfaceCandidate = String(detail.surface || "spine") as L2Surface;
      openDrawer({
        trigger: "signal",
        requestedSurface: SURFACES.some((s) => s.id === surfaceCandidate)
          ? surfaceCandidate
          : "signals",
        contextId: String(detail.entityId || detail.contextId || "current"),
        contextType: String(detail.entityType || "entity"),
        entityName: detail.entityName ? String(detail.entityName) : undefined,
        domain: detail.domain ? (String(detail.domain) as CTXEnum) : undefined,
        title: String(detail.title || "Cognitive review requested"),
        confidence: Number(detail.confidence || 78),
        relatedContext: String(detail.relatedContext || "Live workspace signal"),
      });
    };

    window.addEventListener("open-cognitive-layer", onOpenGeneric);
    window.addEventListener("iw:evidence:open", onEvidenceOpen as EventListener);
    window.addEventListener("iw:cognitive:open", onCognitiveOpen as EventListener);
    return () => {
      window.removeEventListener("open-cognitive-layer", onOpenGeneric);
      window.removeEventListener("iw:evidence:open", onEvidenceOpen as EventListener);
      window.removeEventListener("iw:cognitive:open", onCognitiveOpen as EventListener);
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => setTouchStartY(e.touches[0]?.clientY ?? null);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const delta = (e.changedTouches[0]?.clientY ?? 0) - touchStartY;
    if (delta > 80) closeDrawer();
    setTouchStartY(null);
  };

  const activeSurface = useMemo(() => SURFACES.find((s) => s.id === surface), [surface]);

  const contextValue: DrawerContextValue = {
    isOpen,
    surface,
    height,
    contextId,
    contextType,
    entityName,
    domain,
    intent,
    openDrawer,
    closeDrawer,
    setSurface,
    setHeight,
  };

  return (
    <L2Context.Provider value={contextValue}>
      {children}

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="l2-closed-bar"
            className="fixed bottom-0 left-0 right-0 h-8 text-white flex items-center justify-center gap-2 z-[900]"
            style={{
              background: "var(--iw-bg-tertiary)",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTop: "1px solid var(--iw-border)",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={() => openDrawer({ trigger: "ui_click", requestedSurface: "spine" })}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Cognitive Workspace (L2) · ⌘J</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 z-[895]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />
            <motion.div
              key="l2-drawer"
              className="fixed left-0 right-0 bottom-0 z-[900] rounded-t-2xl overflow-hidden"
              style={{
                background: "var(--iw-bg-secondary)",
                borderTop: "1px solid var(--iw-border)",
                boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0, height: HEIGHT_VARIANTS[height] }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className="h-full flex flex-col">
                {/* Header (Figma: L2 drawer header) */}
                <div
                  className="px-6 py-4 border-b"
                  style={{ borderColor: "var(--iw-border)", background: "var(--iw-bg-secondary)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{contextType || "entity"}</Badge>
                        <Badge variant="outline">Confidence: {intent.confidence}%</Badge>
                        <Badge variant="outline">Source: {intent.trigger}</Badge>
                      </div>
                      <h2 className="text-lg font-semibold">{intent.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        Related context: {intent.relatedContext} {contextId ? `· ${contextId}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-56 h-8 text-xs"
                        placeholder="Search evidence / reasoning..."
                        aria-label="Search cognitive workspace"
                      />
                      <div className="hidden md:flex items-center gap-1">
                        <Button
                          variant={height === "standard" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setHeight("standard")}
                        >
                          68vh
                        </Button>
                        <Button
                          variant={height === "deep" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setHeight("deep")}
                        >
                          80vh
                        </Button>
                        <Button
                          variant={height === "fullscreen" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setHeight("fullscreen")}
                        >
                          96vh
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeDrawer}
                        aria-label="Close cognitive workspace"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div
                  className="px-4 py-2 border-b overflow-x-auto"
                  style={{ borderColor: "var(--iw-border)" }}
                >
                  <div className="flex items-center gap-1 min-w-max">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-1 mr-1">
                      Flow A/B
                    </span>
                    {FLOW_AB_SURFACES.map((tab) => {
                      const Icon = tab.icon;
                      const active = tab.id === surface;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setSurface(tab.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                    <div className="w-px h-6 bg-border mx-2" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-1 mr-1">
                      Flow C
                    </span>
                    {FLOW_C_SURFACES.map((tab) => {
                      const Icon = tab.icon;
                      const active = tab.id === surface;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setSurface(tab.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Main panel */}
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold">{activeSurface?.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {activeSurface?.flow === "ab"
                          ? "Flow A/B — Inspect and work with canonical truth from structured and unstructured data."
                          : "Flow C — AI session loop: review reasoning, approve actions, adjust, and configure your twin."}
                      </p>
                    </div>
                    <SurfaceContent
                      surface={surface}
                      entityType={contextType || undefined}
                      entityId={contextId || undefined}
                      entityName={entityName || undefined}
                      domain={domain || undefined}
                      onCloseAfterApproval={closeDrawer}
                    />
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </L2Context.Provider>
  );
}

function SurfaceContent({
  surface,
  entityType,
  entityId,
  entityName,
  domain,
  onCloseAfterApproval,
}: {
  surface: L2Surface;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  domain?: CTXEnum;
  onCloseAfterApproval: () => void;
}) {
  switch (surface) {
    case "spine":
      return (
        <div className="space-y-6">
          <SpinePanel entityType={entityType} entityId={entityId} />
          <SubSection title="Signals">
            <SignalsPanel entityType={entityType} entityId={entityId} />
          </SubSection>
        </div>
      );
    case "context":
      return <ContextPanel entityType={entityType} entityId={entityId} />;
    case "knowledge":
      return <KnowledgePanel entityType={entityType} entityId={entityId} />;
    case "entity360":
      return <Entity360Surface entityType={entityType} entityId={entityId} />;
    case "think":
      return (
        <div className="space-y-6">
          <ThinkPanel entityType={entityType} entityId={entityId} />
          <SubSection title="Session Memory">
            <MemoryPanel entityType={entityType} entityId={entityId} />
          </SubSection>
        </div>
      );
    case "act":
      return <ActSurface onCloseAfterApproval={onCloseAfterApproval} />;
    case "adjust":
      return (
        <div className="space-y-6">
          <CorrectRedoPanel entityType={entityType} entityId={entityId} />
          <SubSection title="Policies">
            <PolicyPanel entityType={entityType} entityId={entityId} />
          </SubSection>
        </div>
      );
    case "twin":
      return (
        <TwinInsightsSurface
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
          domain={domain}
        />
      );
    default:
      return null;
  }
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/50 transition-colors"
      >
        <span>{title}</span>
        <ChevronUp className={`w-4 h-4 transition-transform ${open ? "" : "rotate-180"}`} />
      </button>
      {open && <div className="border-t">{children}</div>}
    </div>
  );
}

function Entity360Surface({ entityType, entityId }: { entityType?: string; entityId?: string }) {
  return (
    <div className="space-y-4">
      <div className="p-3 border border-iw-gold/20 rounded-lg bg-iw-gold-pale">
        <h3 className="font-semibold flex items-center gap-2 text-iw-gold">
          <Crosshair className="h-5 w-5 text-iw-gold" />
          Entity 360 — Unified Cross-Source View
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Combines Flow A (structured) and Flow B (unstructured) data into a single entity picture.
        </p>
      </div>

      {entityId && entityId !== "current" ? (
        <div className="space-y-3">
          <div className="p-2 border rounded bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Viewing:{" "}
              <code className="bg-muted px-1 rounded">
                {entityType}/{entityId}
              </code>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 border rounded-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Flow A — Structured
              </p>
              <p className="text-sm text-muted-foreground">
                CRM fields, sync data, webhook events, and normalized records from connectors.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Flow B — Unstructured
              </p>
              <p className="text-sm text-muted-foreground">
                Extracted insights, linked knowledge, documents, and enriched context.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          <Crosshair className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Select an entity from Spine or click an entity in L1 to see its 360 view.
          </p>
        </div>
      )}

      <SubSection title="Evidence Trail">
        <EvidencePanel entityType={entityType} entityId={entityId} />
      </SubSection>

      <SubSection title="Audit Log">
        <AuditPanel entityType={entityType} entityId={entityId} />
      </SubSection>
    </div>
  );
}

function ActSurface({ onCloseAfterApproval }: { onCloseAfterApproval: () => void }) {
  const [status, setStatus] = useState<Record<string, "idle" | "approved" | "rejected">>({});
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchQueue() {
      setLoading(true);
      setError(null);
      try {
        const { getHITLQueue } = await import("@/lib/l2-client");
        const items = await getHITLQueue();
        if (!cancelled) setProposals(items);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load approval queue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchQueue();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDecision = async (id: string, decision: "approved" | "rejected") => {
    setStatus((prev) => ({ ...prev, [id]: decision }));
    try {
      const { approveHITLAction } = await import("@/lib/l2-client");
      await approveHITLAction(id, decision === "approved" ? "approve" : "deny");
      if (decision === "approved") {
        setTimeout(() => onCloseAfterApproval(), 800);
      }
    } catch {
      setStatus((prev) => ({ ...prev, [id]: "idle" }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Loading approval queue...</p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="iw-intelligence-card p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-2/3 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Failed to load approval queue</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">No pending approvals</p>
        <p className="text-xs mt-1">Actions requiring your review will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        AI-proposed actions require your approval before execution. Nothing runs automatically.
      </p>
      {proposals.map((proposal: any) => {
        const s = status[proposal.id] || "idle";
        const title = proposal.action_type || proposal.title || "Pending action";
        const outcome = proposal.payload?.description || proposal.outcome || "";
        const tools = proposal.target_tool || proposal.tools || "";
        return (
          <div key={proposal.id} className="iw-intelligence-card p-4">
            <p className="font-medium">{title}</p>
            {outcome && (
              <p className="text-sm text-muted-foreground mt-1">Expected outcome: {outcome}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs">
              {tools && <Badge variant="outline">Tools: {tools}</Badge>}
              <Badge variant="outline">Status: {proposal.status || "pending"}</Badge>
            </div>
            {s === "idle" ? (
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" onClick={() => handleDecision(proposal.id, "approved")}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDecision(proposal.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            ) : (
              <Badge className="mt-3" variant={s === "approved" ? "default" : "destructive"}>
                {s === "approved" ? "Approved" : "Rejected"}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TwinAgentSurface({ entityType, entityId }: { entityType?: string; entityId?: string }) {
  return (
    <div className="space-y-4">
      <div className="p-3 border border-iw-forest/20 rounded-lg bg-iw-forest/10">
        <h3 className="font-semibold flex items-center gap-2 text-iw-forest">
          <Users className="h-5 w-5 text-iw-forest" />
          Twin Agent &amp; Workflows
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your proactive digital twin. Monitors patterns, surfaces insights, and runs configured
          workflows.
        </p>
      </div>

      <div className="space-y-3">
        <div className="iw-intelligence-card p-4">
          <p className="font-medium">Proactive Twin</p>
          <ProactiveTwinPanel entityType={entityType} entityId={entityId} />
        </div>

        <div className="iw-intelligence-card p-4">
          <p className="font-medium mb-3">Configured Workflows</p>
          <WorkflowsPanel entityType={entityType} entityId={entityId} />
        </div>
      </div>
    </div>
  );
}
