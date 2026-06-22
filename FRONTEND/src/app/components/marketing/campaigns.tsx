import { useState } from "react";
import { Megaphone, Search, Plus, Play, Pause, CheckCircle, Clock, Eye, TrendingUp, DollarSign, Mail, Share2, Target, MoreHorizontal, Filter, BarChart3 } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed" | "draft";
  channel: "email" | "social" | "ads" | "multi-channel";
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  revenue: number;
  roi: number;
  owner: string;
}

const campaigns: Campaign[] = [
  { id: "c1", name: "APAC RevOps Launch Campaign", status: "active", channel: "multi-channel", startDate: "Jan 15", endDate: "Mar 15", budget: 15000, spent: 8200, leads: 342, conversions: 28, revenue: 84000, roi: 924, owner: "Deepak J." },
  { id: "c2", name: "Integration Maturity Webinar Series", status: "active", channel: "email", startDate: "Feb 1", endDate: "Feb 28", budget: 5000, spent: 3100, leads: 189, conversions: 15, revenue: 45000, roi: 1352, owner: "Deepak J." },
  { id: "c3", name: "LinkedIn Thought Leadership", status: "active", channel: "social", startDate: "Jan 1", endDate: "Ongoing", budget: 8000, spent: 4500, leads: 156, conversions: 8, revenue: 24000, roi: 433, owner: "Priya S." },
  { id: "c4", name: "Google Ads - India Market", status: "paused", channel: "ads", startDate: "Dec 1", endDate: "Feb 15", budget: 12000, spent: 9800, leads: 267, conversions: 12, revenue: 36000, roi: 267, owner: "Vikram R." },
  { id: "c5", name: "Customer Success Stories", status: "completed", channel: "multi-channel", startDate: "Nov 1", endDate: "Jan 31", budget: 6000, spent: 5800, leads: 124, conversions: 18, revenue: 54000, roi: 831, owner: "Anjali P." },
  { id: "c6", name: "Q1 Product Launch Email Blast", status: "draft", channel: "email", startDate: "Feb 15", endDate: "Feb 28", budget: 3000, spent: 0, leads: 0, conversions: 0, revenue: 0, roi: 0, owner: "Deepak J." },
];

const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  social: Share2,
  ads: Target,
  "multi-channel": Megaphone,
};

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: "var(--iw-success)", label: "Active" },
  paused: { color: "var(--iw-warning)", label: "Paused" },
  completed: { color: "var(--iw-blue)", label: "Completed" },
  draft: { color: "var(--muted-foreground)", label: "Draft" },
};

export function CampaignsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = campaigns.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">Multi-channel campaign management and performance tracking</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><Eye className="w-4 h-4 text-[var(--iw-blue)]" /><span className="text-[10px] text-muted-foreground">Total Leads</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{totalLeads.toLocaleString()}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-[var(--iw-success)]" /><span className="text-[10px] text-muted-foreground">Revenue</span></div><div className="text-lg" style={{ fontWeight: 600 }}>${(totalRevenue / 1000).toFixed(0)}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-[var(--iw-purple)]" /><span className="text-[10px] text-muted-foreground">Avg ROI</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{Math.round(campaigns.filter((c) => c.roi > 0).reduce((s, c) => s + c.roi, 0) / campaigns.filter((c) => c.roi > 0).length)}%</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-[var(--iw-warning)]" /><span className="text-[10px] text-muted-foreground">Total Spend</span></div><div className="text-lg" style={{ fontWeight: 600 }}>${(totalSpent / 1000).toFixed(1)}K</div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search campaigns..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Status</option>
          {Object.entries(statusConfig).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((campaign) => {
          const sCfg = statusConfig[campaign.status];
          const ChannelIcon = channelIcons[campaign.channel];
          const budgetPct = campaign.budget > 0 ? Math.round((campaign.spent / campaign.budget) * 100) : 0;
          return (
            <div key={campaign.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${sCfg.color}15` }}>
                    <ChannelIcon className="w-4 h-4" style={{ color: sCfg.color }} />
                  </div>
                  <div>
                    <div className="text-sm" style={{ fontWeight: 600 }}>{campaign.name}</div>
                    <div className="text-[10px] text-muted-foreground">{campaign.startDate} — {campaign.endDate} · {campaign.owner}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${sCfg.color}15`, color: sCfg.color, fontWeight: 500 }}>{sCfg.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize" style={{ fontWeight: 500 }}>{campaign.channel}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                <div className="p-2 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Leads</div>
                  <div className="text-sm" style={{ fontWeight: 600 }}>{campaign.leads}</div>
                </div>
                <div className="p-2 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Conversions</div>
                  <div className="text-sm" style={{ fontWeight: 600 }}>{campaign.conversions}</div>
                </div>
                <div className="p-2 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Revenue</div>
                  <div className="text-sm" style={{ fontWeight: 600 }}>${(campaign.revenue / 1000).toFixed(0)}K</div>
                </div>
                <div className="p-2 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">ROI</div>
                  <div className="text-sm" style={{ fontWeight: 600, color: campaign.roi > 500 ? "var(--iw-success)" : campaign.roi > 0 ? "var(--iw-blue)" : "var(--muted-foreground)" }}>{campaign.roi > 0 ? `${campaign.roi}%` : "—"}</div>
                </div>
                <div className="p-2 rounded bg-secondary/50">
                  <div className="text-[9px] text-muted-foreground mb-1">Budget ({budgetPct}%)</div>
                  <div className="w-full h-1.5 bg-accent rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${budgetPct}%`, backgroundColor: budgetPct > 90 ? "var(--iw-danger)" : budgetPct > 70 ? "var(--iw-warning)" : "var(--iw-blue)" }} />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">${(campaign.spent / 1000).toFixed(1)}K / ${(campaign.budget / 1000).toFixed(0)}K</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
