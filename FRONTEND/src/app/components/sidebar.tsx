import { useState } from "react";
import {
  MessageSquare, Brain, BookOpen, Zap, Bot, Activity,
  GitBranch, Settings, LogOut, Plug, CreditCard, User,
  ChevronDown, ChevronRight, Sparkles, ChevronsUpDown,
  Home, TrendingUp, AlertTriangle, Users, Building2,
  DollarSign, FileText, BarChart3, Factory, Briefcase,
  HeartPulse, ShieldCheck, Target, Calendar, Search,
  Layers, RefreshCw, MessagesSquare, Timer, Play, Server, Kanban, Star
} from "lucide-react";
import { type CTXEnum, type L1Module } from "./spine/types";
import { type TwinSection } from "./twin-ui/twin-shell";
import { useSpine } from "./spine/spine-client";
import { useGoalsSafe } from "./goal-framework/goal-context";
import { Logo, LogoMark } from "./landing/logo";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeModule: L1Module;
  onModuleChange: (module: L1Module) => void;
  activeCtx: CTXEnum;
  onCtxChange: (ctx: CTXEnum) => void;
  modules: L1Module[];
  allowedWorkspaces?: CTXEnum[];
  darkMode: boolean;
  collapsed: boolean;
  onToggleDarkMode: () => void;
  onToggleCollapse: () => void;
  onOpenCommandPalette: () => void;
  onOpenIntelligence: () => void;
  onLogout?: () => void;
  activeTwinSection: TwinSection | null;
  onTwinSectionChange: (section: TwinSection) => void;
}

// ─── Context config ───────────────────────────────────────────────────────────

const CTX_CONFIG: Record<CTXEnum, { label: string; icon: string; accent: string }> = {
  CTX_CS:        { label: "Customer Success",    icon: "🚀", accent: "var(--iw-blue)" },
  CTX_SALES:     { label: "Sales",               icon: "🎯", accent: "var(--iw-success)" },
  CTX_SUPPORT:   { label: "Support",             icon: "🎧", accent: "var(--iw-blue-light)" },
  CTX_PM:        { label: "Projects",            icon: "📁", accent: "var(--iw-purple)" },
  CTX_MARKETING: { label: "Marketing",           icon: "📣", accent: "var(--iw-pink)" },
  CTX_BIZOPS:    { label: "Business Ops",        icon: "🌏", accent: "var(--iw-blue)" },
  CTX_TECH:      { label: "Engineering",         icon: "💻", accent: "var(--iw-blue-light)" },
  CTX_HR:        { label: "People",              icon: "👥", accent: "var(--iw-warning)" },
  CTX_FINANCE:   { label: "Finance",             icon: "💰", accent: "var(--iw-success)" },
  CTX_LEGAL:     { label: "Legal",               icon: "⚖️", accent: "var(--iw-purple)" },
};

// ─── Domain nav — role-named, not entity-typed ────────────────────────────────
// Each domain gets 4-5 focused navigation items that reflect what the
// person actually does, not a list of database entity types.

interface DomainNavItem {
  module: L1Module;
  label: string;        // role-specific name, not entity type
  icon: any;
  note?: string;        // tiny descriptor
}

