/**
 * Tasks View — List with grouping (by due date, assignee, account), bulk actions
 * CSM Intelligence L1 Workspace
 */
import { useState, useMemo } from "react";
import {
  Search, Filter, Plus, CheckCircle, Circle, Clock,
  AlertTriangle, User, Building, Calendar, ChevronDown,
  X, MoreHorizontal, Check,
} from "lucide-react";
import { tasks as allTasks, getPriorityColor, type CSMTask } from "./csm-data";

type GroupBy = "due-date" | "assignee" | "account" | "priority" | "none";

export function TasksView() {
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("due-date");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [tasksState, setTasksState] = useState(allTasks);

  const filtered = useMemo(() => {
    return tasksState.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.accountName || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [search, statusFilter, priorityFilter, tasksState]);

  const grouped = useMemo(() => {
    const groups: Record<string, CSMTask[]> = {};
    for (const t of filtered) {
      let key: string;
      switch (groupBy) {
        case "assignee": key = t.assignee.name; break;
        case "account": key = t.accountName || "Internal"; break;
        case "priority": key = t.priority; break;
        case "due-date":
          if (t.dueDays < 0) key = "Overdue";
          else if (t.dueDays === 0) key = "Today";
          else if (t.dueDays <= 3) key = "Next 3 Days";
          else if (t.dueDays <= 7) key = "This Week";
          else key = "Later";
          break;
        default: key = "All Tasks";
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    return groups;
  }, [filtered, groupBy]);

  const toggleTask = (id: string) => {
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t));
  };

  const toggleSelect = (id: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const counts = {
    overdue: tasksState.filter(t => t.status === "overdue").length,
    todo: tasksState.filter(t => t.status === "todo").length,
    inProgress: tasksState.filter(t => t.status === "in-progress").length,
    done: tasksState.filter(t => t.status === "done").length,
  };

  const groupOrder: Record<GroupBy, string[]> = {
    "due-date": ["Overdue", "Today", "Next 3 Days", "This Week", "Later"],
    assignee: [],
    account: [],
    priority: ["high", "medium", "low"],
    none: ["All Tasks"],
  };
  const sortedKeys = groupBy in groupOrder && groupOrder[groupBy].length > 0
    ? groupOrder[groupBy].filter(k => grouped[k])
    : Object.keys(grouped).sort();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[var(--iw-success)]/30" />
            </div>
            {/* Status filter chips */}
            <div className="flex items-center gap-1.5">
              {[
                { id: "all", label: "All" },
                { id: "overdue", label: `Overdue (${counts.overdue})` },
                { id: "todo", label: `To Do (${counts.todo})` },
                { id: "in-progress", label: `Active (${counts.inProgress})` },
                { id: "done", label: `Done (${counts.done})` },
              ].map(s => (
                <button key={s.id} onClick={() => setStatusFilter(s.id)} className={`px-2.5 py-1 text-xs rounded-full transition-colors ${statusFilter === s.id ? "bg-[var(--iw-success)]/15 text-[var(--iw-success)]" : "bg-secondary text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: statusFilter === s.id ? 600 : 400 }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary rounded-lg px-2 py-1">
              <span className="text-[10px] text-muted-foreground">Group:</span>
              <select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupBy)} className="text-xs bg-transparent outline-none cursor-pointer text-foreground">
                <option value="due-date">Due Date</option>
                <option value="assignee">Assignee</option>
                <option value="account">Account</option>
                <option value="priority">Priority</option>
                <option value="none">None</option>
              </select>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-success)] text-white hover:opacity-90">
              <Plus className="w-3.5 h-3.5" /> New Task
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedTasks.size > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{selectedTasks.size} selected</span>
            <button className="px-2.5 py-1 text-xs rounded-lg bg-[var(--iw-success)]/10 text-[var(--iw-success)] hover:bg-[var(--iw-success)]/20">
              <Check className="w-3 h-3 inline mr-1" />Complete
            </button>
            <button className="px-2.5 py-1 text-xs rounded-lg bg-secondary text-muted-foreground hover:text-foreground">Reassign</button>
            <button className="px-2.5 py-1 text-xs rounded-lg bg-secondary text-muted-foreground hover:text-foreground">Reschedule</button>
            <button onClick={() => setSelectedTasks(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Clear</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {sortedKeys.map(groupName => (
          <div key={groupName}>
            <div className="flex items-center gap-2 mb-3">
              <GroupIcon groupBy={groupBy} name={groupName} />
              <h3 className="text-sm capitalize" style={{ fontWeight: 600 }}>{groupName}</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{grouped[groupName].length}</span>
            </div>
            <div className="space-y-1">
              {grouped[groupName].map(task => (
                <TaskRow key={task.id} task={task} selected={selectedTasks.has(task.id)} onToggle={() => toggleTask(task.id)} onSelect={() => toggleSelect(task.id)} />
              ))}
            </div>
          </div>
        ))}
        {sortedKeys.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-10 h-10 text-[var(--iw-success)] mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tasks match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GroupIcon({ groupBy, name }: { groupBy: GroupBy; name: string }) {
  if (groupBy === "due-date") return name === "Overdue" ? <AlertTriangle className="w-4 h-4 text-[var(--iw-danger)]" /> : <Calendar className="w-4 h-4 text-muted-foreground" />;
  if (groupBy === "assignee") return <User className="w-4 h-4 text-muted-foreground" />;
  if (groupBy === "account") return <Building className="w-4 h-4 text-muted-foreground" />;
  return null;
}

function TaskRow({ task, selected, onToggle, onSelect }: { task: CSMTask; selected: boolean; onToggle: () => void; onSelect: () => void }) {
  const isDone = task.status === "done";
  const isOverdue = task.status === "overdue";
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-secondary/50 group ${selected ? "bg-[var(--iw-success)]/5 border border-[var(--iw-success)]/20" : ""} ${isOverdue ? "border-l-2 border-l-[var(--iw-danger)]" : ""}`}>
      <input type="checkbox" checked={selected} onChange={onSelect} className="w-3.5 h-3.5 rounded accent-[var(--iw-success)] cursor-pointer" />
      <button onClick={onToggle} className="flex-shrink-0">
        {isDone ? <CheckCircle className="w-5 h-5 text-[var(--iw-success)]" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-[var(--iw-success)]" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isDone ? "line-through text-muted-foreground" : ""}`} style={{ fontWeight: 500 }}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.accountName && <span className="text-[10px] text-muted-foreground">{task.accountName}</span>}
          {task.projectName && <span className="text-[10px] text-muted-foreground">· {task.projectName}</span>}
        </div>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: `${getPriorityColor(task.priority)}15`, color: getPriorityColor(task.priority), fontWeight: 600 }}>
        {task.priority}
      </span>
      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px] flex-shrink-0" style={{ fontWeight: 600 }} title={task.assignee.name}>
        {task.assignee.initials}
      </div>
      <span className={`text-xs flex-shrink-0 ${isOverdue ? "text-[var(--iw-danger)]" : "text-muted-foreground"}`} style={{ fontWeight: isOverdue ? 600 : 400 }}>
        {isOverdue && task.dueDays < 0 ? `${Math.abs(task.dueDays)}d overdue` : task.dueDays === 0 ? "Today" : `${task.dueDays}d`}
      </span>
      {task.tags.length > 0 && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground hidden sm:inline">{task.tags[0]}</span>
      )}
    </div>
  );
}
