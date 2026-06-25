/**
 * Business Ops Workbench — Canonical Reference Implementation
 *
 * Doctrine: BizOps is the connective tissue that binds all 14 departments
 * through Goals, Metrics, Tools/Services, and Product.
 *
 * Built from 8 primitives + Projection Engine.
 * Demonstrates the three views: Work, Org, Personal.
 */

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Target,
  TrendingUp,
  Users,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  Loader2,
  Flag,
  BarChart3,
  Plug,
  Box,
  ChevronRight,
} from "lucide-react";

// Projection Engine
import { useProjection } from "@/lib/projection";
import type { ProjectedModule, ProjectedMetric } from "@/lib/projection";

// Entity hooks (separate from projection — projection decides WHAT to fetch)
import {
  useSpineEntitiesBatch,
  useSpineEntityCounts,
  useWorkspaceEntitiesBatch,
} from "@/hooks/use-workspace-entities";

// Governance
import { useGovernanceQueue } from "@/hooks/use-governance-queue";

// Workbench Primitives
import {
  MetricTile,
  EntityCard,
  InsightBlock,
  TimelineStream,
  GovernancePanel,
  ActionTile,
  HealthRing,
  OperationalCanvas,
} from "@/components/workbench/primitives";
import type { TimelineEvent, GovernanceItem } from "@/components/workbench/primitives";

// Views
import { OrgView } from "./views/org-view";
import { PersonalView } from "./views/personal-view";

// UI
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/components/ui/utils";

// ─── Helper: Format currency (INR) ─────────────────────────────────────────────

function formatINR(value: number): string {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
  return `₹${value.toLocaleString()}`;
}

// ─── Cross-Department Connector Types ──────────────────────────────────────────
const BIZOPS_CONNECTOR_TYPES = [
  "okr",
  "kpi",
  "integration",
  "connector",
  "product",
  "feature",
  "roadmap_item",
  "data_source",
  "tool",
] as const;

// ─── View Components ───────────────────────────────────────────────────────────

