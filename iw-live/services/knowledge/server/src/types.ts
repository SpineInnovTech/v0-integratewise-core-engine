export type Provider = "chatgpt" | "claude" | "grok" | "gemini" | "other";
export type Cadence = "weekly" | "biweekly";

export interface SessionIngestPayload {
  tenant_id: string;
  user_id: string;
  provider: Provider;
  session_id: string;
  started_at: string; // ISO-8601
  ended_at: string; // ISO-8601
  summary_md: string;
  topics?: string[];
  project?: string;
}

export interface SessionMetadata {
  tenant_id: string;
  user_id: string;
  provider: Provider;
  topics: string[];
  project?: string;
  summary_gcs_path: string;
  created_at: string;
}

export interface Topic {
  id: string;
  name: string;
  cadence: Cadence;
  hourly_opt_in: boolean;
  last_synced_at?: string;
  updated_at: string;
}

export interface SearchQuery {
  q: string;
  topic?: string;
  from?: string;
  to?: string;
  tenant_id: string;
}

export interface AuthContext {
  tenantId: string;
  role: "admin" | "member" | "viewer";
}
