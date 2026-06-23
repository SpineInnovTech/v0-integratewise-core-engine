/**
 * Tasks & Actions View — From Project Task Organizer
 * Card-based task layout with status counts, filters, and linked entities.
 * Data: Spine projection via useHydrateProjection("account_success") — task entities.
 */
import { useState, useMemo } from "react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import {
  CheckSquare,
  Plus,
  Filter,
  Clock,
  User,
  Link2,
  Target,
  MessageSquare,
  AlertTriangle,
  DollarSign,
  Settings,
  CalendarClock,
  Loader2,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  priority: "critical" | "high" | "medium" | "low";
  owner: string;
  dueDate: string;
  status: "todo" | "inProgress" | "review" | "done";
  category: "engagement" | "risk" | "expansion" | "technical" | "renewal";
  description: string;
  linkedEntity?: string;
  effort: string;
  impact: string;
}

function normalizeStatus(s: string | undefined): Task["status"] {
  if (!s) return "todo";
  const lower = s.toLowerCase().replace(/[\s_-]+/g, "");
  if (lower === "done" || lower === "completed" || lower === "closed") return "done";
  if (
    lower === "inprogress" ||
    lower === "active" ||
    lower === "working" ||
    lower === "in_progress"
  )
    return "inProgress";
  if (lower === "review" || lower === "pending" || lower === "waiting") return "review";
  return "todo";
}

function normalizePriority(p: string | undefined): Task["priority"] {
  if (!p) return "medium";
  const lower = p.toLowerCase();
  if (lower === "critical" || lower === "urgent" || lower === "p0") return "critical";
  if (lower === "high" || lower === "p1") return "high";
  if (lower === "low" || lower === "p3" || lower === "p4") return "low";
  return "medium";
}

const statusConfig = {
  todo: { label: "To Do", color: "var(--iw-signal-info)", bg: "rgba(61, 122, 80, 0.15)" },
  inProgress: {
    label: "In Progress",
    color: "var(--iw-signal-warning)",
    bg: "rgba(245, 158, 11, 0.15)",
  },
  review: { label: "Review", color: "#b8943f", bg: "rgba(184, 148, 63, 0.15)" },
  done: { label: "Done", color: "var(--iw-signal-success)", bg: "rgba(16, 185, 129, 0.15)" },
};

const priorityConfig = {
  critical: {
    color: "var(--iw-signal-critical)",
    bg: "rgba(239, 68, 68, 0.15)",
    label: "Critical",
  },
  high: { color: "var(--iw-signal-warning)", bg: "rgba(245, 158, 11, 0.15)", label: "High" },
  medium: { color: "var(--iw-signal-info)", bg: "rgba(61, 122, 80, 0.15)", label: "Medium" },
  low: { color: "#8A8580", bg: "rgba(158, 158, 158, 0.15)", label: "Low" },
};

const categoryIcons: Record<string, React.ReactNode> = {
  engagement: <MessageSquare size={14} />,
  risk: <AlertTriangle size={14} />,
  expansion: <DollarSign size={14} />,
  technical: <Settings size={14} />,
  renewal: <CalendarClock size={14} />,
};

export function TasksCardsView() {
  const { data: rawTasks, isLoading: loading } = useWorkspaceEntities<any>("task");

  const tasks: Task[] = useMemo(() => {
    return rawTasks.map((r: any) => ({
      id: r.id || r.task_id || crypto.randomUUID(),
      title: r.title || r.name || r.subject || "Untitled task",
      priority: normalizePriority(r.priority),
      owner: r.owner || r.assignee || r.assignee_name || "",
      dueDate: r.dueDate || r.due_date || "",
      status: normalizeStatus(r.status),
      category: r.category || "engagement",
      description: r.description || "",
      linkedEntity: r.linkedEntity || r.linked_entity || r.account_name || undefined,
      effort: r.effort || "",
      impact: r.impact || "",
    }));
  }, [rawTasks]);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const statusCounts = Object.fromEntries(
    Object.keys(statusConfig).map((s) => [s, tasks.filter((t) => t.status === s).length])
  );

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tasks...
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--iw-signal-info) 0%, #2d5a3d 50%, #1a3a2a 100%)",
          boxShadow: "0 4px 20px rgba(61, 122, 80, 0.2)",
        }}
      >
        <div className="p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CheckSquare size={28} className="text-white/90" />
                <h1 className="text-2xl font-bold">Tasks & Actions</h1>
              </div>
              <p className="text-sm text-white/70">
                Track and manage all customer success activities
              </p>
            </div>
            <button
              className="flex items-center gap-1.5 bg-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-white/90"
              style={{ color: "var(--iw-signal-info)" }}
            >
              <Plus size={16} /> New Task
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div
                key={key}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15"
              >
                <div className="text-[10px] text-white/60 uppercase tracking-wider mb-1">
                  {config.label}
                </div>
                <div className="text-2xl font-bold">{statusCounts[key] || 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl border bg-card px-5 py-3 flex flex-wrap items-center gap-3"
        style={{ borderColor: "var(--border)" }}
      >
        <Filter size={14} className="text-muted-foreground" />
        <select
          aria-label="Filter by status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--iw-signal-info)] bg-background"
          style={{ borderColor: "var(--border)" }}
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="inProgress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select
          aria-label="Filter by priority"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--iw-signal-info)] bg-background"
          style={{ borderColor: "var(--border)" }}
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {filteredTasks.length} of {tasks.length} tasks
        </span>
      </div>

      {/* Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => {
          const prio = priorityConfig[task.priority];
          const status = statusConfig[task.status];

          return (
            <div
              key={task.id}
              className="rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md hover:border-[var(--iw-signal-info)]/30"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {categoryIcons[task.category]}
                    <span className="text-[10px] uppercase tracking-wider">{task.category}</span>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold"
                    style={{ backgroundColor: prio.bg, color: prio.color }}
                  >
                    {prio.label}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold"
                    style={{ backgroundColor: status.bg, color: status.color }}
                  >
                    {status.label}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-foreground mb-2">{task.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {task.description}
                </p>

                {task.linkedEntity && (
                  <div
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 mb-3"
                    style={{ backgroundColor: "rgba(61, 122, 80, 0.1)" }}
                  >
                    <Link2 size={12} style={{ color: "var(--iw-signal-info)" }} />
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: "var(--iw-signal-info)" }}
                    >
                      {task.linkedEntity}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={12} />
                    <span>{task.effort || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User size={12} />
                    <span>{task.owner || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarClock size={12} />
                    <span>{task.dueDate || "—"}</span>
                  </div>
                </div>

                {task.impact && (
                  <div
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2"
                    style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                  >
                    <Target size={12} style={{ color: "var(--iw-signal-success)" }} />
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: "var(--iw-signal-success)" }}
                    >
                      {task.impact}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div
          className="rounded-xl border bg-card p-12 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <CheckSquare size={40} className="text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">No Tasks Found</h3>
          <p className="text-xs text-muted-foreground">
            {tasks.length === 0
              ? "Connect your tools to see tasks here."
              : "Try adjusting your filters or create a new task"}
          </p>
        </div>
      )}
    </div>
  );
}
