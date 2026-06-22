// ========================================
// Multi-Tenant & RBAC Type Definitions
// ========================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  plan: "starter" | "professional" | "enterprise" | "custom";
  region: "india" | "singapore" | "australia" | "global";
  dataResidency: string;
  maturityLevel: number;
  memberCount: number;
  integrationCount: number;
  createdAt: string;
  status: "active" | "suspended" | "trial";
  compliance: string[];
  owner: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
  role: RoleId;
  status: "active" | "invited" | "suspended" | "deactivated";
  department: string;
  timezone: string;
  lastActive: string;
  joinedAt: string;
  mfaEnabled: boolean;
  tenants: string[]; // tenant IDs user belongs to
  viewModes: ViewModeAccess;
  modules: ModuleAccess;
}

export type RoleId = "super_admin" | "admin" | "ops_manager" | "analyst" | "cs_lead" | "sales_rep" | "marketing_mgr" | "viewer" | "external_auditor" | "custom";

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  color: string;
  isSystem: boolean; // system roles can't be deleted
  userCount: number;
  permissions: PermissionSet;
  fieldAccess: FieldAccessConfig;
  maxMaturityAccess: number; // max integration maturity level they can configure
}

export interface PermissionSet {
  // Module-level permissions
  business_ops: ModulePermission;
  website: ModulePermission;
  marketing: ModulePermission;
  sales: ModulePermission;
  admin: ModulePermission;

  // Cross-cutting permissions
  intelligence_overlay: "full" | "read" | "none";
  integrations_manage: boolean;
  workflows_create: boolean;
  workflows_execute: boolean;
  agents_configure: boolean;
  byom_manage: boolean;
  export_data: boolean;
  bulk_actions: boolean;
  api_access: boolean;
  webhook_manage: boolean;
}

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  admin: boolean;
}

export interface FieldAccessConfig {
  revenue_fields: "full" | "masked" | "hidden";
  contact_pii: "full" | "masked" | "hidden";
  api_keys: "full" | "masked" | "hidden";
  audit_logs: "full" | "read" | "hidden";
  billing_info: "full" | "masked" | "hidden";
}

export interface ViewModeAccess {
  personal: boolean;
  work: boolean;
  business: boolean;
  cs: boolean;
}

export interface ModuleAccess {
  ops: boolean;
  website: boolean;
  marketing: boolean;
  sales: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: "created" | "updated" | "deleted" | "accessed" | "exported" | "login" | "logout" | "role_changed" | "permission_changed" | "tenant_switched" | "invite_sent" | "mfa_toggled";
  target: string;
  details: string;
  ipAddress: string;
  tenant: string;
  severity: "info" | "warning" | "critical";
}

export interface InvitePending {
  id: string;
  email: string;
  role: RoleId;
  invitedBy: string;
  sentAt: string;
  expiresAt: string;
  status: "pending" | "expired" | "accepted";
}
