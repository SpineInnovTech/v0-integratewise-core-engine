import { useState } from "react";
import { TrendingUp, Search, Plus, DollarSign, Clock, User, Calendar, FileText, Phone, Mail, ChevronRight, MoreHorizontal, CheckCircle, AlertTriangle, X } from "lucide-react";

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  probability: number;
  closeDate: string;
  daysInStage: number;
  owner: { name: string; initials: string };
  lastActivity: string;
  competitors: string[];
  products: string[];
  nextStep: string;
  risk: "low" | "medium" | "high";
}

const deals: Deal[] = [
  { id: "d1", name: "Enterprise Integration Suite", company: "TechServe India Pvt Ltd", value: 120000, stage: "Negotiation", probability: 75, closeDate: "Feb 28", daysInStage: 8, owner: { name: "Vikram R.", initials: "VR" }, lastActivity: "2h ago", competitors: ["Segment", "Tray.io"], products: ["Enterprise Plan", "BYOM Add-on"], nextStep: "Final pricing review", risk: "low" },
  { id: "d2", name: "APAC Regional Deployment", company: "CloudBridge APAC", value: 85000, stage: "Proposal", probability: 60, closeDate: "Mar 15", daysInStage: 5, owner: { name: "Arun K.", initials: "AK" }, lastActivity: "1d ago", competitors: ["Workato"], products: ["Professional Plan"], nextStep: "Schedule technical demo", risk: "medium" },
  { id: "d3", name: "Data Integration Platform", company: "DataVault Australia", value: 95000, stage: "Discovery", probability: 30, closeDate: "Apr 10", daysInStage: 12, owner: { name: "Anjali P.", initials: "AP" }, lastActivity: "3h ago", competitors: ["MuleSoft", "Boomi"], products: ["Enterprise Plan", "Custom Connectors"], nextStep: "Requirements gathering call", risk: "medium" },
  { id: "d4", name: "RevOps Automation Package", company: "HealthTech Innovations", value: 65000, stage: "Closed Won", probability: 100, closeDate: "Feb 5", daysInStage: 0, owner: { name: "Priya S.", initials: "PS" }, lastActivity: "4d ago", competitors: [], products: ["Professional Plan"], nextStep: "Onboarding kickoff", risk: "low" },
  { id: "d5", name: "Basic Integration Setup", company: "RetailNest Pte Ltd", value: 28000, stage: "Qualification", probability: 20, closeDate: "Mar 30", daysInStage: 3, owner: { name: "Vikram R.", initials: "VR" }, lastActivity: "6h ago", competitors: ["Zapier"], products: ["Starter Plan"], nextStep: "Budget confirmation", risk: "high" },
  { id: "d6", name: "Renewal + Expansion", company: "FinanceFlow Solutions", value: 52000, stage: "Negotiation", probability: 50, closeDate: "Mar 10", daysInStage: 14, owner: { name: "Rajesh M.", initials: "RM" }, lastActivity: "5d ago", competitors: [], products: ["Professional Plan", "API Access"], nextStep: "Address churn risk concerns", risk: "high" },
];

const riskColors: Record<string, string> = { low: "var(--iw-success)", medium: "var(--iw-warning)", high: "var(--iw-danger)" };

