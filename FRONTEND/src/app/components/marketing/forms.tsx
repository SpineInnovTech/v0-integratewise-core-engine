import { useState } from "react";
import { FormInput, Search, Plus, Eye, Edit3, Copy, CheckCircle, Users, TrendingUp, BarChart3, ExternalLink, MoreHorizontal } from "lucide-react";

interface FormItem {
  id: string;
  name: string;
  type: "lead-gen" | "contact" | "feedback" | "registration" | "landing-page";
  status: "active" | "draft" | "archived";
  submissions: number;
  conversionRate: number;
  views: number;
  lastSubmission: string;
  fields: number;
  crmConnected: boolean;
}

const forms: FormItem[] = [
  { id: "f1", name: "APAC Demo Request", type: "lead-gen", status: "active", submissions: 234, conversionRate: 18.5, views: 1265, lastSubmission: "2h ago", fields: 6, crmConnected: true },
  { id: "f2", name: "Contact Sales", type: "contact", status: "active", submissions: 156, conversionRate: 12.3, views: 1268, lastSubmission: "5h ago", fields: 5, crmConnected: true },
  { id: "f3", name: "Webinar Registration", type: "registration", status: "active", submissions: 189, conversionRate: 34.2, views: 553, lastSubmission: "1d ago", fields: 4, crmConnected: true },
  { id: "f4", name: "NPS Survey Q1", type: "feedback", status: "active", submissions: 78, conversionRate: 62.4, views: 125, lastSubmission: "3d ago", fields: 3, crmConnected: false },
  { id: "f5", name: "Free Trial Signup", type: "lead-gen", status: "active", submissions: 412, conversionRate: 22.1, views: 1864, lastSubmission: "30 min ago", fields: 5, crmConnected: true },
  { id: "f6", name: "Partner Application", type: "contact", status: "draft", submissions: 0, conversionRate: 0, views: 0, lastSubmission: "—", fields: 8, crmConnected: false },
  { id: "f7", name: "Integration Solutions Landing", type: "landing-page", status: "active", submissions: 89, conversionRate: 8.7, views: 1023, lastSubmission: "6h ago", fields: 4, crmConnected: true },
];

const typeColors: Record<string, string> = {
  "lead-gen": "var(--iw-success)",
  contact: "var(--iw-blue)",
  feedback: "var(--iw-purple)",
  registration: "var(--iw-pink)",
  "landing-page": "var(--iw-warning)",
};

export function FormsView() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = forms.filter((f) => {
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Forms & Landing Pages</h2>
          <p className="text-sm text-muted-foreground mt-1">Build lead capture forms and landing pages with conversion tracking</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
          <Plus className="w-4 h-4" /> New Form
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Total Submissions</div><div className="text-lg" style={{ fontWeight: 600 }}>{forms.reduce((s, f) => s + f.submissions, 0).toLocaleString()}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Active Forms</div><div className="text-lg" style={{ fontWeight: 600 }}>{forms.filter((f) => f.status === "active").length}</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">Avg Conversion</div><div className="text-lg" style={{ fontWeight: 600, color: "var(--iw-success)" }}>{Math.round(forms.filter((f) => f.conversionRate > 0).reduce((s, f) => s + f.conversionRate, 0) / forms.filter((f) => f.conversionRate > 0).length * 10) / 10}%</div></div>
        <div className="bg-card border border-border rounded-lg p-3"><div className="text-[10px] text-muted-foreground mb-1">CRM Connected</div><div className="text-lg" style={{ fontWeight: 600 }}>{forms.filter((f) => f.crmConnected).length}/{forms.length}</div></div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search forms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((form) => {
          const typeColor = typeColors[form.type] || "var(--muted-foreground)";
          return (
            <div key={form.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${typeColor}15` }}>
                    <FormInput className="w-4 h-4" style={{ color: typeColor }} />
                  </div>
                  <div>
                    <div className="text-sm" style={{ fontWeight: 600 }}>{form.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: `${typeColor}15`, color: typeColor, fontWeight: 500 }}>{form.type.replace("-", " ")}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: form.status === "active" ? "rgba(0,200,83,0.1)" : "rgba(158,158,158,0.1)", color: form.status === "active" ? "var(--iw-success)" : "var(--muted-foreground)", fontWeight: 500 }}>{form.status}</span>
                    </div>
                  </div>
                </div>
                <button className="p-1.5 rounded hover:bg-secondary"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Submissions</div>
                  <div className="text-xs" style={{ fontWeight: 600 }}>{form.submissions}</div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Conversion</div>
                  <div className="text-xs" style={{ fontWeight: 600, color: form.conversionRate >= 20 ? "var(--iw-success)" : "inherit" }}>{form.conversionRate > 0 ? `${form.conversionRate}%` : "—"}</div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Views</div>
                  <div className="text-xs" style={{ fontWeight: 600 }}>{form.views.toLocaleString()}</div>
                </div>
                <div className="p-1.5 rounded bg-secondary/50 text-center">
                  <div className="text-[9px] text-muted-foreground">Fields</div>
                  <div className="text-xs" style={{ fontWeight: 600 }}>{form.fields}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border text-[10px] text-muted-foreground">
                <span>Last submission: {form.lastSubmission}</span>
                <div className="flex items-center gap-1">
                  {form.crmConnected && <span className="flex items-center gap-1 text-[var(--iw-success)]"><CheckCircle className="w-3 h-3" /> CRM</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
