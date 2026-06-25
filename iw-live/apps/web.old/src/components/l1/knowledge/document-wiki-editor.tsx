"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Eye, FileText, Link2, Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  DocumentPriority,
  DocumentRegistryEntry,
  DocumentStatus,
} from "./document-governance-types";

function renderMarkdown(md: string): string {
  const escaped = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return escaped
    .split("\n")
    .map((line) => {
      if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
      if (line.trim() === "") return "<br/>";
      return `<p>${line}</p>`;
    })
    .join("");
}

interface DocumentWikiEditorProps {
  doc: DocumentRegistryEntry;
  notes: string;
  onBack: () => void;
  onSave: (patch: {
    status: DocumentStatus;
    priority: DocumentPriority;
    notes: string;
    linked: string;
    content: string;
  }) => void;
}

export function DocumentWikiEditor({ doc, notes, onBack, onSave }: DocumentWikiEditorProps) {
  const [status, setStatus] = useState<DocumentStatus>(doc.status);
  const [priority, setPriority] = useState<DocumentPriority>(doc.priority);
  const [linked, setLinked] = useState(doc.linked || "");
  const [internalNotes, setInternalNotes] = useState(notes);
  const [content, setContent] = useState(doc.content || "");
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStatus(doc.status);
    setPriority(doc.priority);
    setLinked(doc.linked || "");
    setInternalNotes(notes);
    setContent(doc.content || "");
    setSaved(false);
  }, [doc.doc_id, doc.status, doc.priority, doc.linked, doc.content, notes]);

  const previewHtml = useMemo(() => renderMarkdown(content), [content]);

  const handleSave = () => {
    onSave({ status, priority, notes: internalNotes, linked, content });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#f4f0e8] font-iw-sans">
      <header className="sticky top-0 z-20 border-b border-[#e6e0d0] bg-[#f4f0e8]/95 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-[#6b6556]">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Registry
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-iw-serif text-lg font-bold text-[#1a3a2a] truncate">{doc.title}</h1>
          <p className="text-xs text-[#6b6556] truncate">{doc.description}</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-[#d4cdb8] rounded-lg p-0.5">
          {(["edit", "split", "preview"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors",
                mode === m ? "bg-[#1a3a2a] text-[#e8e0d0]" : "text-[#6b6556] hover:bg-[#faf8f3]"
              )}
            >
              {m === "edit" ? <Pencil className="w-3.5 h-3.5 inline mr-1" /> : null}
              {m === "preview" ? <Eye className="w-3.5 h-3.5 inline mr-1" /> : null}
              {m}
            </button>
          ))}
        </div>
        <Button onClick={handleSave} className="bg-[#1a3a2a] hover:bg-[#2d5a3d] text-[#e8e0d0]">
          {saved ? <Check className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          {saved ? "Saved" : "Save"}
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-[#e6e0d0] bg-white p-5 overflow-y-auto space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6b6556]">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DocumentStatus)}
              className="mt-1 w-full text-sm border border-[#d4cdb8] rounded-lg px-3 py-2 bg-[#faf8f3]"
            >
              <option value="pending">Pending</option>
              <option value="drafted">Drafted</option>
              <option value="inprogress">In Progress</option>
              <option value="locked">Locked</option>
              <option value="na">N/A</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6b6556]">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as DocumentPriority)}
              className="mt-1 w-full text-sm border border-[#d4cdb8] rounded-lg px-3 py-2 bg-[#faf8f3]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6b6556]">
              Linked Documents
            </label>
            <input
              value={linked}
              onChange={(e) => setLinked(e.target.value)}
              placeholder="Architecture Doc v3.0"
              className="mt-1 w-full text-sm border border-[#d4cdb8] rounded-lg px-3 py-2 bg-[#faf8f3]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6b6556]">
              Governance Notes
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={5}
              placeholder="Internal notes about governance state..."
              className="mt-1 w-full text-sm border border-[#d4cdb8] rounded-lg px-3 py-2 bg-[#faf8f3] resize-y leading-relaxed"
            />
          </div>
          <div className="text-[11px] text-[#9b9484] font-iw-mono space-y-1 pt-2 border-t border-[#e6e0d0]">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              {doc.doc_id}
            </div>
            <div>{doc.subcategory}</div>
            {doc.owner && <div>{doc.owner}</div>}
          </div>
        </aside>

        <div className="flex-1 flex overflow-hidden">
          {(mode === "edit" || mode === "split") && (
            <div
              className={cn(
                "flex flex-col border-r border-[#e6e0d0] bg-white",
                mode === "split" ? "w-1/2" : "w-full"
              )}
            >
              <div className="px-4 py-2 border-b border-[#e6e0d0] text-[10px] font-bold uppercase tracking-wider text-[#6b6556]">
                Markdown Editor
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-5 font-iw-mono text-sm leading-relaxed resize-none outline-none bg-white text-[#1a1a14]"
                placeholder="# Document title&#10;&#10;Write wiki content here..."
              />
            </div>
          )}

          {(mode === "preview" || mode === "split") && (
            <div
              className={cn("flex flex-col overflow-hidden", mode === "split" ? "w-1/2" : "w-full")}
            >
              <div className="px-4 py-2 border-b border-[#e6e0d0] text-[10px] font-bold uppercase tracking-wider text-[#6b6556] bg-[#faf8f3] flex items-center gap-1.5">
                <Link2 className="w-3 h-3" />
                Wiki Preview
              </div>
              <article
                className="flex-1 overflow-y-auto p-8 max-w-none bg-[#faf8f3] [&_h1]:font-iw-serif [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-[#1a3a2a] [&_h1]:mb-4 [&_h2]:font-iw-serif [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#1a3a2a] [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[#1a1a14] [&_p]:mb-3 [&_li]:text-sm [&_li]:ml-4 [&_li]:mb-1"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
