/**
 * IntegrateWise Types Package
 *
 * Shared TypeScript types for all services and applications.
 */

// ============================================================================
// Core Types
// ============================================================================

export * from "./billing.js";
export * from "./adaptive-schema.js";
export * from "./spine_contracts.js";
export * from "./unified-connector-registry.js";
export * from "./success-schema.js";
export * from "./handoff.js";

export {
  FLOW_CHARACTERISTICS,
  FLOW_CLASSIFIER_REGISTRY,
  classifyConnectorFull,
  createStoredClassification,
  getFlowRouting,
  getFlowTypeDescription,
} from "./flow-classifier.js";

export type {
  ClassifyConnectorInput,
  ClassifyConnectorResult,
  ConnectorClassification,
  FlowCharacteristics,
  FlowRoutingDecision,
  SimpleFlowClassification,
  StoredFlowClassification,
} from "./flow-classifier.js";

// ============================================================================
// Sync & Entitlements (NEW)
// ============================================================================

export * from "./sync-entitlements.js";

// ============================================================================
// Spine Entities
// ============================================================================

// Schema-driven architecture (new)
export * from "./schema.js";
export * from "./schema-accessor.js";
export * from "./bff-transform.js";

// ============================================================================
// Utility Types
// ============================================================================

export * from "./wiring-constants.js";
export * from "./schema-updater.js";
export * from "./entity360.js";
export * from "./pipeline-contracts.js";

// ============================================================================
// Signal Analyzer (TypeScript-native, replaces Python intelligence client)
// ============================================================================

export * from "./signal-analyzer.js";

// ============================================================================
// Governed Cognition Proposal — Twin → Ops continuity primitive
// ============================================================================

export * from "./proposal.js";

// ============================================================================
// Playbook Handoff Contract
// ============================================================================

export * from "./playbook.js";

// ============================================================================
// Task Orchestration Schema
// ============================================================================

export * from "./task.js";

// ============================================================================
// Morning Context Schema
// ============================================================================

export * from "./morning-context.js";

// ============================================================================
// Customer Zero (founder dogfood tenant)
// ============================================================================

export * from "./customer-zero.js";
