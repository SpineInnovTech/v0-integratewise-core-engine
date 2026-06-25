import { z } from "zod";

// ============================================================================
// BASE CONNECTOR CONTRACTS
// ============================================================================

export interface ConnectorConfig {
  [key: string]: any;
}

export class ConnectorError extends Error {
  constructor(
    message: string,
    public cause?: any
  ) {
    super(message);
    this.name = "ConnectorError";
  }
}

export abstract class BaseConnector {
  constructor(protected config: ConnectorConfig) {}

  abstract testConnection(): Promise<boolean>;

  /**
   * Returns metadata about the connector to support intelligent management.
   */
  getMetadata(): ConnectorMetadata {
    return {
      id: "unknown",
      name: "Unknown Connector",
      version: "0.0.0",
      apiVersion: "unknown",
      capabilities: { sync: false, webhooks: false },
    };
  }
}

// ============================================================================
// RESILIENCE CONTRACTS
// ============================================================================

export enum CircuitStatus {
  CLOSED = "closed", // Normal operation
  OPEN = "open", // Failing, blocking requests
  HALF_OPEN = "half_open", // Testing if service recovered
}

export interface ResilienceConfig {
  retryPolicy: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
  circuitBreaker: {
    failureThreshold: number; // Num failures to open circuit
    resetTimeoutMs: number; // Time to wait before half-open
    successThreshold?: number; // Num successes in half-open to close circuit (default: 3)
  };
}

export interface ConnectorMetadata {
  id: string;
  name: string;
  version: string;
  apiVersion: string;
  capabilities: {
    sync: boolean;
    webhooks: boolean;
    dataVelocity?: "realtime" | "high" | "low";
  };
}

export interface SyncResult {
  connectorId: string;
  startTime: Date;
  endTime: Date;
  status: "success" | "failed" | "partial";
  recordsProcessed: number;
  dataChanged: boolean;
  error?: string;
}

// ============================================================================
// BASE ACCELERATOR CONTRACTS
// ============================================================================

export interface AcceleratorConfig {
  [key: string]: any;
}

export class AcceleratorError extends Error {
  constructor(
    message: string,
    public cause?: any
  ) {
    super(message);
    this.name = "AcceleratorError";
  }
}

export abstract class BaseAccelerator {
  constructor(protected config: AcceleratorConfig) {}

  // Accelerators typically have custom methods, but valid init is good
  async initialize?(): Promise<void>;
}

// ============================================================================
// STRIPE CONTRACTS
// ============================================================================
export const StripePaymentEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.any(),
  created: z.number(),
});

export type StripePaymentEvent = z.infer<typeof StripePaymentEventSchema>;

// ============================================================================
// SALESFORCE CONTRACTS
// ============================================================================
export const SalesforceLeadSchema = z.object({
  Id: z.string().optional(),
  FirstName: z.string(),
  LastName: z.string(),
  Company: z.string(),
  Email: z.string().email(),
  Status: z.string().default("Open - Not Contacted"),
});

export type SalesforceLead = z.infer<typeof SalesforceLeadSchema>;

// ============================================================================
// NORMALIZED SPINE EVENT
// ============================================================================
export const NormalizedConnectorEventSchema = z.object({
  tenant_id: z.string().uuid(),
  event_type: z.string(),
  source_system: z.string(),
  idempotency_key: z.string(),
  payload: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
});

export type NormalizedConnectorEvent = z.infer<typeof NormalizedConnectorEventSchema>;
