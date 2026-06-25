/**
 * Personal Bookmarks View — Saved links and references
 */
import { useState } from "react";
import { Bookmark, ExternalLink, Plus, Search, Tag } from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";

export function BookmarksView() {
  const { data: bookmarks, isLoading } = useWorkspaceEntities<any>("bookmark", {
    domain: "PERSONAL",
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = ["all", ...new Set(bookmarks.map((b: any) => b.category).filter(Boolean))];
  const filtered = bookmarks.filter((b: any) => {
    if (
      search &&
      !b.title?.toLowerCase().includes(search.toLowerCase()) &&
      !(b.tags || []).some((t: string) => t.includes(search.toLowerCase()))
    )
      return false;
    if (categoryFilter !== "all" && b.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Bookmarks</h1>
          <p className="text-sm text-muted-foreground">Your saved links and references</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
        {categories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-background text-sm"
          >
            {categories.map((c) => (
              <option key={c as string} value={c as string}>
                {c === "all"
                  ? "All"
                  : (c as string).charAt(0).toUpperCase() + (c as string).slice(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Loading bookmarks...</p>
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-3">
          {filtered.map((b: any) => (
            <a
              key={b.id}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bookmark className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground group-hover:text-primary truncate">
                  {b.title}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{b.url}</div>
                {(b.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(b.tags || []).map((t: string) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
            </a>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No bookmarks found</p>
          <p className="text-xs mt-1">Add bookmarks to save links for quick access</p>
        </div>
      )}
    </div>
  );
}
