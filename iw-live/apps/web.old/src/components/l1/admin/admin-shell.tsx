"use client";

import { Link, useLocation } from "react-router";
import {
  Bell,
  Database,
  Gauge,
  Gavel,
  LayoutGrid,
  Lock,
  Radar,
  Receipt,
  ScrollText,
  Settings2,
  Shield,
  Users,
  UserCog,
  Bot,
  Workflow,
  Brain,
  Activity,
  Webhook,
  CreditCard,
  Key,
  Eye,
  Zap,
  Layers,
  Server,
  FileCode,
  Network,
  BarChart3,
  LineChart,
  Sparkles,
  GitBranch,
  AlertTriangle,
  Cpu,
  HardDrive,
  Radio,
  BookOpen,
  Boxes,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  isNew?: boolean;
};

const NAV: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/today", icon: <LayoutGrid className="h-4 w-4" /> },
      {
        label: "Observability",
        href: "/admin/observability",
        icon: <Activity className="h-4 w-4" />,
        badge: "17 services",
      },
    ],
  },
  {
    section: "Identity & Access",
    items: [
      { label: "Tenancy", href: "/admin/tenancy", icon: <Users className="h-4 w-4" /> },
      {
        label: "Departments",
        href: "/admin/departments",
        icon: <LayoutGrid className="h-4 w-4" />,
        isNew: true,
      },
      { label: "Users", href: "/admin/users", icon: <UserCog className="h-4 w-4" /> },
      {
        label: "Roles & RBAC",
        href: "/admin/roles",
        icon: <Shield className="h-4 w-4" />,
        isNew: true,
      },
      {
        label: "Permissions",
        href: "/admin/permissions",
        icon: <Lock className="h-4 w-4" />,
        isNew: true,
      },
      { label: "IAM", href: "/admin/iam", icon: <Lock className="h-4 w-4" /> },
      {
        label: "API Keys",
        href: "/admin/api-keys",
        icon: <Key className="h-4 w-4" />,
        isNew: true,
      },
    ],
  },
  {
    section: "Billing & Usage",
    items: [
      {
        label: "Billing",
        href: "/admin/billing",
        icon: <CreditCard className="h-4 w-4" />,
        isNew: true,
      },
      { label: "Usage Metrics", href: "/admin/usage", icon: <BarChart3 className="h-4 w-4" /> },
      {
        label: "Feature Gates",
        href: "/admin/features",
        icon: <Zap className="h-4 w-4" />,
        badge: "40+",
      },
    ],
  },
  {
    section: "AI & Agents",
    items: [
      { label: "Agent Registry", href: "/admin/agent", icon: <Bot className="h-4 w-4" /> },
      {
        label: "Multi-Agent Orchestrator",
        href: "/admin/workflows",
        icon: <Workflow className="h-4 w-4" />,
        isNew: true,
      },
      { label: "AI Models", href: "/admin/iq-hub", icon: <Brain className="h-4 w-4" /> },
      { label: "MCP Tools", href: "/admin/tools", icon: <Cpu className="h-4 w-4" /> },
      {
        label: "Predictions",
        href: "/admin/predictions",
        icon: <Sparkles className="h-4 w-4" />,
        isNew: true,
      },
    ],
  },
  {
    section: "Data Pipeline",
    items: [
      {
        label: "Connectors",
        href: "/admin/connectors",
        icon: <Radar className="h-4 w-4" />,
        badge: "16",
      },
      {
        label: "Webhooks",
        href: "/admin/webhooks",
        icon: <Webhook className="h-4 w-4" />,
        badge: "14 providers",
        isNew: true,
      },
      {
        label: "Data Sources",
        href: "/admin/data-sources",
        icon: <HardDrive className="h-4 w-4" />,
      },
      {
        label: "Pipeline Stages",
        href: "/admin/executions",
        icon: <GitBranch className="h-4 w-4" />,
        badge: "8-stage",
      },
      { label: "Schema", href: "/admin/schema", icon: <Database className="h-4 w-4" /> },
    ],
  },
  {
    section: "Spine & Knowledge",
    items: [
      { label: "Spine (SSOT)", href: "/admin/spine", icon: <Server className="h-4 w-4" /> },
      { label: "Context Store", href: "/admin/context", icon: <Layers className="h-4 w-4" /> },
      {
        label: "Knowledge Bank",
        href: "/admin/knowledge-governance",
        icon: <BookOpen className="h-4 w-4" />,
      },
      { label: "Embeddings", href: "/admin/registry", icon: <Network className="h-4 w-4" /> },
    ],
  },
  {
    section: "Governance & Compliance",
    items: [
      { label: "Governance Rules", href: "/admin/governance", icon: <Gavel className="h-4 w-4" /> },
      { label: "Policies", href: "/admin/policies", icon: <FileCode className="h-4 w-4" /> },
      {
        label: "Actions & Approvals",
        href: "/admin/actions",
        icon: <Shield className="h-4 w-4" />,
      },
      { label: "Audit Trail", href: "/admin/audit", icon: <ScrollText className="h-4 w-4" /> },
    ],
  },
  {
    section: "Reliability",
    items: [
      {
        label: "Circuit Breakers",
        href: "/admin/automations",
        icon: <AlertTriangle className="h-4 w-4" />,
        isNew: true,
      },
      { label: "Signals", href: "/admin/signals", icon: <Radio className="h-4 w-4" /> },
      { label: "Analytics Engine", href: "/admin/0", icon: <LineChart className="h-4 w-4" /> },
    ],
  },
  {
    section: "Operations",
    items: [
      {
        label: "Release Control",
        href: "/admin/releases",
        icon: <Boxes className="h-4 w-4" />,
        badge: "17 services",
      },
      {
        label: "System Settings",
        href: "/admin/settings",
        icon: <Settings2 className="h-4 w-4" />,
        isNew: true,
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = useLocation().pathname || "";

  return (
    <div className="grid grid-cols-[300px_1fr] gap-0 min-h-[calc(100vh-0px)]">
      <aside className="border-r border-slate-200 bg-white flex flex-col">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
              <h1 className="text-lg font-semibold">Control Plane</h1>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] uppercase tracking-widest bg-iw-forest/10 text-iw-forest"
            >
              All Systems
            </Badge>
          </div>

          <div className="mt-4">
            <Input placeholder="Search admin…" />
          </div>
        </div>

        <Separator />

        <ScrollArea className="flex-1">
          <nav className="p-4 space-y-5">
            {NAV.map((group) => (
              <div key={group.section}>
                <p className="px-2 mb-2 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                  {group.section}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                          active
                            ? "bg-iw-slate-mid/10 text-iw-slate border border-iw-slate/20"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {item.icon}
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          {item.isNew && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-iw-forest/10 text-iw-forest rounded">
                              NEW
                            </span>
                          )}
                          {item.badge && (
                            <span className="text-[10px] text-slate-400">{item.badge}</span>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <Separator />
        <div className="p-4">
          <div className="rounded-lg bg-gradient-to-br from-[var(--iw-forest)]/10 via-[var(--iw-gold)]/10 to-[var(--iw-forest)]/5 p-3 text-xs">
            <p className="font-semibold text-iw-slate">🏴‍☠️ Buried Treasures</p>
            <p className="text-slate-600 mt-1">37 systems documented</p>
            <Link to="/admin/home" className="text-iw-slate hover:underline mt-2 inline-block">
              View full inventory →
            </Link>
          </div>
        </div>
      </aside>

      <main className="min-w-0 bg-slate-50">
        <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
          <div className="h-14 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                Org: Acme Corp
              </Badge>
              <Badge variant="outline" className="text-xs">
                Env: production
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-iw-forest/5 text-iw-forest border-iw-forest/20"
              >
                17 Services ✓
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/observability">
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-slate-100">
                  <Activity className="h-3 w-3 mr-1" />
                  Health Status
                </Badge>
              </Link>
              <button className="relative p-2 text-slate-500 hover:text-iw-forest" title="Alerts">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-iw-forest-bright rounded-full" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
