import { BaseConnector, ConnectorConfig } from "@integratewise/connector-contracts";

// ============================================================================
// DOMAIN MASTER CONNECTOR — TYPES
// ============================================================================

/**
 * Defines a provider that a domain master can instantiate.
 * The `connectorClass` is the constructor reference — the master
 * creates instances on demand and re-creates when config changes.
 */
export interface ProviderDefinition {
  /** Unique provider ID within the domain (e.g. "salesforce", "hubspot") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Category tag for filtering/grouping */
  category: string;
  /** The connector class constructor — must extend BaseConnector */
  connectorClass: new (config: any) => BaseConnector;
  /** Short description of what this provider connects to */
  description?: string;
  /** Whether this provider requires OAuth (vs API key) */
  authType?: "api_key" | "oauth2" | "basic" | "token";
  /** Required config fields — used for validation before instantiation */
  requiredFields?: string[];
}

/**
 * Runtime state for a configured provider within a domain master.
 */
export interface ProviderState {
  /** The provider definition reference */
  definition: ProviderDefinition;
  /** Current configuration (credentials, endpoints, etc.) */
  config: ConnectorConfig;
  /** Whether this provider is enabled for operations */
  enabled: boolean;
  /** Last time the connection was verified */
  lastHealthCheck?: Date;
  /** Last health check result */
  healthy?: boolean;
  /** Error message from last failed operation */
  lastError?: string;
}

/**
 * Domain identifiers — matches IntegrateWise domain model.
 */
export type DomainId =
  | "crm"
  | "communication"
  | "support"
  | "finance"
  | "marketing"
  | "analytics"
  | "productivity"
  | "engineering"
  | "compliance"
  | "commerce"
  | "ai";

/**
 * Summary of a domain master's state — used for dashboards / health views.
 */
export interface DomainHealthSummary {
  domain: DomainId;
  totalProviders: number;
  configuredProviders: number;
  healthyProviders: number;
  primaryProvider: string | null;
  providers: Array<{
    id: string;
    name: string;
    configured: boolean;
    enabled: boolean;
    healthy: boolean | null;
    lastCheck: Date | null;
  }>;
}

/**
 * Event emitted when a provider's configuration changes.
 */
export interface ConfigChangeEvent {
  domain: DomainId;
  providerId: string;
  changeType: "configured" | "updated" | "removed" | "enabled" | "disabled";
  timestamp: Date;
}
