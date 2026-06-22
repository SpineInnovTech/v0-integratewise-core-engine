import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { IntelligenceOverlay } from "./intelligence-overlay";
import { CommandPalette } from "./command-palette";
import { type CTXEnum, type L1Module, type IntelligenceAlert } from "./spine/types";
import { useSpine } from "./spine/spine-client";
import { L1ModuleContent } from "./l1-module-content";
import { IntegrationsHub } from "./integrations-hub";
import { SettingsPage } from "./settings-page";
import { SubscriptionsPage } from "./subscriptions-page";
import { ProfilePage } from "./profile-page";
import { TenantAdmin } from "./admin/tenant-admin";
import { OperationsSurface } from "./admin/operations-surface";
import { AdminDashboard } from "./admin/admin-dashboard";
import { TwinShell, type TwinSection } from "./twin-ui/twin-shell";
import { AlertTriangle, X, ChevronRight, Sparkles } from "lucide-react";

// ─── Module map per context ───────────────────────────────────────────────────

// Framework modules available to ALL users regardless of context
// Governance = everyone governs their own Twin's executions
// Ingress = everyone manages their own connectors
// Continuity = everyone has their own memory layer
const FRAMEWORK_MODULES: L1Module[] = ["Continuity", "Governance", "Ingress"];

// Operations is super_admin only — not in any base module map
// It is injected dynamically based on role in WorkspaceShell

const CTX_MODULES: Record<CTXEnum, L1Module[]> = {
  CTX_CS:        ["Home", "Accounts", "Contacts", "Meetings", "Docs", "Tasks", "Calendar", "Risks", "Expansion", "Analytics", ...FRAMEWORK_MODULES],
  CTX_SALES:     ["Home", "Pipeline", "Accounts", "Contacts", "Meetings", "Tasks", "Calendar", "Docs", "Analytics", ...FRAMEWORK_MODULES],
  CTX_SUPPORT:   ["Home", "Accounts", "Contacts", "Tasks", "Calendar", "Knowledge Space", "Analytics", ...FRAMEWORK_MODULES],
  CTX_PM:        ["Home", "Projects", "Tasks", "Docs", "Meetings", "Calendar", "Knowledge Space", "Analytics", ...FRAMEWORK_MODULES],
  CTX_MARKETING: ["Home", "Analytics", "Contacts", "Docs", "Calendar", ...FRAMEWORK_MODULES],
  CTX_BIZOPS:    ["Home", "Projects", "Accounts", "Contacts", "Meetings", "Docs", "Tasks", "Calendar", "Notes", "Knowledge Space", "Team", "Pipeline", "Risks", "Expansion", "Analytics", ...FRAMEWORK_MODULES],
  CTX_TECH:      ["Home", "Projects", "Tasks", "Docs", "Knowledge Space", "Analytics", ...FRAMEWORK_MODULES],
  CTX_HR:        ["Home", "Team", "Tasks", "Docs", "Meetings", "Analytics", ...FRAMEWORK_MODULES],
  CTX_FINANCE:   ["Home", "Accounts", "Docs", "Analytics", ...FRAMEWORK_MODULES],
  CTX_LEGAL:     ["Home", "Docs", "Tasks", "Analytics", ...FRAMEWORK_MODULES],
};

// ─── Intelligence Alert Banner ────────────────────────────────────────────────

const DEMO_ALERTS: IntelligenceAlert[] = [
  {
    id: "a1", severity: "critical",
    title: "Renewal Risk — FinanceFlow Solutions",
    message: "3 P1 tickets, champion silent for 12 days, payment failed twice. Renewal in 29 days.",
    source: "Salesforce + Zendesk + Stripe",
    timestamp: "2 min ago", actionLabel: "View Account",
  },
  {
    id: "a2", severity: "warning",
    title: "Schema Drift Detected — Jira Integration",
    message: "2 fields changed upstream. Auto-correction proposed and ready for review.",
    source: "Jira → Data Spine",
    timestamp: "8 min ago", actionLabel: "Review",
  },
];

