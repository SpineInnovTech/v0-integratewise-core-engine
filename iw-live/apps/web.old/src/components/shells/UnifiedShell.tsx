/**
 * UnifiedShell — New taxonomy shell (Option C: parallel route, zero regression)
 *
 * Serves at /app/unified/* alongside the existing /app/* shell.
 * Kill switch: delete this file + remove the AppShell branch.
 *
 * Nav taxonomy:
 *   PERSONAL → DEPT PROJECTION → AWARENESS → TWIN → MEMORY → ADMIN
 *
 * 3 Interaction Modes:
 *   Operator (default) — data-first, no twin substrate visible
 *   Think (L2 Active)  — inline Twin Substrate + Awareness section active
 *   Open Twin (L3)     — launches twin.integratewise.ai in new tab
 *
 * Content rendering: reuses existing ContentRouter (zero rewrite of 35+ modules)
 * Auth: inherits from AppShell provider stack (SpineProvider, AuthProvider, etc.)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  BarChart3,
  Scale,
  LayoutDashboard,
  Database,
  Activity,
  Calendar,
  TrendingUp,
  Bell,
  Sparkles,
  Zap,
  ExternalLink,
  BookOpen,
  Brain,
  FileCheck,
  Settings,
  Users,
  Lock,
  Search,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Bot,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import { LogoMark } from "@/components/common/brand/logo";
import { CommandPalette } from "@/components/l1/navigation/command-palette";
import { NotificationCenter } from "@/components/l1/notifications/notification-center";
import { L2DrawerProvider } from "@/components/l2/cognitive/l2-drawer-animated";
import { ContentRouter } from "@/components/l1/workspace/content-router";
import { openTwinWorkbench } from "@/lib/twin-handoff";
import { apiFetch } from "@/lib/api-client";
import { getDomainConfig } from "@/components/l1/workspace/workspace-config";
import type { Domain } from "@/components/l1/workspace/workspace-config";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/core/auth/auth-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShellMode = "operator" | "think" | "open-twin";

interface UnifiedShellProps {
  domain: Domain;
  userName: string;
  department?: string;
  userRole?: string;
  onLogout?: () => void;
  useCase?: "personal" | "work" | "business";
}

// ─── Nav Taxonomy ─────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  external?: boolean;
  highlight?: boolean;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  awarenessSection?: boolean;
}

function buildNavSections(domain: Domain, signalCount: number, mode: ShellMode): NavSection[] {
  const domainConfig = getDomainConfig(domain);

  const deptItems: Record<string, NavItem[]> = {
    CUSTOMER_SUCCESS: [
      {
        id: "dash",
        label: "Dashboard",
        icon: <LayoutDashboard className="w-3.5 h-3.5" />,
        path: "/unified/work/dashboard",
      },
      {
        id: "accounts",
        label: "Accounts",
        icon: <Database className="w-3.5 h-3.5" />,
        path: "/unified/work/accounts",
      },
      {
        id: "activity",
        label: "Activity",
        icon: <Activity className="w-3.5 h-3.5" />,
        path: "/unified/work/activity",
      },
      {
        id: "planning",
        label: "Planning",
        icon: <Calendar className="w-3.5 h-3.5" />,
        path: "/unified/work/planning",
      },
      {
        id: "performance",
        label: "Performance",
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        path: "/unified/work/performance",
      },
    ],
    SALES: [
      {
        id: "dash",
        label: "Dashboard",
        icon: <LayoutDashboard className="w-3.5 h-3.5" />,
        path: "/unified/work/dashboard",
      },
      {
        id: "pipeline",
        label: "Pipeline",
        icon: <Database className="w-3.5 h-3.5" />,
        path: "/unified/work/pipeline",
      },
      {
        id: "activity",
        label: "Activity",
        icon: <Activity className="w-3.5 h-3.5" />,
        path: "/unified/work/activity",
      },
      {
        id: "forecasting",
        label: "Forecasting",
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        path: "/unified/work/forecasting",
      },
    ],
    BIZOPS: [
      {
        id: "dash",
        label: "Dashboard",
        icon: <LayoutDashboard className="w-3.5 h-3.5" />,
        path: "/unified/work/dashboard",
      },
      {
        id: "entities",
        label: "Entities",
        icon: <Database className="w-3.5 h-3.5" />,
        path: "/unified/work/accounts",
      },
      {
        id: "activity",
        label: "Activity",
        icon: <Activity className="w-3.5 h-3.5" />,
        path: "/unified/work/activity",
      },
      {
        id: "planning",
        label: "Planning",
        icon: <Calendar className="w-3.5 h-3.5" />,
        path: "/unified/work/planning",
      },
      {
        id: "performance",
        label: "Performance",
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        path: "/unified/work/performance",
      },
    ],
  };

  const dept = deptItems[domain] || deptItems.BIZOPS;

  return [
    {
      id: "personal",
      label: "Personal",
      items: [
        {
          id: "myday",
          label: "My Day",
          icon: <Sun className="w-3.5 h-3.5" />,
          path: "/unified/personal/day",
        },
        {
          id: "mypatterns",
          label: "My Patterns",
          icon: <BarChart3 className="w-3.5 h-3.5" />,
          path: "/unified/personal/patterns",
        },
        {
          id: "mydecisions",
          label: "My Decisions",
          icon: <Scale className="w-3.5 h-3.5" />,
          path: "/unified/personal/decisions",
        },
      ],
    },
    {
      id: "dept",
      label: domainConfig.label,
      items: dept,
    },
    {
      id: "awareness",
      label: "Awareness",
      awarenessSection: true,
      items: [
        {
          id: "headsup",
          label: "Heads Up",
          icon: <Bell className="w-3.5 h-3.5" />,
          path: "/unified/awareness/signals",
          badge: signalCount > 0 ? Math.min(signalCount, 9) : undefined,
          highlight: mode === "think",
        },
        {
          id: "patterns",
          label: "Patterns",
          icon: <Brain className="w-3.5 h-3.5" />,
          path: "/unified/awareness/patterns",
        },
        {
          id: "decide",
          label: "Decide",
          icon: <Zap className="w-3.5 h-3.5" />,
          path: "/unified/awareness/decide",
          highlight: mode === "think",
        },
      ],
    },
    {
      id: "twin",
      label: "Twin",
      items: [
        {
          id: "open-twin",
          label: "Open Twin",
          icon: <Bot className="w-3.5 h-3.5" />,
          path: "/unified/twin",
          external: true,
        },
      ],
    },
    {
      id: "memory",
      label: "Memory",
      items: [
        {
          id: "knowledge",
          label: "What We Know",
          icon: <BookOpen className="w-3.5 h-3.5" />,
          path: "/unified/memory/knowledge",
        },
        {
          id: "mem-patterns",
          label: "My Patterns",
          icon: <Sparkles className="w-3.5 h-3.5" />,
          path: "/unified/memory/patterns",
        },
        {
          id: "decisions",
          label: "Decisions",
          icon: <FileCheck className="w-3.5 h-3.5" />,
          path: "/unified/memory/decisions",
        },
      ],
    },
    {
      id: "admin",
      label: "Admin",
      items: [
        {
          id: "settings",
          label: "Settings",
          icon: <Settings className="w-3.5 h-3.5" />,
          path: "/unified/admin/settings",
        },
        {
          id: "team",
          label: "Team",
          icon: <Users className="w-3.5 h-3.5" />,
          path: "/unified/admin/team",
        },
        {
          id: "access",
          label: "Access",
          icon: <Lock className="w-3.5 h-3.5" />,
          path: "/unified/admin/access",
        },
      ],
    },
  ];
}

// ─── Unified path → ContentRouter module mapping ──────────────────────────────

function resolveModuleId(unifiedPath: string, domain: Domain): string {
  const segment = unifiedPath.replace(/^\/unified\//, "");

  const map: Record<string, Record<string, string>> = {
    CUSTOMER_SUCCESS: {
      "work/dashboard": "dashboard",
      "work/accounts": "accounts",
      "work/activity": "touchpoints",
      "work/planning": "renewals",
      "work/performance": "health-scores",
      "work/pipeline": "accounts",
      "personal/day": "cs-today",
      "personal/patterns": "insights",
      "personal/decisions": "cs-decisions",
      "awareness/signals": "bi",
      "awareness/patterns": "insights",
      "awareness/decide": "cs-decisions",
      "memory/knowledge": "docs",
      "memory/patterns": "insights",
      "memory/decisions": "cs-decisions",
      "admin/settings": "settings",
      "admin/team": "contacts",
      "admin/access": "fabric-admin",
    },
    SALES: {
      "work/dashboard": "dashboard",
      "work/pipeline": "pipeline",
      "work/activity": "activities",
      "work/forecasting": "forecasting",
      "personal/day": "sales-today",
      "personal/patterns": "sales-analytics",
      "personal/decisions": "sales-decisions",
      "awareness/signals": "bi",
      "awareness/patterns": "sales-analytics",
      "awareness/decide": "sales-decisions",
      "memory/knowledge": "docs",
      "memory/patterns": "sales-analytics",
      "memory/decisions": "sales-decisions",
      "admin/settings": "settings",
      "admin/access": "fabric-admin",
    },
    BIZOPS: {
      "work/dashboard": "dashboard",
      "work/accounts": "accounts",
      "work/activity": "tasks",
      "work/planning": "projects",
      "work/performance": "metrics",
      "personal/day": "bizops-today",
      "personal/patterns": "analytics",
      "personal/decisions": "bizops-decisions",
      "awareness/signals": "bi",
      "awareness/patterns": "analytics",
      "awareness/decide": "bizops-decisions",
      "memory/knowledge": "knowledge",
      "memory/patterns": "analytics",
      "memory/decisions": "bizops-decisions",
      "admin/settings": "settings",
      "admin/team": "contacts",
      "admin/access": "fabric-admin",
    },
  };

  const domainMap = map[domain] || map.BIZOPS;
  return domainMap[segment] || "dashboard";
}

// ─── Twin Substrate Component ─────────────────────────────────────────────────

function TwinSubstrate({ domain, onDismiss }: { domain: Domain; onDismiss: () => void }) {
  const proposals = [
    {
      id: "t1",
      entity: "Acme Corp",
      score: 7,
      signal: "Usage dropped 40% in last 14 days",
      draft:
        "Acme Corp's renewal risk is 7/10. Their usage dropped 40% in the last 14 days. I drafted an outreach playbook.",
      actions: ["Review Playbook", "Schedule Call"],
    },
    {
      id: "t2",
      entity: "Vantage Telecom",
      score: 9,
      signal: "Champion departed, renewal in 11 days",
      draft:
        "Vantage Telecom is at critical risk. Champion left last week. Renewal in 11 days. Recommend executive escalation.",
      actions: ["Escalate Now", "Draft EBR"],
    },
  ];

  const [activeProposal, setActiveProposal] = useState(0);
  const p = proposals[activeProposal];

  return (
    <div className="border-t border-[--iw-rule]">
      {/* Section Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-[--iw-paper-warm]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[--iw-forest-bright] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[--iw-forest]">
            L2 / L3 Twin Substrate
          </span>
          <span className="text-[10px] bg-[--iw-gold-pale] text-[--iw-gold] px-1.5 py-0.5 rounded font-bold">
            {proposals.length} proposals
          </span>
        </div>
        <div className="flex items-center gap-1">
          {proposals.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveProposal(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === activeProposal ? "bg-[--iw-forest]" : "bg-[--iw-rule]"
              )}
            />
          ))}
        </div>
      </div>

      {/* Twin Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="p-4 bg-card"
        >
          <div className="flex items-start gap-3">
            {/* Bot avatar */}
            <div className="w-8 h-8 rounded-full bg-[--iw-forest] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[--iw-paper]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-[--iw-forest]">Twin</span>
                <span className="text-[10px] text-[--iw-gold] font-semibold border border-[--iw-gold-pale] bg-[--iw-gold-pale] px-1.5 py-0.5 rounded">
                  {p.entity} — Risk {p.score}/10
                </span>
              </div>
              <p className="text-[12.5px] text-[--iw-ink] leading-relaxed mb-3">{p.draft}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {p.actions.map((action) => (
                  <button
                    key={action}
                    className="px-3 py-1.5 text-[11px] font-semibold bg-[--iw-forest] text-[--iw-paper] rounded-lg hover:bg-[--iw-forest-mid] transition-colors"
                  >
                    {action}
                  </button>
                ))}
                <button
                  onClick={onDismiss}
                  className="px-3 py-1.5 text-[11px] font-semibold border border-[--iw-rule] text-[--iw-ink] rounded-lg hover:bg-[--iw-paper-warm] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Recent Decisions */}
      <div className="px-4 pb-4 bg-card border-t border-border">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[--iw-rule] mt-3 mb-2">
          Recent Decisions
        </div>
        <div className="space-y-1.5">
          {[
            { label: "Approved: Q3 pricing change", date: "Jun 8", status: "approved" },
            { label: "Rejected: Acme Corp discount", date: "Jun 7", status: "rejected" },
            { label: "Pending: Enterprise tier rollout", date: "Jun 10", status: "pending" },
          ].map((d) => (
            <div key={d.label} className="flex items-center gap-2 text-[11.5px]">
              {d.status === "approved" && (
                <CheckCircle className="w-3 h-3 text-green-600 shrink-0" />
              )}
              {d.status === "rejected" && <X className="w-3 h-3 text-red-600 shrink-0" />}
              {d.status === "pending" && <Clock className="w-3 h-3 text-iw-gold shrink-0" />}
              <span className="text-[--iw-ink] flex-1">{d.label}</span>
              <span className="text-[--iw-rule] text-[10px]">{d.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Performance Tracker ──────────────────────────────────────────────────────

function PerformanceTracker() {
  const metrics = [
    { label: "Pipeline velocity", value: "↑ 12%", trend: "up" },
    { label: "Churn risk", value: "Medium", trend: "neutral" },
    { label: "NRR", value: "104%", trend: "up" },
    { label: "Health score", value: "7.3 / 10", trend: "neutral" },
  ];

  return (
    <div className="mx-6 mb-4 rounded-xl border border-[--iw-rule] bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-[--iw-rule-light]">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[--iw-forest]">
          Performance Tracker
        </span>
      </div>
      <div className="grid grid-cols-4 divide-x divide-[--iw-rule-light]">
        {metrics.map((m) => (
          <div key={m.label} className="px-4 py-3">
            <div className="text-[10px] text-[--iw-rule] font-medium mb-0.5">{m.label}</div>
            <div
              className={cn(
                "text-[13px] font-bold",
                m.trend === "up" ? "text-[--iw-forest-bright]" : "text-[--iw-ink]"
              )}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatCards() {
  const cards = [
    {
      label: "Accounts",
      value: "24",
      sub: "active",
      icon: <Database className="w-4 h-4" />,
      color: "--iw-forest",
    },
    {
      label: "Health",
      value: "3",
      sub: "at risk",
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "--iw-gold",
    },
    {
      label: "Renewals",
      value: "2",
      sub: "upcoming",
      icon: <RefreshCw className="w-4 h-4" />,
      color: "--iw-slate",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 px-6 mb-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-[--iw-rule] bg-card p-4 flex items-start gap-3 hover:border-[--iw-rule] hover:shadow-sm transition-all cursor-pointer group"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: `color-mix(in srgb, var(${c.color}) 12%, white)`,
              color: `var(${c.color})`,
            }}
          >
            {c.icon}
          </div>
          <div>
            <div className="text-[22px] font-bold text-[--iw-ink] leading-none">{c.value}</div>
            <div className="text-[11px] text-[--iw-rule] mt-0.5">
              {c.label}: {c.sub}
            </div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[--iw-rule] ml-auto opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
        </div>
      ))}
    </div>
  );
}

// ─── Nav Section Component ────────────────────────────────────────────────────

function NavSection({
  section,
  activePath,
  mode,
  onNavigate,
  onTwinOpen,
}: {
  section: NavSection;
  activePath: string;
  mode: ShellMode;
  onNavigate: (path: string) => void;
  onTwinOpen: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const isAwareness = section.awarenessSection;
  const isActive = isAwareness && mode === "think";

  return (
    <div className={cn("mb-1", isActive && "")}>
      {/* Section Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-1.5 group",
          "text-[9px] font-bold uppercase tracking-widest transition-colors",
          isActive ? "text-[--iw-forest]" : "text-[--iw-forest-mid]/60 hover:text-[--iw-forest-mid]"
        )}
      >
        <span className="flex items-center gap-1.5">
          {section.label}
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[--iw-gold] animate-pulse" />}
        </span>
        {collapsed ? (
          <ChevronRight className="w-3 h-3 opacity-40" />
        ) : (
          <Minus className="w-3 h-3 opacity-20" />
        )}
      </button>

      {/* Items */}
      {!collapsed && (
        <div className="space-y-0.5 px-2 mb-1">
          {section.items.map((item) => {
            const isItemActive = activePath === item.path;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.external) {
                    onTwinOpen();
                  } else {
                    onNavigate(item.path);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] transition-all duration-150 group",
                  isItemActive
                    ? "bg-[--iw-paper] text-[--iw-forest] font-semibold shadow-sm border border-[--iw-rule-light]"
                    : item.highlight
                      ? "text-[--iw-paper] bg-[--iw-forest-mid] font-medium hover:bg-[--iw-forest]"
                      : "text-[--iw-paper-deep]/80 font-medium hover:bg-[--iw-forest-mid]/50 hover:text-[--iw-paper]"
                )}
              >
                <span
                  className={cn(
                    "shrink-0",
                    isItemActive
                      ? "text-[--iw-forest]"
                      : item.highlight
                        ? "text-[--iw-gold]"
                        : "opacity-60"
                  )}
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[9px] font-bold bg-[--iw-gold] text-[--iw-forest] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
                {item.external && (
                  <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Mode Badge ───────────────────────────────────────────────────────────────

function ModeSwitcher({ mode, onMode }: { mode: ShellMode; onMode: (m: ShellMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 bg-[--iw-paper-deep] rounded-lg p-0.5">
      {(["operator", "think"] as ShellMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onMode(m)}
          className={cn(
            "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
            mode === m
              ? "bg-card text-[--iw-forest] shadow-sm"
              : "text-[--iw-rule] hover:text-[--iw-ink]"
          )}
        >
          {m === "operator" ? "Operator" : "Think"}
        </button>
      ))}
    </div>
  );
}

// ─── Live Status Badge ────────────────────────────────────────────────────────

function LiveBadge({ healthy }: { healthy: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
        healthy
          ? "bg-iw-forest/10 text-iw-forest border-iw-forest/20"
          : "bg-iw-gold/10 text-iw-gold border-iw-gold/20"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full animate-pulse",
          healthy ? "bg-iw-forest-bright" : "bg-iw-gold"
        )}
      />
      {healthy ? "Live" : "Degraded"}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UnifiedShell({
  domain,
  userName,
  department,
  userRole,
  onLogout,
  useCase = "work",
}: UnifiedShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active path from URL
  const activePath = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/app/unified")) return p.replace("/app", "");
    return "/unified/work/dashboard";
  }, [location.pathname]);

  const [mode, setMode] = useState<ShellMode>("operator");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [signalCount, setSignalCount] = useState(0);
  const [twinSubstrateDismissed, setTwinSubstrateDismissed] = useState(false);

  // Keyboard shortcut ⌘K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Fetch signal count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await apiFetch<{ unread_count?: number; signal_count?: number }>(
          "/api/v1/intelligence/signals?limit=1",
          {},
          "UnifiedShell.SignalCount"
        );
        setSignalCount(res.unread_count ?? res.signal_count ?? 0);
      } catch {
        /* silent — show 0 */
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      const appPath = `/app${path}`;
      if (location.pathname !== appPath) {
        navigate(appPath, { replace: false });
      }
    },
    [navigate, location.pathname]
  );

  const handleTwinOpen = useCallback(() => {
    openTwinWorkbench({ domain, source: "sidebar" });
  }, [domain]);

  const handleModeChange = useCallback(
    (m: ShellMode) => {
      if (m === "open-twin") {
        handleTwinOpen();
        return;
      }
      setMode(m);
      if (m === "think") setTwinSubstrateDismissed(false);
    },
    [handleTwinOpen]
  );

  const navSections = useMemo(
    () => buildNavSections(domain, signalCount, mode),
    [domain, signalCount, mode]
  );

  const domainConfig = getDomainConfig(domain);
  const moduleId = resolveModuleId(activePath, domain);
  const isDashboard = activePath.endsWith("/dashboard") || activePath === "/unified/work/dashboard";
  const showTwinSubstrate = mode === "think" && !twinSubstrateDismissed;

  return (
    <L2DrawerProvider>
      <div
        className="flex h-screen w-screen overflow-hidden bg-[--iw-paper]"
        style={{ fontFamily: "var(--font-iw-sans)" }}
      >
        {/* ─── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className="w-[220px] shrink-0 flex flex-col bg-[--iw-forest] border-r border-[--iw-forest-mid] overflow-hidden z-20">
          {/* Logo */}
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[--iw-forest-mid] shrink-0">
            <LogoMark size={22} className="text-[--iw-gold]" />
            <span className="text-[14px] font-bold text-[--iw-paper] tracking-tight">
              IntegrateWise
            </span>
          </div>

          {/* Nav sections */}
          <div className="flex-1 overflow-y-auto pt-3 pb-4 scrollbar-thin">
            {navSections.map((section) => (
              <NavSection
                key={section.id}
                section={section}
                activePath={activePath}
                mode={mode}
                onNavigate={handleNavigate}
                onTwinOpen={handleTwinOpen}
              />
            ))}
          </div>

          {/* Bottom profile block */}
          <div className="p-3 border-t border-[--iw-forest-mid] shrink-0">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-full bg-[--iw-gold] flex items-center justify-center text-[11px] font-bold text-[--iw-forest] shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-[--iw-paper] truncate">
                  {userName}
                </div>
                <div className="text-[9px] text-[--iw-forest-mid] uppercase tracking-wider font-bold truncate">
                  {department || userRole || "Operator"}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-[10px] font-bold text-[--iw-forest-mid] hover:text-[--iw-paper-deep] transition-colors uppercase tracking-wider w-full"
            >
              <LogOut className="w-3 h-3" />
              Sign out
            </button>
          </div>
        </aside>

        {/* ─── MAIN AREA ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <header className="h-14 shrink-0 flex items-center gap-4 px-6 border-b border-[--iw-rule] bg-card z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-[--iw-rule]">
              <span>{domainConfig.label}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[--iw-ink] font-semibold capitalize">
                {activePath.split("/").pop()?.replace(/-/g, " ") || "Dashboard"}
              </span>
            </div>

            {/* Search — centered */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex-1 max-w-sm mx-auto flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full border border-[--iw-rule-light] bg-[--iw-paper] text-[--iw-rule] hover:border-[--iw-rule] transition-colors group"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 text-left text-[12px]">Search spine...</span>
              <span className="text-[10px] font-bold border border-[--iw-rule-light] rounded px-1.5 py-0.5 bg-card">
                ⌘K
              </span>
            </button>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <LiveBadge healthy={true} />
              <ModeSwitcher mode={mode} onMode={handleModeChange} />
              <button
                onClick={handleTwinOpen}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[--iw-forest] border border-[--iw-forest]/20 rounded-lg px-2.5 py-1.5 hover:bg-[--iw-forest]/5 transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                Open Twin
                <ExternalLink className="w-3 h-3 opacity-50" />
              </button>
              <button
                onClick={() => setNotificationOpen(true)}
                className="relative p-1.5 text-[--iw-rule] hover:text-[--iw-ink] transition-colors"
              >
                <Bell className="w-4 h-4" />
                {signalCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-red-600 text-[8px] font-bold text-white flex items-center justify-center">
                    {signalCount > 9 ? "9+" : signalCount}
                  </span>
                )}
              </button>
              {/* User pill */}
              <div className="flex items-center gap-2 pl-3 border-l border-[--iw-rule-light]">
                <div className="w-6 h-6 rounded-full bg-[--iw-forest] flex items-center justify-center text-[10px] font-bold text-[--iw-paper]">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-[12px] font-semibold text-[--iw-ink]">{userName}</span>
              </div>
            </div>
          </header>

          {/* Content + Twin Substrate stacking area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Workbench scroll area */}
            <div className="flex-1 overflow-y-auto">
              {/* Stat cards + Performance Tracker — only on dashboard */}
              {isDashboard && (
                <div className="pt-6">
                  <StatCards />
                  <PerformanceTracker />
                </div>
              )}

              {/* Module content */}
              <div className={cn("flex-1", isDashboard ? "px-0" : "h-full")}>
                <ContentRouter
                  domain={domain}
                  moduleId={moduleId}
                  forceRender={true}
                  fullLayers={true} // CZ full for real end-to-end
                  userRole={userRole}
                />
              </div>
            </div>

            {/* Twin Substrate — slides in from bottom when mode = think */}
            <AnimatePresence>
              {showTwinSubstrate && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="shrink-0 overflow-hidden"
                >
                  <TwinSubstrate
                    domain={domain}
                    onDismiss={() => setTwinSubstrateDismissed(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Overlays */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onNavigate={(path) => {
            const unifiedPath = path
              .replace("/work/", "/unified/work/")
              .replace("/personal/", "/unified/personal/");
            handleNavigate(unifiedPath.startsWith("/unified") ? unifiedPath : `/unified${path}`);
          }}
          onDeepDive={() => {}}
        />
        <NotificationCenter
          isOpen={notificationOpen}
          onClose={() => setNotificationOpen(false)}
          onNavigate={(module) => handleNavigate(`/unified/work/${module}`)}
        />
      </div>
    </L2DrawerProvider>
  );
}
