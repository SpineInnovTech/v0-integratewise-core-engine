import { useState } from "react";
import { ClipboardList, Phone, Mail, Video, Calendar, CheckCircle, Clock, AlertTriangle, Plus, Search, User, Building2 } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "call" | "email" | "meeting" | "task" | "note";
  title: string;
  description: string;
  contact: string;
  company: string;
  datetime: string;
  duration?: string;
  status: "completed" | "scheduled" | "overdue" | "cancelled";
  source: string;
  owner: string;
}

const activities: ActivityItem[] = [
  { id: "a1", type: "meeting", title: "TechServe QBR Prep", description: "Internal prep for quarterly review", contact: "Ravi Sharma", company: "TechServe India", datetime: "Today, 11:00 AM", duration: "45 min", status: "scheduled", source: "Google Cal", owner: "Arun K." },
  { id: "a2", type: "call", title: "Discovery Call", description: "Initial discovery for data integration needs", contact: "Sarah Mitchell", company: "DataVault Australia", datetime: "Today, 2:00 PM", duration: "30 min", status: "scheduled", source: "Zoom", owner: "Anjali P." },
  { id: "a3", type: "email", title: "Follow-up: Pricing Proposal", description: "Sent updated pricing with enterprise discount", contact: "Mei Lin Chen", company: "CloudBridge APAC", datetime: "Today, 9:30 AM", status: "completed", source: "Gmail", owner: "Arun K." },
  { id: "a4", type: "task", title: "Prepare renewal analysis", description: "Compile usage data for renewal discussion", contact: "Suresh Iyer", company: "FinanceFlow Solutions", datetime: "Yesterday", status: "overdue", source: "Manual", owner: "Rajesh M." },
  { id: "a5", type: "meeting", title: "Product Demo", description: "Full product demo with IT team", contact: "Arun Tiwari", company: "RetailNest Pte Ltd", datetime: "Yesterday, 3:00 PM", duration: "1h", status: "completed", source: "Zoom", owner: "Vikram R." },
  { id: "a6", type: "call", title: "Check-in Call", description: "Monthly check-in on integration health", contact: "Dr. Priya Reddy", company: "HealthTech Innovations", datetime: "Feb 7, 10:00 AM", duration: "15 min", status: "completed", source: "Phone", owner: "Priya S." },
  { id: "a7", type: "email", title: "Contract Sent", description: "Enterprise agreement v3.2 sent for review", contact: "Ravi Sharma", company: "TechServe India", datetime: "Feb 6", status: "completed", source: "Gmail", owner: "Vikram R." },
  { id: "a8", type: "note", title: "Meeting Notes: LogiPrime", description: "Discussed renewal concerns, competitor mentions", contact: "Rajiv Kumar", company: "LogiPrime Corp", datetime: "Feb 5", status: "completed", source: "Manual", owner: "Vikram R." },
  { id: "a9", type: "meeting", title: "Onboarding Kickoff", description: "Kickoff meeting for new account onboarding", contact: "Dr. Priya Reddy", company: "HealthTech Innovations", datetime: "Tomorrow, 10:00 AM", duration: "1h", status: "scheduled", source: "Google Cal", owner: "Anjali P." },
  { id: "a10", type: "task", title: "Send case study", description: "Share TechServe case study with prospect", contact: "Arun Tiwari", company: "RetailNest Pte Ltd", datetime: "Tomorrow", status: "scheduled", source: "Manual", owner: "Vikram R." },
];

const typeConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  call: { color: "var(--iw-success)", icon: Phone },
  email: { color: "var(--iw-blue)", icon: Mail },
  meeting: { color: "var(--iw-purple)", icon: Video },
  task: { color: "var(--iw-warning)", icon: CheckCircle },
  note: { color: "var(--muted-foreground)", icon: ClipboardList },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  completed: { color: "var(--iw-success)", label: "Completed" },
  scheduled: { color: "var(--iw-blue)", label: "Scheduled" },
  overdue: { color: "var(--iw-danger)", label: "Overdue" },
  cancelled: { color: "var(--muted-foreground)", label: "Cancelled" },
};

export function ActivitiesView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = activities.filter((a) => {
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !a.contact.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    today: activities.filter((a) => a.datetime.includes("Today")).length,
    overdue: activities.filter((a) => a.status === "overdue").length,
    completed: activities.filter((a) => a.status === "completed").length,
    scheduled: activities.filter((a) => a.status === "scheduled").length,
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Activities & Tasks</h2>
          <p className="text-sm text-muted-foreground mt-1">Track calls, emails, meetings, and tasks across all deals</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> Log Activity
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Today</div><div className="text-lg" style={{ fontWeight: 600 }}>{stats.today}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Overdue</div><div className="text-lg" style={{ fontWeight: 600, color: stats.overdue > 0 ? "var(--iw-danger)" : undefined }}>{stats.overdue}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Completed</div><div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-success)" }}>{stats.completed}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Upcoming</div><div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-blue)" }}>{stats.scheduled}</div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search activities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-1 p-0.5 bg-secondary rounded-md">
          <button onClick={() => setTypeFilter("all")} className={`px-3 py-1 rounded text-[11px] transition-all ${typeFilter === "all" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>All</button>
          {Object.entries(typeConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button key={key} onClick={() => setTypeFilter(key)} className={`px-2 py-1 rounded text-[11px] transition-all ${typeFilter === key ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((activity) => {
          const tCfg = typeConfig[activity.type];
          const sCfg = statusConfig[activity.status];
          const Icon = tCfg.icon;
          return (
            <div key={activity.id} className={`bg-card border rounded-lg p-4 flex items-start gap-3 hover:shadow-sm transition-all ${activity.status === "overdue" ? "border-[var(--iw-danger)]/30" : "border-border"}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tCfg.color}15` }}>
                <Icon className="w-4 h-4" style={{ color: tCfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm" style={{ fontWeight: 500 }}>{activity.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${sCfg.color}15`, color: sCfg.color, fontWeight: 500 }}>{sCfg.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{activity.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {activity.contact}</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {activity.company}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {activity.datetime}{activity.duration && ` (${activity.duration})`}</span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary font-mono">{activity.source}</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground flex-shrink-0">{activity.owner}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