function IntelligenceAlertBanner({ alerts, onDismiss, onAction }: {
  alerts: IntelligenceAlert[];
  onDismiss: (id: string) => void;
  onAction: (alert: IntelligenceAlert) => void;
}) {
  const active = alerts.filter(a => !a.dismissed);
  if (active.length === 0) return null;
  const alert = active[0];
  const alertStyle = {
    critical: { background: "var(--iw-danger-light)", borderColor: "var(--iw-danger)",  color: "var(--iw-danger)" },
    warning:  { background: "var(--iw-warning-light)", borderColor: "var(--iw-warning)", color: "var(--iw-warning)" },
    info:     { background: "var(--iw-blue-50)",       borderColor: "var(--iw-blue-100)", color: "var(--iw-blue)" },
  }[alert.severity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="border-b px-4 py-2 flex items-center gap-3 shrink-0"
        style={alertStyle}
      >
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: alertStyle.color }} />
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: alertStyle.color }} />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="text-xs font-bold truncate" style={{ color: alertStyle.color }}>{alert.title}</span>
          <span className="hidden sm:inline text-[10px] opacity-70 truncate" style={{ color: alertStyle.color }}>{alert.message}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] opacity-50">{alert.timestamp}</span>
          {active.length > 1 && (
            <span className="text-[9px] font-bold opacity-60">+{active.length - 1} more</span>
          )}
          {alert.actionLabel && (
            <button
              onClick={() => onAction(alert)}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/60 hover:bg-white/80 transition-all flex items-center gap-1"
            >
              {alert.actionLabel} <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}
          <button onClick={() => onDismiss(alert.id)} className="p-0.5 rounded hover:bg-white/40">
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── WorkspaceShell ───────────────────────────────────────────────────────────

interface WorkspaceShellProps {
  children?: ReactNode;
  userName?: string;
  userRole?: string;
  activeCtx?: CTXEnum;
  allowedWorkspaces?: CTXEnum[];
  onLogout?: () => void;
}

export function WorkspaceShell({ children, userName, userRole, activeCtx: initialCtx, allowedWorkspaces, onLogout }: WorkspaceShellProps) {
  const spine = useSpine();
  const [activeCtx, setActiveCtx] = useState<CTXEnum>(initialCtx || "CTX_BIZOPS");
  const [activeModule, setActiveModule] = useState<L1Module>("Home");
  const [activeTwinSection, setActiveTwinSection] = useState<TwinSection | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [darkMode] = useState(false);
  const [alerts, setAlerts] = useState(DEMO_ALERTS);

  useEffect(() => {
    if (initialCtx) setActiveCtx(initialCtx);
  }, [initialCtx]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCommandPaletteOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") { e.preventDefault(); setIntelligenceOpen(prev => !prev); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Inject Operations for super_admin only — not for regular users
  const isSuperAdmin = spine.role === "super_admin" || allowedWorkspaces?.length === 10;
  const baseModules = CTX_MODULES[activeCtx] || CTX_MODULES.CTX_BIZOPS;
  const currentModules: L1Module[] = isSuperAdmin
    ? [...baseModules, "Operations" as L1Module, "Admin" as L1Module]
    : baseModules;

  const dismissAlert = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  const handleAlertAction = (alert: IntelligenceAlert) => {
    if (alert.title.includes("FinanceFlow")) setActiveModule("Accounts");
    else setIntelligenceOpen(true);
    dismissAlert(alert.id);
  };

  const handleModuleChange = (mod: L1Module) => {
    setActiveModule(mod);
    setActiveTwinSection(null); // exit twin mode when workspace module selected
  };

  const handleTwinSectionChange = (section: TwinSection) => {
    setActiveTwinSection(section);
  };

  const renderContent = () => {
    if (activeTwinSection) {
      return (
        <TwinShell
          section={activeTwinSection}
          onSectionChange={setActiveTwinSection}
          activeCtx={activeCtx}
        />
      );
    }
    switch (activeModule) {
      case "Integrations":  return <IntegrationsHub />;
      case "Settings":      return <TenantAdmin />;
      case "Operations":    return <OperationsSurface />;
      case "Admin":         return <AdminDashboard />;
      case "Subscriptions": return <SubscriptionsPage />;
      case "Profile":       return <ProfilePage />;
      default:              return children || <L1ModuleContent module={activeModule} activeCtx={activeCtx} />;
    }
  };

  return (
    <div className={`h-screen w-screen flex overflow-hidden font-sans ${darkMode ? "dark" : ""} bg-background text-foreground`}>
      <Sidebar
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        activeCtx={activeCtx}
        onCtxChange={(ctx) => { setActiveCtx(ctx); setActiveModule("Home"); setActiveTwinSection(null); }}
        modules={currentModules}
        allowedWorkspaces={allowedWorkspaces}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenIntelligence={() => setIntelligenceOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => {}}
        onLogout={onLogout}
        activeTwinSection={activeTwinSection}
        onTwinSectionChange={handleTwinSectionChange}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopBar
          activeModule={activeTwinSection ? `Twin · ${activeTwinSection}` as any : activeModule as any}
          activeView={"" as any}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onNavigate={(m) => handleModuleChange(m as L1Module)}
        />

        <IntelligenceAlertBanner alerts={alerts} onDismiss={dismissAlert} onAction={handleAlertAction} />

        <main className="flex-1 overflow-hidden relative">
          {renderContent()}
          <IntelligenceOverlay
            isOpen={intelligenceOpen}
            onClose={() => setIntelligenceOpen(false)}
            activeCtx={activeCtx}
          />
        </main>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(m) => handleModuleChange(m as L1Module)}
      />
    </div>
  );
}
