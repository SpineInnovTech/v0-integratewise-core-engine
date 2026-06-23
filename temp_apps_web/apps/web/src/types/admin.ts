export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  status: "active" | "inactive";
  plan: string;
  domains: string[];
  lastActiveAt: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  memberCount?: number;
  isSystem?: boolean;
  baseRole?: string;
  createdAt?: string;
  tenant_id?: string;
  created_at?: string;
}

export interface RegistryObject {
  id: string;
  registryKey?: string;
  displayName: string;
  type: string;
  worldScope: string;
  version: string;
  updatedAt: string;
  department?: string;
  accountRole?: string;
  enabled: boolean;
  schema?: Record<string, unknown>;
  status?: string;
  tenant_id?: string;
}

export interface ServiceHealthMetric {
  service: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  latency_ms?: number;
  errorRate: number;
  error_rate?: number;
  uptime_percent?: number;
  updatedAt: string;
  last_check?: string;
}

export interface GovernanceRequest {
  id: string;
  actionKey: string;
  tenantId: string;
  riskScore?: number;
  blastRadius?: number;
  status: "pending" | "approved" | "rejected";
  type?: string;
  action?: string;
  requester_id?: string;
  approver_id?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  resolved_at?: string;
}

export interface ConnectorInstance {
  id: string;
  system: string;
  tenantId: string;
  status: "healthy" | "warning" | "error";
  lastSyncAt: string;
  errorRate: number;
  name?: string;
  type?: string;
  config?: Record<string, unknown>;
  last_sync?: string;
  created_at?: string;
}

export interface BillingPlan {
  tenantId: string;
  plan: string;
  seatsUsed: number;
  seats: number;
  alerts: string[];
  usage: {
    aiTokens: number;
    actionRuns: number;
    connectorSyncs: number;
    storageGb: number;
  };
  id?: string;
  name?: string;
  price?: number;
  interval?: "monthly" | "yearly";
  features?: string[];
  limits?: Record<string, number>;
  status?: "active" | "deprecated";
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  objectType: string;
  objectId: string;
  timestamp: string;
  justification?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  actor_id?: string;
  actor_name?: string;
  resource_type?: string;
  resource_id?: string;
  tenant_id?: string;
  metadata?: Record<string, unknown>;
}

export interface ActionTemplate {
  id: string;
  key: string;
  category: string;
  riskLevel?: string;
  approvalRequired: boolean;
  connectors: string[];
  requiredEvidenceTypes: string[];
  simulationSupported: boolean;
  rollbackSupported: boolean;
  name?: string;
  description?: string;
  type?: string;
  config?: Record<string, unknown>;
  status?: "active" | "disabled";
  tenant_id?: string;
  created_at?: string;
}
