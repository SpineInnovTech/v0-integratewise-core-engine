import { useState } from "react";
import { Share2, Plus, Eye, Heart, MessageCircle, Repeat2, Clock, CheckCircle, Calendar, TrendingUp, BarChart3, ExternalLink } from "lucide-react";

interface SocialPost {
  id: string;
  content: string;
  platform: "linkedin" | "twitter" | "facebook" | "instagram";
  status: "published" | "scheduled" | "draft";
  publishedAt: string;
  engagement: { likes: number; comments: number; shares: number; impressions: number };
  author: string;
}

const socialPosts: SocialPost[] = [
  { id: "s1", content: "Excited to announce IntegrateWise's new Multi-Tenant support! Manage multiple APAC workspaces with complete data isolation...", platform: "linkedin", status: "published", publishedAt: "Feb 7, 9:00 AM", engagement: { likes: 124, comments: 18, shares: 32, impressions: 4520 }, author: "Deepak J." },
  { id: "s2", content: "Integration Maturity isn't just a buzzword—it's a measurable framework. Here's how we define Level 0 through 5...", platform: "linkedin", status: "published", publishedAt: "Feb 5, 10:00 AM", engagement: { likes: 89, comments: 12, shares: 24, impressions: 3200 }, author: "Arun K." },
  { id: "s3", content: "Just shipped: RBAC with field-level access control. Your Analyst sees masked data while your Admin sees everything...", platform: "twitter", status: "published", publishedAt: "Feb 6, 2:00 PM", engagement: { likes: 45, comments: 8, shares: 15, impressions: 2100 }, author: "Arun K." },
  { id: "s4", content: "Join our webinar: 'Mastering Customer Health Scoring for APAC Markets' - Feb 15 at 2PM IST. Register now!", platform: "linkedin", status: "scheduled", publishedAt: "Feb 10, 9:00 AM", engagement: { likes: 0, comments: 0, shares: 0, impressions: 0 }, author: "Deepak J." },
  { id: "s5", content: "Behind the scenes: How our team in Bangalore builds AI agents that predict customer churn with 94% accuracy...", platform: "instagram", status: "draft", publishedAt: "—", engagement: { likes: 0, comments: 0, shares: 0, impressions: 0 }, author: "Priya S." },
  { id: "s6", content: "Data residency matters. Here's how we ensure your APAC data stays in APAC with per-tenant encryption...", platform: "twitter", status: "scheduled", publishedAt: "Feb 11, 3:00 PM", engagement: { likes: 0, comments: 0, shares: 0, impressions: 0 }, author: "Deepak J." },
];

const platformConfig: Record<string, { color: string; label: string }> = {
  linkedin: { color: "#0A66C2", label: "LinkedIn" },
  twitter: { color: "#1DA1F2", label: "X (Twitter)" },
  facebook: { color: "#1877F2", label: "Facebook" },
  instagram: { color: "#E4405F", label: "Instagram" },
};

const bestTimes = [
  { day: "Monday", time: "9:00 AM IST", engagement: "High" },
  { day: "Tuesday", time: "10:00 AM IST", engagement: "High" },
  { day: "Wednesday", time: "2:00 PM IST", engagement: "Medium" },
  { day: "Thursday", time: "9:00 AM IST", engagement: "High" },
  { day: "Friday", time: "11:00 AM IST", engagement: "Medium" },
];

export function SocialView() {
  const [platformFilter, setPlatformFilter] = useState("all");

  const filtered = socialPosts.filter((p) => {
    if (platformFilter !== "all" && p.platform !== platformFilter) return false;
    return true;
  });

  const totalImpressions = socialPosts.reduce((s, p) => s + p.engagement.impressions, 0);
  const totalEngagement = socialPosts.reduce((s, p) => s + p.engagement.likes + p.engagement.comments + p.engagement.shares, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Social Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">Multi-platform social media management and analytics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Total Impressions</div><div className="text-lg" style={{ fontWeight: 600 }}>{(totalImpressions / 1000).toFixed(1)}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Total Engagement</div><div className="text-lg" style={{ fontWeight: 600 }}>{totalEngagement}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Published</div><div className="text-lg" style={{ fontWeight: 600 }}>{socialPosts.filter((p) => p.status === "published").length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Scheduled</div><div className="text-lg" style={{ fontWeight: 600 }}>{socialPosts.filter((p) => p.status === "scheduled").length}</div></div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setPlatformFilter("all")} className={`px-3 py-1.5 rounded-md text-xs transition-all ${platformFilter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>All</button>
        {Object.entries(platformConfig).map(([key, cfg]) => (
          <button key={key} onClick={() => setPlatformFilter(key)} className={`px-3 py-1.5 rounded-md text-xs transition-all ${platformFilter === key ? "text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`} style={platformFilter === key ? { backgroundColor: cfg.color } : undefined}>{cfg.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filtered.map((post) => {
            const pCfg = platformConfig[post.platform];
            return (
              <div key={post.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px]" style={{ backgroundColor: pCfg.color, fontWeight: 600 }}>{pCfg.label[0]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs" style={{ fontWeight: 500 }}>{pCfg.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{
                        backgroundColor: post.status === "published" ? "rgba(0,200,83,0.1)" : post.status === "scheduled" ? "rgba(0,102,255,0.1)" : "rgba(158,158,158,0.1)",
                        color: post.status === "published" ? "var(--iw-success)" : post.status === "scheduled" ? "var(--iw-blue)" : "var(--muted-foreground)",
                        fontWeight: 500,
                      }}>{post.status}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{post.publishedAt}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{post.content}</p>
                  </div>
                </div>
                {post.status === "published" && (
                  <div className="flex gap-4 pt-2 border-t border-border text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.engagement.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.engagement.comments}</span>
                    <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> {post.engagement.shares}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.engagement.impressions.toLocaleString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="mb-3">Best Times to Post</h3>
            <div className="space-y-2">
              {bestTimes.map((bt) => (
                <div key={bt.day} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                  <div>
                    <div className="text-xs" style={{ fontWeight: 500 }}>{bt.day}</div>
                    <div className="text-[10px] text-muted-foreground">{bt.time}</div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${bt.engagement === "High" ? "bg-[var(--iw-success)]/10 text-[var(--iw-success)]" : "bg-[var(--iw-warning)]/10 text-[var(--iw-warning)]"}`} style={{ fontWeight: 500 }}>{bt.engagement}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="mb-3">Hashtag Suggestions</h3>
            <div className="flex flex-wrap gap-1.5">
              {["#RevOps", "#APAC", "#IntegrationMaturity", "#SaaS", "#DataDriven", "#CustomerSuccess", "#B2BSaaS", "#WorkflowAutomation", "#AI", "#OperationsExcellence"].map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground hover:bg-accent cursor-pointer transition-colors">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
