/**
 * Personal Domain Shell — Individual productivity workspace
 * 8 views: Today, Tasks, Calendar, Notes, Goals, Knowledge, Focus, Bookmarks
 */
import { useState } from "react";
import {
  LayoutDashboard, CheckSquare, Calendar, FileText, Target,
  BookOpen, Clock, Star, Search, Bell,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { PersonalDashboard } from "./dashboard";
import { FocusView, KnowledgeView, BookmarksView } from "./personal-views";
import { useSpine } from "../../spine/spine-client";

const domain = domainConfigs["personal"];

const navItems: NavItem[] = [
  { id: "today", label: "Today", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "tasks", label: "Tasks", icon: <CheckSquare className="w-4 h-4" />, badge: "5" },
  { id: "calendar", label: "Calendar", icon: <Calendar className="w-4 h-4" /> },
  { id: "notes", label: "Notes", icon: <FileText className="w-4 h-4" /> },
  { id: "goals", label: "Goals", icon: <Target className="w-4 h-4" />, section: "Growth" },
  { id: "knowledge", label: "Knowledge", icon: <BookOpen className="w-4 h-4" />, section: "Growth" },
  { id: "focus", label: "Focus Timer", icon: <Clock className="w-4 h-4" />, section: "Tools" },
  { id: "bookmarks", label: "Bookmarks", icon: <Star className="w-4 h-4" />, section: "Tools" },
];

interface PersonalShellProps {
  onSwitchDomain: () => void;
}

export function PersonalShell({ onSwitchDomain }: PersonalShellProps) {
  const [activeView, setActiveView] = useState("today");
  const [collapsed, setCollapsed] = useState(false);
  const spine = useSpine();

  const viewTitles: Record<string, string> = {
    today: "Today", tasks: "Tasks", calendar: "Calendar",
    notes: "Notes", goals: "Goals", knowledge: "Knowledge Base",
    focus: "Focus Timer", bookmarks: "Bookmarks",
  };

  const renderView = () => {
    switch (activeView) {
      case "today": return <PersonalDashboard />;
      case "tasks": return <TasksView />;
      case "calendar": return <CalendarView />;
      case "notes": return <NotesView />;
      case "goals": return <GoalsView />;
      case "knowledge": return <KnowledgeView />;
      case "focus": return <FocusView />;
      case "bookmarks": return <BookmarksView />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="text-3xl">{domain.icon}</div>
              <p className="text-sm text-muted-foreground capitalize">{activeView} — Coming soon</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden font-sans">
      <DomainSidebar
        domain={domain}
        navItems={navItems}
        activeView={activeView}
        onViewChange={setActiveView}
        onBackToConsole={onSwitchDomain}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-shrink-0 h-12 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ fontWeight: 600, color: domain.accentColor }}>
              {domain.icon} {viewTitles[activeView] || "Personal"}
            </span>
            <span className="text-xs text-muted-foreground">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {spine.userName.split(" ")[0]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors relative">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--iw-danger)]" />
            </button>
          </div>
        </div>
        <main className="flex-1 overflow-hidden bg-background">{renderView()}</main>
      </div>
    </div>
  );
}

/* ─── Inline Views (from original Personal domain) ─────────────────────────── */

function TasksView() {
  const tasks = [
    { id: 1, title: "Review Q1 OKR alignment doc", done: false, priority: "high", due: "Today" },
    { id: 2, title: "Prepare customer health report", done: false, priority: "high", due: "Today" },
    { id: 3, title: "Update pipeline forecasting model", done: false, priority: "medium", due: "Tomorrow" },
    { id: 4, title: "Send follow-up to CloudBridge APAC", done: true, priority: "medium", due: "Done" },
    { id: 5, title: "Review new connector architecture doc", done: false, priority: "low", due: "This week" },
    { id: 6, title: "Team sync preparation", done: true, priority: "low", due: "Done" },
    { id: 7, title: "Finalize integration testing plan", done: false, priority: "medium", due: "Wed" },
    { id: 8, title: "Draft Spine SSOT schema updates", done: false, priority: "high", due: "Today" },
    { id: 9, title: "Code review — Auth middleware", done: false, priority: "medium", due: "Thu" },
    { id: 10, title: "Update personal goals tracker", done: true, priority: "low", due: "Done" },
  ];
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const filtered = tasks.filter(t => filter === "all" ? true : filter === "done" ? t.done : !t.done);

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg" style={{ fontWeight: 600 }}>My Tasks</h2>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          {(["all", "active", "done"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs capitalize ${filter === f ? "bg-card shadow-sm" : "text-muted-foreground"}`} style={{ fontWeight: filter === f ? 600 : 400 }}>
              {f} ({tasks.filter(t => f === "all" ? true : f === "done" ? t.done : !t.done).length})
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map(t => (
          <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-all ${t.done ? "opacity-60" : ""}`}>
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${t.done ? "bg-[var(--iw-success)] border-[var(--iw-success)]" : "border-border"}`}>
              {t.done && <CheckSquare className="w-3 h-3 text-white" />}
            </div>
            <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.priority === "high" ? "bg-[var(--iw-danger)]/10 text-[var(--iw-danger)]" : t.priority === "medium" ? "bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: 500 }}>{t.priority}</span>
            <span className="text-[11px] text-muted-foreground w-16 text-right">{t.due}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarView() {
  const events = [
    { time: "09:00", title: "Team Standup", type: "meeting", duration: "30m" },
    { time: "10:00", title: "CloudBridge QBR Prep", type: "work", duration: "1h" },
    { time: "11:30", title: "Product Demo — HealthTech", type: "meeting", duration: "45m" },
    { time: "13:00", title: "Lunch Break", type: "break", duration: "1h" },
    { time: "14:00", title: "Pipeline Review", type: "meeting", duration: "1h" },
    { time: "15:30", title: "Deep Work — Forecasting", type: "focus", duration: "2h" },
    { time: "17:30", title: "Wrap Up & Planning", type: "work", duration: "30m" },
  ];
  const typeColors: Record<string, string> = { meeting: "var(--iw-blue)", work: "var(--iw-purple)", break: "var(--muted-foreground)", focus: "var(--iw-success)" };

  // Generate mini calendar grid
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const calendarDays = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg" style={{ fontWeight: 600 }}>Calendar</h2>
        <span className="text-xs text-muted-foreground">Feb 10, 2026 · IST</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Calendar */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm mb-3" style={{ fontWeight: 600 }}>February 2026</p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="text-[10px] text-muted-foreground py-1" style={{ fontWeight: 600 }}>{d}</span>
            ))}
            {calendarDays.map((d, i) => (
              <button key={i} className={`text-xs py-1.5 rounded-md ${d === today.getDate() ? "bg-[var(--iw-purple)] text-white" : d ? "hover:bg-secondary text-foreground" : ""}`} style={{ fontWeight: d === today.getDate() ? 700 : 400 }}>
                {d || ""}
              </button>
            ))}
          </div>
        </div>

        {/* Day Schedule */}
        <div className="lg:col-span-2">
          <div className="space-y-1.5">
            {events.map((ev, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors group bg-card border border-border">
                <span className="text-sm text-muted-foreground w-12 font-mono">{ev.time}</span>
                <div className="w-1 h-10 rounded-full" style={{ backgroundColor: typeColors[ev.type] || "var(--border)" }} />
                <div className="flex-1">
                  <div className="text-sm" style={{ fontWeight: 500 }}>{ev.title}</div>
                  <div className="text-[10px] text-muted-foreground">{ev.duration} · {ev.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotesView() {
  const [search, setSearch] = useState("");
  const notes = [
    { id: 1, title: "Q1 OKR Alignment", excerpt: "Key objectives for the quarter — revenue targets, customer health improvements, product velocity...", updated: "2h ago", tags: ["okr", "strategy"], pinned: true },
    { id: 2, title: "CloudBridge Migration Notes", excerpt: "Technical requirements for the APAC migration. Staging timeline confirmed for March. Contact: Wei Chen (CTO).", updated: "1d ago", tags: ["account", "technical"], pinned: true },
    { id: 3, title: "Spine Architecture Ideas", excerpt: "Notes on entity resolution approach — corroboration scoring across CRM + support sources. Confidence = f(freshness, coverage, source_count).", updated: "2d ago", tags: ["architecture"], pinned: false },
    { id: 4, title: "Weekly Reflection — W6", excerpt: "Good progress on pipeline visibility. Need to improve response times for CS tickets. Blocked on Zendesk connector auth.", updated: "3d ago", tags: ["personal"], pinned: false },
    { id: 5, title: "RevOps Metrics Research", excerpt: "Magic number = (Net New ARR * 4) / Prior Quarter S&M Spend. Industry benchmark: 0.75+. Our current: 0.82 (elite tier).", updated: "4d ago", tags: ["revops", "metrics"], pinned: false },
    { id: 6, title: "Integration Pattern Notes", excerpt: "Three patterns: Push (webhook), Pull (polling), and Bidirectional (real-time sync). Preference for event-driven where possible.", updated: "1w ago", tags: ["architecture", "integration"], pinned: false },
  ];

  const filtered = notes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()));
  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg" style={{ fontWeight: 600 }}>Notes</h2>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground" />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {pinned.length > 0 && (
          <>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 600 }}>Pinned</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pinned.map(n => <NoteCard key={n.id} note={n} />)}
            </div>
          </>
        )}
        {unpinned.length > 0 && (
          <>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontWeight: 600 }}>All Notes</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unpinned.map(n => <NoteCard key={n.id} note={n} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note }: { note: { id: number; title: string; excerpt: string; updated: string; tags: string[]; pinned: boolean } }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-1">
        <div className="text-sm" style={{ fontWeight: 600 }}>{note.title}</div>
        {note.pinned && <Star className="w-3.5 h-3.5 text-[var(--iw-warning)] fill-[var(--iw-warning)]" />}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{note.excerpt}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {note.tags.map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>)}
        </div>
        <span className="text-[10px] text-muted-foreground">{note.updated}</span>
      </div>
    </div>
  );
}

