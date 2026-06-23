import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { IntegrateWiseLogo } from "@/components/integratewise-logo";
import { useSpine } from "@/spine/spine-context";
import { groupModules } from "@/spine/derive-workspace";
import { ALL_ROLES, CTX_CONFIG } from "@/spine/role-registry";
import { ALL_INDUSTRIES, INDUSTRIES } from "@/spine/industry-registry";
import type { CTXEnum, Industry } from "@/spine/types";

export function WorkspaceSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [pathname] = useLocation();
  const { workspace, role, industry, setRole, setIndustry, userName } = useSpine();
  const groups = groupModules(workspace.modules);
  const ctx = CTX_CONFIG[role];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar md:w-64">
      {/* Brand */}
      <div className="flex-shrink-0 border-b border-sidebar-border p-4">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ background: "var(--iw-blue)" }}>
            <IntegrateWiseLogo className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-sidebar-foreground">IntegrateWise OS</h1>
          </div>
        </Link>
      </div>

      {/* Role + Industry switchers — drive the whole surface */}
      <div className="flex-shrink-0 space-y-2 border-b border-sidebar-border p-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-sidebar-foreground/50">Role</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full" style={{ background: ctx.accent }} />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CTXEnum)}
              className="w-full appearance-none rounded-lg border border-sidebar-border bg-sidebar-muted/40 py-1.5 pl-6 pr-7 text-xs font-semibold text-sidebar-foreground outline-none focus:border-sidebar-primary"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{CTX_CONFIG[r].label}</option>
              ))}
            </select>
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-sidebar-foreground/50">Industry</span>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value as Industry)}
            className="w-full appearance-none rounded-lg border border-sidebar-border bg-sidebar-muted/40 px-2.5 py-1.5 text-xs font-semibold text-sidebar-foreground outline-none focus:border-sidebar-primary"
          >
            {ALL_INDUSTRIES.map((i) => (
              <option key={i} value={i}>{INDUSTRIES[i].label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Derived nav */}
      <nav className="touch-pan-y flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4">
        {groups.map(({ group, items }) => (
          <div key={group}>
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wide text-sidebar-foreground/40">{group}</p>
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
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{m.label}</span>
                    {active && <div className="h-5 w-1 rounded-full" style={{ background: "var(--iw-blue)" }} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="flex-shrink-0 border-t border-sidebar-border p-3">
        <Link href="/settings" onClick={onNavigate} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-muted">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-sidebar-border text-sm font-semibold text-white" style={{ background: "var(--iw-blue)" }}>
            {userName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{userName}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{ctx.label}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
