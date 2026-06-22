/**
 * Documents View — Grid with file previews, list with metadata
 * CSM Intelligence L1 Workspace
 */
import { useState, useMemo } from "react";
import {
  Search, Grid3x3, List, Plus, Download, Upload,
  FileText, File, FileSpreadsheet, Presentation,
  Image, Filter, X, ExternalLink, MoreHorizontal, FolderOpen,
} from "lucide-react";
import { documents as allDocuments, formatFileSize, type CSMDocument } from "./csm-data";

type ViewMode = "grid" | "list";

const typeIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  pdf: { icon: <FileText className="w-5 h-5" />, color: "#F44336" },
  docx: { icon: <FileText className="w-5 h-5" />, color: "#2196F3" },
  xlsx: { icon: <FileSpreadsheet className="w-5 h-5" />, color: "#4CAF50" },
  pptx: { icon: <Presentation className="w-5 h-5" />, color: "#FF9800" },
  csv: { icon: <FileSpreadsheet className="w-5 h-5" />, color: "#4CAF50" },
  png: { icon: <Image className="w-5 h-5" />, color: "#9C27B0" },
  jpg: { icon: <Image className="w-5 h-5" />, color: "#9C27B0" },
};

const spaceColors: Record<string, string> = {
  personal: "var(--iw-purple)",
  team: "var(--iw-blue)",
  account: "var(--iw-success)",
  project: "var(--iw-warning)",
};

export function DocumentsView() {
  const [mode, setMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [spaceFilter, setSpaceFilter] = useState("all");

  const filtered = useMemo(() => {
    return allDocuments.filter(d => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
      if (spaceFilter !== "all" && d.space !== spaceFilter) return false;
      return true;
    });
  }, [search, spaceFilter]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[var(--iw-success)]/30" />
            </div>
            <div className="flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
              {["all", "personal", "team", "account", "project"].map(s => (
                <button key={s} onClick={() => setSpaceFilter(s)} className={`px-2.5 py-1 text-xs rounded-full transition-colors ${spaceFilter === s ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: spaceFilter === s ? 600 : 400 }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} files</span>
            <div className="flex items-center bg-secondary rounded-lg p-0.5">
              {([["grid", Grid3x3], ["list", List]] as [ViewMode, any][]).map(([id, Icon]) => (
                <button key={id} onClick={() => setMode(id)} className={`p-1.5 rounded-md transition-colors ${mode === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-success)] text-white hover:opacity-90">
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {mode === "grid" ? <DocGrid docs={filtered} /> : <DocList docs={filtered} />}
      </div>
    </div>
  );
}

function DocGrid({ docs }: { docs: CSMDocument[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {docs.map(doc => {
        const ti = typeIcons[doc.type] || { icon: <File className="w-5 h-5" />, color: "#757575" };
        return (
          <div key={doc.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group">
            <div className="w-full h-20 bg-secondary rounded-lg flex items-center justify-center mb-3">
              <div style={{ color: ti.color }}>{ti.icon}</div>
            </div>
            <h4 className="text-sm truncate mb-1" style={{ fontWeight: 500 }}>{doc.name}</h4>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
              <span>{formatFileSize(doc.size)}</span>
              <span className="uppercase">{doc.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${spaceColors[doc.space]}15`, color: spaceColors[doc.space], fontWeight: 500 }}>
                {doc.space}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px]" style={{ fontWeight: 600 }}>
                  {doc.uploadedBy.initials}
                </div>
                <span className="text-[10px] text-muted-foreground">{doc.uploadedAt}</span>
              </div>
            </div>
            {doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {doc.tags.slice(0, 2).map(t => (
                  <span key={t} className="text-[8px] px-1 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DocList({ docs }: { docs: CSMDocument[] }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
        <span>Name</span><span>Type</span><span>Size</span><span>Space</span><span>Uploaded</span><span />
      </div>
      {docs.map(doc => {
        const ti = typeIcons[doc.type] || { icon: <File className="w-4 h-4" />, color: "#757575" };
        return (
          <div key={doc.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer items-center">
            <div className="flex items-center gap-3 min-w-0">
              <span style={{ color: ti.color }}>{ti.icon}</span>
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>{doc.name}</p>
                {doc.accountName && <p className="text-[10px] text-muted-foreground">{doc.accountName}</p>}
              </div>
            </div>
            <span className="text-xs text-muted-foreground uppercase">{doc.type}</span>
            <span className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize inline-flex w-fit" style={{ backgroundColor: `${spaceColors[doc.space]}15`, color: spaceColors[doc.space], fontWeight: 500 }}>
              {doc.space}
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{doc.uploadedAt}</p>
              <p className="text-[10px] text-muted-foreground">{doc.uploadedBy.name}</p>
            </div>
            <button className="p-1 rounded hover:bg-secondary"><Download className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        );
      })}
    </div>
  );
}