const DOMAIN_NAV: Record<CTXEnum, DomainNavItem[]> = {
  CTX_CS: [
    { module: "Home",      label: "Today",         icon: Home,          note: "Morning brief" },
    { module: "Accounts",  label: "Accounts",      icon: Building2,     note: "Your portfolio" },
    { module: "Risks",     label: "At-Risk",        icon: AlertTriangle, note: "Needs attention" },
    { module: "Expansion", label: "Expansion",      icon: TrendingUp,    note: "Growth signals" },
    { module: "Docs",      label: "Playbooks",      icon: BookOpen,      note: "Knowledge" },
  ],
  CTX_SALES: [
    { module: "Home",     label: "Today",           icon: Home,          note: "Morning brief" },
    { module: "Pipeline", label: "Pipeline",         icon: DollarSign,    note: "Active deals" },
    { module: "Accounts", label: "Accounts",         icon: Building2,     note: "Your book" },
    { module: "Meetings", label: "Activity",         icon: MessageSquare, note: "Calls & meetings" },
    { module: "Docs",     label: "Proposals",        icon: FileText,      note: "Docs & quotes" },
  ],
  CTX_SUPPORT: [
    { module: "Home",            label: "Today",       icon: Home,          note: "Queue & SLA" },
    { module: "Tasks",           label: "Tickets",      icon: AlertTriangle, note: "Open tickets" },
    { module: "Accounts",        label: "Customers",    icon: Users,         note: "Account view" },
    { module: "Knowledge Space", label: "Knowledge",    icon: BookOpen,      note: "KB articles" },
  ],
  CTX_PM: [
    { module: "Home",     label: "Today",             icon: Home,          note: "Priorities" },
    { module: "Projects", label: "Projects",           icon: Layers,        note: "Active work" },
    { module: "Tasks",    label: "Tasks",              icon: Target,        note: "Assignments" },
    { module: "Meetings", label: "Reviews",            icon: Calendar,      note: "Standups & retros" },
    { module: "Docs",     label: "Docs",               icon: FileText,      note: "Specs & notes" },
  ],
  CTX_MARKETING: [
    { module: "Home",      label: "Today",            icon: Home,           note: "MQLs & signals" },
    { module: "Analytics", label: "Performance",       icon: BarChart3,      note: "Campaigns & ROI" },
    { module: "Contacts",  label: "Audience",          icon: Users,          note: "Leads & segments" },
    { module: "Docs",      label: "Content",           icon: FileText,       note: "Briefs & assets" },
  ],
  CTX_BIZOPS: [
    { module: "Home",       label: "Today",        icon: Home,       note: "Morning brief · signals" },
    { module: "Accounts",   label: "Accounts",     icon: Building2,  note: "All accounts · health" },
    { module: "Pipeline",   label: "Pipeline",     icon: TrendingUp, note: "Deals · forecast" },
    { module: "Analytics",  label: "Metrics",      icon: BarChart3,  note: "Cross-team · NRR · ops" },
    { module: "Projects",   label: "Initiatives",  icon: Layers,     note: "Cross-functional work" },
  ],
  CTX_TECH: [
    { module: "Home",            label: "Today",          icon: Home,       note: "Incidents & ops" },
    { module: "Projects",        label: "Projects",       icon: Layers,     note: "Sprints & repos" },
    { module: "Tasks",           label: "Issues",         icon: Target,     note: "Open items" },
    { module: "Ingress",          label: "Ingress",         icon: Layers,     note: "Proof · Lineage · Audit" },
    { module: "Docs",            label: "Docs",           icon: FileText,   note: "Runbooks & specs" },
  ],
  CTX_HR: [
    { module: "Home",     label: "Today",               icon: Home,         note: "Hiring & reviews" },
    { module: "Team",     label: "People",               icon: Users,        note: "Headcount" },
    { module: "Tasks",    label: "Actions",              icon: Target,       note: "Pending tasks" },
    { module: "Meetings", label: "Interviews",           icon: Calendar,     note: "Scheduled" },
    { module: "Docs",     label: "Policies",             icon: FileText,     note: "HR docs" },
  ],
  CTX_FINANCE: [
    { module: "Home",      label: "Today",             icon: Home,          note: "AR & budget" },
    { module: "Accounts",  label: "Accounts",           icon: Building2,     note: "Revenue view" },
    { module: "Analytics", label: "Financials",         icon: BarChart3,     note: "P&L & forecasts" },
    { module: "Docs",      label: "Reports",            icon: FileText,      note: "Board & internal" },
  ],
  CTX_LEGAL: [
    { module: "Home",       label: "Today",            icon: Home,           note: "Reviews due" },
    { module: "Docs",       label: "Contracts",         icon: FileText,       note: "Active & expiring" },
    { module: "Tasks",      label: "Reviews",           icon: ShieldCheck,    note: "Pending sign-off" },
    { module: "Analytics",  label: "Risk Register",     icon: AlertTriangle,  note: "Open items" },
  ],
};

// ─── Twin items shown in sidebar ─────────────────────────────────────────────

