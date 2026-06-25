export interface MorningBriefing {
  summary: string;
  orgHealthScore: number;
  healthColor: "blue" | "sky" | "amber" | "coral";
  activeAgentStatus: string;
  activeAgentTask: string;
}

export interface PrioritySignal {
  id: string;
  type: "overdue" | "deal" | "client_risk" | "approval_pending" | "memory_event";
  title: string;
  description: string;
  timestamp: string;
  relatedMemoriesCount: number;
  rulesAppliedCount: number;
  urgency: "high" | "medium" | "low";
}

export interface OvernightChange {
  id: string;
  category: "signal" | "pipeline" | "memory";
  description: string;
  timestamp: string;
}

export interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  type: "client" | "internal" | "focus";
}

export interface PriorityAction {
  id: string;
  title: string;
  whyNow: string;
  urgency: "critical" | "high" | "medium";
  due: string;
  involvedTeammates: string[];
  governanceTrace: {
    ruleTriggered: string;
    aiRecommendation: string;
    approvedStatus: string;
  };
  contextSummary: string;
}

export interface DecisionPending {
  id: string;
  title: string;
  type: string;
  proposedBy: string;
  timestamp: string;
  score: number;
  description: string;
  evidenceSource: string;
  lineageId: string;
}

export interface TriageBotInsight {
  id: string;
  type: "risk" | "opportunity" | "pattern";
  title: string;
  description: string;
  confidence: number;
  impact: string;
}

export interface FocusBlock {
  id: string;
  time: string;
  duration: string;
  purpose: string;
}

export interface PlaybookRule {
  id: string;
  name: string;
  scope: string;
  ruleText: string;
  governanceAudit: string;
  isActive: boolean;
}

export interface TeammateContribution {
  id: string;
  teammate: string;
  avatar: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface TwinPreparedItem {
  id: string;
  type: "email_draft" | "summary" | "record_pull";
  title: string;
  description: string;
  preview: string;
}

export interface ConnectorStatus {
  id: string;
  name: string;
  logo: string;
  status: "live" | "syncing" | "degraded" | "offline";
  latency: string;
  lastSync: string;
}

export interface AISkill {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface MemoryRecord {
  id: string;
  title: string;
  category: "Decisions" | "Workflows" | "Institutional Rules" | "Preferences";
  content: string;
  author: string;
  timestamp: string;
  governanceState: "staging" | "approved" | "published";
  version: number;
}

export interface GovernanceEvent {
  id: string;
  action: string;
  operator: string;
  result: "approved" | "rejected" | "blocked" | "flagged";
  ruleApplied: string;
  timestamp: string;
  details: string;
}
