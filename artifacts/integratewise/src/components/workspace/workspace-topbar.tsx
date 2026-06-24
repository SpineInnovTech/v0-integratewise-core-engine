import { Search, PanelLeftClose, PanelLeft, Menu, Command } from "lucide-react";
import { useSpine } from "@/spine/spine-context";
import { CTX_CONFIG } from "@/spine/role-registry";
import { INDUSTRIES } from "@/spine/industry-registry";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConnectionPill } from "@/platform/connection-pill";
import { SpinePill } from "@/platform/spine-pill";

export function WorkspaceTopbar({
  onToggleSidebar,
  sidebarOpen,
  isMobile,
}: {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  isMobile: boolean;
}) {
  const { role, industry } = useSpine();
  const ctx = CTX_CONFIG[role];
  const ind = INDUSTRIES[industry];

  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-4 border-b border-border/50 bg-background/80 px-6 backdrop-blur-md">
      <button
        onClick={onToggleSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
        title={isMobile ? "Open menu" : sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {isMobile ? <Menu className="h-4 w-4" /> : sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
      </button>

      <div className="relative hidden max-w-lg flex-1 sm:block group">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          placeholder="Search commands, modules, entities..."
          readOnly
          className="h-10 w-full rounded-xl border border-border bg-secondary/30 pl-10 pr-12 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-text"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 mr-2">
          <span className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold tracking-wide uppercase shadow-sm border border-black/5 dark:border-white/5" style={{ background: "var(--iw-blue-50)", color: "var(--iw-blue)" }}>
            <span className="h-2 w-2 rounded-full" style={{ background: ctx.accent }} />
            {ctx.label}
          </span>
          <span className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold tracking-wide uppercase shadow-sm border border-black/5 dark:border-white/5" style={{ background: "var(--iw-purple-50)", color: "var(--iw-purple)" }}>
            {ind.label}
          </span>
        </div>
        
        <div className="h-6 w-px bg-border hidden md:block mx-1"></div>
        
        <SpinePill />
        <ConnectionPill />
        <ThemeToggle />
      </div>
    </header>
  );
}
