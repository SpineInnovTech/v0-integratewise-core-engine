/**
 * DomainSidebar — Reusable sidebar for domain shells.
 * Each domain passes its own nav items, accent color, and branding.
 */
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  ArrowLeft,
  Database,
} from "lucide-react";
import { useSpine } from "../spine/spine-client";
import type { DomainConfig } from "./domain-types";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  section?: string;
}

interface DomainSidebarProps {
  domain: DomainConfig;
  navItems: NavItem[];
  activeView: string;
  onViewChange: (view: string) => void;
  onBackToConsole?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DomainSidebar({
  domain,
  navItems,
  activeView,
  onViewChange,
  onBackToConsole,
  collapsed = false,
  onToggleCollapse,
}: DomainSidebarProps) {
  const spine = useSpine();

  // Group items by section
  const sections: Record<string, NavItem[]> = {};
  for (const item of navItems) {
    const sec = item.section || "main";
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(item);
  }

  return (
    <div
      className={`flex flex-col bg-card border-r border-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Domain Header */}
      <div className="flex-shrink-0 px-3 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className={`flex-shrink-0 flex items-center justify-center rounded-lg text-lg bg-gradient-to-br ${domain.gradient} ${
              collapsed ? "w-9 h-9" : "w-9 h-9"
            }`}
          >
            <span className="text-sm">{domain.icon}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate" style={{ fontWeight: 600 }}>
                {domain.shortLabel}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {spine.userName}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {Object.entries(sections).map(([sectionName, items]) => (
          <div key={sectionName}>
            {sectionName !== "main" && !collapsed && (
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pt-3 pb-1" style={{ fontWeight: 500 }}>
                {sectionName}
              </div>
            )}
            {sectionName !== "main" && collapsed && <div className="h-px bg-border mx-2 my-2" />}
            {items.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left group ${
                    isActive
                      ? "text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: `${domain.accentColor}10`, color: domain.accentColor }
                      : undefined
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${domain.accentColor}15`,
                            color: domain.accentColor,
                            fontWeight: 500,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* SSOT indicator */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Database className="w-3 h-3" />
            <span>SSOT: {spine.connectedApps.length} sources</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--iw-success)] ml-auto" />
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex-shrink-0 px-2 py-2 border-t border-border space-y-1">
        {onBackToConsole && (
          <button
            onClick={onBackToConsole}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            title={collapsed ? "Back to Console" : undefined}
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-xs">Back to Console</span>}
          </button>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
