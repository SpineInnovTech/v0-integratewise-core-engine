"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_VIEWS,
  SUBCATEGORY_LABELS,
  type DocumentRegistryEntry,
  type DocumentStatus,
  type DocumentViewId,
} from "./document-governance-types";
import { useDocumentGovernance } from "./useDocumentGovernance";
import { DocumentWikiEditor } from "./document-wiki-editor";

const SIDEBAR_SECTIONS: Array<{
  title: string;
  items: Array<{ id: DocumentViewId; label: string; dotColor?: string }>;
}> = [
  {
    title: "Overview",
    items: [{ id: "all", label: "All Documents" }],
  },
  {
    title: "Public Docs",
    items: [
      { id: "public", label: "All Public" },
      { id: "public-product", label: "Product & Website" },
      { id: "public-docs", label: "Documentation" },
      { id: "public-gtm", label: "GTM & Sales" },
      { id: "public-support", label: "Support & Community" },
    ],
  },
  {
    title: "Internal Docs",
    items: [
      { id: "internal", label: "All Internal" },
      { id: "internal-arch", label: "Architecture & Eng" },
      { id: "internal-ops", label: "Operations & DevOps" },
      { id: "internal-ai", label: "AI & Cognition" },
      { id: "internal-org", label: "Organizational" },
    ],
  },
  {
    title: "Strategy Docs",
    items: [
      { id: "strategy", label: "All Strategy" },
      { id: "strategy-vision", label: "Vision & Direction" },
      { id: "strategy-market", label: "Market & GTM" },
      { id: "strategy-platform", label: "Platform & Technical" },
    ],
  },
  {
    title: "Filter by Status",
    items: [
      { id: "status-locked", label: "Locked", dotColor: "#2d5a3d" },
      { id: "status-drafted", label: "Drafted", dotColor: "#b8943f" },
      { id: "status-inprogress", label: "In Progress", dotColor: "#3d7a50" },
      { id: "status-pending", label: "Pending", dotColor: "#9a7a34" },
    ],
  },
];

const STATUS_STYLES: Record<DocumentStatus, string> = {
  locked: "bg-[#d8e4dc] text-[#1a3a2a] border-[#3d7a50]",
  drafted: "bg-[#f5ecd4] text-[#5e4a1f] border-[#b8943f]",
  pending: "bg-[#fff8c5] text-[#5e4a1f] border-[#b8943f]",
  inprogress: "bg-[#eef3f0] text-[#2d5a3d] border-[#8fb3a0]",
  na: "bg-[#f4f0e8] text-[#9b9484] border-[#d4cdb8]",
};

const TAG_STYLES: Record<string, string> = {
  arch: "bg-[#faf4e6] text-[#5e9277]",
  product: "bg-[#d8e4dc] text-[#2d5a3d]",
  gtm: "bg-[#f5ecd4] text-[#5e4a1f]",
  eng: "bg-[#eef3f0] text-[#3d7a50]",
  strategy: "bg-[#f5e0e0] text-[#8b2020]",
};

