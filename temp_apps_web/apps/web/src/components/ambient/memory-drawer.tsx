import React, { useState, useEffect } from "react";
import { X, Database, ShieldAlert, Award, FileText, CheckCircle, RefreshCw } from "lucide-react";
import { mockMemoryRecords, mockPlaybookRules } from "@/lib/mock-data";
import { MemoryRecord, PlaybookRule } from "@/lib/types";

export function MemoryDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<{
    title: string;
    memoriesCount: number;
    rulesCount: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"memories" | "rules">("memories");
  const [selectedMemories, setSelectedMemories] = useState<MemoryRecord[]>([]);
  const [selectedRules, setSelectedRules] = useState<PlaybookRule[]>([]);
  const [isPromoting, setIsPromoting] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      setDrawerData(customEvent.detail);

      // Filter mock data for demonstration purposes based on title context
      const titleContext = customEvent.detail.title;
      let memories = mockMemoryRecords.slice(0, customEvent.detail.memoriesCount);
      let rules = mockPlaybookRules.slice(0, customEvent.detail.rulesCount);

      // Ensure we have at least some items if counts are set
      if (memories.length === 0 && customEvent.detail.memoriesCount > 0) {
        memories = [mockMemoryRecords[0]];
      }
      if (rules.length === 0 && customEvent.detail.rulesCount > 0) {
        rules = [mockPlaybookRules[0]];
      }

      setSelectedMemories(memories);
      setSelectedRules(rules);
      setActiveTab(customEvent.detail.memoriesCount > 0 ? "memories" : "rules");
      setIsOpen(true);
    };

    window.addEventListener("iw:memory-drawer:open", handleOpen);
    return () => window.removeEventListener("iw:memory-drawer:open", handleOpen);
  }, []);

  const handlePromote = (id: string) => {
    setIsPromoting(id);
    setTimeout(() => {
      setSelectedMemories((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, governanceState: "published", version: m.version + 1 } : m
        )
      );
      setIsPromoting(null);
      // Dispatch success notification
      window.dispatchEvent(
        new CustomEvent("iw:notification", {
          detail: {
            message: "Memory successfully promoted to Org Memory Vault and written to filesystem.",
            type: "success",
          },
        })
      );
    }, 1200);
  };

  if (!isOpen || !drawerData) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-iw-ink/40 backdrop-blur-xs z-50 transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-[420px] bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-all duration-300 animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-iw-paper-deep">
          <div className="flex items-center gap-2">
            <Database className="size-4.5 text-iw-forest" />
            <h3 className="text-sm font-bold text-foreground font-iw-serif truncate max-w-[280px]">
              {drawerData.title}
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-iw-paper-warm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-card p-1 font-iw-mono text-xs">
          <button
            onClick={() => setActiveTab("memories")}
            className={`flex-1 py-1.5 text-center rounded transition-colors ${
              activeTab === "memories"
                ? "bg-iw-forest text-iw-paper font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Memories ({selectedMemories.length})
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex-1 py-1.5 text-center rounded transition-colors ${
              activeTab === "rules"
                ? "bg-iw-gold text-iw-paper font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Playbook Rules ({selectedRules.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "memories" ? (
            selectedMemories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-iw-mono text-xs">
                No active memories loaded for this context.
              </div>
            ) : (
              selectedMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3.5 border border-border bg-iw-paper rounded space-y-2.5 font-iw-mono text-xs"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-iw-forest uppercase font-bold">
                      [{mem.category}]
                    </span>
                    <span
                      className={`text-[9px] px-1 rounded border ${
                        mem.governanceState === "published"
                          ? "border-iw-forest/30 bg-iw-forest/10 text-iw-forest"
                          : "border-iw-gold/30 bg-iw-gold-pale text-iw-gold"
                      }`}
                    >
                      {mem.governanceState.toUpperCase()} · v{mem.version}
                    </span>
                  </div>
                  <p className="text-foreground font-iw-sans leading-relaxed">{mem.content}</p>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border">
                    <span>By: {mem.author}</span>
                    <span>{mem.timestamp}</span>
                  </div>

                  {mem.governanceState !== "published" && (
                    <button
                      onClick={() => handlePromote(mem.id)}
                      disabled={isPromoting === mem.id}
                      className="w-full mt-2 py-1.5 bg-iw-forest hover:bg-iw-forest-bright text-iw-paper font-semibold rounded flex items-center justify-center gap-1.5 transition-all text-[11px]"
                    >
                      {isPromoting === mem.id ? (
                        <>
                          <RefreshCw className="size-3 animate-spin" />
                          Curating Dual-Write...
                        </>
                      ) : (
                        <>
                          <Award className="size-3" />
                          Promote to Vault & Sync Outbound
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))
            )
          ) : selectedRules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-iw-mono text-xs">
              No playbook rules active in this scope.
            </div>
          ) : (
            selectedRules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 border border-border bg-iw-paper rounded space-y-2 font-iw-mono text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-iw-gold">{rule.name}</span>
                  <span className="text-[9px] text-muted-foreground">{rule.scope}</span>
                </div>
                <p className="text-foreground font-iw-sans text-xs bg-card p-2 rounded border border-border">
                  {rule.ruleText}
                </p>
                <div className="text-[10px] text-muted-foreground pt-1 flex items-start gap-1">
                  <FileText className="size-3 shrink-0 text-muted-foreground mt-0.5" />
                  <span>{rule.governanceAudit}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-iw-paper-warm font-iw-mono text-[10px] text-muted-foreground text-center">
          Spine Context Substrate · Locked May 2026
        </div>
      </div>
    </>
  );
}
