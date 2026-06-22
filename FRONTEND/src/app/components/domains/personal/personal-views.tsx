/**
 * Personal Domain Inner Views — Focus Timer, Knowledge Base, Bookmarks
 * Individual productivity, no team context needed.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock, Play, Pause, RotateCcw, Coffee, Target,
  Search, Plus, Star, ExternalLink, Folder, Hash,
  FileText, BookOpen, Globe, Link, X, ChevronRight, Tags,
} from "lucide-react";

/* ═══════════ Focus Timer (Pomodoro) ═══════════ */
export function FocusView() {
  const [mode, setMode] = useState<"focus" | "short-break" | "long-break">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<any>(null);

  const durations = { focus: 25 * 60, "short-break": 5 * 60, "long-break": 15 * 60 };
  const modeColors = { focus: "var(--iw-purple)", "short-break": "var(--iw-success)", "long-break": "var(--iw-blue)" };

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
      if (timeLeft === 0 && running) {
        setRunning(false);
        if (mode === "focus") setSessions(s => s + 1);
      }
    }
    return () => clearInterval(intervalRef.current);
  }, [running, timeLeft, mode]);

  const switchMode = (m: typeof mode) => {
    setMode(m);
    setTimeLeft(durations[m]);
    setRunning(false);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = 1 - timeLeft / durations[mode];

  const todayLog = [
    { task: "Review Q1 alignment", duration: "25min", completed: true },
    { task: "Pipeline analysis", duration: "25min", completed: true },
    { task: "Draft customer report", duration: "25min", completed: true },
    { task: "Break", duration: "5min", completed: true },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full flex flex-col items-center">
      {/* Mode Selector */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
        {([["focus", "Focus", Clock], ["short-break", "Short Break", Coffee], ["long-break", "Long Break", Coffee]] as [typeof mode, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => switchMode(id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${mode === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: mode === id ? 600 : 400 }}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="100" cy="100" r="90" fill="none" stroke={modeColors[mode]} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="text-center z-10">
          <p className="text-5xl font-mono" style={{ fontWeight: 700 }}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
          <p className="text-xs text-muted-foreground capitalize mt-1">{mode.replace("-", " ")}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button onClick={() => setRunning(!running)} className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform" style={{ backgroundColor: modeColors[mode] }}>
          {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
        <button onClick={() => switchMode(mode)} className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 transition-colors">
          <RotateCcw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Sessions today: <span style={{ fontWeight: 700, color: "var(--iw-purple)" }}>{sessions + todayLog.filter(l => l.completed && l.task !== "Break").length}</span></span>
        <span className="text-sm text-muted-foreground">Focus time: <span style={{ fontWeight: 700, color: "var(--iw-purple)" }}>{(sessions + 3) * 25}min</span></span>
      </div>

      {/* Today's Log */}
      <div className="w-full max-w-md">
        <h3 className="text-sm mb-3" style={{ fontWeight: 600 }}>Today's Log</h3>
        <div className="space-y-1.5">
          {todayLog.map((l, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${l.completed ? "bg-[var(--iw-purple)]" : "border-2 border-border"}`}>
                {l.completed && <Clock className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className="flex-1 text-sm">{l.task}</span>
              <span className="text-[10px] text-muted-foreground">{l.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Knowledge Base ═══════════ */
export function KnowledgeView() {
  const [search, setSearch] = useState("");
  const [activeSpace, setActiveSpace] = useState("all");

  const articles = [
    { id: "k1", title: "Spine Architecture Overview", excerpt: "The 4-layer architecture: L0 (Onboarding) → L3 (Spine SSOT) → L2 (AI) → L1 (Workspace)", space: "engineering", tags: ["architecture", "spine"], updated: "1d ago", author: "Arun K." },
    { id: "k2", title: "Customer Health Score Model v3", excerpt: "Product Adoption (40%), Engagement (30%), Value Realization (30%). Updated weights based on Q4 analysis.", space: "cs", tags: ["health-score", "model"], updated: "3d ago", author: "Priya S." },
    { id: "k3", title: "Q1 OKR Framework", excerpt: "Revenue: $500K closed. Health: <5% churn. Expansion: 3 enterprise accounts. NPS: 75+.", space: "strategy", tags: ["okr", "q1"], updated: "1w ago", author: "Arun K." },
    { id: "k4", title: "Integration Playbook — Salesforce", excerpt: "Step-by-step guide for Salesforce connector setup, field mapping, and sync configuration.", space: "engineering", tags: ["integration", "salesforce"], updated: "2w ago", author: "Dev Team" },
    { id: "k5", title: "CS Playbook — At-Risk Recovery", excerpt: "When health drops below 60: 1) Executive sponsor call within 48h, 2) Root cause analysis...", space: "cs", tags: ["playbook", "cs"], updated: "5d ago", author: "Priya S." },
    { id: "k6", title: "Renewal Negotiation Framework", excerpt: "Multi-year discount tiers, expansion clauses, and negotiation templates for enterprise renewals.", space: "sales", tags: ["renewal", "negotiation"], updated: "1w ago", author: "Rajesh M." },
    { id: "k7", title: "Meeting Notes Template", excerpt: "Standard template for customer meetings: agenda, discussion, action items, follow-ups.", space: "templates", tags: ["template", "meetings"], updated: "2w ago", author: "Priya S." },
    { id: "k8", title: "Data Quality Standards", excerpt: "Minimum completeness thresholds: Accounts 85%, Contacts 70%, Deals 90% field coverage.", space: "engineering", tags: ["data-quality", "standards"], updated: "3d ago", author: "Dev Team" },
  ];

  const spaces = ["all", "engineering", "cs", "sales", "strategy", "templates"];
  const spaceColors: Record<string, string> = { engineering: "var(--iw-blue)", cs: "var(--iw-success)", sales: "var(--iw-sales)", strategy: "var(--iw-purple)", templates: "var(--iw-warning)" };

  const filtered = articles.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.excerpt.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeSpace !== "all" && a.space !== activeSpace) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>Knowledge Base</h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search knowledge..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-purple)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Article
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          {spaces.map(s => (
            <button key={s} onClick={() => setActiveSpace(s)} className={`px-2.5 py-1 text-xs rounded-full capitalize ${activeSpace === s ? "bg-[var(--iw-purple)]/15 text-[var(--iw-purple)]" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: activeSpace === s ? 600 : 400 }}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm" style={{ fontWeight: 600 }}>{a.title}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full capitalize flex-shrink-0" style={{ backgroundColor: `${spaceColors[a.space] || "var(--muted-foreground)"}15`, color: spaceColors[a.space], fontWeight: 600 }}>
                  {a.space}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{a.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {a.tags.map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>)}
                </div>
                <span className="text-[10px] text-muted-foreground">{a.updated} · {a.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Bookmarks ═══════════ */
export function BookmarksView() {
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState("all");

  const bookmarks = [
    { id: "b1", title: "Supabase Documentation", url: "https://supabase.com/docs", folder: "engineering", favicon: "🔷", added: "2d ago" },
    { id: "b2", title: "Tailwind CSS v4 Migration", url: "https://tailwindcss.com/docs", folder: "engineering", favicon: "🎨", added: "3d ago" },
    { id: "b3", title: "Customer Success Metrics Guide", url: "https://gainsight.com/metrics", folder: "cs", favicon: "📊", added: "1w ago" },
    { id: "b4", title: "SaaS Revenue Benchmarks 2026", url: "https://openview.com/benchmarks", folder: "strategy", favicon: "📈", added: "1w ago" },
    { id: "b5", title: "Figma Design System Best Practices", url: "https://figma.com/best-practices", folder: "design", favicon: "🎯", added: "2w ago" },
    { id: "b6", title: "APAC Market Analysis", url: "https://internal.wiki/apac", folder: "strategy", favicon: "🌏", added: "3d ago" },
    { id: "b7", title: "Recharts Documentation", url: "https://recharts.org", folder: "engineering", favicon: "📉", added: "5d ago" },
    { id: "b8", title: "SOC2 Compliance Checklist", url: "https://internal.wiki/soc2", folder: "compliance", favicon: "🔒", added: "1w ago" },
  ];

  const folders = ["all", "engineering", "cs", "strategy", "design", "compliance"];

  const filtered = bookmarks.filter(b => {
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeFolder !== "all" && b.folder !== activeFolder) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>Bookmarks</h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search bookmarks..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-purple)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Add Bookmark
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          {folders.map(f => (
            <button key={f} onClick={() => setActiveFolder(f)} className={`px-2.5 py-1 text-xs rounded-full capitalize ${activeFolder === f ? "bg-[var(--iw-purple)]/15 text-[var(--iw-purple)]" : "bg-secondary text-muted-foreground"}`} style={{ fontWeight: activeFolder === f ? 600 : 400 }}>
              <Folder className="w-3 h-3 inline mr-1" />{f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-2">
          {filtered.map(b => (
            <div key={b.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:shadow-sm transition-all cursor-pointer group">
              <span className="text-lg flex-shrink-0">{b.favicon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>{b.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{b.url}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{b.folder}</span>
              <span className="text-[10px] text-muted-foreground">{b.added}</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No bookmarks found</p>}
        </div>
      </div>
    </div>
  );
}
