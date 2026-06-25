/**
 * BizOps — Tasks view
 *
 * Wired to real entity data via direct Supabase RPC.
 * Entity type: "task" (cs.task schema)
 */
import { useState, useMemo } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  List,
  KanbanSquare,
  AlertTriangle,
  CheckCircle,
  Circle,
  Flag,
  RefreshCw,
} from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "urgent" | "high" | "medium" | "low";
  assignee: { name: string; initials: string };
  dueDate: string;
  overdue: boolean;
  source: string;
  tags: string[];
  account?: string;
}

/** Map raw entity data from Supabase to the Task UI interface */
function normalizeTask(raw: any): Task {
  const status = normalizeStatus(raw.status);
  const priority = normalizePriority(raw.priority);
  const assigneeName = raw.assignee_name || raw.assignee || raw.owner || "";
  const initials = assigneeName
    .split(" ")
    .map((w: string) => w[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const dueDate = raw.due_date ? new Date(raw.due_date) : null;
  const now = new Date();
  const overdue = dueDate ? dueDate < now && status !== "done" : false;

  return {
    id: raw.id || raw.task_id || crypto.randomUUID(),
    title: raw.title || raw.name || raw.subject || "Untitled Task",
    status,
    priority,
    assignee: { name: assigneeName || "Unassigned", initials: initials || "?" },
    dueDate: dueDate
      ? dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "No date",
    overdue,
    source: raw.source || raw.origin || raw.integration || "Manual",
    tags: Array.isArray(raw.tags) ? raw.tags : raw.category ? [raw.category] : [],
    account: raw.account_name || raw.account || undefined,
  };
}

function normalizeStatus(s: string | undefined): Task["status"] {
  if (!s) return "todo";
  const lower = s.toLowerCase().replace(/[\s_-]+/g, "");
  if (lower === "done" || lower === "completed" || lower === "closed") return "done";
  if (lower === "inprogress" || lower === "active" || lower === "working") return "in-progress";
  if (lower === "review" || lower === "pending" || lower === "waiting") return "review";
  return "todo";
}

function normalizePriority(p: string | undefined): Task["priority"] {
  if (!p) return "medium";
  const lower = p.toLowerCase();
  if (lower === "urgent" || lower === "critical" || lower === "p0") return "urgent";
  if (lower === "high" || lower === "p1") return "high";
  if (lower === "low" || lower === "p3" || lower === "p4") return "low";
  return "medium";
}

const priorityConfig: Record<
  string,
  { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  urgent: { color: "var(--iw-danger)", icon: AlertTriangle },
  high: { color: "var(--iw-warning)", icon: Flag },
  medium: { color: "var(--iw-forest-mid)", icon: Flag },
  low: { color: "var(--iw-success)", icon: Flag },
};

const statusColumns = [
  { id: "todo" as const, label: "To Do", color: "var(--muted-foreground)" },
  { id: "in-progress" as const, label: "In Progress", color: "var(--iw-forest-mid)" },
  { id: "review" as const, label: "Review", color: "var(--iw-warning)" },
  { id: "done" as const, label: "Done", color: "var(--iw-success)" },
];

export function TasksView() {
  const { data: rawTasks, isLoading, refetch } = useWorkspaceEntities("task");
  const tasks = useMemo(() => rawTasks.map(normalizeTask), [rawTasks]);

  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    overdue: tasks.filter((t) => t.overdue).length,
    dueToday: tasks.filter((t) => t.dueDate === "Today").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Tasks & Operations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage operational tasks from all connected systems
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg border hover:bg-accent text-muted-foreground"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <div className="flex p-0.5 bg-secondary rounded-md">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded text-xs transition-all ${viewMode === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 rounded text-xs transition-all ${viewMode === "kanban" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks", value: stats.total },
          {
            label: "Overdue",
            value: stats.overdue,
            color: stats.overdue > 0 ? "var(--iw-danger)" : undefined,
          },
          { label: "Due Today", value: stats.dueToday, color: "var(--iw-warning)" },
          { label: "Completed", value: stats.done, color: "var(--iw-success)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
            <div className="text-lg" style={{ fontWeight: 600, color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {viewMode === "list" ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th
                    className="text-left py-2.5 px-4 text-xs text-muted-foreground"
                    style={{ fontWeight: 500 }}
                  >
                    Task
                  </th>
                  <th
                    className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell"
                    style={{ fontWeight: 500 }}
                  >
                    Assignee
                  </th>
                  <th
                    className="text-center py-2.5 px-4 text-xs text-muted-foreground"
                    style={{ fontWeight: 500 }}
                  >
                    Priority
                  </th>
                  <th
                    className="text-center py-2.5 px-4 text-xs text-muted-foreground"
                    style={{ fontWeight: 500 }}
                  >
                    Status
                  </th>
                  <th
                    className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell"
                    style={{ fontWeight: 500 }}
                  >
                    Due
                  </th>
                  <th
                    className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden xl:table-cell"
                    style={{ fontWeight: 500 }}
                  >
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const prCfg = priorityConfig[task.priority];
                  const PrIcon = prCfg.icon;
                  return (
                    <tr
                      key={task.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {task.status === "done" ? (
                            <CheckCircle
                              className="w-4 h-4 shrink-0"
                              style={{ color: "var(--iw-success)" }}
                            />
                          ) : (
                            <Circle className="w-4 h-4 shrink-0 text-muted-foreground/30" />
                          )}
                          <div>
                            <div
                              className={
                                task.status === "done" ? "line-through text-muted-foreground" : ""
                              }
                              style={{ fontWeight: 500 }}
                            >
                              {task.title}
                            </div>
                            {task.account && (
                              <div className="text-[10px] text-muted-foreground">
                                {task.account}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] text-primary"
                            style={{ fontWeight: 600 }}
                          >
                            {task.assignee.initials}
                          </div>
                          <span className="text-xs">{task.assignee.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full capitalize"
                          style={{
                            backgroundColor: `${prCfg.color}15`,
                            color: prCfg.color,
                            fontWeight: 500,
                          }}
                        >
                          <PrIcon className="w-3 h-3" /> {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full capitalize bg-secondary text-muted-foreground"
                          style={{ fontWeight: 500 }}
                        >
                          {task.status.replace("-", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span
                          className="text-xs"
                          style={{
                            fontWeight: task.overdue ? 500 : 400,
                            color: task.overdue ? "var(--iw-danger)" : undefined,
                          }}
                        >
                          {task.overdue && "⚠ "}
                          {task.dueDate}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden xl:table-cell">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                          {task.source}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.id);
            return (
              <div key={col.id}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-xs" style={{ fontWeight: 600 }}>
                    {col.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => {
                    const prCfg = priorityConfig[task.priority];
                    return (
                      <div
                        key={task.id}
                        className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="text-sm mb-1" style={{ fontWeight: 500 }}>
                          {task.title}
                        </div>
                        {task.account && (
                          <div className="text-[10px] text-muted-foreground mb-2">
                            {task.account}
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                            style={{
                              backgroundColor: `${prCfg.color}15`,
                              color: prCfg.color,
                              fontWeight: 500,
                            }}
                          >
                            {task.priority}
                          </span>
                          {task.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                          <div
                            className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] text-primary"
                            style={{ fontWeight: 600 }}
                          >
                            {task.assignee.initials}
                          </div>
                          <span
                            className="text-[10px]"
                            style={{ color: task.overdue ? "var(--iw-danger)" : undefined }}
                          >
                            {task.dueDate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TasksView;
