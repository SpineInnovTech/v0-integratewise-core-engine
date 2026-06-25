"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { SlidingPanel } from "./sliding-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FileSearch,
  Lightbulb,
  Zap,
  Shield,
  History,
  Database,
  Brain,
  BookOpen,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Clock,
  Check,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Activity,
  Layers,
  RotateCcw,
  Workflow,
  Eye,
  GanttChart,
} from "lucide-react";

// Import all L2 panels (13 total per spec)
import {
  // Core L2 panels (enhanced)
  SpinePanel,
  KnowledgePanel,
  SignalsPanel,
  EvidencePanel,
  AuditPanel,
  MemoryPanel,
  // New L2 panels from spec
  ContextPanel,
  ThinkPanel,
  PolicyPanel,
  CorrectRedoPanel,
  WorkflowsPanel,
  ProactiveTwinPanel,
} from "./panels";

// API Base URL for workflow service
const WORKFLOW_API = process.env.NEXT_PUBLIC_WORKFLOW_URL || "https://workflow.integratewise.ai";

interface CognitiveContext {
  entityId?: string;
  entityType?: string;
  situationId?: string;
  context: string;
  scope: Record<string, unknown>;
}

// Evidence data structure
interface EvidenceItem {
  id: string;
  source: string;
  sourceType: "crm" | "email" | "meeting" | "document" | "api";
  timestamp: string;
  content: string;
  confidence: number;
  link?: string;
}

export function CognitiveLayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [ctx, setCtx] = useState<CognitiveContext | null>(null);
  const [activeTab, setActiveTab] = useState("evidence");
  const [position, setPosition] = useState<"right" | "bottom">("right");

  // Listen for evidence open events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setCtx(e.detail);
      setIsOpen(true);
      setActiveTab("evidence");
    };
    window.addEventListener("iw:evidence:open", handler as EventListener);
    return () => window.removeEventListener("iw:evidence:open", handler as EventListener);
  }, []);

  // Listen for cognitive surface open events
  useEffect(() => {
    const handler = (e: CustomEvent<{ surface: string; data?: Record<string, unknown> }>) => {
      setActiveTab(e.detail.surface);
      if (e.detail.data) {
        setCtx({
          context: e.detail.surface,
          scope: e.detail.data,
          entityId: e.detail.data.entityId as string,
          entityType: e.detail.data.entityType as string,
        });
      }
      setIsOpen(true);
    };
    window.addEventListener("iw:cognitive:open", handler as EventListener);
    return () => window.removeEventListener("iw:cognitive:open", handler as EventListener);
  }, []);

  // Listen for generic open-cognitive-layer event (from L1 buttons)
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      setActiveTab("signals"); // Default to signals when opened from L1
    };
    window.addEventListener("open-cognitive-layer", handler);
    return () => window.removeEventListener("open-cognitive-layer", handler);
  }, []);

  // Keyboard shortcut: ⌘J / Ctrl+J to toggle Cognitive Layer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // L2 Tabs organized by cognitive function (13 total per spec)
  // Group 1: Evidence/Truth/Context (grounding)
  // Group 2: IQ/Think/Act (cognitive loop)
  // Group 3: Policy/Audit/Correct (governance)
  // Group 4: Workflows/Twin (orchestration)
  const tabs = [
    // Grounding
    { id: "evidence", label: "Evidence", icon: FileSearch, group: "ground" },
    { id: "spine", label: "Spine", icon: Database, group: "ground" },
    { id: "context", label: "Context", icon: Layers, group: "ground" },
    { id: "knowledge", label: "Knowledge", icon: BookOpen, group: "ground" },
    // Cognitive Loop
    { id: "signals", label: "IQ Hub", icon: Activity, group: "think" },
    { id: "think", label: "Think", icon: Brain, group: "think" },
    { id: "act", label: "Act", icon: Zap, group: "think" },
    { id: "approve", label: "Approve", icon: Shield, group: "think" },
    // Governance
    { id: "policy", label: "Policy", icon: GanttChart, group: "govern" },
    { id: "audit", label: "Audit", icon: History, group: "govern" },
    { id: "correct", label: "Correct", icon: RotateCcw, group: "govern" },
    // Orchestration
    { id: "workflows", label: "Workflows", icon: Workflow, group: "orch" },
    { id: "twin", label: "Twin", icon: Eye, group: "orch" },
  ];

  return (
    <SlidingPanel
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Cognitive Layer"
      subtitle={ctx?.context || "L2 Intelligence Surface"}
      icon={<Sparkles className="h-5 w-5" />}
      position={position}
      size="lg"
      showOverlay={true}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b px-4">
          <TabsList className="bg-transparent h-12">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="gap-1.5 data-[state=active]:bg-primary/10"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Enhanced L2 Panels connected to real services */}
          <TabsContent value="evidence" className="h-full m-0">
            <EvidencePanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>

          <TabsContent value="spine" className="h-full m-0">
            <SpinePanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>

          <TabsContent value="knowledge" className="h-full m-0">
            <KnowledgePanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>

          <TabsContent value="context" className="h-full m-0">
            <ContextPanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>

          <TabsContent value="signals" className="h-full m-0">
            <SignalsPanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>

          <TabsContent value="think" className="h-full m-0">
            <ThinkPanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>

          <TabsContent value="act" className="h-full m-0">
            <ActPanelWithWorkflows context={ctx} />
          </TabsContent>

          <TabsContent value="approve" className="h-full m-0">
            <ApprovePanelWithWorkflows context={ctx} />
          </TabsContent>

          <TabsContent value="policy" className="h-full m-0">
            <PolicyPanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>

          <TabsContent value="audit" className="h-full m-0">
            <AuditPanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>

          <TabsContent value="correct" className="h-full m-0">
            <CorrectRedoPanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>

          <TabsContent value="workflows" className="h-full m-0">
            <WorkflowsPanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>

          <TabsContent value="twin" className="h-full m-0">
            <ProactiveTwinPanel entityType={ctx?.entityType} entityId={ctx?.entityId} />
          </TabsContent>
        </div>
      </Tabs>
    </SlidingPanel>
  );
}

