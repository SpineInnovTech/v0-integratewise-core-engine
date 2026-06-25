/**
 * Knowledge Workspace — 5-Board Governance Workbench
 *
 * The "Remember + Govern" workspace.
 * Where institutional knowledge lives and is governed.
 *
 * Boards:
 *   Governance — strategy, approvals, policy
 *   Operations — runbooks, DevOps, procedures
 *   Content    — marketing, sales, brand
 *   Public     — customer-facing docs, API, guides
 *   Internal   — engineering, architecture, org docs
 *
 * Built from 8 primitives + Projection Engine.
 */

import { useState, useMemo, useCallback } from "react";
import {
  Shield,
  Wrench,
  Megaphone,
  Globe,
  Building2,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Search,
} from "lucide-react";

// Projection Engine
import { useProjection } from "@/lib/projection";

// Workbench Primitives
import {
  MetricTile,
  EntityCard,
  InsightBlock,
  GovernancePanel,
  OperationalCanvas,
  HealthRing,
} from "@/components/workbench/primitives";
import type { GovernanceItem } from "@/components/workbench/primitives";

// Knowledge Registry
import {
  useKnowledgeRegistry,
  useBoardStats,
  useApproveKnowledge,
  usePublishKnowledge,
  BOARD_CATEGORIES,
  type BoardId,
  type OrgMemoryItem,
} from "./useKnowledgeRegistry";

// Governance
import { useGovernanceQueue } from "@/hooks/use-governance-queue";

// UI
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/components/ui/utils";

// ─── Board Definitions ──────────────────────────────────────────────────────

const BOARDS: Array<{
  id: BoardId;
  label: string;
  icon: typeof Shield;
  description: string;
  color: string;
}> = [
  {
    id: "governance",
    label: "Governance",
    icon: Shield,
    description: "Strategy, approvals, policy",
    color: "text-[var(--iw-gold)]",
  },
  {
    id: "operations",
    label: "Operations",
    icon: Wrench,
    description: "Runbooks, DevOps, procedures",
    color: "text-[var(--iw-forest-mid)]",
  },
  {
    id: "content",
    label: "Content",
    icon: Megaphone,
    description: "Marketing, sales, brand",
    color: "text-[var(--iw-warning)]",
  },
  {
    id: "public",
    label: "Public Docs",
    icon: Globe,
    description: "Customer-facing docs, API, guides",
    color: "text-[var(--iw-success)]",
  },
  {
    id: "internal",
    label: "Internal",
    icon: Building2,
    description: "Engineering, architecture, org docs",
    color: "text-[var(--iw-error)]",
  },
];

// ─── Board Stats Component ──────────────────────────────────────────────────

function BoardStatsRow({ boardId }: { boardId: BoardId }) {
  const { stats, isLoading } = useBoardStats(boardId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MetricTile label="Total" value={stats.total} icon={<FileText className="w-4 h-4" />} />
      <MetricTile label="Staging" value={stats.staging} icon={<Clock className="w-4 h-4" />} />
      <MetricTile
        label="Approved"
        value={stats.approved}
        icon={<CheckCircle className="w-4 h-4" />}
      />
      <MetricTile label="Published" value={stats.published} icon={<Globe className="w-4 h-4" />} />
    </div>
  );
}

// ─── Knowledge Item Card ────────────────────────────────────────────────────