function DocCard({
  doc,
  notes,
  onOpen,
}: {
  doc: DocumentRegistryEntry;
  notes: string;
  onOpen: () => void;
}) {
  const statusLabel: Record<DocumentStatus, string> = {
    locked: "locked",
    drafted: "drafted",
    inprogress: "in progress",
    pending: "pending",
    na: "n/a",
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left bg-white border border-[#e6e0d0] rounded-xl p-5 flex flex-col gap-2.5 hover:shadow-md hover:border-[#d4cdb8] transition-all"
    >
      <div className="flex items-start gap-2.5">
        <h4 className="text-sm font-semibold text-[#1a3a2a] leading-snug flex-1">{doc.title}</h4>
        <span
          className={cn(
            "text-[10px] font-bold font-iw-mono uppercase tracking-wide px-2.5 py-1 rounded border shrink-0",
            STATUS_STYLES[doc.status]
          )}
        >
          {statusLabel[doc.status]}
        </span>
      </div>
      <p className="text-xs text-[#6b6556] leading-relaxed line-clamp-2">{doc.description}</p>
      {doc.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {doc.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded",
                TAG_STYLES[tag] || "bg-[#ebe5d8] text-[#6b6556]"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 text-[11px] text-[#9b9484] font-iw-mono mt-auto pt-2 border-t border-[#e6e0d0]">
        <span
          className={cn(
            "font-semibold uppercase",
            doc.priority === "critical" && "text-[#8b2020]",
            doc.priority === "high" && "text-[#9a7a34]",
            doc.priority === "medium" && "text-[#3d7a50]"
          )}
        >
          {doc.priority}
        </span>
        {doc.linked && <span className="truncate">→ {doc.linked}</span>}
        {notes && <span className="truncate italic">note</span>}
      </div>
    </button>
  );
}

export function DocumentGovernanceWorkbench() {
  const {
    filteredDocuments,
    selectedDoc,
    selectedDocId,
    setSelectedDocId,
    activeView,
    setActiveView,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    stats,
    viewCounts,
    updateDocument,
    getNotes,
  } = useDocumentGovernance();

  const viewMeta = DOCUMENT_VIEWS[activeView];

  const groupedDocs = useMemo(() => {
    const shouldGroup = ["all", "public", "internal", "strategy"].includes(activeView);
    if (!shouldGroup) return null;

    const groups: Record<string, DocumentRegistryEntry[]> = {};
    for (const doc of filteredDocuments) {
      const key = doc.subcategory || doc.category;
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    }
    return groups;
  }, [filteredDocuments, activeView]);

  if (selectedDocId && selectedDoc) {
    return (
      <DocumentWikiEditor
        doc={selectedDoc}
        notes={getNotes(selectedDoc.doc_id)}
        onBack={() => setSelectedDocId(null)}
        onSave={(patch) => updateDocument(selectedDoc.doc_id, patch)}
      />
    );
  }

  return (
    <div className="h-full flex bg-[#f4f0e8] font-iw-sans text-[#1a1a14]">
      <aside className="w-[280px] shrink-0 bg-gradient-to-b from-[#0e2016] to-[#142e20] text-[#d8e4dc] flex flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-5 border-b border-white/5">
          <h1 className="font-iw-serif text-xl font-bold text-[#e8e0d0]">IntegrateWise</h1>
          <p className="text-[11px] text-[#5e9277] font-iw-mono mt-1 tracking-wide">
            Document Governance
          </p>
        </div>

        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className="px-4 pt-5 pb-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2d5a3d] px-2 mb-2">
              {section.title}
            </div>
            {section.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveView(item.id);
                  setStatusFilter("all");
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors mb-0.5",
                  activeView === item.id
                    ? "bg-[rgba(184,148,63,0.12)] text-[#d4ac5a]"
                    : "text-[#8fb3a0] hover:bg-white/5 hover:text-[#d8e4dc]"
                )}
              >
                {item.dotColor ? (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: item.dotColor }}
                  />
                ) : (
                  <span className="w-4 text-center text-xs opacity-70">◉</span>
                )}
                <span className="flex-1 text-left">{item.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-bold font-iw-mono px-1.5 py-0.5 rounded-full min-w-[22px] text-center",
                    activeView === item.id
                      ? "bg-[rgba(184,148,63,0.2)] text-[#d4ac5a]"
                      : "bg-white/5 text-[#5e9277]"
                  )}
                >
                  {viewCounts[item.id] ?? 0}
                </span>
              </button>
            ))}
          </div>
        ))}

        <div className="mt-auto px-6 py-5 border-t border-white/5 text-[11px] text-[#2d5a3d] font-iw-mono">
          IntegrateWise Docs v3.0
          <br />
          <span className="text-[#5e9277]">Last sync: live</span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-10 border-b border-[#e6e0d0] bg-[#f4f0e8]/95 backdrop-blur-md px-10 py-4 flex items-center gap-5">
          <div className="min-w-0">
            <h2 className="font-iw-serif text-lg font-bold text-[#1a3a2a]">{viewMeta.title}</h2>
            <p className="text-xs text-[#6b6556]">{viewMeta.description}</p>
          </div>
          <div className="ml-auto relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b9484] text-sm pointer-events-none">
              ⌕
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-72 pl-9 pr-3 py-2 text-sm border border-[#d4cdb8] rounded-lg bg-white outline-none focus:border-[#b8943f] focus:ring-2 focus:ring-[#b8943f]/10"
            />
          </div>
        </header>

        <div className="px-10 pt-7 pb-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Locked", value: stats.locked, icon: "✓", tone: "green" },
              { label: "Drafted", value: stats.drafted, icon: "◆", tone: "gold" },
              { label: "In Progress", value: stats.inprogress, icon: "▶", tone: "blue" },
              { label: "Pending", value: stats.pending, icon: "○", tone: "amber" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-[#e6e0d0] rounded-xl p-5 flex items-start gap-3.5"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-[10px] grid place-items-center text-lg shrink-0",
                    stat.tone === "green" && "bg-[#d8e4dc] text-[#2d5a3d]",
                    stat.tone === "gold" && "bg-[#f5ecd4] text-[#b8943f]",
                    stat.tone === "blue" && "bg-[#eef3f0] text-[#3d7a50]",
                    stat.tone === "amber" && "bg-[#fff8c5] text-[#9a7a34]"
                  )}
                >
                  {stat.icon}
                </div>
                <div>
                  <div className="font-iw-serif text-3xl font-bold text-[#1a3a2a] leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs text-[#6b6556] mt-1">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-4">
            {(["all", "locked", "drafted", "inprogress", "pending"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors",
                  statusFilter === f
                    ? "bg-[#1a3a2a] text-[#e8e0d0] border-[#1a3a2a]"
                    : "bg-white text-[#6b6556] border-[#d4cdb8] hover:border-[#1a3a2a] hover:text-[#1a1a14]"
                )}
              >
                {f === "all" ? "All statuses" : f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-16">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-16 text-[#9b9484]">
              <div className="text-3xl mb-3 opacity-50">◇</div>
              <p className="text-sm">No documents match the current view and filters.</p>
            </div>
          ) : groupedDocs ? (
            Object.keys(SUBCATEGORY_LABELS)
              .filter((key) => groupedDocs[key]?.length)
              .map((key) => (
                <section key={key} className="mb-8">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#e6e0d0]">
                    <h3 className="font-iw-serif text-xl font-bold text-[#1a3a2a]">
                      {SUBCATEGORY_LABELS[key]}
                    </h3>
                    <span className="text-[11px] font-bold font-iw-mono bg-[#ebe5d8] text-[#6b6556] px-2.5 py-1 rounded-full">
                      {groupedDocs[key].length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {groupedDocs[key].map((doc) => (
                      <DocCard
                        key={doc.doc_id}
                        doc={doc}
                        notes={getNotes(doc.doc_id)}
                        onOpen={() => setSelectedDocId(doc.doc_id)}
                      />
                    ))}
                  </div>
                </section>
              ))
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredDocuments.map((doc) => (
                <DocCard
                  key={doc.doc_id}
                  doc={doc}
                  notes={getNotes(doc.doc_id)}
                  onOpen={() => setSelectedDocId(doc.doc_id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
