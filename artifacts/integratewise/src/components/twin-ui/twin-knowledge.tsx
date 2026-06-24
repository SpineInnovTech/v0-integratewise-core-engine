import { useState } from "react";
import { BookOpen, Search, Plus, FolderOpen, FileText, ChevronRight,
  Upload, Star, Clock, Download, Eye, MoreHorizontal, Globe, Lock, Users } from "lucide-react";

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  size: string;
  updated: string;
  author: string;
  visibility: "Private" | "Team" | "Public";
  pinned?: boolean;
  excerpt: string;
}

interface KnowledgeCategory {
  id: string;
  label: string;
  count: number;
  icon: string;
}

const CATEGORIES: KnowledgeCategory[] = [
  { id: "all", label: "All Documents", count: 18, icon: "📄" },
  { id: "playbooks", label: "Playbooks", count: 6, icon: "📋" },
  { id: "sows", label: "SOWs & Contracts", count: 3, icon: "📝" },
  { id: "runbooks", label: "Runbooks", count: 4, icon: "🔧" },
  { id: "research", label: "Research", count: 3, icon: "🔬" },
  { id: "templates", label: "Templates", count: 2, icon: "📐" },
];

const DOCS: KnowledgeDoc[] = [
  {
    id: "d1", title: "CSM Renewal Playbook v3", category: "playbooks", size: "142 KB", updated: "2 days ago",
    author: "Alex Rivera", visibility: "Team", pinned: true,
    excerpt: "Standardized renewal motion for accounts >$40K ARR. Covers risk signals, EBR cadence, champion mapping, and escalation paths.",
  },
  {
    id: "d2", title: "APAC Market Intelligence Report", category: "research", size: "2.1 MB", updated: "1 week ago",
    author: "Marketing", visibility: "Team",
    excerpt: "Q2 2026 intelligence report covering buyer personas, competitive landscape, and expansion opportunities in APAC SaaS segment.",
  },
  {
    id: "d3", title: "HubSpot → Spine Integration Runbook", category: "runbooks", size: "88 KB", updated: "3 days ago",
    author: "RevOps", visibility: "Team",
    excerpt: "Step-by-step process for configuring HubSpot connector, field mapping, schema normalization, and HITL approval setup.",
  },
  {
    id: "d4", title: "FinanceFlow Solutions — SOW Q2 2026", category: "sows", size: "340 KB", updated: "2 months ago",
    author: "Legal", visibility: "Private",
    excerpt: "Master services agreement and scope of work for FinanceFlow Solutions engagement. Includes deliverables, SLAs, and payment schedule.",
  },
  {
    id: "d5", title: "Executive Business Review Template", category: "templates", size: "56 KB", updated: "5 days ago",
    author: "Alex Rivera", visibility: "Public",
    excerpt: "Reusable EBR deck template with Spine data auto-fill. Sections: QBR scorecard, goal alignment, roadmap, and renewal preview.",
  },
  {
    id: "d6", title: "Champion Mapping & Stakeholder Guide", category: "playbooks", size: "98 KB", updated: "1 week ago",
    author: "CS Team", visibility: "Team",
    excerpt: "Framework for identifying, mapping, and maintaining champions within accounts. Includes engagement cadence and re-engagement protocols.",
  },
];

const VISIBILITY_CONFIG = {
  "Private": { icon: Lock, color: "text-slate-400" },
  "Team":    { icon: Users, color: "text-[#4256AB]" },
  "Public":  { icon: Globe, color: "text-[#10B981]" },
};

