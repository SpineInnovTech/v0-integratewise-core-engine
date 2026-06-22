import { useState } from "react";
import { FileEdit, Search, Plus, Eye, Edit3, Calendar, Tag, Clock, MessageCircle, TrendingUp, MoreHorizontal } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  status: "published" | "draft" | "scheduled";
  author: string;
  authorInitials: string;
  publishedAt: string;
  readTime: string;
  views: number;
  comments: number;
  seoScore: number;
  tags: string[];
}

const posts: BlogPost[] = [
  { id: "b1", title: "How APAC RevOps Teams Are Scaling with Integration Maturity", excerpt: "A deep dive into the integration maturity model and how teams across India, Singapore, and Australia are leveraging it...", category: "Strategy", status: "published", author: "Arun Kumar", authorInitials: "AK", publishedAt: "Feb 7, 2026", readTime: "8 min", views: 2340, comments: 12, seoScore: 91, tags: ["RevOps", "APAC", "Integration"] },
  { id: "b2", title: "5 Workflow Automations Every Ops Team Needs", excerpt: "Streamline your operations with these essential workflow patterns that save 10+ hours per week...", category: "Automation", status: "published", author: "Priya Sharma", authorInitials: "PS", publishedAt: "Feb 3, 2026", readTime: "6 min", views: 1890, comments: 8, seoScore: 87, tags: ["Workflow", "Automation", "Productivity"] },
  { id: "b3", title: "Customer Health Scoring: A Practical Framework", excerpt: "Learn how to build and calibrate a customer health scoring model that actually predicts churn...", category: "CS Intelligence", status: "published", author: "Anjali Patel", authorInitials: "AP", publishedAt: "Jan 28, 2026", readTime: "12 min", views: 3120, comments: 24, seoScore: 94, tags: ["Customer Success", "Health Score", "Churn"] },
  { id: "b4", title: "Data Residency in APAC: What You Need to Know", excerpt: "Navigating compliance requirements across India, Singapore, and Australia for SaaS platforms...", category: "Compliance", status: "published", author: "Arun Kumar", authorInitials: "AK", publishedAt: "Jan 20, 2026", readTime: "10 min", views: 1560, comments: 6, seoScore: 82, tags: ["Compliance", "APAC", "Data Privacy"] },
  { id: "b5", title: "Building AI Agents for Revenue Operations", excerpt: "How we built ChurnShield, DealPredictor, and other AI agents that power intelligence overlay...", category: "AI/ML", status: "draft", author: "Rajesh Menon", authorInitials: "RM", publishedAt: "—", readTime: "15 min", views: 0, comments: 0, seoScore: 65, tags: ["AI", "Agents", "Intelligence"] },
  { id: "b6", title: "Q1 2026 Product Roadmap Recap", excerpt: "Everything we shipped in Q1 including multi-tenant support, RBAC, and the intelligence overlay...", category: "Product", status: "scheduled", author: "Arun Kumar", authorInitials: "AK", publishedAt: "Feb 15, 2026", readTime: "5 min", views: 0, comments: 0, seoScore: 78, tags: ["Product", "Roadmap", "Updates"] },
];

const categoryColors: Record<string, string> = {
  Strategy: "var(--iw-blue)",
  Automation: "var(--iw-purple)",
  "CS Intelligence": "var(--iw-success)",
  Compliance: "var(--iw-warning)",
  "AI/ML": "var(--iw-pink)",
  Product: "var(--iw-blue)",
};

export function BlogView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = posts.filter((p) => {
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Blog & Content</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage blog posts, articles, and content marketing</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((post) => {
          const catColor = categoryColors[post.category] || "var(--muted-foreground)";
          return (
            <div key={post.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${catColor}15` }}>
                  <FileEdit className="w-5 h-5" style={{ color: catColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm" style={{ fontWeight: 600 }}>{post.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{
                      backgroundColor: post.status === "published" ? "rgba(0,200,83,0.1)" : post.status === "draft" ? "rgba(158,158,158,0.1)" : "rgba(0,102,255,0.1)",
                      color: post.status === "published" ? "var(--iw-success)" : post.status === "draft" ? "var(--muted-foreground)" : "var(--iw-blue)",
                      fontWeight: 500,
                    }}>{post.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${catColor}15`, color: catColor, fontWeight: 500 }}>{post.category}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.publishedAt}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                    {post.views > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views.toLocaleString()}</span>}
                    {post.comments > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px]" style={{ borderColor: post.seoScore >= 80 ? "var(--iw-success)" : "var(--iw-warning)", color: post.seoScore >= 80 ? "var(--iw-success)" : "var(--iw-warning)", fontWeight: 600 }}>{post.seoScore}</div>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] text-primary" style={{ fontWeight: 600 }}>{post.authorInitials}</div>
                  </div>
                  <button className="p-1.5 rounded hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
