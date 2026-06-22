import { useState } from "react";
import { Globe, Search, Plus, Eye, Edit3, Trash2, ExternalLink, CheckCircle, Clock, AlertTriangle, TrendingUp, MoreHorizontal, Copy } from "lucide-react";

interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft" | "scheduled";
  seoScore: number;
  views: number;
  lastUpdated: string;
  author: string;
  template: string;
}

const pages: PageItem[] = [
  { id: "p1", title: "Home", slug: "/", status: "published", seoScore: 92, views: 12450, lastUpdated: "2d ago", author: "Arun K.", template: "Landing" },
  { id: "p2", title: "About Us", slug: "/about", status: "published", seoScore: 85, views: 3200, lastUpdated: "1w ago", author: "Deepak J.", template: "Standard" },
  { id: "p3", title: "Pricing", slug: "/pricing", status: "published", seoScore: 88, views: 8900, lastUpdated: "3d ago", author: "Arun K.", template: "Pricing" },
  { id: "p4", title: "APAC Integration Solutions", slug: "/solutions/apac", status: "published", seoScore: 76, views: 2100, lastUpdated: "5d ago", author: "Priya S.", template: "Landing" },
  { id: "p5", title: "Contact Sales", slug: "/contact", status: "published", seoScore: 82, views: 4500, lastUpdated: "1w ago", author: "Vikram R.", template: "Form" },
  { id: "p6", title: "Blog", slug: "/blog", status: "published", seoScore: 90, views: 6700, lastUpdated: "1d ago", author: "Deepak J.", template: "Blog Index" },
  { id: "p7", title: "Case Study: TechServe", slug: "/case-studies/techserve", status: "draft", seoScore: 45, views: 0, lastUpdated: "4h ago", author: "Anjali P.", template: "Case Study" },
  { id: "p8", title: "Q1 2026 Product Updates", slug: "/updates/q1-2026", status: "scheduled", seoScore: 72, views: 0, lastUpdated: "6h ago", author: "Arun K.", template: "Standard" },
  { id: "p9", title: "Documentation", slug: "/docs", status: "published", seoScore: 94, views: 15200, lastUpdated: "12h ago", author: "Arun K.", template: "Docs" },
  { id: "p10", title: "Careers", slug: "/careers", status: "published", seoScore: 68, views: 1800, lastUpdated: "2w ago", author: "Priya S.", template: "Standard" },
];

function getSeoColor(score: number) {
  if (score >= 80) return "var(--iw-success)";
  if (score >= 60) return "var(--iw-warning)";
  return "var(--iw-danger)";
}

const statusConfig: Record<string, { color: string; label: string }> = {
  published: { color: "var(--iw-success)", label: "Published" },
  draft: { color: "var(--muted-foreground)", label: "Draft" },
  scheduled: { color: "var(--iw-blue)", label: "Scheduled" },
};

export function PagesView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = pages.filter((p) => {
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Pages</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage website pages with SEO scoring and content optimization</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> New Page
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Total Pages</div><div className="text-lg" style={{ fontWeight: 600 }}>{pages.length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Published</div><div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-success)" }}>{pages.filter((p) => p.status === "published").length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Avg SEO Score</div><div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-blue)" }}>{Math.round(pages.reduce((s, p) => s + p.seoScore, 0) / pages.length)}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Total Views</div><div className="text-lg" style={{ fontWeight: 600 }}>{(pages.reduce((s, p) => s + p.views, 0) / 1000).toFixed(1)}K</div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search pages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Page</th>
              <th className="text-center py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Status</th>
              <th className="text-center py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>SEO</th>
              <th className="text-right py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 500 }}>Views</th>
              <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden xl:table-cell" style={{ fontWeight: 500 }}>Updated</th>
              <th className="text-right py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((page) => {
              const sCfg = statusConfig[page.status];
              return (
                <tr key={page.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4">
                    <div style={{ fontWeight: 500 }}>{page.title}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{page.slug}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${sCfg.color}15`, color: sCfg.color, fontWeight: 500 }}>{sCfg.label}</span>
                  </td>
                  <td className="py-3 px-4 text-center hidden md:table-cell">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px]" style={{ borderColor: getSeoColor(page.seoScore), color: getSeoColor(page.seoScore), fontWeight: 600 }}>{page.seoScore}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-muted-foreground hidden lg:table-cell">{page.views.toLocaleString()}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground hidden xl:table-cell">{page.lastUpdated}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-1 justify-end">
                      <button className="p-1.5 rounded hover:bg-secondary transition-colors" title="View"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button className="p-1.5 rounded hover:bg-secondary transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button className="p-1.5 rounded hover:bg-secondary transition-colors" title="More"><MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
