import { useCallback, useMemo, useState } from "react";
import registry from "@/data/document-governance-registry.json";
import type {
  DocumentOverrides,
  DocumentRegistryEntry,
  DocumentStatus,
  DocumentViewId,
} from "./document-governance-types";

const STORAGE_KEY = "iw_document_governance_v1";

type PersistedState = Record<string, DocumentOverrides>;

function loadOverrides(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : {};
  } catch {
    return {};
  }
}

function saveOverrides(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

const BASE_DOCS = registry as DocumentRegistryEntry[];

export function useDocumentGovernance() {
  const [overrides, setOverrides] = useState<PersistedState>(loadOverrides);
  const [activeView, setActiveView] = useState<DocumentViewId>("all");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const documents = useMemo(() => {
    return BASE_DOCS.map((doc) => {
      const patch = overrides[doc.doc_id];
      return patch ? { ...doc, ...patch } : doc;
    });
  }, [overrides]);

  const selectedDoc = useMemo(
    () => documents.find((d) => d.doc_id === selectedDocId) ?? null,
    [documents, selectedDocId]
  );

  const filteredDocuments = useMemo(() => {
    let docs = documents;

    if (activeView === "all") {
      /* all */
    } else if (activeView.startsWith("status-")) {
      const status = activeView.replace("status-", "") as DocumentStatus;
      docs = docs.filter((d) => d.status === status);
    } else {
      docs = docs.filter((d) => d.category === activeView || d.subcategory === activeView);
    }

    if (statusFilter !== "all") {
      docs = docs.filter((d) => d.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          (overrides[d.doc_id]?.notes || "").toLowerCase().includes(q) ||
          (d.linked || "").toLowerCase().includes(q)
      );
    }

    return docs;
  }, [documents, activeView, statusFilter, searchQuery, overrides]);

  const stats = useMemo(() => {
    const count = (status: DocumentStatus) => documents.filter((d) => d.status === status).length;
    return {
      locked: count("locked"),
      drafted: count("drafted"),
      inprogress: count("inprogress"),
      pending: count("pending"),
      total: documents.length,
    };
  }, [documents]);

  const viewCounts = useMemo(() => {
    const by = (pred: (d: DocumentRegistryEntry) => boolean) => documents.filter(pred).length;
    return {
      all: documents.length,
      public: by((d) => d.category === "public"),
      "public-product": by((d) => d.subcategory === "public-product"),
      "public-docs": by((d) => d.subcategory === "public-docs"),
      "public-gtm": by((d) => d.subcategory === "public-gtm"),
      "public-support": by((d) => d.subcategory === "public-support"),
      internal: by((d) => d.category === "internal"),
      "internal-arch": by((d) => d.subcategory === "internal-arch"),
      "internal-ops": by((d) => d.subcategory === "internal-ops"),
      "internal-ai": by((d) => d.subcategory === "internal-ai"),
      "internal-org": by((d) => d.subcategory === "internal-org"),
      strategy: by((d) => d.category === "strategy"),
      "strategy-vision": by((d) => d.subcategory === "strategy-vision"),
      "strategy-market": by((d) => d.subcategory === "strategy-market"),
      "strategy-platform": by((d) => d.subcategory === "strategy-platform"),
      "status-locked": stats.locked,
      "status-drafted": stats.drafted,
      "status-inprogress": stats.inprogress,
      "status-pending": stats.pending,
    } as Record<DocumentViewId, number>;
  }, [documents, stats]);

  const updateDocument = useCallback((docId: string, patch: DocumentOverrides) => {
    setOverrides((prev) => {
      const next = { ...prev, [docId]: { ...(prev[docId] || {}), ...patch } };
      saveOverrides(next);
      return next;
    });
  }, []);

  const getNotes = useCallback((docId: string) => overrides[docId]?.notes || "", [overrides]);

  return {
    documents,
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
  };
}
