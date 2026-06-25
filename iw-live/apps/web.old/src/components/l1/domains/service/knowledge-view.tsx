import { useState } from "react";
import { BookOpen, Search, Loader2, FileText, FolderOpen } from "lucide-react";
import { useHydrateDomainTable } from "@/components/core/hydration/use-hydrate-projection";

export function KnowledgeView() {
  const { data, loading } = useHydrateDomainTable<any>("service", "knowledge");
  const [search, setSearch] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const articles = data?.items || [];
  const filtered = articles.filter(
    (a: any) => !search || a.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Knowledge Base
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Articles, guides, and troubleshooting resources.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No articles found</div>
        ) : (
          filtered.map((article: any) => (
            <div
              key={article.id}
              className="rounded-lg border p-4 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-iw-slate/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-iw-slate-mid" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{article.title || "Untitled"}</div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {article.summary || article.excerpt || ""}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" />
                      {article.category || "General"}
                    </span>
                    <span>{article.updatedAt || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default KnowledgeView;