function GoalsView() {
  const goals = [
    { title: "Close $500K in Q1", progress: 65, target: "$500K", current: "$325K", color: "var(--iw-sales)", milestones: ["$100K milestone hit", "$250K milestone hit"] },
    { title: "Reduce churn to <5%", progress: 72, target: "<5%", current: "6.2%", color: "var(--iw-success)", milestones: ["Improved onboarding flow", "CS playbook launched"] },
    { title: "Onboard 3 enterprise accounts", progress: 33, target: "3", current: "1", color: "var(--iw-blue)", milestones: ["CloudBridge signed"] },
    { title: "Improve NPS to 75+", progress: 96, target: "75+", current: "72", color: "var(--iw-purple)", milestones: ["Support response time improved", "Product feedback loop established"] },
    { title: "Ship Spine v2 architecture", progress: 40, target: "v2.0", current: "In progress", color: "var(--iw-warning)", milestones: ["Entity schema finalized", "Provenance tracking live"] },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg" style={{ fontWeight: 600 }}>My Goals</h2>
        <span className="text-xs text-muted-foreground">Q1 2026 · {goals.filter(g => g.progress >= 80).length}/{goals.length} on track</span>
      </div>
      <div className="space-y-4">
        {goals.map((g, i) => (
          <div key={i} className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ fontWeight: 600 }}>{g.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${g.color}15`, color: g.color, fontWeight: 700 }}>{g.progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all" style={{ width: `${g.progress}%`, backgroundColor: g.color }} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span>Current: <span style={{ fontWeight: 600 }}>{g.current}</span></span>
              <span>Target: <span style={{ fontWeight: 600 }}>{g.target}</span></span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {g.milestones.map((m, j) => (
                <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--iw-success)]/10 text-[var(--iw-success)] flex items-center gap-1" style={{ fontWeight: 500 }}>
                  <CheckSquare className="w-2.5 h-2.5" /> {m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}