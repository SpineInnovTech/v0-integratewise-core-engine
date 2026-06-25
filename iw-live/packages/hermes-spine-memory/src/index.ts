/**
 * Hermes Spine Memory — Main Exports
 *
 * CouchDB memory substrate for IntegrateWise.
 * Provides namespace isolation, continuity object CRUD,
 * and Twin memory context switching primitives.
 *
 * Usage:
 *   import { CouchDbClient, ContinuityObjectStore, resolveNamespace, routeTwinMemory } from "@integratewise/hermes-spine-memory";
 */

// Client
export { CouchDbClient } from "./client.js";

// Namespace isolation & routing
export {
  buildDbName,
  resolveNamespace,
  parseNamespacePath,
  dbNameFromPath,
  listMemoryDatabases,
  routeTwinMemory,
} from "./namespaces.js";

// Continuity Object CRUD
export {
  ContinuityObjectStore,
  createContinuityObject,
  generateObjectId,
  CURRENT_SCHEMA_VERSION,
} from "./continuity-objects.js";

// Types
export type {
  CouchDbConfig,
  CouchDbResponse,
  MemoryScope,
  Namespace,
  ResolveNamespaceInput,
  SpineDocument,
  ContinuityObjectType,
  ContinuityObject,
  LineageEntry,
  ObjectReference,
  OperationalRealizationContent,
  GovernanceOutcomeContent,
  DeploymentLineageContent,
  CustomerContinuityStateContent,
  OrganizationalSynthesisContent,
  ContinuityTransitionContent,
  MangoSelector,
  MangoQueryOptions,
  MangoQueryResult,
  ViewQueryOptions,
  ViewQueryResult,
  TwinMemoryContext,
  TwinMemoryPayload,
} from "./types.js";