// ============================================================================
// Active Panels with Workflow Integration (kept for HITL approval flow)
// ============================================================================

function ActPanelWithWorkflows({ context }: { context: CognitiveContext | null }) {
  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Act Engine
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Execute actions, automations, and workflows
        </p>
      </div>

      <div className="space-y-3">
        {[
          { action: "Send follow-up email", status: "ready" },
          { action: "Schedule meeting", status: "pending_approval" },
          { action: "Update CRM status", status: "ready" },
        ].map((item, idx) => (
          <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
            <span className="text-sm">{item.action}</span>
            <Badge variant={item.status === "ready" ? "default" : "secondary"}>
              {item.status === "ready" ? "Execute" : "Pending"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// Renamed: ApprovePanel -> ApprovePanelWithWorkflows (workflow HITL integration)
function ApprovePanelWithWorkflows({ context }: { context: CognitiveContext | null }) {
  const auth = useAuth();
  const [recommendations, setRecommendations] = useState<PendingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch pending recommendations
  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // Get tenant ID from auth context (user metadata)
      const tenantId =
        auth.user?.user_metadata?.tenant_id || auth.user?.app_metadata?.tenant_id || "default";
      const userId = auth.user?.id || "current-user";

      const response = await fetch(
        `${WORKFLOW_API}/recommendations/pending?tenantId=${tenantId}&userId=${userId}`
      );
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  }, [auth.user, context]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Handle approval/rejection
  const handleDecision = async (instanceId: string, approved: boolean) => {
    setProcessingId(instanceId);
    try {
      const userId = auth.user?.id || "current-user";

      await fetch(`${WORKFLOW_API}/workflows/${instanceId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          approvedBy: userId,
          comments: comment || undefined,
        }),
      });

      // Remove from list and refresh
      setRecommendations((prev) => prev.filter((r) => r.instance_id !== instanceId));
      setComment("");
      setExpandedId(null);
    } catch (error) {
      console.error("Failed to process decision:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Human-in-the-Loop Approvals
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve AI-suggested actions using Cloudflare Workflows
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="outline">{recommendations.length} pending</Badge>
        <Button variant="ghost" size="sm" onClick={fetchRecommendations} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No pending approvals</p>
          <p className="text-xs">AI recommendations will appear here for review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.instance_id}
              className={`p-4 border rounded-lg transition-all ${
                rec.confidence >= 90
                  ? "border-green-300 bg-green-50/50 dark:bg-green-900/10"
                  : rec.confidence >= 70
                    ? "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-900/10"
                    : "border-orange-300 bg-orange-50/50 dark:bg-orange-900/10"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={rec.type === "action" ? "default" : "secondary"}>
                    {rec.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(rec.created_at).toLocaleString()}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium ${
                    rec.confidence >= 90
                      ? "text-green-600"
                      : rec.confidence >= 70
                        ? "text-yellow-600"
                        : "text-orange-600"
                  }`}
                >
                  {rec.confidence}% confidence
                </span>
              </div>

              <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>

              {rec.action_data && Object.keys(JSON.parse(rec.action_data)).length > 0 && (
                <div className="mb-3 p-2 bg-muted/50 rounded text-xs">
                  <span className="font-medium">Action: </span>
                  <code>{JSON.stringify(JSON.parse(rec.action_data), null, 2)}</code>
                </div>
              )}

              {/* Evidence */}
              {rec.evidence && (
                <button
                  onClick={() =>
                    setExpandedId(expandedId === rec.instance_id ? null : rec.instance_id)
                  }
                  className="text-xs text-primary flex items-center gap-1 mb-3"
                >
                  <FileSearch className="h-3 w-3" />
                  View evidence ({JSON.parse(rec.evidence).length} sources)
                  <ChevronRight
                    className={`h-3 w-3 transition-transform ${expandedId === rec.instance_id ? "rotate-90" : ""}`}
                  />
                </button>
              )}

              {expandedId === rec.instance_id && rec.evidence && (
                <div className="mb-3 space-y-2">
                  {JSON.parse(rec.evidence).map(
                    (ev: { source: string; data: unknown; timestamp: string }, idx: number) => (
                      <div key={idx} className="p-2 border rounded text-xs">
                        <span className="font-medium">{ev.source}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(ev.timestamp).toLocaleString()}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Comment input */}
              {expandedId === rec.instance_id && (
                <Textarea
                  placeholder="Add a comment (optional)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mb-3 text-sm"
                  rows={2}
                />
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDecision(rec.instance_id, true)}
                  disabled={processingId === rec.instance_id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingId === rec.instance_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecision(rec.instance_id, false)}
                  disabled={processingId === rec.instance_id}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setExpandedId(expandedId === rec.instance_id ? null : rec.instance_id)
                  }
                >
                  {expandedId === rec.instance_id ? "Collapse" : "Details"}
                </Button>
              </div>

              {/* Expiration warning */}
              {rec.expires_at &&
                new Date(rec.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000) && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    Expires {new Date(rec.expires_at).toLocaleString()}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Type for pending recommendations from API
interface PendingRecommendation {
  id: string;
  instance_id: string;
  tenant_id: string;
  user_id: string;
  signal_id: string;
  type: "action" | "insight" | "alert";
  title: string;
  description: string;
  action_data: string;
  confidence: number;
  evidence: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

// Legacy AuditPanel removed - now using enhanced AuditPanel from ./panels

// Helper to open cognitive layer programmatically
export function openCognitiveLayer(surface: string, data?: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent("iw:cognitive:open", {
      detail: { surface, data },
    })
  );
}

// Helper to open evidence panel
export function openEvidence(entityId: string, entityType: string, context: string) {
  window.dispatchEvent(
    new CustomEvent("iw:evidence:open", {
      detail: { entityId, entityType, context, scope: {} },
    })
  );
}
