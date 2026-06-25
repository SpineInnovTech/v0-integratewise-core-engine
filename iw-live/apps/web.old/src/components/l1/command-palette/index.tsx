"use client";

/**
 * Command Palette - Global Search & Actions
 * Searches across Spine, Knowledge, Signals, and provides quick navigation
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { useTenant } from "@/contexts/tenant-context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Database,
  BookOpen,
  Activity,
  Users,
  Building2,
  Target,
  FileText,
  Calendar,
  CheckSquare,
  Zap,
  Settings,
  History,
  Eye,
  Brain,
  Sparkles,
  ArrowRight,
  Loader2,
  Command,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface SearchResult {
  id: string;
  type: "entity" | "knowledge" | "signal" | "action" | "navigation";
  category: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  route?: string;
  action?: () => void;
  metadata?: Record<string, unknown>;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// Quick Actions & Navigation
// ============================================================================

const QUICK_ACTIONS: SearchResult[] = [
  {
    id: "nav-home",
    type: "navigation",
    category: "Go to",
    title: "Home",
    subtitle: "Personal workspace",
    icon: Target,
    route: "/personal/home",
  },
  {
    id: "nav-tasks",
    type: "navigation",
    category: "Go to",
    title: "Tasks",
    subtitle: "Your task list",
    icon: CheckSquare,
    route: "/personal/tasks",
  },
  {
    id: "nav-accounts",
    type: "navigation",
    category: "Go to",
    title: "Accounts",
    subtitle: "Account management",
    icon: Building2,
    route: "/accounts/home",
  },
  {
    id: "nav-sales",
    type: "navigation",
    category: "Go to",
    title: "Sales",
    subtitle: "Pipeline & deals",
    icon: Target,
    route: "/sales/home",
  },
  {
    id: "nav-settings",
    type: "navigation",
    category: "Go to",
    title: "Settings",
    subtitle: "App settings",
    icon: Settings,
    route: "/settings",
  },
];

const COGNITIVE_ACTIONS: SearchResult[] = [
  {
    id: "action-spine",
    type: "action",
    category: "Search",
    title: "Search Spine",
    subtitle: "Structured data & entities",
    icon: Database,
    action: () => openCognitive("spine"),
  },
  {
    id: "action-knowledge",
    type: "action",
    category: "Search",
    title: "Search Knowledge",
    subtitle: "Documents & insights",
    icon: BookOpen,
    action: () => openCognitive("knowledge"),
  },
  {
    id: "action-signals",
    type: "action",
    category: "View",
    title: "View Signals",
    subtitle: "Alerts & situations",
    icon: Activity,
    action: () => openCognitive("signals"),
  },
  {
    id: "action-evidence",
    type: "action",
    category: "View",
    title: "Evidence Trail",
    subtitle: "Data lineage",
    icon: Eye,
    action: () => openCognitive("evidence"),
  },
  {
    id: "action-audit",
    type: "action",
    category: "View",
    title: "Audit Log",
    subtitle: "Activity history",
    icon: History,
    action: () => openCognitive("audit"),
  },
  {
    id: "action-memory",
    type: "action",
    category: "View",
    title: "AI Memory",
    subtitle: "Session summaries",
    icon: Brain,
    action: () => openCognitive("memory"),
  },
];

function openCognitive(surface: string) {
  window.dispatchEvent(
    new CustomEvent("iw:cognitive:open", {
      detail: { surface, data: {} },
    })
  );
}

// ============================================================================
// Search Hook
// ============================================================================

function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const tenant = useTenant();

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Search API call
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=global`, {
          signal: controller.signal,
        });
        const data = await response.json();

        const searchResults: SearchResult[] = [];

        // Map entity results
        if (data.entities) {
          data.entities.forEach((entity: any) => {
            const iconMap: Record<string, React.ElementType> = {
              account: Building2,
              contact: Users,
              project: Target,
              task: CheckSquare,
              meeting: Calendar,
              document: FileText,
            };
            searchResults.push({
              id: `entity-${entity.id}`,
              type: "entity",
              category: entity.type,
              title: entity.name || entity.title || entity.id,
              subtitle: entity.description || entity.type,
              icon: iconMap[entity.type] || Database,
              route: `/${entity.scope || "personal"}/${entity.type}s/${entity.id}`,
              metadata: entity,
            });
          });
        }

        // Map knowledge results
        if (data.knowledge) {
          data.knowledge.forEach((doc: any) => {
            searchResults.push({
              id: `knowledge-${doc.id}`,
              type: "knowledge",
              category: "Document",
              title: doc.title || doc.document_title,
              subtitle: doc.content?.substring(0, 100) + "...",
              icon: BookOpen,
              action: () => openCognitive("knowledge"),
              metadata: doc,
            });
          });
        }

        // Map signal results
        if (data.signals) {
          data.signals.forEach((signal: any) => {
            searchResults.push({
              id: `signal-${signal.id}`,
              type: "signal",
              category: signal.band || "Signal",
              title: signal.title,
              subtitle: signal.description,
              icon: Activity,
              action: () => openCognitive("signals"),
              metadata: signal,
            });
          });
        }

        setResults(searchResults);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Search failed:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, tenant?.id]);

  return { results, isLoading };
}

// ============================================================================
// Command Palette Component
// ============================================================================

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { results: searchResults, isLoading } = useGlobalSearch(query);

  // Combine results: search results + filtered actions
  const allResults = React.useMemo(() => {
    if (query.length >= 2) {
      // Show search results first, then filtered actions
      const filteredActions = [...QUICK_ACTIONS, ...COGNITIVE_ACTIONS].filter(
        (action) =>
          action.title.toLowerCase().includes(query.toLowerCase()) ||
          action.subtitle?.toLowerCase().includes(query.toLowerCase())
      );
      return [...searchResults, ...filteredActions];
    }
    // No query - show quick actions
    return [...QUICK_ACTIONS, ...COGNITIVE_ACTIONS];
  }, [query, searchResults]);

  // Group results by category
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    allResults.forEach((result) => {
      const key = result.category;
      if (!groups[key]) groups[key] = [];
      groups[key].push(result);
    });
    return groups;
  }, [allResults]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          const selected = allResults[selectedIndex];
          if (selected) executeResult(selected);
          break;
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, allResults, onOpenChange]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const executeResult = useCallback(
    (result: SearchResult) => {
      onOpenChange(false);
      if (result.route) {
        navigate(result.route);
      } else if (result.action) {
        result.action();
      }
    },
    [navigate, onOpenChange]
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [open, onOpenChange]);

  let flatIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search everything... entities, docs, signals, or type a command"
            className="flex-1 text-sm outline-none bg-transparent"
          />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <kbd className="px-2 py-1 text-[10px] font-medium bg-muted rounded border">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {Object.entries(groupedResults).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                {category}
              </div>
              {items.map((result) => {
                const currentIndex = flatIndex++;
                const isSelected = currentIndex === selectedIndex;
                const Icon = result.icon;

                return (
                  <button
                    key={result.id}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                    }`}
                    onClick={() => executeResult(result)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    {result.type === "entity" && result.metadata && (
                      <Badge variant="outline" className="text-[10px]">
                        {(result.metadata as any).type}
                      </Badge>
                    )}
                    <ArrowRight
                      className={`w-4 h-4 transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`}
                    />
                  </button>
                );
              })}
            </div>
          ))}

          {query.length >= 2 && allResults.length === 0 && !isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No results found for &quot;{query}&quot;</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded border">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-background rounded border">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-background rounded border">↵</kbd>
              to select
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>K to toggle</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Command Palette Trigger Button
// ============================================================================

export function CommandPaletteTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border transition-colors ${className}`}
    >
      <Search className="w-4 h-4" />
      <span className="hidden md:inline">Search everything...</span>
      <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] font-medium bg-background rounded border ml-auto">
        ⌘K
      </kbd>
    </button>
  );
}

export default CommandPalette;
