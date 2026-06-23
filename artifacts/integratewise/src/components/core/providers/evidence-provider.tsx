"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface EvidenceRef {
  type: "spine" | "context" | "knowledge";
  title: string;
  source: string;
  date: string;
  link?: string;
  confidence?: number;
}

interface EvidenceContextType {
  openEvidence: (title: string, data: EvidenceRef[], description?: string) => void;
  closeEvidence: () => void;
}

const EvidenceContext = createContext<EvidenceContextType | undefined>(undefined);

export function EvidenceProvider({ children }: { children: ReactNode }) {
  // Keep the API surface for existing views, but route all evidence UI into the single bottom drawer.
  // This avoids duplicate side panels and keeps the app feeling like a familiar SaaS surface.
  const [, setNonce] = useState(0);

  const openEvidence = (title: string, evidence: EvidenceRef[], description = "") => {
    // Ensure React callers can still await UI updates if needed.
    setNonce((n) => n + 1);
    window.dispatchEvent(
      new CustomEvent("iw:evidence:open", {
        detail: {
          title,
          description,
          evidence,
        },
      })
    );
  };

  const closeEvidence = () => {
    setNonce((n) => n + 1);
    window.dispatchEvent(new CustomEvent("iw:evidence:close"));
  };

  return (
    <EvidenceContext.Provider value={{ openEvidence, closeEvidence }}>
      {children}
    </EvidenceContext.Provider>
  );
}

export function useEvidence() {
  const context = useContext(EvidenceContext);
  if (context === undefined) {
    throw new Error("useEvidence must be used within an EvidenceProvider");
  }
  return context;
}
