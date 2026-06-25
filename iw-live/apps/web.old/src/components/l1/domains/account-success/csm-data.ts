export interface CSMAccount {
  id: string;
  name: string;
  logo: string;
  domain: string;
  arr: number;
  arrGrowth: number;
  healthScore: number;
  tier: "enterprise" | "mid-market" | "smb";
  region: string;
  industry: string;
  renewalDate: string;
  renewalDays: number;
  owner: { name: string; initials: string; avatar?: string };
  lastTouchpoint: string;
  lastTouchDays: number;
  contacts: number;
  openTickets: number;
  csat: number;
  nps: number;
  productAdoption: number;
  engagement: number;
  valueRealization: number;
  status: "active" | "onboarding" | "churning" | "churned";
  tags: string[];
  sources: string[];
}

export interface CSMContact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  accountId: string;
  accountName: string;
  avatar: string;
  role: "champion" | "decision-maker" | "end-user" | "executive" | "technical";
  sentiment: "positive" | "neutral" | "at-risk" | "negative";
  lastContactDate: string;
  lastContactDays: number;
  emailCount: number;
  meetingCount: number;
  slackMessages: number;
  nps: number | null;
  sources: string[];
}

export interface CSMProject {
  id: string;
  name: string;
  objective: string;
  accountId: string;
  accountName: string;
  progress: number;
  status: "planning" | "in-progress" | "completed" | "blocked" | "on-hold";
  owner: { name: string; initials: string };
  startDate: string;
  dueDate: string;
  linkedContacts: string[];
  taskCount: number;
  completedTasks: number;
  priority: "high" | "medium" | "low";
  tags: string[];
}

export interface CSMTask {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "done" | "overdue";
  assignee: { name: string; initials: string };
  dueDate: string;
  dueDays: number;
  accountId?: string;
  accountName?: string;
  projectId?: string;
  projectName?: string;
  contactId?: string;
  contactName?: string;
  createdAt: string;
  completedAt?: string;
  tags: string[];
}

export interface CSMMeeting {
  id: string;
  title: string;
  type: "qbr" | "check-in" | "onboarding" | "ebr" | "internal" | "training";
  startTime: string;
  endTime: string;
  duration: number;
  accountId?: string;
  accountName?: string;
  participants: { name: string; initials: string; role: string }[];
  hasNotes: boolean;
  hasRecording: boolean;
  status: "scheduled" | "completed" | "cancelled";
  projectId?: string;
  followUpTasks: number;
}

export interface CSMDocument {
  id: string;
  name: string;
  type: "pdf" | "docx" | "xlsx" | "pptx" | "csv" | "png" | "jpg";
  size: number;
  accountId?: string;
  accountName?: string;
  projectId?: string;
  space: "personal" | "team" | "account" | "project";
  uploadedBy: { name: string; initials: string };
  uploadedAt: string;
  tags: string[];
  source: string;
}

export interface RiskAlert {
  id: string;
  accountId: string;
  accountName: string;
  severity: "high" | "medium" | "low";
  type: "churn" | "engagement-drop" | "expansion" | "escalation" | "renewal";
  title: string;
  description: string;
  confidence: number;
  evidenceCount: number;
  createdAt: string;
  cta: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: "meeting" | "renewal" | "milestone" | "task-due";
  date: string;
  time?: string;
  duration?: number;
  accountName?: string;
  color: string;
}

export function getHealthColor(score: number): string {
  if (score >= 80) return "var(--iw-success)";
  if (score >= 60) return "var(--iw-warning)";
  return "var(--iw-danger)";
}

export function getHealthLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "At Risk";
  return "Critical";
}

export function getSentimentColor(s: CSMContact["sentiment"]): string {
  switch (s) {
    case "positive":
      return "var(--iw-success)";
    case "neutral":
      return "var(--iw-forest-mid)";
    case "at-risk":
      return "var(--iw-warning)";
    case "negative":
      return "var(--iw-danger)";
  }
}

export function getPriorityColor(p: string): string {
  switch (p) {
    case "high":
      return "var(--iw-danger)";
    case "medium":
      return "var(--iw-warning)";
    case "low":
      return "var(--iw-forest-mid)";
    default:
      return "var(--muted-foreground)";
  }
}

export function getStatusColor(s: string): string {
  switch (s) {
    case "completed":
    case "done":
      return "var(--iw-success)";
    case "in-progress":
      return "var(--iw-forest-mid)";
    case "planning":
    case "todo":
      return "var(--muted-foreground)";
    case "blocked":
    case "overdue":
      return "var(--iw-danger)";
    case "on-hold":
      return "var(--iw-warning)";
    default:
      return "var(--muted-foreground)";
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
