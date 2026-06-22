import { useState } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  List,
  KanbanSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  Circle,
  MoreHorizontal,
  User,
  Flag,
  Tag,
  ArrowUpRight,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "urgent" | "high" | "medium" | "low";
  assignee: { name: string; initials: string };
  dueDate: string;
  overdue: boolean;
  source: string;
  tags: string[];
  account?: string;
}

const tasks: Task[] = [
  { id: "t1", title: "Review Q4 revenue reconciliation", description: "Cross-check Stripe invoices with Salesforce records", status: "in-progress", priority: "urgent", assignee: { name: "Arun K.", initials: "AK" }, dueDate: "Today", overdue: false, source: "Manual", tags: ["Finance", "QBR"], account: "TechServe India" },
  { id: "t2", title: "Fix Salesforce sync error - 3 accounts", description: "API rate limit exceeded, needs config change", status: "todo", priority: "high", assignee: { name: "Priya S.", initials: "PS" }, dueDate: "Today", overdue: false, source: "Jira", tags: ["Integration", "Bug"] },
  { id: "t3", title: "Onboard TechServe integration stack", description: "Connect SF, Slack, and Stripe for new enterprise account", status: "in-progress", priority: "medium", assignee: { name: "Rajesh M.", initials: "RM" }, dueDate: "Tomorrow", overdue: false, source: "Asana", tags: ["Onboarding"], account: "TechServe India" },
  { id: "t4", title: "Update SLA compliance report", description: "Monthly APAC SLA report for leadership review", status: "todo", priority: "medium", assignee: { name: "Anjali P.", initials: "AP" }, dueDate: "Wed", overdue: false, source: "Manual", tags: ["Compliance", "Report"] },
  { id: "t5", title: "Approve renewal risk workflow", description: "Review and activate the automated renewal alert workflow", status: "review", priority: "low", assignee: { name: "Arun K.", initials: "AK" }, dueDate: "Thu", overdue: false, source: "Workflow", tags: ["Automation"] },
  { id: "t6", title: "CloudBridge QBR preparation", description: "Compile usage metrics and ROI analysis for QBR", status: "todo", priority: "high", assignee: { name: "Vikram R.", initials: "VR" }, dueDate: "Mon", overdue: false, source: "Calendar", tags: ["QBR", "CS"], account: "CloudBridge APAC" },
  { id: "t7", title: "Configure Razorpay webhook retry", description: "Set up retry policy for failed payment webhooks", status: "done", priority: "high", assignee: { name: "Priya S.", initials: "PS" }, dueDate: "Yesterday", overdue: false, source: "Jira", tags: ["Integration"] },
  { id: "t8", title: "FinanceFlow health check follow-up", description: "Account health dropped to 54 - schedule customer call", status: "todo", priority: "urgent", assignee: { name: "Anjali P.", initials: "AP" }, dueDate: "Yesterday", overdue: true, source: "ChurnShield", tags: ["CS", "At-Risk"], account: "FinanceFlow Solutions" },
  { id: "t9", title: "LogiPrime renewal outreach", description: "Renewal in 19 days, engagement metrics declining", status: "in-progress", priority: "urgent", assignee: { name: "Vikram R.", initials: "VR" }, dueDate: "Today", overdue: false, source: "Workflow", tags: ["Renewal"], account: "LogiPrime Corp" },
  { id: "t10", title: "Marketing attribution data audit", description: "Verify UTM parameter mapping accuracy", status: "done", priority: "medium", assignee: { name: "Deepak J.", initials: "DJ" }, dueDate: "Last Fri", overdue: false, source: "Manual", tags: ["Marketing", "Data Quality"] },
];

const priorityConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  urgent: { color: "var(--iw-danger)", icon: AlertTriangle },
  high: { color: "var(--iw-warning)", icon: Flag },
  medium: { color: "var(--iw-blue)", icon: Flag },
  low: { color: "var(--iw-success)", icon: Flag },
};

const statusColumns = [
  { id: "todo" as const, label: "To Do", color: "var(--muted-foreground)" },
  { id: "in-progress" as const, label: "In Progress", color: "var(--iw-blue)" },
  { id: "review" as const, label: "Review", color: "var(--iw-warning)" },
  { id: "done" as const, label: "Done", color: "var(--iw-success)" },
];

type ViewMode = "list" | "kanban";

export function TasksView() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Tasks & Operations</h2>
          <p className="text-sm text-muted-foreground mt-1">Track and manage operational tasks from all connected systems</p>
        </div>
        <div className="flex gap-2">
          <div className="flex p-0.5 bg-secondary rounded-md">
            <button onClick={() => setViewMode("list")} className={`px-3 py-1 rounded text-xs transition-all ${viewMode === "list" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("kanban")} className={`px-3 py-1 rounded text-xs transition-all ${viewMode === "kanban" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              <KanbanSquare className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Total Tasks</div>
          <div className="text-lg" style={{ fontWeight: 600 }}>{stats.total}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Overdue</div>
          <div className="text-lg" style={{ fontWeight: 600, color: stats.overdue > 0 ? "var(--iw-danger)" : undefined }}>{stats.overdue}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Due Today</div>
          <div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-warning)" }}>{stats.dueToday}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Completed</div>
          <div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-success)" }}>{stats.done}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Views */}
      {viewMode === "list" ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Task</th>
                  <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>Assignee</th>
                  <th className="text-center py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Priority</th>
                  <th className="text-center py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Status</th>
                  <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 500 }}>Due</th>
                  <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden xl:table-cell" style={{ fontWeight: 500 }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const prCfg = priorityConfig[task.priority];
                  const PrIcon = prCfg.icon;
                  return (
                    <tr key={task.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {task.status === "done" ? <CheckCircle className="w-4 h-4 text-[var(--iw-success)] flex-shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />}
                          <div>
                            <div className={`${task.status === "done" ? "line-through text-muted-foreground" : ""}`} style={{ fontWeight: 500 }}>{task.title}</div>
                            {task.account && <div className="text-[10px] text-muted-foreground">{task.account}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] text-primary" style={{ fontWeight: 600 }}>{task.assignee.initials}</div>
                          <span className="text-xs">{task.assignee.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${prCfg.color}15`, color: prCfg.color, fontWeight: 500 }}>
                          <PrIcon className="w-3 h-3" /> {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full capitalize bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>{task.status.replace("-", " ")}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className={`text-xs ${task.overdue ? "text-[var(--iw-danger)]" : "text-muted-foreground"}`} style={{ fontWeight: task.overdue ? 500 : 400 }}>
                          {task.overdue && "⚠ "}{task.dueDate}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden xl:table-cell">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">{task.source}</span>
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
                  <span className="text-xs" style={{ fontWeight: 600 }}>{col.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => {
                    const prCfg = priorityConfig[task.priority];
                    return (
                      <div key={task.id} className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm" style={{ fontWeight: 500 }}>{task.title}</span>
                        </div>
                        {task.account && <div className="text-[10px] text-muted-foreground mb-2">{task.account}</div>}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${prCfg.color}15`, color: prCfg.color, fontWeight: 500 }}>{task.priority}</span>
                          {task.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] text-primary" style={{ fontWeight: 600 }}>{task.assignee.initials}</div>
                          <span className={`text-[10px] ${task.overdue ? "text-[var(--iw-danger)]" : "text-muted-foreground"}`}>{task.dueDate}</span>
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
