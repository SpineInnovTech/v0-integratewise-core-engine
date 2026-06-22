import { useState } from "react";
import {
  FileText,
  Search,
  Grid3x3,
  List,
  Plus,
  Download,
  ExternalLink,
  Clock,
  Eye,
  Lock,
  Users,
  Filter,
  Folder,
  Tag,
  Star,
  MoreHorizontal,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  type: "SOP" | "Playbook" | "Contract" | "Guide" | "Report" | "Template";
  source: string;
  sourceIcon: string;
  access: "public" | "team" | "private";
  updatedAt: string;
  updatedBy: string;
  size: string;
  starred: boolean;
  tags: string[];
}

const documents: Document[] = [
  { id: "d1", title: "APAC RevOps Playbook 2026", type: "Playbook", source: "Google Drive", sourceIcon: "📁", access: "team", updatedAt: "2h ago", updatedBy: "Arun K.", size: "2.4 MB", starred: true, tags: ["APAC", "RevOps", "Strategy"] },
  { id: "d2", title: "TechServe SOW v3.2", type: "Contract", source: "Google Drive", sourceIcon: "📁", access: "private", updatedAt: "1d ago", updatedBy: "Priya S.", size: "890 KB", starred: true, tags: ["Contract", "Enterprise"] },
  { id: "d3", title: "Integration Onboarding SOP", type: "SOP", source: "Notion", sourceIcon: "📝", access: "public", updatedAt: "3d ago", updatedBy: "Arun K.", size: "1.2 MB", starred: false, tags: ["Onboarding", "Integration"] },
  { id: "d4", title: "Q4 2025 Revenue Report", type: "Report", source: "Google Drive", sourceIcon: "📁", access: "team", updatedAt: "1w ago", updatedBy: "Rajesh M.", size: "5.1 MB", starred: false, tags: ["Finance", "Quarterly"] },
  { id: "d5", title: "Customer Health Scoring Guide", type: "Guide", source: "Confluence", sourceIcon: "📚", access: "public", updatedAt: "2w ago", updatedBy: "Anjali P.", size: "450 KB", starred: true, tags: ["CS", "Health Score"] },
  { id: "d6", title: "CloudBridge APAC Agreement", type: "Contract", source: "Google Drive", sourceIcon: "📁", access: "private", updatedAt: "5d ago", updatedBy: "Vikram R.", size: "1.1 MB", starred: false, tags: ["Contract", "Singapore"] },
  { id: "d7", title: "Workflow Builder Documentation", type: "Guide", source: "Notion", sourceIcon: "📝", access: "public", updatedAt: "4d ago", updatedBy: "Arun K.", size: "780 KB", starred: false, tags: ["Technical", "Automation"] },
  { id: "d8", title: "Sales Pitch Deck Template", type: "Template", source: "Google Drive", sourceIcon: "📁", access: "team", updatedAt: "1w ago", updatedBy: "Deepak J.", size: "3.2 MB", starred: false, tags: ["Sales", "Template"] },
  { id: "d9", title: "Data Privacy Policy (APAC)", type: "SOP", source: "Confluence", sourceIcon: "📚", access: "public", updatedAt: "3w ago", updatedBy: "Arun K.", size: "320 KB", starred: true, tags: ["Compliance", "Privacy"] },
  { id: "d10", title: "Monthly Ops Standup Notes", type: "Report", source: "Notion", sourceIcon: "📝", access: "team", updatedAt: "2d ago", updatedBy: "Priya S.", size: "180 KB", starred: false, tags: ["Ops", "Meeting Notes"] },
];

const typeColors: Record<string, string> = {
  SOP: "var(--iw-blue)",
  Playbook: "var(--iw-purple)",
  Contract: "var(--iw-warning)",
  Guide: "var(--iw-success)",
  Report: "var(--iw-pink)",
  Template: "var(--muted-foreground)",
};

const accessIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  public: Users,
  team: Eye,
  private: Lock,
};

export function DocumentsView() {
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

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Documents & Knowledge Base</h2>
          <p className="text-sm text-muted-foreground mt-1">Unified document hub with semantic search across all connected systems</p>
        </div>
        <div className="flex gap-2">
          <div className="flex p-0.5 bg-secondary rounded-md">
            <button onClick={() => setViewMode("grid")} className={`px-3 py-1 rounded text-xs transition-all ${viewMode === "grid" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={`px-3 py-1 rounded text-xs transition-all ${viewMode === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
            <Plus className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {types.map((type) => (
          <div key={type} className="bg-card border border-border rounded-lg p-2 text-center cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}>
            <div className="text-lg" style={{ fontWeight: 600, color: typeColors[type] }}>{documents.filter((d) => d.type === type).length}</div>
            <div className="text-[10px] text-muted-foreground">{type}s</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Semantic search across all documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Types</option>
          {types.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Sources</option>
          {sources.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
      </div>

      {/* Document Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc) => {
            const AccessIcon = accessIcons[doc.access];
            return (
              <div key={doc.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${typeColors[doc.type]}15` }}>
                    <FileText className="w-5 h-5" style={{ color: typeColors[doc.type] }} />
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.starred && <Star className="w-3.5 h-3.5 text-[var(--iw-warning)] fill-[var(--iw-warning)]" />}
                    <button className="p-1 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                </div>
                <div className="text-sm mb-1" style={{ fontWeight: 500 }}>{doc.title}</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${typeColors[doc.type]}15`, color: typeColors[doc.type], fontWeight: 500 }}>{doc.type}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <AccessIcon className="w-3 h-3" /> {doc.access}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {doc.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">{doc.sourceIcon} {doc.source}</span>
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
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Document</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>Type</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 500 }}>Source</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 500 }}>Updated</th>
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden xl:table-cell" style={{ fontWeight: 500 }}>Size</th>
                <th className="text-center py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Access</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const AccessIcon = accessIcons[doc.access];
                return (
                  <tr key={doc.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 flex-shrink-0" style={{ color: typeColors[doc.type] }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{doc.title}</div>
                          <div className="text-[10px] text-muted-foreground">{doc.updatedBy}</div>
                        </div>
                        {doc.starred && <Star className="w-3 h-3 text-[var(--iw-warning)] fill-[var(--iw-warning)]" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${typeColors[doc.type]}15`, color: typeColors[doc.type], fontWeight: 500 }}>{doc.type}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">{doc.sourceIcon} {doc.source}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">{doc.updatedAt}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden xl:table-cell">{doc.size}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] capitalize flex items-center gap-1 justify-center text-muted-foreground"><AccessIcon className="w-3 h-3" /> {doc.access}</span>
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
