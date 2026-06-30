import { Search, PanelLeftClose, PanelLeft, Menu, Command, Bot, Briefcase, MessageSquare, Bell } from "lucide-react";
import { useSpine } from "@/spine/spine-context";
import { CTX_CONFIG } from "@/spine/role-registry";
import { INDUSTRIES } from "@/spine/industry-registry";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConnectionPill } from "@/platform/connection-pill";
import { SpinePill } from "@/platform/spine-pill";
import { cn } from "@/lib/utils";
import type { WorkspaceMode } from "./workspace-shell";

interface WorkspaceTopbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  isMobile: boolean;
  mode: WorkspaceMode;
  setMode: (m: WorkspaceMode) => void;
  overlayOpen: boolean;
  setOverlayOpen: (o: boolean) => void;
}

const PENDING_COUNT = 3;

export function WorkspaceTopbar({
  onToggleSidebar,
  sidebarOpen,
  isMobile,
  mode,
  setMode,
  overlayOpen,
  setOverlayOpen,
}: WorkspaceTopbarProps) {
  const { role, industry } = useSpine();
  const ctx = CTX_CONFIG[role];
  const ind = INDUSTRIES[industry];

  return (
    <header className="sticky top-0 z-10 flex h-14 flex-shrink-0 items-center gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur-md">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground flex-shrink-0"
        title={isMobile ? "Open menu" : sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {isMobile ? <Menu className="h-4 w-4" /> : sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
      </button>

      {/* ── Mode switcher: [Work] [AI] ── */}
      <div className="flex items-center rounded-lg border border-border/60 bg-secondary/30 p-0.5 flex-shrink-0">
        <button
          onClick={() => setMode("work")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all",
            mode === "work"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Briefcase className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Workbench</span>
        </button>
        <button
          onClick={() => setMode("ai")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all relative",
            mode === "ai"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Bot className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI Home</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-black text-white" style={{ background: "var(--iw-blue)" }}>
            {PENDING_COUNT}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative hidden max-w-sm flex-1 sm:block group">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          placeholder="Search commands, modules, entities..."
          readOnly
          className="h-9 w-full rounded-xl border border-border bg-secondary/30 pl-9 pr-10 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-text"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Right cluster */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Context badges — desktop only */}
        <div className="hidden lg:flex items-center gap-1.5">
          <span
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm border border-black/5 dark:border-white/5"
            style={{ background: "var(--iw-blue-50)", color: "var(--iw-blue)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: ctx.accent }} />
            {ctx.label}
          </span>
          <span
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm border border-black/5 dark:border-white/5"
            style={{ background: "var(--iw-purple-50,#f5f3ff)", color: "var(--iw-purple,#7c3aed)" }}
          >
            {ind.label}
          </span>
        </div>

        <div className="h-5 w-px bg-border hidden md:block" />

        <SpinePill />
        <ConnectionPill />

        {/* ── Overlay / AI communication toggle ── */}
        <button
          onClick={() => setOverlayOpen(!overlayOpen)}
          title="AI Workspace Overlay"
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded-lg transition-all",
            overlayOpen
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/60",
          )}
        >
          <MessageSquare className="h-4 w-4" />
          {PENDING_COUNT > 0 && !overlayOpen && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-black text-white" style={{ background: "var(--iw-blue)" }}>
              {PENDING_COUNT}
            </span>
          )}
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
