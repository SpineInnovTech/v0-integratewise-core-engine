/**
 * Tenant Service Types
 *
 * Core types for multi-tenant SaaS functionality
 */

export type Plan = "personal" | "team" | "org" | "enterprise";
export type TenantStatus = "active" | "trial" | "suspended" | "churned";
export type WorkspaceType = "production" | "staging" | "development";
export type UserStatus = "active" | "invited" | "suspended";

export interface TenantContext {
  tenantId: string;
  workspaceId: string;
  plan: Plan;
  limits: PlanLimits;
  features: string[];
  settings: Record<string, any>;
}

export interface PlanLimits {
  users: number;
  connectors: number;
  aiSessions: number;
  storageGb: number;
  retentionDays: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  status: TenantStatus;
  trialEndsAt?: Date;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  dataRegion: string;
  demoMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  type: WorkspaceType;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  status: UserStatus;
  lastSeenAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  tenantId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAt?: Date;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "paused";