export function DealsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const filtered = deals.filter((d) => {
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase()) && !d.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalValue = deals.reduce((s, d) => s + d.value, 0);
  const weightedValue = deals.reduce((s, d) => s + d.value * d.probability / 100, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Deals</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage deal lifecycle, competitors, and revenue forecasting</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Pipeline Value</div><div className="text-lg" style={{ fontWeight: 600 }}>${(totalValue / 1000).toFixed(0)}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Weighted Value</div><div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-blue)" }}>${(weightedValue / 1000).toFixed(0)}K</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Active Deals</div><div className="text-lg" style={{ fontWeight: 600 }}>{deals.filter((d) => d.stage !== "Closed Won").length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Won This Month</div><div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-success)" }}>{deals.filter((d) => d.stage === "Closed Won").length}</div></div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search deals..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Deal</th>
              <th className="text-right py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Value</th>
              <th className="text-center py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>Stage</th>
              <th className="text-center py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 500 }}>Probability</th>
              <th className="text-center py-2.5 px-4 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 500 }}>Risk</th>
              <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden xl:table-cell" style={{ fontWeight: 500 }}>Close Date</th>
              <th className="text-right py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((deal) => (
              <tr key={deal.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelectedDeal(deal)}>
                <td className="py-3 px-4">
                  <div style={{ fontWeight: 500 }}>{deal.name}</div>
                  <div className="text-[10px] text-muted-foreground">{deal.company}</div>
                </td>
                <td className="py-3 px-4 text-right" style={{ fontWeight: 600 }}>${(deal.value / 1000).toFixed(0)}K</td>
                <td className="py-3 px-4 text-center hidden md:table-cell">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary" style={{ fontWeight: 500 }}>{deal.stage}</span>
                </td>
                <td className="py-3 px-4 text-center hidden lg:table-cell">
                  <span className="text-xs" style={{ fontWeight: 500 }}>{deal.probability}%</span>
                </td>
                <td className="py-3 px-4 text-center hidden sm:table-cell">
                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${riskColors[deal.risk]}15`, color: riskColors[deal.risk], fontWeight: 500 }}>{deal.risk}</span>
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground hidden xl:table-cell">{deal.closeDate}</td>
                <td className="py-3 px-4 text-right">
                  <button className="p-1 rounded hover:bg-secondary"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deal Detail Drawer */}
      {selectedDeal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedDeal(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-[420px] max-w-[90vw] bg-card border-l border-border shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
              <h3>Deal Details</h3>
              <button onClick={() => setSelectedDeal(null)} className="p-1.5 rounded-md hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-lg" style={{ fontWeight: 600 }}>{selectedDeal.name}</div>
                <div className="text-sm text-muted-foreground">{selectedDeal.company}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-secondary/50"><div className="text-[10px] text-muted-foreground">Value</div><div className="text-sm" style={{ fontWeight: 600 }}>${(selectedDeal.value / 1000).toFixed(0)}K</div></div>
                <div className="p-2 rounded bg-secondary/50"><div className="text-[10px] text-muted-foreground">Stage</div><div className="text-sm" style={{ fontWeight: 500 }}>{selectedDeal.stage}</div></div>
                <div className="p-2 rounded bg-secondary/50"><div className="text-[10px] text-muted-foreground">Probability</div><div className="text-sm" style={{ fontWeight: 500 }}>{selectedDeal.probability}%</div></div>
                <div className="p-2 rounded bg-secondary/50"><div className="text-[10px] text-muted-foreground">Close Date</div><div className="text-sm" style={{ fontWeight: 500 }}>{selectedDeal.closeDate}</div></div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider" style={{ fontWeight: 600 }}>Next Step</div>
                <div className="p-3 rounded-md bg-primary/5 border border-primary/20 text-sm">{selectedDeal.nextStep}</div>
              </div>
              {selectedDeal.competitors.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider" style={{ fontWeight: 600 }}>Competitors</div>
                  <div className="flex gap-2">{selectedDeal.competitors.map((c) => (<span key={c} className="text-[10px] px-2 py-1 rounded bg-[var(--iw-danger)]/10 text-[var(--iw-danger)]" style={{ fontWeight: 500 }}>{c}</span>))}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider" style={{ fontWeight: 600 }}>Products</div>
                <div className="flex gap-2 flex-wrap">{selectedDeal.products.map((p) => (<span key={p} className="text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>{p}</span>))}</div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] text-primary" style={{ fontWeight: 600 }}>{selectedDeal.owner.initials}</div>
                <span>{selectedDeal.owner.name}</span>
                <span className="ml-auto">Last activity: {selectedDeal.lastActivity}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