export function TwinKnowledge() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [activeDoc, setActiveDoc] = useState<string | null>("d1");

  const filtered = DOCS.filter(d => {
    const matchCat = activeCategory === "all" || d.category === activeCategory;
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const active = DOCS.find(d => d.id === activeDoc);

  return (
    <div className="flex h-full">
      {/* Category Sidebar */}
      <div className="w-44 shrink-0 flex flex-col border-r border-[#E5E7EB] bg-[#FAFAFA] py-3 px-2">
        <div className="flex items-center gap-2 px-2 mb-4">
          <BookOpen className="w-4 h-4 text-[#3F5185]" />
          <span className="text-xs font-bold text-slate-800">Knowledge</span>
        </div>

        <div className="space-y-0.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
                activeCategory === cat.id
                  ? "bg-[#3F5185]/8 text-[#3F5185]"
                  : "text-slate-500 hover:bg-white hover:text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs">{cat.icon}</span>
                <span className="text-[11px] font-medium truncate">{cat.label}</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? "bg-[#3F5185]/15 text-[#3F5185]" : "bg-[#F8F9FA] text-slate-400"}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-[#E5E7EB] px-1">
          <button className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-[#3F5185] text-white text-[11px] font-semibold hover:bg-[#354775] transition-colors shadow-sm">
            <Upload className="w-3 h-3" />
            Upload Doc
          </button>
        </div>
      </div>

      {/* Document List */}
      <div className="w-72 shrink-0 flex flex-col border-r border-[#E5E7EB] bg-white">
        <div className="p-3 border-b border-[#E5E7EB]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg pl-7 pr-3 py-1.5 text-xs outline-none focus:border-[#3F5185]/40 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {filtered.map(doc => {
            const VisIcon = VISIBILITY_CONFIG[doc.visibility].icon;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeDoc === doc.id
                    ? "bg-[#3F5185]/5 border-[#3F5185]/20"
                    : "bg-white border-[#E5E7EB] hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-[#3F5185]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      {doc.pinned && <Star className="w-2.5 h-2.5 text-[#D46780] fill-[#D46780] shrink-0" />}
                      <span className="text-[11px] font-semibold text-slate-800 line-clamp-1">{doc.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{doc.excerpt}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <VisIcon className={`w-2.5 h-2.5 ${VISIBILITY_CONFIG[doc.visibility].color}`} />
                      <span className="text-[9px] text-slate-400">{doc.updated}</span>
                      <span className="text-[9px] text-slate-300">·</span>
                      <span className="text-[9px] text-slate-400">{doc.size}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Preview */}
      {active ? (
        <div className="flex-1 flex flex-col bg-white min-w-0">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#3F5185]/8 flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 text-[#3F5185]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">{active.title}</h2>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>{active.author}</span>
                  <span>·</span>
                  <span>{active.updated}</span>
                  <span>·</span>
                  <span>{active.size}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-medium text-slate-600 hover:bg-[#F8F9FA] transition-colors">
                <Download className="w-3 h-3" />
                Download
              </button>
              <button className="p-1.5 rounded-lg hover:bg-[#F8F9FA] text-slate-400 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document content (mock preview) */}
          <div className="flex-1 overflow-y-auto p-8 max-w-3xl">
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">{active.title}</h1>
                <p className="text-sm text-slate-500">{active.excerpt}</p>
              </div>
              <hr className="border-[#E5E7EB]" />
              <div className="prose prose-sm max-w-none text-slate-600 space-y-4">
                <p>This document is part of the IntegrateWise Knowledge Base. It is grounded in your Spine data and kept in sync with connected sources.</p>
                <h3 className="text-base font-semibold text-slate-800">Overview</h3>
                <p>The following content is dynamically maintained by IntegrateWise and cross-referenced with your organizational memory. Key entities mentioned in this document are tracked in Spine and will be updated as data changes.</p>
                <h3 className="text-base font-semibold text-slate-800">Key Entities Referenced</h3>
                <ul className="space-y-1 list-none pl-0">
                  {["TechServe Asia — Account (CTX_CS)", "FinanceFlow Solutions — Account (CTX_CS)", "David Park — Contact (VP Product)", "Renewal Playbook v3 — Linked Playbook"].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="w-3 h-3 text-[#3F5185] shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-4 rounded-xl bg-[#3F5185]/5 border border-[#3F5185]/15 text-sm text-[#3F5185]">
                  <strong>Memory Integration:</strong> This document has been indexed into your Twin Memory store. The AI can reference it in chat sessions for grounded answers.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-300">
          <div className="text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a document to preview</p>
          </div>
        </div>
      )}
    </div>
  );
}
