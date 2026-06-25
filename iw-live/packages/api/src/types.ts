export interface Env {
  DB: D1Database;
  AI: Ai;
  ANTHROPIC_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  ENVIRONMENT: string;
  // Webhook secrets
  HUBSPOT_CLIENT_SECRET?: string;
  LINKEDIN_CLIENT_SECRET?: string;
  CANVA_WEBHOOK_SECRET?: string;
  SALESFORCE_SECURITY_TOKEN?: string;
  PIPEDRIVE_WEBHOOK_TOKEN?: string;
  META_VERIFY_TOKEN?: string;
  WHATSAPP_VERIFY_TOKEN?: string;
}

export type EntityType =
  | "project"
  | "task"
  | "customer"
  | "opportunity"
  | "document"
  | "note"
  | "metric"
  | "event"
  | "lead" // CRM leads from webhooks
  | "contact" // CRM contacts
  | "deal" // Sales deals
  | "team_member"
  | "compliance"
  | "rnd";

// Webhook source providers
export type WebhookSource =
  | "hubspot"
  | "salesforce"
  | "pipedrive"
  | "linkedin"
  | "canva"
  | "google_ads"
  | "meta"
  | "whatsapp"
  | "razorpay"
  | "stripe"
  | "github"
  | "vercel"
  | "todoist"
  | "notion"
  | "coda"
  | "slack"
  | "linear"
  | "shopify"
  | "manual";

export type EntityStatus = "active" | "completed" | "archived" | "blocked" | "pending";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Entity {
  id: string;
  type: EntityType;
  title: string;
  description?: string;
  status: EntityStatus;
  priority: Priority;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  parent_id?: string;
  owner?: string;
  source?: string;
  source_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  id: string;
  key: string;
  value: number;
  unit?: string;
  category: string;
  period?: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  entity_id?: string;
  action: string;
  actor?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: string;
  last_sync?: string;
  created_at: string;
}

export interface AICommand {
  id: string;
  input: string;
  intent?: string;
  entities_affected?: string[];
  response?: string;
  success: boolean;
  created_at: string;
}

export interface CommandResult {
  intent: string;
  action?: string;
  entities?: Entity[];
  metrics?: Metric[];
  message: string;
  data?: unknown;
}
