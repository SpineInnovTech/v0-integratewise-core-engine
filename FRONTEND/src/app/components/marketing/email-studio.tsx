import { useState } from "react";
import { Mail, Search, Plus, Send, Eye, Edit3, Copy, Clock, CheckCircle, Users, TrendingUp, MousePointerClick, MoreHorizontal } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  status: "sent" | "draft" | "scheduled" | "ab-testing";
  type: "campaign" | "nurture" | "transactional" | "newsletter";
  sentTo: number;
  openRate: number;
  clickRate: number;
  lastEdited: string;
  scheduledFor?: string;
}

const emails: EmailTemplate[] = [
  { id: "e1", name: "APAC RevOps Launch Announcement", subject: "Introducing IntegrateWise: Your APAC Integration Hub", status: "sent", type: "campaign", sentTo: 2340, openRate: 42.5, clickRate: 12.3, lastEdited: "Feb 5" },
  { id: "e2", name: "Integration Maturity Webinar Invite", subject: "Join us: Master Integration Maturity in 2026", status: "sent", type: "campaign", sentTo: 1890, openRate: 38.2, clickRate: 15.7, lastEdited: "Feb 1" },
  { id: "e3", name: "Weekly Digest - Feb W2", subject: "Your APAC Ops Weekly: Key Metrics & Insights", status: "scheduled", type: "newsletter", sentTo: 0, openRate: 0, clickRate: 0, lastEdited: "Feb 8", scheduledFor: "Feb 10, 9AM IST" },
  { id: "e4", name: "Customer Onboarding - Day 1", subject: "Welcome to IntegrateWise! Let's get started", status: "sent", type: "nurture", sentTo: 156, openRate: 68.4, clickRate: 45.2, lastEdited: "Jan 20" },
  { id: "e5", name: "Customer Onboarding - Day 7", subject: "Have you connected your first integration?", status: "sent", type: "nurture", sentTo: 142, openRate: 52.1, clickRate: 28.6, lastEdited: "Jan 20" },
  { id: "e6", name: "Renewal Reminder (30 Day)", subject: "Your IntegrateWise renewal is coming up", status: "sent", type: "transactional", sentTo: 45, openRate: 78.9, clickRate: 34.2, lastEdited: "Jan 15" },
  { id: "e7", name: "A/B Test: CTA Button Color", subject: "Unlock Deeper Insights with Intelligence Overlay", status: "ab-testing", type: "campaign", sentTo: 500, openRate: 35.6, clickRate: 11.8, lastEdited: "Feb 7" },
  { id: "e8", name: "Product Update: Multi-Tenant Support", subject: "New: Manage Multiple Workspaces with Ease", status: "draft", type: "campaign", sentTo: 0, openRate: 0, clickRate: 0, lastEdited: "Feb 9" },
];

const statusCfg: Record<string, { color: string; label: string }> = {
  sent: { color: "var(--iw-success)", label: "Sent" },
  draft: { color: "var(--muted-foreground)", label: "Draft" },
  scheduled: { color: "var(--iw-blue)", label: "Scheduled" },
  "ab-testing": { color: "var(--iw-purple)", label: "A/B Testing" },
};

const typeCfg: Record<string, string> = {
  campaign: "var(--iw-pink)",
  nurture: "var(--iw-success)",
  transactional: "var(--iw-warning)",
  newsletter: "var(--iw-blue)",
};

export function EmailStudioView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = emails.filter((e) => {
    if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    return true;
  });

  const sentEmails = emails.filter((e) => e.status === "sent");
  const avgOpen = sentEmails.length > 0 ? Math.round(sentEmails.reduce((s, e) => s + e.openRate, 0) / sentEmails.length * 10) / 10 : 0;
  const avgClick = sentEmails.length > 0 ? Math.round(sentEmails.reduce((s, e) => s + e.clickRate, 0) / sentEmails.length * 10) / 10 : 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Email Studio</h2>
          <p className="text-sm text-muted-foreground mt-1">Design, personalize, and automate email campaigns</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> New Email
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><Send className="w-4 h-4 text-[var(--iw-blue)]" /><span className="text-[10px] text-muted-foreground">Total Sent</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{emails.reduce((s, e) => s + e.sentTo, 0).toLocaleString()}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><Eye className="w-4 h-4 text-[var(--iw-success)]" /><span className="text-[10px] text-muted-foreground">Avg Open Rate</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{avgOpen}%</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><MousePointerClick className="w-4 h-4 text-[var(--iw-purple)]" /><span className="text-[10px] text-muted-foreground">Avg Click Rate</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{avgClick}%</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><Mail className="w-4 h-4 text-[var(--iw-warning)]" /><span className="text-[10px] text-muted-foreground">Templates</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{emails.length}</div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search emails..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Types</option>
          <option value="campaign">Campaign</option>
          <option value="nurture">Nurture</option>
          <option value="transactional">Transactional</option>
          <option value="newsletter">Newsletter</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((email) => {
          const sCfg = statusCfg[email.status];
          return (
            <div key={email.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${typeCfg[email.type]}15` }}>
                  <Mail className="w-5 h-5" style={{ color: typeCfg[email.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm" style={{ fontWeight: 600 }}>{email.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${sCfg.color}15`, color: sCfg.color, fontWeight: 500 }}>{sCfg.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize" style={{ fontWeight: 500 }}>{email.type}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">Subject: {email.subject}</div>
                  {email.status === "sent" || email.status === "ab-testing" ? (
                    <div className="flex gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {email.sentTo.toLocaleString()} recipients</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {email.openRate}% open</span>
                      <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {email.clickRate}% click</span>
                    </div>
                  ) : email.scheduledFor ? (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Scheduled for {email.scheduledFor}</div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">Last edited: {email.lastEdited}</div>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded hover:bg-secondary"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded hover:bg-secondary"><Edit3 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="p-1.5 rounded hover:bg-secondary"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
