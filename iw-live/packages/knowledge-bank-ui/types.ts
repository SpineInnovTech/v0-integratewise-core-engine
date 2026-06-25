export type Provider = "chatgpt" | "claude" | "grok" | "gemini" | "other";

export type Cadence = "weekly" | "biweekly";

export interface Attachment {
  name: string;
  gcs_path: string;
}

export interface Session {
  id: string;
  tenant_id: string;
  user_id: string;
  provider: Provider;
  started_at: string; // ISO-8601
  ended_at: string; // ISO-8601
  summary_md: string;
  topics: string[];
  attachments?: Attachment[];
  project?: string;
}

export interface Topic {
  id: string;
  name: string;
  cadence: Cadence;
  last_synced_at?: string; // ISO-8601
}

export type Page = "inbox" | "search" | "topics" | "demo";
