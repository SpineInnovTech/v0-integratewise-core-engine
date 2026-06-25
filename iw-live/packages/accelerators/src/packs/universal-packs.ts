import { AcceleratorManifest } from "../types";

/**
 * Section 5 — EXTRACTION ACCELERATOR (Universal Extraction Pack)
 * Purpose: Convert raw tool responses into a structured Object Graph Package.
 */
export const UniversalExtractionPack: AcceleratorManifest = {
  id: "universal-extraction-pack",
  name: "Universal Extraction Accelerator",
  version: "1.0.0",
  type: "universal",
  description: "Bridges the gap between raw tool objects and the graph-aware ingestion pipeline.",
  tools_supported: ["all"],
  signals: [
    {
      name: "EA0_ObjectIngester",
      description: "Requests and pulls raw objects from tool runtime.",
      logic: "connector.pull_all()",
      trigger: "event",
    },
    {
      name: "EA1_GraphAssembler",
      description: "Assembles nodes and relationships into a Tool Graph Package.",
      logic: "graph_builder.assemble()",
      trigger: "event",
    },
    {
      name: "EA2_RelationExtractor",
      description: "Identifies and captures cross-object relationships (Parent, Child, Links).",
      logic: "graph_builder.extract_edges()",
      trigger: "event",
    },
    {
      name: "EA3_LogicImporter",
      description: "Captures tool-specific formulas and dependency fields.",
      logic: "graph_builder.capture_formulas()",
      trigger: "event",
    },
    {
      name: "EA4_WorkflowSniffer",
      description: "Captures tool-specific automations and flow definitions.",
      logic: "graph_builder.capture_workflows()",
      trigger: "event",
    },
    {
      name: "EA5_ToolGatewayPack",
      description: "Seals the Tool Graph Package and prepares it for the Ingestion Pipeline.",
      logic: "graph_package.seal()",
      trigger: "event",
    },
  ],
};

/**
 * Section 6 — NORMALIZER ACCELERATOR (Universal Normalizer Pack)
 * Purpose: Convert Tool Graph Packages into Canonical Spine Entities.
 */
export const UniversalNormalizerPack: AcceleratorManifest = {
  id: "universal-normalizer-pack",
  name: "Universal Normalizer Accelerator",
  version: "1.0.0",
  type: "universal",
  description: "Maps tool-specific graphs to the canonical SSOT (Single Source of Truth).",
  tools_supported: ["all"],
  signals: [
    {
      name: "NA0_SchemaDetector",
      description: "Analyzes incoming graph nodes to determine appropriate SSOT entity mappings.",
      logic: "schema_registry.detect()",
      trigger: "event",
    },
    {
      name: "NA1_CanonicalTransformer",
      description: "Transforms tool fields into canonical HSL-tailored Spine traits.",
      logic: "transformer.to_canonical()",
      trigger: "event",
    },
    {
      name: "NA2_SSOTBinder",
      description: "Binds transformed data to the Single Source of Truth registry.",
      logic: "ssot_registry.bind()",
      trigger: "event",
    },
    {
      name: "NA3_LineageManager",
      description: "Binds evidence references and audit trails to the canonical record.",
      logic: "audit_store.bind_evidence()",
      trigger: "event",
    },
    {
      name: "NA4_RelationBinder",
      description: "Maintains relationship graph integrity using Canonical IDs.",
      logic: "spine.bind_edges()",
      trigger: "event",
    },
    {
      name: "NA5_SpinePublisher",
      description: "Final commit to Spine DB and Context Store.",
      logic: "spine.publish()",
      trigger: "event",
    },
  ],
};
