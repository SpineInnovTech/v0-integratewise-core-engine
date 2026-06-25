import {
  MorningBriefing,
  PrioritySignal,
  OvernightChange,
  CalendarEvent,
  PriorityAction,
  DecisionPending,
  TriageBotInsight,
  FocusBlock,
  PlaybookRule,
  TeammateContribution,
  TwinPreparedItem,
  ConnectorStatus,
  AISkill,
  MemoryRecord,
  GovernanceEvent,
} from "./types";

export const mockMorningBriefing: MorningBriefing = {
  summary:
    "Northwind Logistics webhook degradation detected in stage 4 pipeline. Twin has staged an auto-buffering playbook. Two client reviews are scheduled, and $120K in ARR is currently pending final approval in the governance workbench.",
  orgHealthScore: 88,
  healthColor: "sky",
  activeAgentStatus: "Monitoring Webhooks",
  activeAgentTask: "Analyzing buffering logs for Northwind Logistics",
};

export const mockPrioritySignals: PrioritySignal[] = [
  {
    id: "sig-1",
    type: "client_risk",
    title: "Northwind Logistics Webhook Drops",
    description:
      "Pipeline normalizer Stage 4 experiencing 8.2% drop rate due to server congestion.",
    timestamp: "10 min ago",
    relatedMemoriesCount: 3,
    rulesAppliedCount: 1,
    urgency: "high",
  },
  {
    id: "sig-2",
    type: "approval_pending",
    title: "ARR Expansion Approval Request",
    description: "Acme Corp upsell of $45K requires dual-write memory confirmation.",
    timestamp: "2h ago",
    relatedMemoriesCount: 1,
    rulesAppliedCount: 2,
    urgency: "high",
  },
  {
    id: "sig-3",
    type: "deal",
    title: "Brightwave Solutions Renewal Close",
    description: "$98K ARR renewal scheduled for automated signature ingestion.",
    timestamp: "4h ago",
    relatedMemoriesCount: 5,
    rulesAppliedCount: 1,
    urgency: "medium",
  },
  {
    id: "sig-4",
    type: "overdue",
    title: "Stale Integration Audit: CloudBridge",
    description: "Health score degraded to 62. Security policy review overdue by 3 days.",
    timestamp: "Yesterday",
    relatedMemoriesCount: 2,
    rulesAppliedCount: 3,
    urgency: "high",
  },
];

