import { useState } from "react";
import { FileSignature, Search, Plus, Eye, Download, CheckCircle, Clock, AlertTriangle, Send, Edit3, MoreHorizontal, DollarSign, Users } from "lucide-react";

interface Quote {
  id: string;
  number: string;
  title: string;
  company: string;
  contact: string;
  value: number;
  status: "draft" | "sent" | "viewed" | "accepted" | "expired" | "declined";
  createdAt: string;
  expiresAt: string;
  items: number;
  discount: number;
  owner: string;
  requiresApproval: boolean;
}

const quotes: Quote[] = [
  { id: "q1", number: "QT-2026-042", title: "Enterprise Integration Suite - Annual", company: "TechServe India Pvt Ltd", contact: "Ravi Sharma", value: 120000, status: "sent", createdAt: "Feb 7", expiresAt: "Feb 21", items: 3, discount: 10, owner: "Vikram R.", requiresApproval: false },
  { id: "q2", number: "QT-2026-041", title: "APAC Regional Deployment", company: "CloudBridge APAC", contact: "Mei Lin Chen", value: 85000, status: "viewed", createdAt: "Feb 5", expiresAt: "Feb 19", items: 2, discount: 5, owner: "Arun K.", requiresApproval: false },
  { id: "q3", number: "QT-2026-040", title: "RevOps Automation Package", company: "HealthTech Innovations", contact: "Dr. Priya Reddy", value: 65000, status: "accepted", createdAt: "Jan 28", expiresAt: "Feb 11", items: 2, discount: 0, owner: "Priya S.", requiresApproval: false },
  { id: "q4", number: "QT-2026-039", title: "Data Integration Platform - Custom", company: "DataVault Australia", contact: "Sarah Mitchell", value: 95000, status: "draft", createdAt: "Feb 9", expiresAt: "Feb 23", items: 4, discount: 15, owner: "Anjali P.", requiresApproval: true },
  { id: "q5", number: "QT-2026-038", title: "Renewal + API Access Expansion", company: "FinanceFlow Solutions", contact: "Suresh Iyer", value: 52000, status: "sent", createdAt: "Feb 4", expiresAt: "Feb 18", items: 2, discount: 8, owner: "Rajesh M.", requiresApproval: false },
  { id: "q6", number: "QT-2026-037", title: "Starter Integration Package", company: "RetailNest Pte Ltd", contact: "Arun Tiwari", value: 28000, status: "expired", createdAt: "Jan 15", expiresAt: "Jan 29", items: 1, discount: 0, owner: "Vikram R.", requiresApproval: false },
];

const statusCfg: Record<string, { color: string; label: string }> = {
  draft: { color: "var(--muted-foreground)", label: "Draft" },
  sent: { color: "var(--iw-blue)", label: "Sent" },
  viewed: { color: "var(--iw-purple)", label: "Viewed" },
  accepted: { color: "var(--iw-success)", label: "Accepted" },
  expired: { color: "var(--iw-danger)", label: "Expired" },
  declined: { color: "var(--iw-danger)", label: "Declined" },
};

export function QuotesView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = quotes.filter((q) => {
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase()) && !q.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && q.status !== statusFilter) return false;
    return true;
  });

  const totalValue = quotes.reduce((s, q) => s + q.value, 0);
  const accepted = quotes.filter((q) => q.status === "accepted");
  const pending = quotes.filter((q) => ["sent", "viewed"].includes(q.status));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Quotes & Contracts</h2>
          <p className="text-sm text-muted-foreground mt-1">Create, send, and track quotes with e-signature integration</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> New Quote
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-[var(--iw-blue)]" /><span className="text-[10px] text-muted-foreground">Total Quoted</span></div><div className="text-lg" style={{ fontWeight: 606 }}>${(totalValue / 1000).toFixed(0)}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-[var(--iw-success)]" /><span className="text-[10px] text-muted-foreground">Accepted</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{accepted.length} (${(accepted.reduce((s, q) => s + q.value, 0) / 1000).toFixed(0)}K)</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-[var(--iw-warning)]" /><span className="text-[10px] text-muted-foreground">Pending</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{pending.length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="flex items-center gap-2 mb-1"><FileSignature className="w-4 h-4 text-[var(--iw-purple)]" /><span className="text-[10px] text-muted-foreground">Win Rate</span></div><div className="text-lg" style={{ fontWeight: 600 }}>{Math.round(accepted.length / quotes.length * 100)}%</div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search quotes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
          <option value="all">All Status</option>
          {Object.entries(statusCfg).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Quote</th>
              <th className="text-right py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Value</th>
              <th className="text-center py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Status</th>
              <th className="text-center py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>Discount</th>
              <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 500 }}>Expires</th>
              <th className="text-right py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((quote) => {
              const sCfg = statusCfg[quote.status];
              return (
                <tr key={quote.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div style={{ fontWeight: 500 }}>{quote.title}</div>
                        <div className="text-[10px] text-muted-foreground">{quote.number} · {quote.company} · {quote.contact}</div>
                      </div>
                      {quote.requiresApproval && <AlertTriangle className="w-3.5 h-3.5 text-[var(--iw-warning)]" title="Requires approval" />}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right" style={{ fontWeight: 600 }}>${(quote.value / 1000).toFixed(0)}K</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${sCfg.color}15`, color: sCfg.color, fontWeight: 500 }}>{sCfg.label}</span>
                  </td>
                  <td className="py-3 px-4 text-center text-xs hidden md:table-cell">{quote.discount > 0 ? <span className="text-[var(--iw-warning)]">{quote.discount}%</span> : "—"}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground hidden lg:table-cell">{quote.expiresAt}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-1 justify-end">
                      <button className="p-1 rounded hover:bg-secondary"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button className="p-1 rounded hover:bg-secondary"><Download className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      {quote.status === "draft" && <button className="p-1 rounded hover:bg-secondary"><Send className="w-3.5 h-3.5 text-[var(--iw-blue)]" /></button>}
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
