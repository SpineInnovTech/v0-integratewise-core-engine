/**
 * IntegrateWise V11.11 - Spine Module
 *
 * LOOP B: Truth Store
 * The Spine is the SINGLE SOURCE OF TRUTH for all verified, normalized data.
 */

export * from "./types";

// Re-export health score utilities
export {
  calculateHealthScore,
  getHealthStatus,
  type HealthScoreComponents,
  type HealthScoreInput,
} from "./types";

export * from "./contracts";
export * from "./src/adaptive-schema";
export * from "./src/schema-updater";
export * from "./src/success-schema";
export * from "./src/webhooks";
