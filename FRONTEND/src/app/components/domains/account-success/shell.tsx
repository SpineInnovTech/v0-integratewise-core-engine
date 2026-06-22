/**
 * Account Success / CSM Intelligence Shell — Full L1 Workspace + L2 Intelligence
 * 16 entity-table views organized into sidebar sections.
 * "Work-first, intelligence-optional" — L2 never pollutes L1.
 */
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, HeartPulse, Users, Briefcase, CheckSquare,
  Calendar, FileText, FolderOpen, Search, Bell, Plus, Sparkles,
  Brain, Command, RefreshCw, AlertTriangle, Settings,
  Target, Layers, Zap, Wifi, Activity, Rocket, ShieldAlert,
  UserCircle, MessageSquare, ClipboardList, Lightbulb,
  TrendingUp,
} from "lucide-react";
import { DomainSidebar, type NavItem } from "../domain-sidebar";
import { domainConfigs } from "../domain-types";
import { AccountSuccessDashboard } from "./dashboard";
import { IntelligenceOverlay } from "./intelligence-overlay";
import { useSpine } from "../../spine/spine-client";

// ─── New entity-table views ──────────────────────────────────────────────────
import { AccountMasterView } from "./views/account-master-view";
import { PeopleTeamView } from "./views/people-team-view";
import { BusinessContextView } from "./views/business-context-view";
import { StrategicObjectivesView } from "./views/strategic-objectives-view";
import { CapabilitiesView } from "./views/capabilities-view";
import { ValueStreamsView } from "./views/value-streams-view";
import { ApiPortfolioView } from "./views/api-portfolio-view";
import { PlatformHealthView } from "./views/platform-health-view";
import { InitiativesView } from "./views/initiatives-view";
import { RiskRegisterView } from "./views/risk-register-view";
import { StakeholderOutcomesView } from "./views/stakeholder-outcomes-view";
import { EngagementLogView } from "./views/engagement-log-view";
import { SuccessPlansView } from "./views/success-plans-view";
import { TaskManagerView } from "./views/task-manager-view";
import { InsightsView } from "./views/insights-view";
import { ProductClientView } from "./views/product-client-view";
import { CompanyGrowthView } from "./views/company-growth-view";

const domain = domainConfigs["account-success"];

const navItems: NavItem[] = [
  // Executive Lenses
  { id: "dashboard", label: "Home", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "product-client", label: "Product Intelligence", icon: <Sparkles className="w-4 h-4" />, section: "Executive" },
  { id: "company-growth", label: "Company Growth", icon: <TrendingUp className="w-4 h-4" />, section: "Executive" },
  // Core
  { id: "account-master", label: "Account Master", icon: <HeartPulse className="w-4 h-4" />, badge: "8", section: "Core" },
  { id: "people-team", label: "People & Team", icon: <Users className="w-4 h-4" />, section: "Core" },
  // Strategy
  { id: "business-context", label: "Business Context", icon: <Briefcase className="w-4 h-4" />, section: "Strategy" },
  { id: "strategic-objectives", label: "Objectives", icon: <Target className="w-4 h-4" />, section: "Strategy", badge: "5" },
  { id: "stakeholder-outcomes", label: "Outcomes", icon: <UserCircle className="w-4 h-4" />, section: "Strategy" },
  { id: "success-plans", label: "Success Plans", icon: <ClipboardList className="w-4 h-4" />, section: "Strategy" },
  // Capabilities
  { id: "capabilities", label: "Capabilities", icon: <Layers className="w-4 h-4" />, section: "Capabilities" },
  { id: "value-streams", label: "Value Streams", icon: <Zap className="w-4 h-4" />, section: "Capabilities" },
  { id: "api-portfolio", label: "API Portfolio", icon: <Wifi className="w-4 h-4" />, section: "Capabilities", badge: "7" },
  // Operations
  { id: "platform-health", label: "Health Metrics", icon: <Activity className="w-4 h-4" />, section: "Operations" },
  { id: "initiatives", label: "Initiatives", icon: <Rocket className="w-4 h-4" />, section: "Operations" },
  { id: "tasks", label: "Tasks", icon: <CheckSquare className="w-4 h-4" />, section: "Operations", badge: "3" },
  // Risk & Insights
  { id: "risk-register", label: "Risk Register", icon: <ShieldAlert className="w-4 h-4" />, section: "Risk & Insights", badge: "2" },
  { id: "engagement-log", label: "Engagement Log", icon: <MessageSquare className="w-4 h-4" />, section: "Risk & Insights" },
  { id: "insights", label: "Insights", icon: <Lightbulb className="w-4 h-4" />, section: "Risk & Insights", badge: "3" },
];

