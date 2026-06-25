import { AcceleratorManifest } from "../types";

export const ConnectorCoverage: AcceleratorManifest = {
  id: "accel-found-coverage-001",
  name: "Connector Coverage & Data Completeness",
  version: "1.0.0",
  type: "intelligence",
  description: "Scores tool connectivity, freshness, and completeness (missing fields/references).",
  tools_supported: ["all"],
  signals: [
    {
      name: "coverage_score",
      source: "computed",
      description: "0-100 completeness score",
      trigger: "schedule",
      logic: "Weighted field population",
    },
    {
      name: "freshness_score",
      source: "computed",
      description: "Avg time since last sync",
      trigger: "schedule",
      logic: "max(last_sync)",
    },
  ],
};

export const RelationshipIntegrity: AcceleratorManifest = {
  id: "accel-found-integrity-001",
  name: "Relationship Integrity & Graph Consistency",
  version: "1.0.0",
  type: "intelligence",
  description:
    "Ensures extracted relationships remain accurate across databases and tools (Graph Fidelity).",
  tools_supported: ["all"],
  signals: [
    {
      name: "relationship_gaps",
      source: "computed",
      description: "Count of broken edges",
      trigger: "schedule",
      logic: "FK validation",
    },
  ],
};

export const RAGQuality: AcceleratorManifest = {
  id: "accel-found-rag-001",
  name: "RAG Quality & Retrieval Performance",
  version: "1.0.0",
  type: "intelligence",
  description: "Evaluates chunking quality, duplication, and retrieval recall/precision.",
  tools_supported: ["knowledge-base"],
  signals: [
    {
      name: "retrieval_score",
      source: "computed",
      description: "Proxy metric for recall",
      trigger: "event",
      logic: "Search eval",
    },
    {
      name: "stale_sources",
      source: "computed",
      description: "Chunks > 90d old",
      trigger: "schedule",
      logic: "Date diff",
    },
  ],
};
