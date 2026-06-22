/**
 * Projects / Initiatives View — List, Kanban, progress tracking
 * CSM Intelligence L1 Workspace
 */
import { useState, useMemo } from "react";
import {
  Search, List, KanbanSquare, Filter, Plus,
  Clock, CheckCircle, AlertTriangle, Pause, ChevronRight,
  MoreHorizontal, X,
} from "lucide-react";
import { projects as allProjects, getStatusColor, getPriorityColor, type CSMProject } from "./csm-data";

type ViewMode = "list" | "kanban";

export function ProjectsView() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return allProjects.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.accountName.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [search, statusFilter]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[var(--iw-success)]/30" />
            </div>
            <div className="flex items-center gap-1.5">
              {["all", "in-progress", "planning", "blocked", "on-hold", "completed"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 text-xs rounded-full transition-colors ${statusFilter === s ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: statusFilter === s ? 600 : 400 }}>
                  {s === "all" ? "All" : s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-secondary rounded-lg p-0.5">
              {([["list", List], ["kanban", KanbanSquare]] as [ViewMode, any][]).map(([id, Icon]) => (
                <button key={id} onClick={() => setMode(id)} className={`p-1.5 rounded-md transition-colors ${mode === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-success)] text-white hover:opacity-90">
              <Plus className="w-3.5 h-3.5" /> New Project
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {mode === "list" ? <ProjectList projects={filtered} /> : <ProjectKanban projects={filtered} />}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed": return <CheckCircle className="w-4 h-4 text-[var(--iw-success)]" />;
    case "blocked": return <AlertTriangle className="w-4 h-4 text-[var(--iw-danger)]" />;
    case "on-hold": return <Pause className="w-4 h-4 text-[var(--iw-warning)]" />;
    case "in-progress": return <Clock className="w-4 h-4 text-[var(--iw-blue)]" />;
    default: return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

function ProjectCard({ project: p }: { project: CSMProject }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-start gap-3 mb-3">
        <StatusIcon status={p.status} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm" style={{ fontWeight: 600 }}>{p.name}</h4>
          <p className="text-[11px] text-muted-foreground line-clamp-1">{p.objective}</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: `${getPriorityColor(p.priority)}15`, color: getPriorityColor(p.priority), fontWeight: 600 }}>
          {p.priority}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Progress</span>
          <span className="text-[10px]" style={{ fontWeight: 600 }}>{p.progress}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, backgroundColor: getStatusColor(p.status) }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px]" style={{ fontWeight: 600 }}>{p.owner.initials}</span>
          {p.accountName}
        </span>
        <span>{p.completedTasks}/{p.taskCount} tasks</span>
      </div>

      {p.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {p.tags.map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectList({ projects }: { projects: CSMProject[] }) {
  return (
    <div className="space-y-3">
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No projects match your filters</p>
        </div>
      )}
    </div>
  );
}

function ProjectKanban({ projects }: { projects: CSMProject[] }) {
  const columns = [
    { id: "planning", label: "Planning", color: "var(--muted-foreground)" },
    { id: "in-progress", label: "In Progress", color: "var(--iw-blue)" },
    { id: "blocked", label: "Blocked", color: "var(--iw-danger)" },
    { id: "on-hold", label: "On Hold", color: "var(--iw-warning)" },
    { id: "completed", label: "Completed", color: "var(--iw-success)" },
  ];

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map(col => {
        const items = projects.filter(p => p.status === col.id);
        return (
          <div key={col.id} className="flex-shrink-0 w-72 flex flex-col">
            <div className="flex items-center gap-2 px-2 py-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-sm" style={{ fontWeight: 600 }}>{col.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{items.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {items.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
