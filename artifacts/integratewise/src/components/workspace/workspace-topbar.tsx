import { Search, PanelLeftClose, PanelLeft, Menu } from "lucide-react";
import { useSpine } from "@/spine/spine-context";
import { CTX_CONFIG } from "@/spine/role-registry";
import { INDUSTRIES } from "@/spine/industry-registry";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <header className="sticky top-0 z-10 flex h-14 flex-shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      <button
        onClick={onToggleSidebar}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title={isMobile ? "Open menu" : sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {isMobile ? <Menu className="h-4 w-4" /> : sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search this workspace..."
          readOnly
          className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold md:flex" style={{ background: "var(--iw-blue-50)", color: "var(--iw-blue)" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: ctx.accent }} />
          {ctx.label}
        </span>
        <span className="hidden rounded-md px-2 py-1 text-[11px] font-semibold lg:inline" style={{ background: "var(--iw-purple-50)", color: "var(--iw-purple)" }}>
          {ind.label}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
