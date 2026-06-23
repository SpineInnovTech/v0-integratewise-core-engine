import React, { useState } from "react";
import { Brain, Building2, User, Briefcase, FileText, BookOpen } from "lucide-react";

export interface MemoryShellProps {
  /** The current active profile from the workspace shell */
  activeProfile: "PERSONAL" | "WORK";
}

export function MemoryShell({ activeProfile }: MemoryShellProps) {
  // Determine default selected section based on active profile
  const [selectedSection, setSelectedSection] = useState<
    "org" | "personal_work" | "personal_private"
  >("org");

  // If user is in WORK view and had "personal_private" selected, we should fallback to work
  if (activeProfile === "WORK" && selectedSection === "personal_private") {
    setSelectedSection("personal_work");
  }

  return (
    <div className="flex h-full w-full bg-white overflow-hidden rounded-tl-2xl shadow-sm border-l border-t border-[#ebe5d8]">
      {/* ─── LEFT PANE: MEMORY NAVIGATION ─── */}
      <div className="w-[280px] border-r border-[#ebe5d8] bg-[#f4f0e8] flex flex-col shrink-0">
        <div className="p-5 border-b border-[#ebe5d8]">
          <h2 className="text-base font-bold text-[#0e1410] flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#2d5a3d]" />
            Knowledge Base
          </h2>
          <p className="text-xs text-[#8a8580] mt-1 font-medium">Non-tabular memory navigation</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* Organisation Memory */}
          <div>
            <div className="px-2 mb-3 text-[10px] font-bold text-[#8fb3a0] uppercase tracking-widest">
              Organisation Memory
            </div>
            <button
              onClick={() => setSelectedSection("org")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                selectedSection === "org"
                  ? "bg-[#2d5a3d] text-white shadow-md shadow-[#2d5a3d]/20"
                  : "text-[#5a5550] hover:bg-[#ebe5d8] hover:text-[#0e1410]"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Org Knowledge</span>
            </button>
          </div>

          {/* Personal Memory */}
          <div>
            <div className="px-2 mb-3 text-[10px] font-bold text-[#8fb3a0] uppercase tracking-widest">
              Personal Memory
            </div>

            <div className="space-y-1">
              {/* Work Role (Always visible) */}
              <button
                onClick={() => setSelectedSection("personal_work")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  selectedSection === "personal_work"
                    ? "bg-[#2d5a3d] text-white shadow-md shadow-[#2d5a3d]/20"
                    : "text-[#5a5550] hover:bg-[#ebe5d8] hover:text-[#0e1410]"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Work Profile</span>
              </button>

              {/* Personal Role (Only visible if activeProfile is PERSONAL) */}
              {activeProfile === "PERSONAL" && (
                <button
                  onClick={() => setSelectedSection("personal_private")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    selectedSection === "personal_private"
                      ? "bg-linear-to-r from-iw-forest to-iw-gold text-white shadow-md shadow-iw-gold/20"
                      : "text-[#5a5550] hover:bg-[#ebe5d8] hover:text-[#0e1410]"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Personal Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANE: CONTENT VIEWER (NON-TABULAR) ─── */}
      <div className="flex-1 flex flex-col bg-[#eef3f0]">
        <div className="h-16 border-b border-[#ebe5d8] flex items-center px-8 shrink-0 bg-white">
          <span className="text-base font-bold text-[#0e1410]">
            {selectedSection === "org" && "Organisation Knowledge"}
            {selectedSection === "personal_work" && "Work Profile Memory"}
            {selectedSection === "personal_private" && "Personal Profile Memory"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl space-y-6 mx-auto">
            {/* Example Document Card - Non-tabular format */}
            <div className="p-8 rounded-2xl border border-[#ebe5d8] bg-white shadow-sm space-y-4 hover:border-[#d8d0c0] transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#2d5a3d] uppercase tracking-widest bg-[#2d5a3d]/10 px-2.5 py-1 rounded-md">
                  <BookOpen className="w-3.5 h-3.5" />
                  Verified Insight
                </div>
                <span className="text-xs font-medium text-[#8fb3a0]">Just now</span>
              </div>

              <h3 className="text-xl font-bold text-[#0e1410] group-hover:text-[#2d5a3d] transition-colors">
                {selectedSection === "org" && "Company Deployment Architecture"}
                {selectedSection === "personal_work" && "Client Communication Preferences"}
                {selectedSection === "personal_private" && "Personal Goals & Setup"}
              </h3>

              <p className="text-sm text-[#5a5550] leading-relaxed">
                This knowledge is rendered in a document-first, non-tabular view. Instead of sterile
                rows and columns, memory is consumed exactly like a notebook or brief. The system
                automatically structures the context so it feels native and easy to read.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[#ebe5d8] bg-white shadow-sm space-y-4 hover:border-[#d8d0c0] transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-bold text-iw-forest-bright uppercase tracking-widest bg-iw-forest/10 px-2.5 py-1 rounded-md border border-iw-forest/20">
                  <FileText className="w-3.5 h-3.5" />
                  Standard Operating Procedure
                </div>
                <span className="text-xs font-medium text-[#8fb3a0]">2 days ago</span>
              </div>

              <h3 className="text-xl font-bold text-[#0e1410] group-hover:text-iw-forest-bright transition-colors">
                Handling Escalated Support Tickets
              </h3>

              <p className="text-sm text-[#5a5550] leading-relaxed">
                When a tier-1 customer raises a P1 issue, always ping the #escalations channel in
                Slack first, then notify the assigned Account Executive. The SLA for response is
                strictly 15 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
