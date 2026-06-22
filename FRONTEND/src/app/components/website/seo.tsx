import { useState } from "react";
import { Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Globe, ExternalLink, ArrowUpRight, Link2, FileWarning, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const seoPages = [
  { page: "Home", score: 92, issues: 1, indexed: true, clicks: 4520, impressions: 23400 },
  { page: "Documentation", score: 94, issues: 0, indexed: true, clicks: 3200, impressions: 18700 },
  { page: "Blog", score: 90, issues: 1, indexed: true, clicks: 2800, impressions: 15600 },
  { page: "Pricing", score: 88, issues: 2, indexed: true, clicks: 2100, impressions: 12800 },
  { page: "About Us", score: 85, issues: 2, indexed: true, clicks: 890, impressions: 5400 },
  { page: "Contact", score: 82, issues: 3, indexed: true, clicks: 1200, impressions: 6200 },
  { page: "APAC Solutions", score: 76, issues: 4, indexed: true, clicks: 560, impressions: 3100 },
  { page: "Careers", score: 68, issues: 5, indexed: false, clicks: 340, impressions: 2800 },
];

const keywords = [
  { keyword: "integration management platform", position: 4, change: 2, volume: 1200 },
  { keyword: "APAC RevOps tools", position: 2, change: 1, volume: 890 },
  { keyword: "customer health scoring", position: 6, change: -1, volume: 720 },
  { keyword: "multi-tenant SaaS platform", position: 8, change: 3, volume: 560 },
  { keyword: "workflow automation India", position: 3, change: 0, volume: 1450 },
  { keyword: "data integration Singapore", position: 5, change: 2, volume: 680 },
];

const coreWebVitals = [
  { metric: "LCP (Largest Contentful Paint)", value: "1.8s", status: "good", threshold: "<2.5s" },
  { metric: "FID (First Input Delay)", value: "45ms", status: "good", threshold: "<100ms" },
  { metric: "CLS (Cumulative Layout Shift)", value: "0.08", status: "good", threshold: "<0.1" },
  { metric: "TTFB (Time to First Byte)", value: "320ms", status: "needs-improvement", threshold: "<500ms" },
  { metric: "FCP (First Contentful Paint)", value: "1.2s", status: "good", threshold: "<1.8s" },
  { metric: "INP (Interaction to Next Paint)", value: "180ms", status: "needs-improvement", threshold: "<200ms" },
];

const technicalIssues = [
  { issue: "Missing alt text on 3 images", severity: "warning", pages: 2 },
  { issue: "Duplicate meta descriptions", severity: "warning", pages: 1 },
  { issue: "Careers page not indexed", severity: "error", pages: 1 },
  { issue: "Mixed content (HTTP/HTTPS)", severity: "error", pages: 1 },
  { issue: "Missing Open Graph tags", severity: "info", pages: 3 },
  { issue: "Schema markup incomplete", severity: "info", pages: 4 },
];

const searchPerformance = [
  { week: "W1", clicks: 1200, impressions: 8500 },
  { week: "W2", clicks: 1350, impressions: 9200 },
  { week: "W3", clicks: 1180, impressions: 8800 },
  { week: "W4", clicks: 1520, impressions: 10100 },
  { week: "W5", clicks: 1680, impressions: 11400 },
  { week: "W6", clicks: 1890, impressions: 12600 },
];

export function SeoView() {
  const [tab, setTab] = useState<"overview" | "keywords" | "technical">("overview");
  const avgScore = Math.round(seoPages.reduce((s, p) => s + p.score, 0) / seoPages.length);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>SEO Center</h2>
          <p className="text-sm text-muted-foreground mt-1">Site-wide health scoring, technical audits, and keyword tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Site SEO Score</div><div className="text-xl" style={{ fontWeight: 600, color: avgScore >= 80 ? "var(--iw-success)" : "var(--iw-warning)" }}>{avgScore}/100</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Indexed Pages</div><div className="text-xl" style={{ fontWeight: 600 }}>{seoPages.filter((p) => p.indexed).length}/{seoPages.length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Total Clicks (6w)</div><div className="text-xl" style={{ fontWeight: 600, color: "var(--iw-blue)" }}>{(searchPerformance.reduce((s, w) => s + w.clicks, 0) / 1000).toFixed(1)}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Technical Issues</div><div className="text-xl" style={{ fontWeight: 600, color: "var(--iw-warning)" }}>{technicalIssues.length}</div></div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {[{ id: "overview" as const, label: "Overview" }, { id: "keywords" as const, label: "Keywords" }, { id: "technical" as const, label: "Technical Audit" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm border-b-2 transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`} style={{ fontWeight: tab === t.id ? 500 : 400 }}>{t.label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="mb-4">Search Performance (Weekly)</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={searchPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="clicks" fill="var(--iw-blue)" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="mb-4">Core Web Vitals</h3>
              <div className="space-y-3">
                {coreWebVitals.map((v) => (
                  <div key={v.metric} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                    <div>
                      <div className="text-xs" style={{ fontWeight: 500 }}>{v.metric}</div>
                      <div className="text-[10px] text-muted-foreground">Target: {v.threshold}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ fontWeight: 600 }}>{v.value}</span>
                      {v.status === "good" ? <CheckCircle className="w-4 h-4 text-[var(--iw-success)]" /> : <AlertTriangle className="w-4 h-4 text-[var(--iw-warning)]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><h3>Page SEO Scores</h3></div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Page</th>
                  <th className="text-center py-2 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Score</th>
                  <th className="text-center py-2 px-4 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>Issues</th>
                  <th className="text-center py-2 px-4 text-xs text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 500 }}>Indexed</th>
                  <th className="text-right py-2 px-4 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 500 }}>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {seoPages.map((p) => (
                  <tr key={p.page} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-4" style={{ fontWeight: 500 }}>{p.page}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${p.score >= 80 ? "var(--iw-success)" : p.score >= 60 ? "var(--iw-warning)" : "var(--iw-danger)"}15`, color: p.score >= 80 ? "var(--iw-success)" : p.score >= 60 ? "var(--iw-warning)" : "var(--iw-danger)", fontWeight: 600 }}>{p.score}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center text-xs hidden md:table-cell">{p.issues > 0 ? <span className="text-[var(--iw-warning)]">{p.issues}</span> : <CheckCircle className="w-4 h-4 text-[var(--iw-success)] mx-auto" />}</td>
                    <td className="py-2.5 px-4 text-center hidden lg:table-cell">{p.indexed ? <CheckCircle className="w-4 h-4 text-[var(--iw-success)] mx-auto" /> : <AlertTriangle className="w-4 h-4 text-[var(--iw-warning)] mx-auto" />}</td>
                    <td className="py-2.5 px-4 text-right text-xs text-muted-foreground hidden sm:table-cell">{p.clicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "keywords" && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Keyword</th>
                <th className="text-center py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Position</th>
                <th className="text-center py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Change</th>
                <th className="text-right py-2.5 px-4 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 500 }}>Monthly Volume</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw) => (
                <tr key={kw.keyword} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4" style={{ fontWeight: 500 }}>{kw.keyword}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm px-2 py-0.5 rounded bg-secondary" style={{ fontWeight: 600 }}>#{kw.position}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {kw.change > 0 ? <span className="text-[var(--iw-success)] text-xs flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> +{kw.change}</span> :
                     kw.change < 0 ? <span className="text-[var(--iw-danger)] text-xs flex items-center justify-center gap-1"><TrendingDown className="w-3 h-3" /> {kw.change}</span> :
                     <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-muted-foreground hidden sm:table-cell">{kw.volume.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "technical" && (
        <div className="space-y-4">
          {technicalIssues.map((issue, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${issue.severity === "error" ? "bg-[var(--iw-danger)]/10" : issue.severity === "warning" ? "bg-[var(--iw-warning)]/10" : "bg-[var(--iw-blue)]/10"}`}>
                {issue.severity === "error" ? <AlertTriangle className="w-4 h-4 text-[var(--iw-danger)]" /> : issue.severity === "warning" ? <FileWarning className="w-4 h-4 text-[var(--iw-warning)]" /> : <Zap className="w-4 h-4 text-[var(--iw-blue)]" />}
              </div>
              <div className="flex-1">
                <div className="text-sm" style={{ fontWeight: 500 }}>{issue.issue}</div>
                <div className="text-[10px] text-muted-foreground">{issue.pages} page{issue.pages > 1 ? "s" : ""} affected</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{
                backgroundColor: issue.severity === "error" ? "rgba(244,67,54,0.1)" : issue.severity === "warning" ? "rgba(255,152,0,0.1)" : "rgba(0,102,255,0.1)",
                color: issue.severity === "error" ? "var(--iw-danger)" : issue.severity === "warning" ? "var(--iw-warning)" : "var(--iw-blue)",
                fontWeight: 500,
              }}>{issue.severity}</span>
              <button className="text-xs text-primary hover:underline">Fix</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
