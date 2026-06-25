/**
 * Analytics Types
 *
 * Core types for the analytics abstraction layer.
 */

/**
 * User identification properties
 */
export interface UserProperties {
  userId?: string;
  email?: string;
  name?: string;
  tenantId?: string;
  plan?: "personal" | "team" | "org" | "enterprise";
  role?: string;
  department?: string;
  [key: string]: unknown;
}

/**
 * Event properties
 */
export interface EventProperties {
  [key: string]: unknown;
}

/**
 * Page view properties
 */
export interface PageProperties {
  path?: string;
  title?: string;
  referrer?: string;
  surface?: string;
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
}

/**
 * Analytics provider interface
 */
export interface AnalyticsProvider {
  name: string;

  /** Initialize the provider */
  init(config: ProviderConfig): Promise<void>;

  /** Identify a user */
  identify(userId: string, properties?: UserProperties): void;

  /** Track an event */
  track(event: string, properties?: EventProperties): void;

  /** Track a page view */
  page(properties?: PageProperties): void;

  /** Reset user identity (logout) */
  reset(): void;

  /** Set super properties (sent with every event) */
  setSuperProperties?(properties: EventProperties): void;

  /** Opt user out of tracking */
  optOut?(): void;

  /** Opt user back in to tracking */
  optIn?(): void;

  /** Check if user is opted out */
  isOptedOut?(): boolean;

  /** Flush any pending events */
  flush?(): Promise<void>;

  /** Shutdown the provider */
  shutdown?(): void;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  apiKey?: string;
  host?: string;
  debug?: boolean;
  autocapture?: boolean;
  persistence?: "localStorage" | "cookie" | "memory" | "none";
  [key: string]: unknown;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  providers: ProviderConfig[];
  debug?: boolean;
  defaultProperties?: EventProperties;
  enabled?: boolean;
}

/**
 * Standard IntegrateWise events
 *
 * Organized by OS layer for consistency.
 */
export const StandardEvents = {
  // ═══════════════════════════════════════════════════════════════
  // P0 — GOVERNANCE
  // ═══════════════════════════════════════════════════════════════
  AUTH_SIGNED_UP: "auth_signed_up",
  AUTH_SIGNED_IN: "auth_signed_in",
  AUTH_SIGNED_OUT: "auth_signed_out",
  AUTH_PASSWORD_RESET: "auth_password_reset",

  // ═══════════════════════════════════════════════════════════════
  // L0 — ONBOARDING
  // ═══════════════════════════════════════════════════════════════
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_COMPLETED: "onboarding_completed",
  BUCKET_CREATED: "bucket_created",
  BUCKET_CONNECTED: "bucket_connected",
  CONNECTOR_AUTHORIZED: "connector_authorized",

  // ═══════════════════════════════════════════════════════════════
  // L3 — ADAPTIVE SPINE
  // ═══════════════════════════════════════════════════════════════
  ENTITY_VIEWED: "entity_viewed",
  ENTITY_CREATED: "entity_created",
  ENTITY_UPDATED: "entity_updated",
  ENTITY_SEARCH: "entity_search",

  // ═══════════════════════════════════════════════════════════════
  // L2 — COGNITIVE BRAIN
  // ═══════════════════════════════════════════════════════════════
  COGNITIVE_DRAWER_OPENED: "cognitive_drawer_opened",
  COGNITIVE_DRAWER_CLOSED: "cognitive_drawer_closed",
  CHAT_STARTED: "chat_started",
  CHAT_MESSAGE_SENT: "chat_message_sent",
  CHAT_RESPONSE_RECEIVED: "chat_response_received",
  AGENT_INVOKED: "agent_invoked",
  SIGNAL_ACKNOWLEDGED: "signal_acknowledged",
  DECISION_RECORDED: "decision_recorded",

  // ═══════════════════════════════════════════════════════════════
  // L1 — THE WORKPLACE
  // ═══════════════════════════════════════════════════════════════
  TASK_CREATED: "task_created",
  TASK_COMPLETED: "task_completed",
  SURFACE_VIEWED: "surface_viewed",
  QUICK_ACTION_USED: "quick_action_used",
  CONTEXT_SWITCHED: "context_switched",

  // ═══════════════════════════════════════════════════════════════
  // FEATURE ENGAGEMENT
  // ═══════════════════════════════════════════════════════════════
  FEATURE_USED: "feature_used",
  FEATURE_DISCOVERED: "feature_discovered",
  UPGRADE_PROMPTED: "upgrade_prompted",
  UPGRADE_STARTED: "upgrade_started",
  UPGRADE_COMPLETED: "upgrade_completed",
};

export type StandardEventName = (typeof StandardEvents)[keyof typeof StandardEvents];