interface AccountSuccessShellProps {
  onSwitchDomain: () => void;
}

export function AccountSuccessShell({ onSwitchDomain }: AccountSuccessShellProps) {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const spine = useSpine();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "i") {
        e.preventDefault();
        setIntelligenceOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <AccountSuccessDashboard />;
      case "account-master": return <AccountMasterView />;
      case "people-team": return <PeopleTeamView />;
      case "business-context": return <BusinessContextView />;
      case "strategic-objectives": return <StrategicObjectivesView />;
      case "stakeholder-outcomes": return <StakeholderOutcomesView />;
      case "success-plans": return <SuccessPlansView />;
      case "capabilities": return <CapabilitiesView />;
      case "value-streams": return <ValueStreamsView />;
      case "api-portfolio": return <ApiPortfolioView />;
      case "platform-health": return <PlatformHealthView />;
      case "initiatives": return <InitiativesView />;
      case "tasks": return <TaskManagerView />;
      case "risk-register": return <RiskRegisterView />;
      case "engagement-log": return <EngagementLogView />;
      case "insights": return <InsightsView />;
      case "product-client": return <ProductClientView />;
      case "company-growth": return <CompanyGrowthView />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="text-3xl">{domain.icon}</div>
              <p className="text-sm text-muted-foreground capitalize">{activeView.replace(/-/g, " ")} — Coming soon</p>
            </div>
          </div>
        );
    }
  };

  const viewTitles: Record<string, string> = {
    dashboard: "Home",
    "account-master": "Account Master",
    "people-team": "People & Team",
    "business-context": "Business Context",
    "strategic-objectives": "Strategic Objectives",
    "stakeholder-outcomes": "Stakeholder Outcomes",
    "success-plans": "Success Plans",
    capabilities: "MuleSoft Capabilities",
    "value-streams": "Value Streams",
    "api-portfolio": "API Portfolio",
    "platform-health": "Platform Health Metrics",
    initiatives: "Initiatives",
    tasks: "Task Manager",
    "risk-register": "Risk Register",
    "engagement-log": "Engagement Log",
    insights: "Generated Insights",
    "product-client": "Product Intelligence",
    "company-growth": "Company Growth",
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
        {/* Top Bar */}
        <div className="flex-shrink-0 h-12 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ fontWeight: 600, color: domain.accentColor }}>
              {domain.icon} {viewTitles[activeView] || "Account Success"}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {spine.connectedApps.length} data sources · SSOT live · 16 entity tables
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Command Palette trigger */}
            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors text-xs"
            >
              <Command className="w-3 h-3" />
              <span className="hidden sm:inline">Search</span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-card text-muted-foreground ml-1 hidden sm:inline">⌘K</span>
            </button>
            {/* Quick Add */}
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors relative">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--iw-danger)]" />
            </button>
            {/* L2 Intelligence trigger — discrete, NOT prominent */}
            <button
              onClick={() => setIntelligenceOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors group"
              title="Intelligence (⌘⇧I)"
            >
              <Brain className="w-4 h-4 text-muted-foreground group-hover:text-[var(--iw-purple)]" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-background">
          {renderView()}
        </main>
      </div>

      {/* L2 Intelligence Overlay — cognitive layer, never inline */}
      <IntelligenceOverlay
        isOpen={intelligenceOpen}
        onClose={() => setIntelligenceOpen(false)}
      />

      {/* Floating L2 trigger (Sparkle FAB) */}
      <button
        onClick={() => setIntelligenceOpen(true)}
        className="fixed bottom-5 right-5 z-30 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        style={{
          background: "linear-gradient(135deg, #00BCD4, #9C27B0)",
          boxShadow: "0 4px 20px rgba(0, 188, 212, 0.3)",
        }}
        title="Open Intelligence (⌘⇧I)"
      >
        <Sparkles className="w-4.5 h-4.5 text-white" />
      </button>

      {/* Command Palette */}
      {commandOpen && <CSMCommandPalette onClose={() => setCommandOpen(false)} onNavigate={setActiveView} />}
    </div>
  );
}

