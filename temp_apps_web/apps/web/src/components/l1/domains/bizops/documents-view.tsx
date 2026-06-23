/**
 * BizOps — Documents & Knowledge Base
 *
 * Wired to real entity data via direct Supabase RPC.
 * Entity type: "document" (public.entities fallback)
 */
import { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Grid3x3,
  List,
  Plus,
  Clock,
  Eye,
  Lock,
  Users,
  Star,
  MoreHorizontal,
  Loader2,
  Folder,
} from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";

interface Document {
  id: string;
  title: string;
  type: string;
  source: string;
  sourceIcon: string;
  access: "public" | "team" | "private";
  updatedAt: string;
  updatedBy: string;
  size: string;
  starred: boolean;
  tags: string[];
}

/** Map raw entity data from Supabase to the Document UI interface */
function normalizeDocument(raw: any): Document {
  const data = raw.data || {};
  const type = data.type || data.doc_type || data.category || "Document";
  const source = raw.source || data.source || "Uploaded";
  const access = normalizeAccess(data.access || data.visibility);
  const updatedAt = raw.updated_at ? formatRelativeTime(raw.updated_at) : "Unknown";

  return {
    id: raw.id || crypto.randomUUID(),
    title: raw.name || data.title || data.name || "Untitled Document",
    type: capitalizeFirst(type),
    source,
    sourceIcon: sourceToIcon(source),
    access,
    updatedAt,
    updatedBy: data.updated_by || data.author || data.owner || "",
    size: data.size || data.file_size || "",
    starred: data.starred === true || data.pinned === true,
    tags: Array.isArray(raw.tags) ? raw.tags : Array.isArray(data.tags) ? data.tags : [],
  };
}

function normalizeAccess(a: string | undefined): Document["access"] {
  if (!a) return "team";
  const lower = a.toLowerCase();
  if (lower === "public" || lower === "open") return "public";
  if (lower === "private" || lower === "restricted") return "private";
  return "team";
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function sourceToIcon(source: string): string {
  const lower = source.toLowerCase();
  if (lower.includes("google") || lower.includes("drive")) return "\u{1F4C1}";
  if (lower.includes("notion")) return "\u{1F4DD}";
  if (lower.includes("confluence")) return "\u{1F4DA}";
  if (lower.includes("dropbox")) return "\u{1F4E6}";
  if (lower.includes("sharepoint") || lower.includes("onedrive")) return "\u{2601}\uFE0F";
  return "\u{1F4C4}";
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const typeColors: Record<string, string> = {
  SOP: "var(--iw-forest-mid)",
  Playbook: "var(--iw-gold)",
  Contract: "var(--iw-warning)",
  Guide: "var(--iw-success)",
  Report: "var(--iw-pink)",
  Template: "var(--muted-foreground)",
  Document: "var(--iw-forest-mid)",
  Policy: "var(--iw-teal)",
  Note: "var(--iw-gold)",
};

const accessIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  public: Users,
  team: Eye,
  private: Lock,
};

export function DocumentsView() {
  const { data: rawDocs, isLoading } = useWorkspaceEntities("document");
  const documents = useMemo(() => rawDocs.map(normalizeDocument), [rawDocs]);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filtered = documents.filter((d) => {
    if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    if (sourceFilter !== "all" && d.source !== sourceFilter) return false;
    return true;
  });

  const sources = [...new Set(documents.map((d) => d.source))];
  const types = [...new Set(documents.map((d) => d.type))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Documents & Knowledge Base</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Unified document hub across all connected systems
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex p-0.5 bg-secondary rounded-md">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded text-xs transition-all ${viewMode === "grid" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded text-xs transition-all ${viewMode === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
            <Plus className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      {/* Stats */}
      {types.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {types.map((type) => (
            <div
              key={type}
              className="bg-card border border-border rounded-lg p-2 text-center cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
            >
              <div
                className="text-lg"
                style={{ fontWeight: 600, color: typeColors[type] || "var(--iw-forest-mid)" }}
              >
                {documents.filter((d) => d.type === type).length}
              </div>
              <div className="text-[10px] text-muted-foreground">{type}s</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {types.length > 0 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
        {sources.length > 0 && (
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
          >
            <option value="all">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Empty State */}
      {documents.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Folder className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-semibold mb-1">No documents yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Documents will appear here as data flows through connected sources like Google Drive,
            Notion, or Confluence.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No documents match your filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc) => {
            const AccessIcon = accessIcons[doc.access] || Eye;
            const color = typeColors[doc.type] || "var(--iw-forest-mid)";
            return (
              <div
                key={doc.id}
                className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <FileText className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.starred && (
                      <Star className="w-3.5 h-3.5 text-[var(--iw-warning)] fill-[var(--iw-warning)]" />
                    )}
                    <button className="p-1 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="text-sm mb-1" style={{ fontWeight: 500 }}>
                  {doc.title}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${color}15`,
                      color,
                      fontWeight: 500,
                    }}
                  >
                    {doc.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <AccessIcon className="w-3 h-3" /> {doc.access}
                  </span>
                </div>
                {doc.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {doc.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {doc.sourceIcon} {doc.source}
                  </span>
                  <span>{doc.updatedAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th
                  className="text-left py-2.5 px-4 text-xs text-muted-foreground"
                  style={{ fontWeight: 500 }}
                >
                  Document
                </th>
                <th
                  className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell"
                  style={{ fontWeight: 500 }}
                >
                  Type
                </th>
                <th
                  className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell"
                  style={{ fontWeight: 500 }}
                >
                  Source
                </th>
                <th
                  className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden sm:table-cell"
                  style={{ fontWeight: 500 }}
                >
                  Updated
                </th>
                <th
                  className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden xl:table-cell"
                  style={{ fontWeight: 500 }}
                >
                  Size
                </th>
                <th
                  className="text-center py-2.5 px-4 text-xs text-muted-foreground"
                  style={{ fontWeight: 500 }}
                >
                  Access
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const AccessIcon = accessIcons[doc.access] || Eye;
                const color = typeColors[doc.type] || "var(--iw-forest-mid)";
                return (
                  <tr
                    key={doc.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 flex-shrink-0" style={{ color }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{doc.title}</div>
                          {doc.updatedBy && (
                            <div className="text-[10px] text-muted-foreground">{doc.updatedBy}</div>
                          )}
                        </div>
                        {doc.starred && (
                          <Star className="w-3 h-3 text-[var(--iw-warning)] fill-[var(--iw-warning)]" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${color}15`,
                          color,
                          fontWeight: 500,
                        }}
                      >
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {doc.sourceIcon} {doc.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">
                      {doc.updatedAt}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden xl:table-cell">
                      {doc.size || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] capitalize flex items-center gap-1 justify-center text-muted-foreground">
                        <AccessIcon className="w-3 h-3" /> {doc.access}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DocumentsView;
