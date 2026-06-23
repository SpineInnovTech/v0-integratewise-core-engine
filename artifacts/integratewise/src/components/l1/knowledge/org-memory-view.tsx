import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import {
  Search,
  BookOpen,
  Filter,
  CheckCircle,
  Clock,
  Shield,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import type { OrgMemoryItem } from "./useKnowledgeRegistry";

// ─── Hook: Fetch all org memory ──────────────────────────────────────────────

export function useOrgMemory() {
  return useQuery({
    queryKey: ["org_memory_all"],
    queryFn: async () => {
      const result = await apiFetch<{ success: boolean; data: OrgMemoryItem[]; count: number }>(
        `/api/v1/intelligence/knowledge/org-memory?limit=200`
      );
      return result?.data || [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ─── OrgMemoryView ───────────────────────────────────────────────────────────

export function OrgMemoryView({ onBack }: { onBack: () => void }) {
  const { data: items, isLoading, error } = useOrgMemory();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");

  const categories = useMemo(() => {
    if (!items) return [] as string[];
    const cats = new Set(items.map((i: OrgMemoryItem) => i.category));
    return Array.from(cats).sort();
  }, [items]);

  const states = ["staging", "approved", "published", "archived"];

  const filtered = useMemo(() => {
    if (!items) return [] as OrgMemoryItem[];
    return items.filter((item: OrgMemoryItem) => {
      const matchSearch =
        !search ||
        item.topic.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchState = selectedState === "all" || item.governance_state === selectedState;
      return matchSearch && matchCategory && matchState;
    });
  }, [items, search, selectedCategory, selectedState]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading Book of Records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <AlertTriangle className="w-8 h-8 text-destructive mb-4" />
        <p className="text-sm font-medium">Failed to load Org Memory</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2 h-auto">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--iw-gold)]" />
              The Book of Records (Org Memory)
            </h2>
            <p className="text-xs text-muted-foreground">
              Canonical, governed institutional knowledge.
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
          {items?.length || 0} Total Records
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm bg-secondary rounded-lg px-3 py-2 border-none outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c: string) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="text-sm bg-secondary rounded-lg px-3 py-2 border-none outline-none"
          >
            <option value="all">All States</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-secondary/20">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No records found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item: OrgMemoryItem) => {
            const stateColor =
              item.governance_state === "published"
                ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80 border-iw-forest/20 dark:border-green-800"
                : item.governance_state === "approved"
                  ? "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/20 dark:text-iw-slate-mid/80 border-iw-slate/20 dark:border-iw-slate/60"
                  : item.governance_state === "staging"
                    ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light border-iw-gold/20 dark:border-yellow-800"
                    : "bg-muted text-muted-foreground border-border";

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border bg-card hover:bg-secondary/20 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-sm truncate">{item.topic}</h3>
                    <span
                      className={cn(
                        "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border",
                        stateColor
                      )}
                    >
                      {item.governance_state}
                    </span>
                    <span className="text-[10px] uppercase bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                </div>
                <div className="text-right flex flex-col gap-1 items-end shrink-0">
                  <span className="text-xs text-muted-foreground">v{item.version}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.updated_at).toLocaleDateString()}
                  </span>
                  {item.approved_by && (
                    <span className="text-[10px] text-[var(--iw-gold)] bg-[var(--iw-gold)]/10 px-1.5 py-0.5 rounded mt-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Approved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
