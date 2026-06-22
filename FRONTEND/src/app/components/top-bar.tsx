import { useState } from "react";
import {
  Search,
  Bell,
  Plus,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
} from "lucide-react";
import { type L1Module } from "./spine/types";
import { NotificationCenter } from "./notifications/notification-center";
import { useSpine } from "./spine/spine-client";

interface TopBarProps {
  activeModule: L1Module;
  activeView: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenCommandPalette: () => void;
  onNavigate?: (module: string) => void;
}

export function TopBar({
  activeModule,
  activeView,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenCommandPalette,
  onNavigate,
}: TopBarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const spine = useSpine();
  
  return (
    <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">Workspace</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span style={{ fontWeight: 700 }}>{activeModule}</span>
        </nav>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Global Search */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-muted-foreground text-xs hover:bg-accent transition-colors"
        >
          <Search className="w-3 h-3" />
          <span className="hidden sm:inline">Search everything...</span>
          <kbd className="hidden sm:inline text-[10px] bg-card px-1 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 flex items-center justify-center text-white text-[8px] rounded-full px-1 font-bold"
              style={{ background: "var(--iw-danger)" }}>
              3
            </span>
          </button>
          <NotificationCenter
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            onNavigate={(m: any) => onNavigate?.(m)}
          />
        </div>

        {/* RBAC Role */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-[10px] text-muted-foreground font-bold">
          <Shield className="w-3 h-3" />
          <span className="uppercase tracking-tighter">
            {spine.role || "Admin"}
          </span>
        </div>

        {/* User Avatar */}
        {spine.userName && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1">
            <div className="w-6 h-6 rounded-full bg-[var(--iw-blue)] flex items-center justify-center text-white text-[9px] font-bold">
              {spine.userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-foreground font-semibold">
              {spine.userName.split(" ")[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}