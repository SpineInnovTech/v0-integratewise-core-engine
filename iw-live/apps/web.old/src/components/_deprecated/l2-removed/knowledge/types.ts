export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  provider: string;
  type: "document" | "article" | "note" | "conversation";
  status: "pending" | "processed" | "failed";
  tenant_id: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface KnowledgeTopic {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  lastUpdated: string;
  cadence?: Cadence;
}

export interface Topic extends KnowledgeTopic {
  cadence: Cadence;
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
  source: string;
  document: KnowledgeDocument;
}

export interface InboxItem {
  id: string;
  title: string;
  source: string;
  receivedAt: string;
  status: "new" | "reviewed" | "archived";
  content: string;
  provider: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  provider: Provider;
  summary_md: string;
  attachments?: Array<{ name: string; gcs_path: string }>;
  topics: string[];
  ended_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CadenceObject {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly" | "biweekly";
  description: string;
}

export type Cadence = "daily" | "weekly" | "monthly" | "biweekly";

export type Page = "inbox" | "topics" | "search" | "demo";

export type Provider =
  | "email"
  | "slack"
  | "notion"
  | "drive"
  | "confluence"
  | "github"
  | "linear"
  | "gemini"
  | "chatgpt"
  | "claude"
  | "grok"
  | "other";
