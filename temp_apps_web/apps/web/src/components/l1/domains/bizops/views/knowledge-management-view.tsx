/**
 * BizOps — Knowledge Management View
 *
 * Covers: Internal documentation, SOPs, training materials,
 *         institutional knowledge base, onboarding guides
 */
import { useState } from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Lightbulb,
  FolderOpen,
  Search,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Tag,
} from "lucide-react";

const ENTITY_TYPES = [
  "document",
  "sop",
  "training_material",
  "knowledge_article",
  "onboarding_guide",
  "playbook",
] as const;

export function KnowledgeManagementView() {
  const {
    data: batch,
    isLoading,
    refetch,
  } = useWorkspaceEntitiesBatch([...ENTITY_TYPES], {
    limit: 200,
  });

  const documents = batch.document ?? [];
  const sops = batch.sop ?? [];
  const training = batch.training_material ?? [];
  const articles = batch.knowledge_article ?? [];
  const onboarding = batch.onboarding_guide ?? [];
  const playbooks = batch.playbook ?? [];

  const publishedArticles = articles.filter(
    (a: any) => a.status === "published" || a.status === "active"
  );
  const draftDocs = documents.filter((d: any) => d.status === "draft" || d.status === "pending");

  const allItems = [...documents, ...sops, ...training, ...articles, ...onboarding, ...playbooks];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[var(--iw-purple)]" />
            Knowledge Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Documentation, SOPs, training, and institutional knowledge
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 rounded-lg border hover:bg-accent text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniKPI
          label="Documents"
          value={documents.length}
          icon={<FileText className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="SOPs"
          value={sops.length}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="text-iw-forest-mid"
        />
        <MiniKPI
          label="Articles"
          value={publishedArticles.length}
          icon={<Lightbulb className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="Training"
          value={training.length}
          icon={<GraduationCap className="h-4 w-4" />}
          color="text-iw-slate"
        />
      </div>

      {/* Search placeholder */}
      <div className="flex items-center gap-2 p-3 border rounded-lg bg-secondary/50">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Search across {allItems.length} knowledge items...
        </span>
      </div>

      {/* Documents */}
      <CollapsibleSection
        title="Internal Documentation"
        icon={<FileText className="h-4 w-4 text-iw-slate-mid" />}
        count={documents.length}
        countLabel="documents"
        defaultOpen
      >
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.slice(0, 10).map((d: any) => (
              <div
                key={d.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {d.name || d.title || d.document_name || "Document"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[d.category, d.department, d.author].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.last_updated && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(d.last_updated).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <StatusBadge status={d.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No documents</p>
        )}
      </CollapsibleSection>

      {/* SOPs */}
      <CollapsibleSection
        title="Standard Operating Procedures"
        icon={<CheckCircle2 className="h-4 w-4 text-iw-forest-mid" />}
        count={sops.length}
        countLabel="SOPs"
        defaultOpen
      >
        {sops.length > 0 ? (
          <div className="space-y-2">
            {sops.slice(0, 10).map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">{s.name || s.title || s.sop_name || "SOP"}</span>
                  <p className="text-xs text-muted-foreground">
                    {[s.department, s.owner].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.version && <span className="text-xs text-muted-foreground">v{s.version}</span>}
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No SOPs defined</p>
        )}
      </CollapsibleSection>

      {/* Knowledge Articles */}
      <CollapsibleSection
        title="Knowledge Base Articles"
        icon={<Lightbulb className="h-4 w-4 text-iw-slate-mid" />}
        count={articles.length}
        countLabel="articles"
      >
        {articles.length > 0 ? (
          <div className="space-y-2">
            {articles.slice(0, 10).map((a: any) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {a.name || a.title || a.article_name || "Article"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[a.category, a.tags?.[0]].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.views != null && (
                    <span className="text-xs text-muted-foreground">{a.views} views</span>
                  )}
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No knowledge articles</p>
        )}
      </CollapsibleSection>

      {/* Training Materials */}
      <CollapsibleSection
        title="Training Materials"
        icon={<GraduationCap className="h-4 w-4 text-iw-slate" />}
        count={training.length}
        countLabel="materials"
      >
        {training.length > 0 ? (
          <div className="space-y-2">
            {training.slice(0, 10).map((t: any) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {t.name || t.title || t.material_name || "Training"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[t.type, t.department, t.duration].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.completion_rate != null && (
                    <span className="text-xs text-muted-foreground">
                      {t.completion_rate}% completed
                    </span>
                  )}
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No training materials</p>
        )}
      </CollapsibleSection>

      {/* Onboarding Guides */}
      <CollapsibleSection
        title="Onboarding Guides"
        icon={<FolderOpen className="h-4 w-4 text-iw-gold" />}
        count={onboarding.length}
        countLabel="guides"
      >
        {onboarding.length > 0 ? (
          <div className="space-y-2">
            {onboarding.slice(0, 10).map((o: any) => (
              <div
                key={o.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {o.name || o.title || o.guide_name || "Guide"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[o.role, o.department].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {o.steps_total != null && (
                    <span className="text-xs text-muted-foreground">
                      {o.steps_completed ?? 0}/{o.steps_total} steps
                    </span>
                  )}
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No onboarding guides</p>
        )}
      </CollapsibleSection>

      {/* Playbooks */}
      <CollapsibleSection
        title="Internal Playbooks"
        icon={<Tag className="h-4 w-4 text-iw-forest-bright" />}
        count={playbooks.length}
        countLabel="playbooks"
      >
        {playbooks.length > 0 ? (
          <div className="space-y-2">
            {playbooks.slice(0, 10).map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {p.name || p.title || p.playbook_name || "Playbook"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[p.category, p.department].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.last_updated && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.last_updated).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No playbooks defined</p>
        )}
      </CollapsibleSection>
    </div>
  );
}

function MiniKPI({
  label,
  value,
  icon,
  color = "text-muted-foreground",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-3 border rounded-lg bg-card">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  count,
  countLabel,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  countLabel: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-muted-foreground">
            ({count} {countLabel})
          </span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const s = status.toLowerCase();
  const color =
    s === "active" ||
    s === "running" ||
    s === "live" ||
    s === "enabled" ||
    s === "on_track" ||
    s === "published"
      ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80"
      : s === "paused" || s === "pending" || s === "draft" || s === "in_progress" || s === "review"
        ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light"
        : s === "completed" || s === "done" || s === "approved" || s === "archived"
          ? "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/20 dark:text-iw-slate-mid/80"
          : s === "failed" || s === "lost" || s === "blocked" || s === "at_risk" || s === "rejected"
            ? "bg-iw-red/10 text-iw-red dark:bg-iw-red/90/20 dark:text-iw-red/70"
            : "bg-muted text-muted-foreground";

  return <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{status}</span>;
}

export default KnowledgeManagementView;
