"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Database, FileText, MessageSquare, ShieldCheck } from "lucide-react";

export interface EvidenceItem {
  id: string;
  sourcePlane: "structured" | "unstructured" | "chat";
  sourceType: string;
  displayLabel: string;
  trustLevel: "high" | "medium" | "low" | "model_inferred";
  summary?: string;
  metadata?: Record<string, any>;
  link?: string;
}

interface EvidenceDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  artifactTitle: string;
  evidence: EvidenceItem[];
}

export function EvidenceDrawer({
  isOpen,
  onOpenChange,
  artifactTitle,
  evidence,
}: EvidenceDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[70vh] rounded-t-xl bg-slate-950 text-slate-50 border-slate-800"
      >
        <SheetHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                Evidence Basis: {artifactTitle}
              </SheetTitle>
              <SheetDescription className="text-slate-400">
                Verifiable sources and logic behind this insight
              </SheetDescription>
            </div>
            <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-800">
              {evidence.length} Sources Found
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="h-full py-6">
          <div className="space-y-6">
            {evidence.map((item) => (
              <div
                key={item.id}
                className="group p-4 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-slate-800 text-slate-400 group-hover:text-blue-400 transition-colors">
                      {item.sourcePlane === "structured" && <Database size={18} />}
                      {item.sourcePlane === "unstructured" && <FileText size={18} />}
                      {item.sourcePlane === "chat" && <MessageSquare size={18} />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200">{item.displayLabel}</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        {item.sourcePlane} • {item.sourceType}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      item.trustLevel === "high"
                        ? "border-green-800 text-green-400"
                        : item.trustLevel === "medium"
                          ? "border-yellow-800 text-yellow-400"
                          : "border-slate-800 text-slate-400"
                    }
                  >
                    {item.trustLevel.replace("_", " ")}
                  </Badge>
                </div>

                {item.summary && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3">{item.summary}</p>
                )}

                {item.link && (
                  <a
                    href={item.link}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View Source <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}

            {evidence.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>No verifiable evidence records found for this artifact.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