function WorkView({
  metrics,
  entityTypes,
  modules,
  canAct,
  canApprove,
}: {
  metrics: ProjectedMetric[];
  entityTypes: any[];
  modules: ProjectedModule[];
  canAct: boolean;
  canApprove: boolean;
}) {
  const navigate = useNavigate();
  const entityTypeNames = useMemo(() => entityTypes.map((e) => e.name), [entityTypes]);

  // Entity data from Spine
  const { data: batchData, isLoading: entitiesLoading } = useSpineEntitiesBatch(
    entityTypeNames.slice(0, 4),
    { domain: "BIZOPS" } // scoped to this domain's data
  );
  const { counts } = useSpineEntityCounts(entityTypeNames.slice(0, 4), { domain: "BIZOPS" });

  // Cross-department connector data (Goals, Metrics, Tools, Product)
  const { data: connectorBatch, isLoading: connectorsLoading } = useWorkspaceEntitiesBatch(
    [...BIZOPS_CONNECTOR_TYPES],
    { limit: 100, domain: "BIZOPS" }
  );

  // Live dynamic surfaces: AI insights, signals, recent activity (timeline).
  // Previously simulated — now read from the Spine (empty until data is synced).
  const { data: dynamicBatch } = useWorkspaceEntitiesBatch(
    ["generated_insight", "signal", "activity"],
    { limit: 12, domain: "BIZOPS" }
  );

  // Build metric tiles from projection + counts
  const metricTiles = useMemo(() => {
    return metrics.slice(0, 4).map((m) => ({
      ...m,
      value: counts[m.entityType] ?? 0,
      formatted:
        m.type === "currency"
          ? formatINR(counts[m.entityType] ?? 0)
          : String(counts[m.entityType] ?? 0),
    }));
  }, [metrics, counts]);

  // Build entity cards from batch data
  const entityCards = useMemo(() => {
    const cards: any[] = [];
    for (const et of entityTypes.slice(0, 3)) {
      const rows = batchData[et.name] ?? [];
      for (const row of rows.slice(0, 2)) {
        cards.push({
          id: row.id,
          name: row.name || row.account_name || "Untitled",
          entityType: et.label,
          healthScore: row.health_score ?? row.healthScore,
          status: row.status,
          sources: row._sources || [row.source],
          fields: et.allowedFields.slice(0, 3).map((f: string) => ({
            label: f.replace(/_/g, " "),
            value: row[f] ?? "—",
          })),
        });
      }
    }
    return cards;
  }, [batchData, entityTypes]);

  // ─── Goals & OKRs ────────────────────────────────────────────────────────────
  const okrs = connectorBatch.okr ?? [];
  const avgOkrProgress = okrs.length
    ? Math.round(
        okrs.reduce((s: number, o: any) => s + (o.progress || o.progress_percent || 0), 0) /
          okrs.length
      )
    : 0;

  // ─── Metrics & KPIs ──────────────────────────────────────────────────────────
  const kpis = connectorBatch.kpi ?? [];
  const opsMetrics = connectorBatch.ops_metric ?? [];
  const allMetrics = [...kpis, ...opsMetrics];

  // ─── Tools & Services ────────────────────────────────────────────────────────
  const integrations = connectorBatch.integration ?? [];
  const connectors = connectorBatch.connector ?? [];
  const dataSources = connectorBatch.data_source ?? [];
  const tools = connectorBatch.tool ?? [];
  const allTools = [...integrations, ...connectors, ...dataSources, ...tools];
  const activeTools = allTools.filter(
    (t: any) => t.status === "active" || t.status === "connected" || t.status === "healthy"
  );

  // ─── Product ─────────────────────────────────────────────────────────────────
  const products = connectorBatch.product ?? [];
  const features = connectorBatch.feature ?? [];
  const roadmapItems = connectorBatch.roadmap_item ?? [];

  // Live AI insights from the Spine (generated_insight + signal). Empty when none.
  const insights = useMemo(() => {
    const rows = [
      ...((dynamicBatch.generated_insight as any[]) ?? []),
      ...((dynamicBatch.signal as any[]) ?? []),
    ];
    return rows.slice(0, 6).map((r: any, i: number) => ({
      id: String(r.id ?? i),
      title: r.title || r.name || "Insight",
      description: r.description || r.recommendation || r.summary || "",
      confidence: Math.round(Number(r.confidence ?? r.score ?? 0)),
      severity: (r.severity || r.priority || "medium") as "low" | "medium" | "high" | "critical",
      entityType: r.entity_type || r.domain || "Insight",
      suggestedAction: r.recommendation || r.suggested_action || undefined,
    }));
  }, [dynamicBatch]);

  // Live timeline from recent Spine activity entities. Empty when none.
  const timelineEvents = useMemo(() => {
    return ((dynamicBatch.activity as any[]) ?? []).slice(0, 8).map((r: any, i: number) => ({
      id: String(r.id ?? i),
      timestamp: r.event_date || r.updated_at || r.created_at || new Date().toISOString(),
      type: "ingest" as const,
      title: r.name || r.title || "Activity",
      description: r.description || "",
      source: r.source_tool || r.source || undefined,
    }));
  }, [dynamicBatch]);

  // Real governance items from HITL queue
  const {
    items: governanceItems,
    isLoading: governanceLoading,
    approve,
    reject,
  } = useGovernanceQueue();

  const handleApprove = useCallback(
    async (id: string) => {
      await approve({ id });
    },
    [approve]
  );

  const handleReject = useCallback(
    async (id: string) => {
      await reject({ id, reason: "Rejected from Workbench" });
    },
    [reject]
  );

  const handleEdit = useCallback((id: string) => {
    console.log("[Governance] Edit:", id);
  }, []);

  const handleDefer = useCallback((id: string) => {
    console.log("[Governance] Defer:", id);
  }, []);

  if (entitiesLoading || connectorsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* ─── TOP STRIP: Department Projection Metrics ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricTiles.map((m) => (
          <MetricTile
            key={m.id}
            label={m.label}
            value={m.value}
            formatted={m.formatted}
            icon={<TrendingUp className="w-4 h-4" />}
          />
        ))}
      </div>

      {/* ─── CONNECTOR LAYER: Goals · Metrics · Tools · Product ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Goals & OKRs */}
        <div className="border rounded-lg bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Flag className="h-4 w-4 text-iw-gold" />
              Goals & OKRs
            </h3>
            <button
              onClick={() => navigate("/work/strategy-leadership")}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {okrs.length > 0 ? (
            <div className="space-y-2">
              {okrs.slice(0, 3).map((okr: any) => (
                <div key={okr.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate mr-2">{okr.title || okr.objective || "OKR"}</span>
                    <span className="text-xs text-muted-foreground">{okr.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-iw-gold"
                      style={{ width: `${Math.min(okr.progress || 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 text-xs text-muted-foreground">
                Avg progress: {avgOkrProgress}% across {okrs.length} OKRs
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No OKRs yet. Connect a source or add goals in Strategy & Leadership.
            </p>
          )}
        </div>

        {/* Metrics & KPIs */}
        <div className="border rounded-lg bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-iw-forest-bright" />
              Metrics & KPIs
            </h3>
            <button
              onClick={() => navigate("/work/business-intelligence")}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {allMetrics.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {allMetrics.slice(0, 4).map((m: any) => (
                <div key={m.id} className="p-2 bg-secondary/50 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {m.department || m.category}
                  </p>
                  <p className="text-lg font-bold">{m.current_value ?? m.value ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {m.name || m.metric_name || m.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No metrics yet. KPIs will appear here once tracked across departments.
            </p>
          )}
        </div>

        {/* Tools & Services Stack */}
        <div className="border rounded-lg bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Plug className="h-4 w-4 text-[var(--iw-success)]" />
              Tools & Services
            </h3>
            <button
              onClick={() => navigate("/work/integrations")}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Manage <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {allTools.length > 0 ? (
            <div className="space-y-2">
              {allTools.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        t.status === "active" || t.status === "connected" || t.status === "healthy"
                          ? "bg-iw-forest-bright"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="truncate">
                      {t.name || t.tool_name || t.source_name || "Tool"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {t.department || t.category || "—"}
                  </span>
                </div>
              ))}
              <div className="pt-1 text-xs text-muted-foreground">
                {activeTools.length}/{allTools.length} active
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No tools connected. Add integrations to see your software stack.
            </p>
          )}
        </div>

        {/* Product */}
        <div className="border rounded-lg bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Box className="h-4 w-4 text-[var(--iw-warning)]" />
              Product
            </h3>
            <button
              onClick={() => navigate("/work/pe--roadmap")}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Roadmap <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {products.length > 0 || features.length > 0 || roadmapItems.length > 0 ? (
            <div className="space-y-2">
              {products.slice(0, 2).map((p: any) => (
                <div key={p.id} className="text-sm">
                  <span className="font-medium">{p.name || p.product_name || "Product"}</span>
                  <p className="text-xs text-muted-foreground">{p.status || "—"}</p>
                </div>
              ))}
              {features.slice(0, 2).map((f: any) => (
                <div key={f.id} className="text-sm flex items-center justify-between">
                  <span className="truncate">
                    {f.name || f.feature_name || f.title || "Feature"}
                  </span>
                  <StatusBadge status={f.status} />
                </div>
              ))}
              <div className="pt-1 text-xs text-muted-foreground">
                {products.length} products · {features.length} features · {roadmapItems.length}{" "}
                roadmap items
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No product data. Connect your product management tools to see roadmap and features.
            </p>
          )}
        </div>
      </div>

      {/* ─── MAIN CANVAS: Operational Reality ─────────────────────────────────── */}
      <OperationalCanvas
        title="Operational Reality"
        subtitle="Live projection across all departments"
        sections={[
          {
            id: "entities",
            label: "Active Entities",
            width: "half",
            component: (
              <div className="grid grid-cols-1 gap-3">
                {entityCards.map((card) => (
                  <EntityCard
                    key={card.id}
                    id={card.id}
                    name={card.name}
                    entityType={card.entityType}
                    healthScore={card.healthScore}
                    status={card.status}
                    sources={card.sources}
                    fields={card.fields}
                    actions={
                      canAct
                        ? [{ label: "Open", onClick: () => navigate(`/work/entity/${card.id}`) }]
                        : []
                    }
                  />
                ))}
                {entityCards.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No entities yet. Connect a source to begin ingestion.
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "insights",
            label: "AI Insights",
            width: "half",
            component: (
              <div className="flex flex-col gap-3">
                {insights.map((insight) => (
                  <InsightBlock
                    key={insight.id}
                    id={insight.id}
                    title={insight.title}
                    description={insight.description}
                    confidence={insight.confidence}
                    severity={insight.severity}
                    entityType={insight.entityType}
                    suggestedAction={canAct ? insight.suggestedAction : undefined}
                    onAction={
                      canAct ? () => console.log("[Insight] Action:", insight.id) : undefined
                    }
                  />
                ))}
              </div>
            ),
          },
          {
            id: "timeline",
            label: "Continuity",
            width: "half",
            component: <TimelineStream events={timelineEvents} maxItems={5} />,
          },
          {
            id: "governance",
            label: "Governance Queue",
            width: "half",
            component: canApprove ? (
              <GovernancePanel
                items={governanceItems}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEdit}
                onDefer={handleDefer}
              />
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Governance queue visible to owners, admins, and managers only.
              </div>
            ),
          },
        ]}
      />

      {/* ─── QUICK NAV: All 14 Departments ────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Department Quick Access
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            {
              id: "strategy-leadership",
              label: "Strategy",
              icon: Flag,
              path: "/work/strategy-leadership",
            },
            {
              id: "marketing--dashboard",
              label: "Marketing",
              icon: Zap,
              path: "/work/marketing--dashboard",
            },
            {
              id: "sales--dashboard",
              label: "Sales",
              icon: Briefcase,
              path: "/work/sales--dashboard",
            },
            { id: "cs--dashboard", label: "CS", icon: Users, path: "/work/cs--dashboard" },
            { id: "pe--dashboard", label: "Product & Eng", icon: Box, path: "/work/pe--dashboard" },
            {
              id: "operations-center",
              label: "Operations",
              icon: Target,
              path: "/work/operations-center",
            },
            {
              id: "finance--dashboard",
              label: "Finance",
              icon: TrendingUp,
              path: "/work/finance--dashboard",
            },
            { id: "human-resources", label: "HR", icon: Users, path: "/work/human-resources" },
            {
              id: "legal-compliance",
              label: "Legal",
              icon: CheckCircle,
              path: "/work/legal-compliance",
            },
            {
              id: "business-intelligence",
              label: "BI",
              icon: BarChart3,
              path: "/work/business-intelligence",
            },
            {
              id: "it-admin--dashboard",
              label: "IT",
              icon: Plug,
              path: "/work/it-admin--dashboard",
            },
            {
              id: "partnerships",
              label: "Partnerships",
              icon: Briefcase,
              path: "/work/partnerships",
            },
            {
              id: "knowledge-management",
              label: "Knowledge",
              icon: Brain,
              path: "/work/knowledge-management",
            },
            {
              id: "procurement--dashboard",
              label: "Procurement",
              icon: Target,
              path: "/work/procurement--dashboard",
            },
          ].map((dept) => (
            <Button
              key={dept.id}
              variant="outline"
              className="h-auto py-3 px-4 flex flex-col items-center gap-2 text-xs"
              onClick={() => navigate(dept.path)}
            >
              <dept.icon className="w-4 h-4" />
              <span className="text-center leading-tight">{dept.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Workbench Component ──────────────────────────────────────────────────

export function BizOpsWorkbench() {
  const { user, tenant, modules, entityTypes, metrics, canAct, canApprove, isLoading, error } =
    useProjection();
  // Live "system health" header: real connected-source count from the Spine.
  const { counts: sourceCounts } = useSpineEntityCounts(["connector", "integration"]);
  const sourcesSynced = (sourceCounts.connector ?? 0) + (sourceCounts.integration ?? 0);
  const [activeTab, setActiveTab] = useState("work");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">Projection failed</p>
          <p className="text-xs text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Business Ops</h1>
            <p className="text-sm text-muted-foreground">
              {tenant.industryVertical} · {user.department} · {user.role}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HealthRing
              label="System Health"
              score={sourcesSynced > 0 ? 100 : 0}
              size={60}
              strokeWidth={4}
              status={sourcesSynced > 0 ? "healthy" : "warning"}
              sublabel={sourcesSynced > 0 ? `${sourcesSynced} sources synced` : "No sources synced"}
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="work">My Department</TabsTrigger>
            <TabsTrigger value="org">Organization</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="work" className="flex-1 overflow-y-auto mt-0">
          <WorkView
            metrics={metrics}
            entityTypes={entityTypes}
            modules={modules}
            canAct={canAct}
            canApprove={canApprove}
          />
        </TabsContent>

        <TabsContent value="org" className="flex-1 overflow-y-auto mt-0">
          <OrgView />
        </TabsContent>

        <TabsContent value="personal" className="flex-1 overflow-y-auto mt-0">
          <PersonalView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const s = status.toLowerCase();
  const color =
    s === "active" ||
    s === "running" ||
    s === "live" ||
    s === "enabled" ||
    s === "on_track" ||
    s === "shipped"
      ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/20 dark:text-iw-forest-bright"
      : s === "paused" || s === "pending" || s === "draft" || s === "in_progress" || s === "planned"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
        : s === "completed" || s === "done" || s === "won" || s === "released"
          ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/20 dark:text-iw-forest-bright"
          : s === "failed" || s === "lost" || s === "blocked" || s === "at_risk"
            ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            : "bg-muted text-muted-foreground";

  return <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{status}</span>;
}