const TWIN_ITEMS: { id: TwinSection; icon: any; label: string }[] = [
  { id: "Chat",          icon: MessageSquare, label: "Chat" },
  { id: "Conversations", icon: MessagesSquare, label: "Conversations" },
  { id: "Sessions",      icon: Timer,         label: "Sessions" },
  { id: "Memory",        icon: Brain,         label: "Working Memory" },
  { id: "Knowledge",     icon: BookOpen,      label: "Knowledge" },
  { id: "Bench",         icon: Kanban,        label: "Task Bench" },
  { id: "Agents",        icon: Bot,           label: "Agents" },
  { id: "Workflows",     icon: GitBranch,     label: "Workflows" },
  { id: "Executions",    icon: Play,          label: "Executions" },
  { id: "Observability", icon: Activity,      label: "Observability" },
];

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function Sidebar({
  activeModule, onModuleChange, activeCtx, onCtxChange,
  modules, allowedWorkspaces, collapsed, onOpenCommandPalette, onOpenIntelligence,
  onLogout, activeTwinSection, onTwinSectionChange,
}: SidebarProps) {
  const [ctxOpen, setCtxOpen] = useState(false);
  const [twinOpen, setTwinOpen] = useState(false);
  const spine = useSpine();
  const goalsCtx = useGoalsSafe();
  const ctx = CTX_CONFIG[activeCtx];
  const domainNav = DOMAIN_NAV[activeCtx] || DOMAIN_NAV.CTX_BIZOPS;

  // Filter to modules that actually exist in the current context
  const available = new Set(modules);
  const visibleNav = domainNav.filter(n => available.has(n.module));
  const workspaces = allowedWorkspaces || Object.keys(CTX_CONFIG) as CTXEnum[];

  const NavItem = ({ item }: { item: DomainNavItem }) => {
    const isActive = activeModule === item.module && !activeTwinSection;
    return (
      <button
        onClick={() => onModuleChange(item.module)}
        title={item.label}
        className={`w-full flex items-center transition-all rounded-lg ${collapsed ? "justify-center p-2" : "px-2.5 py-2 gap-2.5"}`}
        style={{
          background: isActive ? `${ctx.accent}14` : "transparent",
          borderLeft: isActive && !collapsed ? `2px solid ${ctx.accent}` : "2px solid transparent",
          color: isActive ? ctx.accent : "var(--muted-foreground)",
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <item.icon className="w-3.5 h-3.5 shrink-0" />
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[12px] truncate" style={{ fontWeight: isActive ? 600 : 500 }}>{item.label}</div>
            {item.note && !isActive && (
              <div className="text-[9px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>{item.note}</div>
            )}
          </div>
        )}
      </button>
    );
  };

  const TwinNavItem = ({ item }: { item: typeof TWIN_ITEMS[0] }) => {
    const isActive = activeTwinSection === item.id;
    return (
      <button
        onClick={() => onTwinSectionChange(item.id)}
        title={item.label}
        className={`w-full flex items-center transition-all rounded-lg ${collapsed ? "justify-center p-2" : "px-2.5 py-1.5 gap-2.5"}`}
        style={{
          background: isActive ? "rgba(66,86,171,0.1)" : "transparent",
          color: isActive ? "var(--iw-blue)" : "var(--muted-foreground)",
        }}
        onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(66,86,171,0.06)"; (e.currentTarget as HTMLElement).style.color = "var(--iw-blue)"; } }}
        onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; } }}
      >
        <item.icon className="w-3.5 h-3.5 shrink-0" />
        {!collapsed && <span className="text-[12px] truncate" style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
      </button>
    );
  };

  return (
    <div className={`h-full flex flex-col border-r transition-all duration-300 ${collapsed ? "w-[52px]" : "w-[220px]"}`}
      style={{ borderColor: "var(--border)", background: "var(--card)" }}>

      {/* Brand */}
      <div className={`flex items-center border-b shrink-0 ${collapsed ? "justify-center py-3" : "px-3 py-3 gap-2.5"}`}
        style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
        {collapsed
          ? <LogoMark size={22} />
          : <>
              <Logo width={22} />
              <span className="text-sm tracking-tight" style={{ fontWeight: 700, color: "var(--iw-blue-900)" }}>
                Integrate<span style={{ color: "var(--iw-pink)" }}>Wise</span>
              </span>
            </>}
      </div>

      {/* Context switcher */}
      <div className="px-2 py-2 border-b shrink-0 relative" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => !collapsed && setCtxOpen(!ctxOpen)}
          className={`w-full flex items-center rounded-xl transition-all ${collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-2"}`}
          style={{ background: "var(--secondary)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={{ background: ctx.accent, color: "white" }}>
            {ctx.icon}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[11px] truncate" style={{ fontWeight: 600, color: "var(--foreground)" }}>{ctx.label}</div>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                  {goalsCtx?.orgType || "ORG"} · Workbench
                </div>
              </div>
              <ChevronsUpDown className="w-3 h-3 shrink-0" style={{ color: "var(--muted-foreground)" }} />
            </>
          )}
        </button>

        {ctxOpen && !collapsed && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setCtxOpen(false)} />
            <div className="absolute top-full left-2 right-2 mt-1 z-50 rounded-xl shadow-xl overflow-hidden py-1"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {workspaces.map(key => {
                const c = CTX_CONFIG[key];
                return (
                  <button key={key} onClick={() => { onCtxChange(key); setCtxOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all"
                    style={{ background: key === activeCtx ? "var(--secondary)" : "transparent" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = key === activeCtx ? "var(--secondary)" : "transparent"; }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0"
                      style={{ background: c.accent, color: "white" }}>
                      {c.icon}
                    </div>
                    <span className="text-xs" style={{ fontWeight: key === activeCtx ? 600 : 400, color: "var(--foreground)" }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Capability Framework Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-none">

        {/* ── Search ── */}
        {!collapsed && (
          <div className="px-2 pt-2 pb-1">
            <button onClick={onOpenCommandPalette}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
              <Search className="w-3 h-3 shrink-0" />
              <span className="text-[11px] flex-1 text-left">Search or jump…</span>
              <span className="text-[9px] opacity-40 font-mono">⌘K</span>
            </button>
          </div>
        )}

        {/* ── PERSONAL ── Always visible, user's own layer */}
        {!collapsed && (
          <div className="px-2 pt-2 pb-1">
            <p className="text-[9px] uppercase tracking-[0.14em] px-1 mb-1.5" style={{ fontWeight: 800, color: "var(--muted-foreground)" }}>Personal</p>
            <div className="space-y-0.5">
              {[
                { label: "My Day",      icon: Home,          module: "Home" as L1Module },
                { label: "My Tasks",    icon: Target,        module: "Tasks" as L1Module },
                { label: "Calendar",    icon: Calendar,      module: "Calendar" as L1Module },
              ].map(item => {
                const isActive = activeModule === item.module && !activeTwinSection && !available.has("Home" as any);
                // For Home/My Day we treat it specially — it's always the morning brief
                const isHomeActive = item.module === "Home" && activeModule === "Home" && !activeTwinSection;
                const active = isHomeActive || (item.module !== "Home" && activeModule === item.module && !activeTwinSection);
                return (
                  <button key={item.label} onClick={() => onModuleChange(item.module)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all"
                    style={{
                      background: active ? "var(--secondary)" : "transparent",
                      borderLeft: active ? "2px solid var(--muted-foreground)" : "2px solid transparent",
                      color: active ? "var(--foreground)" : "var(--muted-foreground)",
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[12px]" style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DEPARTMENT (projection) ── */}
        <div className="px-2 pt-2 pb-1">
          {!collapsed && (
            <div className="flex items-center gap-1.5 px-1 mb-1.5">
              <div className="w-1 h-3 rounded-full shrink-0" style={{ background: ctx.accent }} />
              <span className="text-[9px] uppercase tracking-[0.14em]" style={{ fontWeight: 800, color: ctx.accent }}>{ctx.label}</span>
            </div>
          )}
          <div className="space-y-0.5">
            {visibleNav.filter(n => n.module !== "Home").map(item => <NavItem key={item.module} item={item} />)}
          </div>
        </div>

        {/* ── INTELLIGENCE ── Awareness layer */}
        {!collapsed && (
          <div className="px-2 pt-1 pb-1">
            <p className="text-[9px] uppercase tracking-[0.14em] px-1 mb-1.5" style={{ fontWeight: 800, color: "var(--iw-warning)" }}>Intelligence</p>
            <div className="space-y-0.5">
              {[
                { label: "Signals",    icon: Zap,        action: () => onOpenIntelligence(), note: "What's happening" },
                { label: "Patterns",   icon: BarChart3,   action: () => onOpenIntelligence(), note: "What it means" },
                { label: "Decisions",  icon: ShieldCheck, action: () => onOpenIntelligence(), note: "What to do · HITL" },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-left"
                  style={{ color: "var(--muted-foreground)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px]" style={{ fontWeight: 500 }}>{item.label}</div>
                    <div className="text-[9px]" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>{item.note}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TWIN ── AI capability layer */}
        <div className="px-2 pt-1 pb-1">
          {!collapsed ? (
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(66,86,171,0.04)", border: "1px solid rgba(66,86,171,0.1)" }}>
              <button onClick={() => setTwinOpen(!twinOpen)}
                className="w-full flex items-center gap-2 px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: "var(--iw-success)" }} />
                <span className="text-[9px] uppercase tracking-[0.14em] flex-1 text-left" style={{ fontWeight: 800, color: "var(--iw-blue)" }}>Twin</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(66,86,171,0.12)", color: "var(--iw-blue)" }}>Live</span>
                {twinOpen ? <ChevronDown className="w-3 h-3 ml-1" style={{ color: "var(--iw-blue)" }} /> : <ChevronRight className="w-3 h-3 ml-1" style={{ color: "var(--iw-blue)" }} />}
              </button>
              {twinOpen && (
                <div className="pb-1.5 px-1.5 space-y-0.5">
                  <p className="text-[8px] uppercase tracking-widest px-2 pt-1 pb-0.5" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Think</p>
                  {TWIN_ITEMS.slice(0, 3).map(item => <TwinNavItem key={item.id} item={item} />)}
                  <p className="text-[8px] uppercase tracking-widest px-2 pt-1.5 pb-0.5" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Do</p>
                  {TWIN_ITEMS.slice(3, 5).map(item => <TwinNavItem key={item.id} item={item} />)}
                  <TwinNavItem key="Bench" item={{ id: "Bench" as any, icon: Kanban, label: "Task Bench" }} />
                  <p className="text-[8px] uppercase tracking-widest px-2 pt-1.5 pb-0.5" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Run</p>
                  {TWIN_ITEMS.slice(5).map(item => <TwinNavItem key={item.id} item={item} />)}
                </div>
              )}
              {!twinOpen && (
                <div className="px-3 pb-2">
                  <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>Chat · Memory · Task Bench · Agents · {TWIN_ITEMS.length} surfaces</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              {TWIN_ITEMS.slice(0, 3).map(item => <TwinNavItem key={item.id} item={item} />)}
            </div>
          )}
        </div>

        {/* ── FRAMEWORK CAPABILITIES ── Fixed layers always present */}
        {!collapsed && (
          <div className="px-2 pt-1 pb-2 space-y-0.5">
            <p className="text-[9px] uppercase tracking-[0.14em] px-1 mb-1.5 pt-1" style={{ fontWeight: 800, color: "var(--muted-foreground)" }}>Framework</p>
            {([
              // Continuity, Governance, Ingress → all users
              // Operations → super_admin only (injected by workspace-shell)
              { module: "Continuity" as L1Module, label: "Continuity",  icon: Brain,       note: "Memory · Org knowledge" },
              { module: "Governance" as L1Module, label: "Governance",  icon: ShieldCheck, note: "Your Twin · Approvals · Audit" },
              { module: "Ingress" as L1Module,    label: "Ingress",     icon: Layers,      note: "Connectors · Schema · Evidence" },
              { module: "Operations" as L1Module, label: "Operations",    icon: Server,      note: "super_admin · Platform ops" },
              { module: "Admin" as L1Module,      label: "Admin",         icon: Star,        note: "Release gate · RBAC · Tenants" },
            ] as (DomainNavItem & { note: string })[]).filter(n => available.has(n.module)).map(item => {
              const isActive = activeModule === item.module && !activeTwinSection;
              return (
                <button key={item.module} onClick={() => onModuleChange(item.module)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-left"
                  style={{
                    background: isActive ? "var(--secondary)" : "transparent",
                    borderLeft: isActive ? "2px solid var(--iw-blue-900)" : "2px solid transparent",
                    color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate" style={{ fontWeight: isActive ? 700 : 500 }}>{item.label}</p>
                    <p className="text-[9px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>{item.note}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom strip */}
      <div className="border-t shrink-0" style={{ borderColor: "var(--border)" }}>

        {/* Cognitive Overlay shortcut — collapsed or always */}
        {collapsed && (
          <div className="flex justify-center py-2">
            <button onClick={onOpenIntelligence}
              className="p-2 rounded-xl transition-all"
              style={{ background: "rgba(212,103,128,0.08)", color: "var(--iw-pink)" }}>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {!collapsed && (
          <div className="px-3 py-2 flex items-center justify-between">
            <button onClick={onOpenIntelligence}
              className="flex items-center gap-1.5 text-[10px] transition-all"
              style={{ color: "var(--iw-pink)", fontWeight: 600 }}>
              <Sparkles className="w-3 h-3" />
              Overlay ⌘J
            </button>
            <button onClick={() => onModuleChange("Settings" as L1Module)}
              className="p-1 rounded-md transition-all"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* User */}
        <div className={`flex items-center px-2 pb-2 gap-2 ${collapsed ? "justify-center" : ""}`}>
          <button onClick={() => onModuleChange("Profile")}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] shrink-0"
            style={{ background: ctx.accent, fontWeight: 700 }}>
            {spine.userName?.charAt(0) || "U"}
          </button>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[11px] truncate" style={{ fontWeight: 600, color: "var(--foreground)" }}>{spine.userName || "User"}</div>
              <div className="text-[9px] truncate uppercase" style={{ color: "var(--muted-foreground)" }}>{spine.role || "Member"}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={onLogout} className="p-1 rounded-md transition-all shrink-0"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--iw-danger)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
              <LogOut className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
