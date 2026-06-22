/**
 * Task Manager View — Tasks linked to risks, initiatives, and external systems.
 * Entity: Task_Manager
 */
import { useState } from "react";
import { Search, CheckSquare, Clock, AlertTriangle } from "lucide-react";
import { taskManagerData, getAccountName, statusColor, riskColor } from "../csm-intelligence-data";

export function TaskManagerView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = taskManagerData.filter(t => {
    if (search && !t.taskName.toLowerCase().includes(search.toLowerCase()) && !getAccountName(t.account).toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  }).sort((a, b) => {
    const prio = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (prio[a.priority] || 3) - (prio[b.priority] || 3);
  });

  const overdue = taskManagerData.filter(t => t.status === "Overdue").length;
  const critical = taskManagerData.filter(t => t.priority === "Critical").length;

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg text-foreground" style={{ fontWeight: 600 }}>Task Manager</h2>
          <p className="text-xs text-muted-foreground">{taskManagerData.length} tasks · {overdue} overdue · {critical} critical</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary/30 w-44" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Overdue">Overdue</option>
            <option value="Done">Done</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="text-xs rounded-lg border border-border bg-card px-2.5 py-1.5 focus:outline-none">
            <option value="all">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Task Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["Task", "Account", "Owner", "Due", "Priority", "Status", "Source", "Links"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap" style={{ fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.taskId} className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${t.status === "Overdue" ? "bg-red-500/[0.03]" : ""}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: t.status === "Done" ? "#22c55e" : t.status === "Overdue" ? "#ef4444" : "#6b7280" }} />
                      <span className={`${t.status === "Done" ? "line-through text-muted-foreground" : "text-foreground"}`} style={{ fontWeight: 500 }}>{t.taskName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{getAccountName(t.account)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{t.owner}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {t.status === "Overdue" && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      <span style={{ fontWeight: 500, color: t.status === "Overdue" ? "#ef4444" : "inherit" }}>{t.dueDate}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, color: riskColor(t.priority), background: `${riskColor(t.priority)}15` }}>{t.priority}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600, color: statusColor(t.status), background: `${statusColor(t.status)}15` }}>{t.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-muted-foreground">{t.source}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {t.linkedRisk && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600" style={{ fontWeight: 500 }}>{t.linkedRisk}</span>}
                      {t.linkedInitiative && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600" style={{ fontWeight: 500 }}>{t.linkedInitiative}</span>}
                      {t.linkedObjective && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600" style={{ fontWeight: 500 }}>{t.linkedObjective}</span>}
                      {t.linkedMetric && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700" style={{ fontWeight: 500 }}>{t.linkedMetric}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}