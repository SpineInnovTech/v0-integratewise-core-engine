import { useState } from "react";
import { Users, Search, Plus, Phone, Mail, Calendar, Building2, Star, MoreHorizontal, TrendingUp, CheckCircle, MessageCircle } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  initials: string;
  tier: "champion" | "decision-maker" | "influencer" | "user";
  healthScore: number;
  lastContact: string;
  engagementLevel: "high" | "medium" | "low";
  deals: number;
  meetings: number;
  emails: number;
}

const contacts: Contact[] = [
  { id: "ct1", name: "Ravi Sharma", email: "ravi.sharma@techserve.in", phone: "+91 98xxx xxxxx", company: "TechServe India Pvt Ltd", title: "CTO", initials: "RS", tier: "champion", healthScore: 92, lastContact: "2h ago", engagementLevel: "high", deals: 2, meetings: 8, emails: 24 },
  { id: "ct2", name: "Mei Lin Chen", email: "meilin@cloudbridge.sg", phone: "+65 9xxx xxxx", company: "CloudBridge APAC", title: "VP Operations", initials: "MC", tier: "decision-maker", healthScore: 78, lastContact: "1d ago", engagementLevel: "medium", deals: 1, meetings: 4, emails: 12 },
  { id: "ct3", name: "Suresh Iyer", email: "suresh.iyer@financeflow.in", phone: "+91 97xxx xxxxx", company: "FinanceFlow Solutions", title: "Head of RevOps", initials: "SI", tier: "decision-maker", healthScore: 54, lastContact: "5d ago", engagementLevel: "low", deals: 1, meetings: 2, emails: 6 },
  { id: "ct4", name: "Sarah Mitchell", email: "sarah.m@datavault.au", phone: "+61 4xx xxx xxx", company: "DataVault Australia", title: "CEO", initials: "SM", tier: "champion", healthScore: 88, lastContact: "3h ago", engagementLevel: "high", deals: 1, meetings: 6, emails: 18 },
  { id: "ct5", name: "Arun Tiwari", email: "arun.t@retailnest.sg", phone: "+65 8xxx xxxx", company: "RetailNest Pte Ltd", title: "Director of IT", initials: "AT", tier: "influencer", healthScore: 71, lastContact: "12h ago", engagementLevel: "medium", deals: 1, meetings: 3, emails: 8 },
  { id: "ct6", name: "Dr. Priya Reddy", email: "priya.r@healthtech.in", phone: "+91 99xxx xxxxx", company: "HealthTech Innovations", title: "COO", initials: "PR", tier: "champion", healthScore: 95, lastContact: "6h ago", engagementLevel: "high", deals: 1, meetings: 5, emails: 15 },
  { id: "ct7", name: "Rajiv Kumar", email: "rajiv.k@logiprime.in", phone: "+91 98xxx xxxxx", company: "LogiPrime Corp", title: "VP Technology", initials: "RK", tier: "decision-maker", healthScore: 42, lastContact: "8d ago", engagementLevel: "low", deals: 0, meetings: 1, emails: 3 },
  { id: "ct8", name: "Anita Desai", email: "anita.d@eduspark.in", phone: "+91 96xxx xxxxx", company: "EduSpark Learning", title: "Founder", initials: "AD", tier: "champion", healthScore: 83, lastContact: "1d ago", engagementLevel: "high", deals: 1, meetings: 4, emails: 10 },
];

const tierColors: Record<string, { color: string; label: string }> = {
  champion: { color: "var(--iw-success)", label: "Champion" },
  "decision-maker": { color: "var(--iw-blue)", label: "Decision Maker" },
  influencer: { color: "var(--iw-purple)", label: "Influencer" },
  user: { color: "var(--muted-foreground)", label: "User" },
};

const engColors: Record<string, string> = { high: "var(--iw-success)", medium: "var(--iw-warning)", low: "var(--iw-danger)" };

export function ContactsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const filtered = contacts.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (tierFilter !== "all" && c.tier !== tierFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Contacts & Accounts</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage contacts with engagement heatmaps and deal associations</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search contacts or companies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Tiers</option>
          {Object.entries(tierColors).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((contact) => {
          const tCfg = tierColors[contact.tier];
          return (
            <div key={contact.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" style={{ backgroundColor: tCfg.color, fontWeight: 600 }}>{contact.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ fontWeight: 600 }}>{contact.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${tCfg.color}15`, color: tCfg.color, fontWeight: 500 }}>{tCfg.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{contact.title} · {contact.company}</div>
                </div>
                <div className="text-center flex-shrink-0">
                  <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px]" style={{ borderColor: contact.healthScore >= 80 ? "var(--iw-success)" : contact.healthScore >= 60 ? "var(--iw-warning)" : "var(--iw-danger)", color: contact.healthScore >= 80 ? "var(--iw-success)" : contact.healthScore >= 60 ? "var(--iw-warning)" : "var(--iw-danger)", fontWeight: 600 }}>{contact.healthScore}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Health</div>
                </div>
              </div>

              {/* Engagement Heatmap */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Meetings</div>
                  <div className="text-xs" style={{ fontWeight: 600 }}>{contact.meetings}</div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Emails</div>
                  <div className="text-xs" style={{ fontWeight: 600 }}>{contact.emails}</div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Deals</div>
                  <div className="text-xs" style={{ fontWeight: 600 }}>{contact.deals}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: engColors[contact.engagementLevel] }} /> {contact.engagementLevel} engagement</span>
                  <span>· {contact.lastContact}</span>
                </div>
                <div className="flex gap-1">
                  <button className="p-1 rounded hover:bg-secondary" title="Call"><Phone className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="p-1 rounded hover:bg-secondary" title="Email"><Mail className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button className="p-1 rounded hover:bg-secondary" title="Schedule"><Calendar className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
