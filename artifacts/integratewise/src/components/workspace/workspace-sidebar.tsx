import { Link, useLocation } from "wouter";
import { Bot, Settings, Shield, Brain, MemoryStick, Plug, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { IntegrateWiseLogo } from "@/components/integratewise-logo";
import { useSpine } from "@/spine/spine-context";
import { groupModules } from "@/spine/derive-workspace";
import { ALL_ROLES, CTX_CONFIG } from "@/spine/role-registry";
import { ALL_INDUSTRIES, INDUSTRIES } from "@/spine/industry-registry";
import type { CTXEnum, Industry } from "@/spine/types";
import { LayerSwitcher } from "@/components/workspace/layer-switcher";
import type { WorkspaceMode } from "./workspace-shell";

interface WorkspaceSidebarProps {
  onNavigate?: () => void;
  mode?: WorkspaceMode;
}

const MEMORY_ZONES = [
  { kind: "org", label: "Org Memory", count: 342, icon: Shield, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
  { kind: "ai", label: "AI Memory", count: 28, icon: Brain, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  { kind: "me", label: "Mine", count: 115, icon: MemoryStick, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
] as const;

const DAILY_TOOLS = [
  { label: "Gmail", status: "connected" },
  { label: "Linear", status: "connected" },
  { label: "Notion", status: "connected" },
  { label: "Slack", status: "idle" },
];

export function WorkspaceSidebar({ onNavigate, mode = "work" }: WorkspaceSidebarProps) {
  const [pathname] = useLocation();
  const { workspace, role, industry, setRole, setIndustry, userName } = useSpine();
  const groups = groupModules(workspace.modules);
  const ctx = CTX_CONFIG[role];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar md:w-64">
      {/* ── Brand ── */}
      <div className="flex-shrink-0 border-b border-sidebar-border px-5 py-4">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm"
            style={{ background: "var(--iw-blue)" }}
          >
            <IntegrateWiseLogo className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-sidebar-foreground tracking-tight">
              IntegrateWise
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
              {mode === "ai" ? "AI Home" : "Workbench"}
            </p>
          </div>
        </Link>
      </div>

      {/* ── Role + Industry ── */}
      <div className="flex-shrink-0 space-y-3 border-b border-sidebar-border p-4 bg-sidebar-muted/20">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60">
            Role Context
          </span>
          <div className="relative">
            <span
              className="absolute left-2.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
              style={{ background: ctx.accent }}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CTXEnum)}
              className="w-full appearance-none rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-muted/50 transition-colors py-2 pl-7 pr-7 text-xs font-semibold text-sidebar-foreground shadow-sm outline-none focus:border-sidebar-primary focus:ring-1 focus:ring-sidebar-primary/20"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{CTX_CONFIG[r].label}</option>
              ))}
            </select>
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60">
            Industry Domain
          </span>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value as Industry)}
            className="w-full appearance-none rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-muted/50 transition-colors px-3 py-2 text-xs font-semibold text-sidebar-foreground shadow-sm outline-none focus:border-sidebar-primary focus:ring-1 focus:ring-sidebar-primary/20"
          >
            {ALL_INDUSTRIES.map((i) => (
              <option key={i} value={i}>{INDUSTRIES[i].label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* ── Layer switcher ── */}
      <LayerSwitcher />

      {/* ── Navigation ── */}
      <nav className="touch-pan-y flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 custom-scrollbar">
        {/* Twin — bridge to AI Home */}
        <div className="space-y-1">
          <Link
            href="/twin"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 group",
              isActive("/twin")
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-sidebar-foreground",
            )}
          >
            <Bot
              className={cn(
                "h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110",
                isActive("/twin") ? "text-primary-foreground" : "text-primary",
              )}
            />
            <span className="flex-1 truncate">Intelligence Twin</span>
          </Link>
        </div>

        {/* Adaptive module groups */}
        {groups.map(({ group, items }) => (
          <div key={group} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
              {group}
            </p>
            <div className="space-y-0.5">
              {items.map((m) => {
                const Icon = m.icon;
                const active = isActive(m.path);
                return (
                  <Link
                    key={m.id}
                    href={m.path}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm font-semibold"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        active
                          ? "text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground",
                      )}
                    />
                    <span className="flex-1 truncate">{m.label}</span>
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Memory Boundaries ── */}
      <div className="flex-shrink-0 border-t border-sidebar-border px-4 py-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
          Memory
        </p>
        <div className="space-y-1">
          {MEMORY_ZONES.map(({ kind, label, count, icon: Icon, color, bg }) => (
            <div
              key={kind}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-sidebar-muted/40 transition-colors cursor-pointer"
            >
              <div className={cn("flex h-5 w-5 items-center justify-center rounded flex-shrink-0", bg)}>
                <Icon className={cn("h-3 w-3", color)} />
              </div>
              <span className="flex-1 truncate text-[11px] font-medium text-sidebar-foreground/70">{label}</span>
              <span className="text-[10px] font-bold text-sidebar-foreground/40 tabular-nums">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Daily Tools ── */}
      <div className="flex-shrink-0 border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
            Daily Tools
          </p>
          <Link href="/integrations" onClick={onNavigate}>
            <Plug className="h-3 w-3 text-sidebar-foreground/30 hover:text-sidebar-foreground/70 transition-colors" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DAILY_TOOLS.map((t) => (
            <span
              key={t.label}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold border",
                t.status === "connected"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400"
                  : "border-border bg-secondary/40 text-muted-foreground",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", t.status === "connected" ? "bg-green-500" : "bg-muted-foreground/40")} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── User footer ── */}
      <div className="flex-shrink-0 border-t border-sidebar-border p-4 bg-sidebar-muted/10">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-muted group"
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-sidebar-border shadow-sm text-sm font-bold text-white transition-transform group-hover:scale-105"
            style={{ background: "var(--iw-blue)" }}
          >
            {userName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{userName}</p>
            <p className="truncate text-[10px] uppercase tracking-wider font-bold text-sidebar-foreground/50 mt-0.5">
              {ctx.label}
            </p>
          </div>
          <Settings className="w-4 h-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/80 transition-colors" />
        </Link>
      </div>
    </aside>
  );
}