/* ─── Command Palette (⌘K) ─── */
function CSMCommandPalette({ onClose, onNavigate }: { onClose: () => void; onNavigate: (view: string) => void }) {
  const [query, setQuery] = useState("");

  const pages = [
    { id: "dashboard", label: "Home Dashboard", icon: "🏠", category: "Core" },
    { id: "account-master", label: "Account Master", icon: "💚", category: "Core" },
    { id: "people-team", label: "People & Team", icon: "👥", category: "Core" },
    { id: "business-context", label: "Business Context", icon: "🏢", category: "Strategy" },
    { id: "strategic-objectives", label: "Strategic Objectives", icon: "🎯", category: "Strategy" },
    { id: "stakeholder-outcomes", label: "Stakeholder Outcomes", icon: "👤", category: "Strategy" },
    { id: "success-plans", label: "Success Plans", icon: "📋", category: "Strategy" },
    { id: "capabilities", label: "MuleSoft Capabilities", icon: "🔧", category: "Capabilities" },
    { id: "value-streams", label: "Value Streams", icon: "⚡", category: "Capabilities" },
    { id: "api-portfolio", label: "API Portfolio", icon: "📡", category: "Capabilities" },
    { id: "platform-health", label: "Platform Health Metrics", icon: "📊", category: "Operations" },
    { id: "initiatives", label: "Initiatives", icon: "🚀", category: "Operations" },
    { id: "tasks", label: "Task Manager", icon: "✅", category: "Operations" },
    { id: "risk-register", label: "Risk Register", icon: "🛡️", category: "Risk & Insights" },
    { id: "engagement-log", label: "Engagement Log", icon: "💬", category: "Risk & Insights" },
    { id: "insights", label: "Generated Insights", icon: "💡", category: "Risk & Insights" },
    { id: "product-client", label: "Product Intelligence", icon: "✨", category: "Executive" },
    { id: "company-growth", label: "Company Growth", icon: "📈", category: "Executive" },
  ];

  const actions = [
    { id: "new-task", label: "Create New Task", icon: "➕", category: "Actions" },
    { id: "new-engagement", label: "Log Engagement", icon: "📝", category: "Actions" },
    { id: "risk-alert", label: "Flag Risk", icon: "⚠️", category: "Actions" },
    { id: "search-accounts", label: "Search Accounts", icon: "🔍", category: "Actions" },
  ];

  const allItems = [...pages, ...actions];
  const filtered = query
    ? allItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const categories = [...new Set(filtered.map(i => i.category))];

  const handleSelect = (id: string) => {
    if (pages.find(p => p.id === id)) {
      onNavigate(id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pages, actions, accounts..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1.5" style={{ fontWeight: 600 }}>{cat}</p>
              {filtered.filter(i => i.category === cat).map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-secondary transition-colors"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm" style={{ fontWeight: 500 }}>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No results for "{query}"</p>
          )}
        </div>
      </div>
    </div>
  );
}