export const mockOvernightChanges: OvernightChange[] = [
  {
    id: "oc-1",
    category: "signal",
    description: "Twin auto-resolved two minor webhook parsing errors on HubSpot Connector.",
    timestamp: "03:15 AM",
  },
  {
    id: "oc-2",
    category: "pipeline",
    description: "Normalizer ingested 14 new corporate updates into Spine context substrate.",
    timestamp: "04:30 AM",
  },
  {
    id: "oc-3",
    category: "memory",
    description: 'Autosynced Org Memory ruleset "CS-BUFFERING-01" to regional D1 cache.',
    timestamp: "05:00 AM",
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { id: "cal-1", time: "09:00 AM", title: "Twin Daily Briefing & Alert Audit", type: "internal" },
  { id: "cal-2", time: "10:30 AM", title: "Northwind Logistics Save Review", type: "client" },
  { id: "cal-3", time: "01:00 PM", title: "Deep Work: Rebuild buffering filters", type: "focus" },
  { id: "cal-4", time: "03:30 PM", title: "Acme Corp Executive Alignment", type: "client" },
];

export const mockPriorityActions: PriorityAction[] = [
  {
    id: "act-1",
    title: "Deploy webhook edge buffering playbook",
    whyNow:
      "Northwind is losing webhook payloads on production endpoints. Execution takes 12 seconds.",
    urgency: "critical",
    due: "11:00 AM",
    involvedTeammates: ["Hermes", "Nirmal"],
    governanceTrace: {
      ruleTriggered: "ENG-BUFFERING-THRESHOLD-2026",
      aiRecommendation: "Deploy Stage 4 edge queue extension (500ms limit)",
      approvedStatus: "Staged - Awaiting Action",
    },
    contextSummary: "Northwind Logistics webhook Drops",
  },
  {
    id: "act-2",
    title: "Approve $45K upsell billing schedule",
    whyNow: "Acme Corp requested custom billing cycle integration to close before Q2 review.",
    urgency: "high",
    due: "02:00 PM",
    involvedTeammates: ["Nirmal"],
    governanceTrace: {
      ruleTriggered: "FIN-CUSTOM-TERM-GATES",
      aiRecommendation: "Approve with 30-day default buffer",
      approvedStatus: "Staged - Awaiting Approval",
    },
    contextSummary: "ARR Expansion Approval Request",
  },
  {
    id: "act-3",
    title: "Initiate save playbook for CloudBridge",
    whyNow: "Active usage has declined 25% over 14 days. Rule CS-USAGE-ALERT was triggered.",
    urgency: "high",
    due: "End of Day",
    involvedTeammates: ["Hermes"],
    governanceTrace: {
      ruleTriggered: "CS-ESC-PROCEDURE-V2",
      aiRecommendation: "Draft usage drop email + Schedule CSM triage",
      approvedStatus: "Staged - Drafted by Twin",
    },
    contextSummary: "Stale Integration Audit: CloudBridge",
  },
];

export const mockDecisionsPending: DecisionPending[] = [
  {
    id: "dec-1",
    title: "Promote Webhook Buffer Policy to Org Rules",
    type: "Policy Revision",
    proposedBy: "Twin Engine (reasoner-3.6)",
    timestamp: "10 min ago",
    score: 0.94,
    description:
      "Raise default webhook buffering limit from 50ms to 200ms dynamically for high-frequency channels.",
    evidenceSource: "Production telemetry from pipeline.service",
    lineageId: "lin-8891",
  },
  {
    id: "dec-2",
    title: "Approve Custom Billing Schema for Acme Corp",
    type: "Data Schema Shift",
    proposedBy: "Hermes (Operator)",
    timestamp: "2h ago",
    score: 0.88,
    description:
      'Add field "override_billing_terms_v2" to core Spine DB records for Acme and child accounts.',
    evidenceSource: "Gmail contract confirmation & HubSpot Deal #9918",
    lineageId: "lin-8892",
  },
];

export const mockTriageBotInsights: TriageBotInsight[] = [
  {
    id: "tri-1",
    type: "risk",
    title: "Systemic Webhook Degradation",
    description:
      "Pattern matches prior crash of HubSpot connector in April 2026. High correlation.",
    confidence: 0.96,
    impact: "High ARR Loss Potential",
  },
  {
    id: "tri-2",
    type: "opportunity",
    title: "Potential Expansion Value",
    description:
      "Brightwave Solutions has exceeded their base usage limit by 180% without throttling. Perfect time for upsell.",
    confidence: 0.89,
    impact: "+$35K ARR Opportunity",
  },
  {
    id: "tri-3",
    type: "pattern",
    title: "Teammate Collaboration Hotspot",
    description:
      "Hermes and Nirmal collaborated on 12 related buffering tickets over 48 hours. Suggest creating automated Slack channel.",
    confidence: 0.81,
    impact: "Process Optimization",
  },
];

export const mockFocusBlocks: FocusBlock[] = [
  { id: "fb-1", time: "11:30 AM", duration: "90 mins", purpose: "Edge Buffering Fix Execution" },
  {
    id: "fb-2",
    time: "04:00 PM",
    duration: "60 mins",
    purpose: "Governance Review & Memory Cleanup",
  },
];

export const mockPlaybookRules: PlaybookRule[] = [
  {
    id: "rule-1",
    name: "CS-BUFFER-THRESHOLD-LIMIT",
    scope: "Departmental (Customer Success)",
    ruleText:
      "If webhook drops exceed 5% over a 5-minute interval, the twin MUST stage an edge buffering expansion playbook with dual-write replication.",
    governanceAudit: "Approved by Nirmal on June 1, 2026. Audited against security policies.",
    isActive: true,
  },
  {
    id: "rule-2",
    name: "FIN-CUSTOM-ARR-APPROVALS",
    scope: "Corporate (Finance)",
    ruleText:
      "All ARR additions exceeding $25K require manual operator approval in the Governance Workbench prior to D1 mirror synchronization.",
    governanceAudit: "Locked by Hermes. Audit trails archived in permanent markdown.",
    isActive: true,
  },
  {
    id: "rule-3",
    name: "SEC-VECTOR-PII-REDACTION",
    scope: "Security (Global)",
    ruleText:
      "Redact all raw credentials, API keys, and PII from Spine ingest logs before pushing session summaries to conversational vector spaces.",
    governanceAudit: "Doctrine locked. Compliance tested against ISO27001.",
    isActive: true,
  },
];

export const mockTeammateContributions: TeammateContribution[] = [
  {
    id: "tc-1",
    teammate: "Nirmal Prince J",
    avatar: "NP",
    action: "Approved playbook schema override for",
    target: "Northwind Logistics",
    timestamp: "1h ago",
  },
  {
    id: "tc-2",
    teammate: "Hermes Operator",
    avatar: "HO",
    action: "Resolved customer contact mismatch in CRM for",
    target: "Brightwave Solutions",
    timestamp: "3h ago",
  },
  {
    id: "tc-3",
    teammate: "Nirmal Prince J",
    avatar: "NP",
    action: "Archived deprecated CouchDB connectors from",
    target: "Integration Hub",
    timestamp: "5h ago",
  },
];

export const mockTwinPreparedItems: TwinPreparedItem[] = [
  {
    id: "tpi-1",
    type: "email_draft",
    title: "Northwind Outage Explanation Draft",
    description:
      "Sleek, transparent status email written specifically for CEO of Northwind Logistics.",
    preview:
      "Hi team, we identified a temporary drop rate in Stage 4. Edge buffer rules have been expanded...",
  },
  {
    id: "tpi-2",
    type: "summary",
    title: "Acme Corp Upsell Summary Sheet",
    description:
      "Synthesized timeline of all deals and conversational notes from the past 30 days.",
    preview: "Acme Corp requested custom cycles. Dual-writes have been successfully staged...",
  },
  {
    id: "tpi-3",
    type: "record_pull",
    title: "CloudBridge Historical Incident File",
    description:
      "Unified JSON data bundle compiled from HubSpot CRM + Jira incident queue history.",
    preview: "Reconstructed 3 critical tickets from April. Pattern matches current degradation...",
  },
];

export const mockConnectorStatuses: ConnectorStatus[] = [
  {
    id: "conn-1",
    name: "HubSpot CRM",
    logo: "HS",
    status: "live",
    latency: "42ms",
    lastSync: "10s ago",
  },
  {
    id: "conn-2",
    name: "Jira Software",
    logo: "JR",
    status: "live",
    latency: "120ms",
    lastSync: "30s ago",
  },
  {
    id: "conn-3",
    name: "Salesforce Core",
    logo: "SF",
    status: "syncing",
    latency: "280ms",
    lastSync: "2m ago",
  },
  {
    id: "conn-4",
    name: "DocuSign Signatures",
    logo: "DS",
    status: "live",
    latency: "95ms",
    lastSync: "5m ago",
  },
  {
    id: "conn-5",
    name: "Slack Hook",
    logo: "SL",
    status: "live",
    latency: "35ms",
    lastSync: "5s ago",
  },
  {
    id: "conn-6",
    name: "Coda Docs",
    logo: "CD",
    status: "degraded",
    latency: "820ms",
    lastSync: "15m ago",
  },
];

export const mockAISkills: AISkill[] = [
  {
    id: "sk-1",
    name: "Anomaly Detector",
    description: "Surfaces telemetry drops and performance slips dynamically.",
    category: "Telemetry",
  },
  {
    id: "sk-2",
    name: "Contract Summarizer",
    description: "Pulls terms, obligations, and custom billing models from PDFs.",
    category: "Document Analysis",
  },
  {
    id: "sk-3",
    name: "Risk Predictor",
    description: "Predicts retention slippage based on support spikes and usage drops.",
    category: "Customer Success",
  },
  {
    id: "sk-4",
    name: "Playbook Builder",
    description: "Generates functional, safe playbook schemas for edge deployment.",
    category: "Execution",
  },
];

export const mockMemoryRecords: MemoryRecord[] = [
  {
    id: "mem-1",
    title: "Northwind Buffering Override Agreement",
    category: "Decisions",
    content:
      "Agreed with Northwind Director of Eng to expand the edge buffer limit to 500ms during congestion windows. Autoclassified by Triage Bot.",
    author: "Nirmal Prince J",
    timestamp: "June 1, 2026",
    governanceState: "published",
    version: 2,
  },
  {
    id: "mem-2",
    title: "Double-Write Synchronization Strategy",
    category: "Workflows",
    content:
      "Ensure all Org Memory writes commit concurrently to the vector database for searches and physical markdown files for archiving.",
    author: "Hermes Operator",
    timestamp: "May 28, 2026",
    governanceState: "published",
    version: 1,
  },
  {
    id: "mem-3",
    title: "ARR Expansion Approval Guardrails",
    category: "Institutional Rules",
    content:
      "No ARR adjustment over $25K should bypass the dual-signature workflow. Prevents immediate, unreviewed updates to Cloudflare edge cache.",
    author: "Nirmal Prince J",
    timestamp: "May 25, 2026",
    governanceState: "published",
    version: 3,
  },
  {
    id: "mem-4",
    title: "Acme Executive Communications Preferences",
    category: "Preferences",
    content:
      "Prefers dense technical logs attached directly to summaries. Avoid sales terminology and prioritize diagnostic dashboards.",
    author: "Twin Engine",
    timestamp: "June 2, 2026",
    governanceState: "staging",
    version: 1,
  },
];

export const mockGovernanceEvents: GovernanceEvent[] = [
  {
    id: "gov-1",
    action: "Approved Buffer Expansion for Northwind Logistics",
    operator: "Nirmal Prince J",
    result: "approved",
    ruleApplied: "CS-BUFFER-THRESHOLD-LIMIT",
    timestamp: "1h ago",
    details: "Expanded buffer limit to 500ms. Dual-writes committed successfully to SQLite DB.",
  },
  {
    id: "gov-2",
    action: "Staged Custom Schema for Acme Corp Upsell",
    operator: "Twin Engine",
    result: "approved",
    ruleApplied: "FIN-CUSTOM-ARR-APPROVALS",
    timestamp: "2h ago",
    details: "Staged $45K upsell schedule. Awaiting second operator validation.",
  },
  {
    id: "gov-3",
    action: "Blocked Unsigned API Webhook Change",
    operator: "System Guard",
    result: "blocked",
    ruleApplied: "SEC-VECTOR-PII-REDACTION",
    timestamp: "4h ago",
    details:
      "Blocked raw customer password token from flowing into conversational memory. Source: support ticket draft.",
  },
];

// Rich datasets for the 14 execution modules of Surface 4
export const mockCRMContacts = [
  {
    name: "John Doe",
    email: "john@northwind.com",
    title: "VP of Eng",
    account: "Northwind Logistics",
    phone: "+1 555 291 9901",
  },
  {
    name: "Sarah Connor",
    email: "sarah@acme.com",
    title: "Director of Ops",
    account: "Acme Corp",
    phone: "+1 555 882 1211",
  },
  {
    name: "Linus Torvalds",
    email: "linus@brightwave.com",
    title: "Principal Architect",
    account: "Brightwave Solutions",
    phone: "+1 555 330 9181",
  },
];

export const mockSalesDeals = [
  {
    dealName: "Northwind Enterprise Save",
    value: "$120,000",
    stage: "Negotiation",
    probability: "85%",
    owner: "Nirmal",
  },
  {
    dealName: "Acme Corp Stage 2 Upsell",
    value: "$45,000",
    stage: "Proposal Staged",
    probability: "90%",
    owner: "Hermes",
  },
  {
    dealName: "Brightwave SaaS Bundle Expansion",
    value: "$98,000",
    stage: "Contract Out",
    probability: "95%",
    owner: "Nirmal",
  },
];

export const mockBillingAccounts = [
  {
    client: "Northwind Logistics",
    balance: "$0.00",
    status: "paid",
    period: "Annual",
    nextInvoice: "July 15, 2026",
  },
  {
    client: "Acme Corp",
    balance: "$3,750.00",
    status: "pending",
    period: "Monthly",
    nextInvoice: "June 12, 2026",
  },
  {
    client: "Brightwave Solutions",
    balance: "$0.00",
    status: "paid",
    period: "Annual",
    nextInvoice: "Sept 01, 2026",
  },
];