function KnowledgeCard({
  item,
  onApprove,
  onPublish,
  canApprove,
}: {
  item: OrgMemoryItem;
  onApprove?: () => void;
  onPublish?: () => void;
  canApprove: boolean;
}) {
  const stateColor =
    item.governance_state === "published"
      ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80"
      : item.governance_state === "approved"
        ? "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/20 dark:text-iw-slate-mid/80"
        : item.governance_state === "staging"
          ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light"
          : "bg-muted text-muted-foreground";

  return (
    <div className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold truncate">{item.topic}</h3>
            <span className={cn("text-xs px-1.5 py-0.5 rounded", stateColor)}>
              {item.governance_state}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {item.content.substring(0, 200)}
          </p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="uppercase">{item.category}</span>
            <span>v{item.version}</span>
            <span>{new Date(item.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {canApprove && item.governance_state === "staging" && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={onApprove}>
              Approve
            </Button>
          </div>
        )}
        {canApprove && item.governance_state === "approved" && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={onPublish}>
              Publish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generic Board Component ────────────────────────────────────────────────

function KnowledgeBoard({ boardId, canApprove }: { boardId: BoardId; canApprove: boolean }) {
  const { data: items, isLoading, error } = useKnowledgeRegistry(boardId);
  const approve = useApproveKnowledge();
  const publish = usePublishKnowledge();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.topic.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to load knowledge</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={`Search ${boardId}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{search ? "No matching items" : `No ${boardId} knowledge yet`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((item) => (
            <KnowledgeCard
              key={item.id}
              item={item}
              canApprove={canApprove}
              onApprove={() => approve.mutate({ id: item.id, approvedBy: "current-user" })}
              onPublish={() => publish.mutate({ id: item.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Knowledge Workbench ───────────────────────────────────────────────

import { OrgMemoryView } from "./org-memory-view";
import { DocumentGovernanceWorkbench } from "./document-governance-workbench";

export function KnowledgeWorkbench() {
  const { user, tenant, canApprove, isLoading } = useProjection();
  const [activeBoard, setActiveBoard] = useState<BoardId>("governance");
  const [activeTab, setActiveTab] = useState<"boards" | "documents" | "memory">("boards");
  const [activeMemoryView, setActiveMemoryView] = useState<
    "overview" | "org" | "conversational" | "personal"
  >("overview");

  // Governance queue from HITL
  const { items: governanceItems, approve, reject } = useGovernanceQueue();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentBoard = BOARDS.find((b) => b.id === activeBoard)!;
  const BoardIcon = currentBoard.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--iw-gold)]" />
              Knowledge
            </h1>
            <p className="text-sm text-muted-foreground">
              {tenant.industryVertical} · Institutional knowledge governance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HealthRing
              label="Coverage"
              score={78}
              size={60}
              strokeWidth={4}
              status="healthy"
              sublabel={`${BOARDS.length} boards`}
            />
          </div>
        </div>
      </div>

      {/* Tab Switch: Boards | Memory */}
      <div className="px-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as any);
            if (v === "boards") setActiveMemoryView("overview");
          }}
        >
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="boards">Boards</TabsTrigger>
            <TabsTrigger value="documents">Document Registry</TabsTrigger>
            <TabsTrigger value="memory">My Memory</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === "documents" ? (
          <div className="-mx-6 -mb-6 h-[calc(100%+1.5rem)]">
            <DocumentGovernanceWorkbench />
          </div>
        ) : activeTab === "boards" ? (
          <div className="space-y-6 pt-4">
            {/* Board Switcher */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {BOARDS.map((board) => {
                const Icon = board.icon;
                const isActive = activeBoard === board.id;
                return (
                  <button
                    key={board.id}
                    onClick={() => setActiveBoard(board.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {board.label}
                  </button>
                );
              })}
            </div>

            {/* Board Stats */}
            <BoardStatsRow boardId={activeBoard} />

            {/* Board Content */}
            <OperationalCanvas
              title={currentBoard.label}
              subtitle={currentBoard.description}
              sections={[
                {
                  id: "items",
                  label: "Knowledge Items",
                  width: "half",
                  component: <KnowledgeBoard boardId={activeBoard} canApprove={canApprove} />,
                },
                {
                  id: "governance",
                  label: "Approval Queue",
                  width: "third",
                  component: canApprove ? (
                    <GovernancePanel
                      items={governanceItems}
                      onApprove={(id) => approve({ id })}
                      onReject={(id) => reject({ id, reason: "Rejected from Knowledge" })}
                      onEdit={(id) => console.log("[Knowledge] Edit:", id)}
                      onDefer={(id) => console.log("[Knowledge] Defer:", id)}
                    />
                  ) : (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      Approval queue visible to owners and admins.
                    </div>
                  ),
                },
              ]}
            />
          </div>
        ) : (
          /* Memory View */
          <div className="pt-4 h-full">
            {activeMemoryView === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[var(--iw-gold)]" />
                      Org Memory
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Approved institutional knowledge shared with team
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setActiveMemoryView("org")}
                    >
                      Browse <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--iw-forest-mid)]" />
                      Conversational
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      AI sessions, Triage Bot exchanges
                    </p>
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Browse <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[var(--iw-success)]" />
                      Personal
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      My drafts, notes, preferences
                    </p>
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Browse <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Select a memory layer to browse</p>
                  <p className="text-xs">org_memory is fully implemented</p>
                </div>
              </div>
            )}

            {activeMemoryView === "org" && (
              <OrgMemoryView onBack={() => setActiveMemoryView("overview")} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
