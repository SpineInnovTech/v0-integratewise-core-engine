/**
 * CSM Intelligence Data — Rich mock dataset for all Account Success views.
 * In production, ALL of this comes from Spine SSOT projections.
 * Entities carry provenance (source lineage).
 */

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
  duration: number; // minutes
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
  size: number; // bytes
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

// ────────────────────────────────────────────────
// Mock Data
// ────────────────────────────────────────────────

export const accounts: CSMAccount[] = [
  {
    id: "a1", name: "TechServe India Pvt Ltd", logo: "🏢", domain: "techserve.in",
    arr: 420000, arrGrowth: 12.5, healthScore: 92, tier: "enterprise",
    region: "APAC - India", industry: "Technology",
    renewalDate: "2026-06-15", renewalDays: 126,
    owner: { name: "Priya Sharma", initials: "PS" },
    lastTouchpoint: "2h ago", lastTouchDays: 0, contacts: 8, openTickets: 1,
    csat: 4.6, nps: 72, productAdoption: 38, engagement: 28, valueRealization: 26,
    status: "active", tags: ["strategic", "expansion"],
    sources: ["Salesforce", "Slack", "Stripe"],
  },
  {
    id: "a2", name: "CloudBridge APAC", logo: "☁️", domain: "cloudbridge.sg",
    arr: 280000, arrGrowth: 8.3, healthScore: 78, tier: "enterprise",
    region: "APAC - Singapore", industry: "Cloud Services",
    renewalDate: "2026-04-22", renewalDays: 72,
    owner: { name: "Arun Kumar", initials: "AK" },
    lastTouchpoint: "1d ago", lastTouchDays: 1, contacts: 5, openTickets: 3,
    csat: 4.1, nps: 45, productAdoption: 30, engagement: 24, valueRealization: 24,
    status: "active", tags: ["at-risk"],
    sources: ["HubSpot", "Gmail", "Zoom"],
  },
  {
    id: "a3", name: "FinanceFlow Solutions", logo: "💰", domain: "financeflow.io",
    arr: 180000, arrGrowth: -2.1, healthScore: 54, tier: "mid-market",
    region: "APAC - India", industry: "FinTech",
    renewalDate: "2026-03-10", renewalDays: 29,
    owner: { name: "Rajesh Menon", initials: "RM" },
    lastTouchpoint: "5d ago", lastTouchDays: 5, contacts: 3, openTickets: 5,
    csat: 3.2, nps: 12, productAdoption: 20, engagement: 18, valueRealization: 16,
    status: "active", tags: ["renewal-risk", "escalation"],
    sources: ["Salesforce", "Razorpay"],
  },
  {
    id: "a4", name: "DataVault Australia", logo: "🔒", domain: "datavault.au",
    arr: 350000, arrGrowth: 15.2, healthScore: 88, tier: "enterprise",
    region: "APAC - Australia", industry: "Data Security",
    renewalDate: "2026-09-01", renewalDays: 204,
    owner: { name: "Anjali Patel", initials: "AP" },
    lastTouchpoint: "3h ago", lastTouchDays: 0, contacts: 6, openTickets: 0,
    csat: 4.8, nps: 82, productAdoption: 35, engagement: 27, valueRealization: 26,
    status: "active", tags: ["strategic", "advocate"],
    sources: ["HubSpot", "Slack", "Jira"],
  },
  {
    id: "a5", name: "RetailNest Pte Ltd", logo: "🛍️", domain: "retailnest.sg",
    arr: 95000, arrGrowth: 5.7, healthScore: 71, tier: "smb",
    region: "APAC - Singapore", industry: "Retail",
    renewalDate: "2026-05-18", renewalDays: 98,
    owner: { name: "Vikram Rajan", initials: "VR" },
    lastTouchpoint: "12h ago", lastTouchDays: 0, contacts: 2, openTickets: 2,
    csat: 3.8, nps: 35, productAdoption: 25, engagement: 22, valueRealization: 24,
    status: "active", tags: [],
    sources: ["Zoho", "Gmail"],
  },
  {
    id: "a6", name: "HealthTech Innovations", logo: "🏥", domain: "healthtech.in",
    arr: 210000, arrGrowth: 22.0, healthScore: 95, tier: "mid-market",
    region: "APAC - India", industry: "Healthcare",
    renewalDate: "2026-08-30", renewalDays: 202,
    owner: { name: "Priya Sharma", initials: "PS" },
    lastTouchpoint: "6h ago", lastTouchDays: 0, contacts: 4, openTickets: 0,
    csat: 4.9, nps: 90, productAdoption: 37, engagement: 29, valueRealization: 29,
    status: "active", tags: ["advocate", "expansion"],
    sources: ["Salesforce", "Slack", "Notion"],
  },
  {
    id: "a7", name: "LogiPrime Corp", logo: "🚚", domain: "logiprime.in",
    arr: 145000, arrGrowth: -5.3, healthScore: 42, tier: "mid-market",
    region: "APAC - India", industry: "Logistics",
    renewalDate: "2026-02-28", renewalDays: 19,
    owner: { name: "Rajesh Menon", initials: "RM" },
    lastTouchpoint: "8d ago", lastTouchDays: 8, contacts: 3, openTickets: 7,
    csat: 2.8, nps: -15, productAdoption: 15, engagement: 14, valueRealization: 13,
    status: "active", tags: ["churn-risk", "escalation"],
    sources: ["Pipedrive"],
  },
  {
    id: "a8", name: "EduSync Platform", logo: "📚", domain: "edusync.co",
    arr: 120000, arrGrowth: 18.0, healthScore: 86, tier: "smb",
    region: "APAC - India", industry: "EdTech",
    renewalDate: "2026-07-20", renewalDays: 161,
    owner: { name: "Arun Kumar", initials: "AK" },
    lastTouchpoint: "4h ago", lastTouchDays: 0, contacts: 3, openTickets: 1,
    csat: 4.4, nps: 65, productAdoption: 33, engagement: 27, valueRealization: 26,
    status: "active", tags: ["growing"],
    sources: ["Salesforce", "Slack"],
  },
  {
    id: "a9", name: "GreenEnergy Solutions", logo: "🌱", domain: "greenenergy.au",
    arr: 260000, arrGrowth: 10.0, healthScore: 81, tier: "enterprise",
    region: "APAC - Australia", industry: "Energy",
    renewalDate: "2026-05-30", renewalDays: 110,
    owner: { name: "Anjali Patel", initials: "AP" },
    lastTouchpoint: "1d ago", lastTouchDays: 1, contacts: 5, openTickets: 2,
    csat: 4.2, nps: 55, productAdoption: 31, engagement: 25, valueRealization: 25,
    status: "active", tags: [],
    sources: ["HubSpot", "Jira", "Gmail"],
  },
  {
    id: "a10", name: "MediCare Plus", logo: "💊", domain: "medicareplus.in",
    arr: 75000, arrGrowth: -1.0, healthScore: 63, tier: "smb",
    region: "APAC - India", industry: "Healthcare",
    renewalDate: "2026-04-05", renewalDays: 55,
    owner: { name: "Vikram Rajan", initials: "VR" },
    lastTouchpoint: "3d ago", lastTouchDays: 3, contacts: 2, openTickets: 4,
    csat: 3.5, nps: 20, productAdoption: 22, engagement: 20, valueRealization: 21,
    status: "active", tags: ["needs-attention"],
    sources: ["Zoho"],
  },
];

export const contacts: CSMContact[] = [
  { id: "c1", name: "Ravi Sharma", title: "CTO", email: "ravi@techserve.in", phone: "+91-98765-43210", accountId: "a1", accountName: "TechServe India", avatar: "RS", role: "champion", sentiment: "positive", lastContactDate: "2026-02-08", lastContactDays: 2, emailCount: 45, meetingCount: 12, slackMessages: 128, nps: 9, sources: ["Salesforce", "Slack"] },
  { id: "c2", name: "Meera Krishnan", title: "VP Engineering", email: "meera@techserve.in", phone: "+91-98765-43211", accountId: "a1", accountName: "TechServe India", avatar: "MK", role: "decision-maker", sentiment: "positive", lastContactDate: "2026-02-06", lastContactDays: 4, emailCount: 22, meetingCount: 8, slackMessages: 45, nps: 8, sources: ["Salesforce", "Gmail"] },
  { id: "c3", name: "David Chen", title: "Head of Engineering", email: "dchen@cloudbridge.sg", phone: "+65-9123-4567", accountId: "a2", accountName: "CloudBridge APAC", avatar: "DC", role: "technical", sentiment: "neutral", lastContactDate: "2026-02-09", lastContactDays: 1, emailCount: 18, meetingCount: 6, slackMessages: 92, nps: 7, sources: ["HubSpot", "Slack"] },
  { id: "c4", name: "Sarah Lim", title: "CEO", email: "sarah@cloudbridge.sg", phone: "+65-9123-4568", accountId: "a2", accountName: "CloudBridge APAC", avatar: "SL", role: "executive", sentiment: "neutral", lastContactDate: "2026-01-28", lastContactDays: 13, emailCount: 8, meetingCount: 3, slackMessages: 5, nps: 6, sources: ["HubSpot"] },
  { id: "c5", name: "Arjun Mehta", title: "Product Manager", email: "arjun@financeflow.io", phone: "+91-88765-43210", accountId: "a3", accountName: "FinanceFlow Solutions", avatar: "AM", role: "end-user", sentiment: "at-risk", lastContactDate: "2026-02-05", lastContactDays: 5, emailCount: 12, meetingCount: 4, slackMessages: 23, nps: 4, sources: ["Salesforce"] },
  { id: "c6", name: "Neha Patel", title: "CFO", email: "neha@financeflow.io", phone: "+91-88765-43211", accountId: "a3", accountName: "FinanceFlow Solutions", avatar: "NP", role: "decision-maker", sentiment: "at-risk", lastContactDate: "2026-01-20", lastContactDays: 21, emailCount: 6, meetingCount: 2, slackMessages: 0, nps: 3, sources: ["Salesforce"] },
  { id: "c7", name: "James Wu", title: "CISO", email: "jwu@datavault.au", phone: "+61-4123-4567", accountId: "a4", accountName: "DataVault Australia", avatar: "JW", role: "champion", sentiment: "positive", lastContactDate: "2026-02-10", lastContactDays: 0, emailCount: 30, meetingCount: 10, slackMessages: 67, nps: 9, sources: ["HubSpot", "Slack", "Jira"] },
  { id: "c8", name: "Priya Nair", title: "Operations Head", email: "priya@retailnest.sg", phone: "+65-8123-4567", accountId: "a5", accountName: "RetailNest Pte Ltd", avatar: "PN", role: "end-user", sentiment: "neutral", lastContactDate: "2026-02-08", lastContactDays: 2, emailCount: 15, meetingCount: 5, slackMessages: 34, nps: 7, sources: ["Zoho"] },
  { id: "c9", name: "Dr. Suresh Rao", title: "CTO", email: "suresh@healthtech.in", phone: "+91-77765-43210", accountId: "a6", accountName: "HealthTech Innovations", avatar: "SR", role: "champion", sentiment: "positive", lastContactDate: "2026-02-10", lastContactDays: 0, emailCount: 38, meetingCount: 14, slackMessages: 156, nps: 10, sources: ["Salesforce", "Slack"] },
  { id: "c10", name: "Kumar Verma", title: "CEO", email: "kumar@logiprime.in", phone: "+91-99765-43210", accountId: "a7", accountName: "LogiPrime Corp", avatar: "KV", role: "decision-maker", sentiment: "negative", lastContactDate: "2026-02-02", lastContactDays: 8, emailCount: 5, meetingCount: 1, slackMessages: 0, nps: 2, sources: ["Pipedrive"] },
  { id: "c11", name: "Anita Desai", title: "VP Product", email: "anita@edusync.co", phone: "+91-88123-45678", accountId: "a8", accountName: "EduSync Platform", avatar: "AD", role: "champion", sentiment: "positive", lastContactDate: "2026-02-09", lastContactDays: 1, emailCount: 25, meetingCount: 9, slackMessages: 78, nps: 8, sources: ["Salesforce", "Slack"] },
  { id: "c12", name: "Mark Thompson", title: "COO", email: "mark@greenenergy.au", phone: "+61-4567-8901", accountId: "a9", accountName: "GreenEnergy Solutions", avatar: "MT", role: "decision-maker", sentiment: "neutral", lastContactDate: "2026-02-07", lastContactDays: 3, emailCount: 20, meetingCount: 7, slackMessages: 42, nps: 7, sources: ["HubSpot", "Gmail"] },
];

export const projects: CSMProject[] = [
  { id: "p1", name: "API Integration Rollout", objective: "Complete REST API integration across all modules", accountId: "a1", accountName: "TechServe India", progress: 78, status: "in-progress", owner: { name: "Priya Sharma", initials: "PS" }, startDate: "2025-12-01", dueDate: "2026-03-15", linkedContacts: ["c1", "c2"], taskCount: 12, completedTasks: 9, priority: "high", tags: ["integration", "technical"] },
  { id: "p2", name: "Cloud Migration Phase 2", objective: "Migrate remaining workloads to multi-cloud setup", accountId: "a2", accountName: "CloudBridge APAC", progress: 45, status: "in-progress", owner: { name: "Arun Kumar", initials: "AK" }, startDate: "2026-01-10", dueDate: "2026-05-30", linkedContacts: ["c3"], taskCount: 20, completedTasks: 9, priority: "high", tags: ["migration", "cloud"] },
  { id: "p3", name: "Payment Gateway Update", objective: "Upgrade payment processing to v3 with new compliance", accountId: "a3", accountName: "FinanceFlow Solutions", progress: 20, status: "blocked", owner: { name: "Rajesh Menon", initials: "RM" }, startDate: "2026-01-15", dueDate: "2026-03-01", linkedContacts: ["c5", "c6"], taskCount: 8, completedTasks: 2, priority: "high", tags: ["compliance", "payment"] },
  { id: "p4", name: "Security Audit Q1", objective: "Complete SOC2 compliance audit and remediation", accountId: "a4", accountName: "DataVault Australia", progress: 90, status: "in-progress", owner: { name: "Anjali Patel", initials: "AP" }, startDate: "2025-11-01", dueDate: "2026-02-28", linkedContacts: ["c7"], taskCount: 15, completedTasks: 13, priority: "medium", tags: ["security", "compliance"] },
  { id: "p5", name: "Onboarding Program", objective: "Design and deploy new customer onboarding flow", accountId: "a6", accountName: "HealthTech Innovations", progress: 100, status: "completed", owner: { name: "Priya Sharma", initials: "PS" }, startDate: "2025-10-15", dueDate: "2026-01-30", linkedContacts: ["c9"], taskCount: 10, completedTasks: 10, priority: "medium", tags: ["onboarding"] },
  { id: "p6", name: "Feature Adoption Drive", objective: "Increase daily active usage from 45% to 70%", accountId: "a5", accountName: "RetailNest Pte Ltd", progress: 35, status: "in-progress", owner: { name: "Vikram Rajan", initials: "VR" }, startDate: "2026-01-20", dueDate: "2026-04-30", linkedContacts: ["c8"], taskCount: 6, completedTasks: 2, priority: "medium", tags: ["adoption"] },
  { id: "p7", name: "Renewal Negotiation", objective: "Secure 2-year renewal with 10% expansion", accountId: "a7", accountName: "LogiPrime Corp", progress: 10, status: "on-hold", owner: { name: "Rajesh Menon", initials: "RM" }, startDate: "2026-02-01", dueDate: "2026-02-25", linkedContacts: ["c10"], taskCount: 5, completedTasks: 0, priority: "high", tags: ["renewal", "negotiation"] },
  { id: "p8", name: "Energy Dashboard Build", objective: "Custom analytics dashboard for sustainability metrics", accountId: "a9", accountName: "GreenEnergy Solutions", progress: 60, status: "in-progress", owner: { name: "Anjali Patel", initials: "AP" }, startDate: "2025-12-15", dueDate: "2026-04-15", linkedContacts: ["c12"], taskCount: 14, completedTasks: 8, priority: "medium", tags: ["analytics", "custom"] },
];

export const tasks: CSMTask[] = [
  { id: "t1", title: "Review QBR deck for TechServe", description: "Prepare slides for Q1 business review", priority: "high", status: "in-progress", assignee: { name: "Priya Sharma", initials: "PS" }, dueDate: "2026-02-12", dueDays: 2, accountId: "a1", accountName: "TechServe India", projectId: "p1", projectName: "API Integration Rollout", createdAt: "2026-02-05", tags: ["qbr"] },
  { id: "t2", title: "Follow up on CloudBridge ticket #CB-312", description: "Escalated performance issue needs status check", priority: "high", status: "todo", assignee: { name: "Arun Kumar", initials: "AK" }, dueDate: "2026-02-11", dueDays: 1, accountId: "a2", accountName: "CloudBridge APAC", createdAt: "2026-02-08", tags: ["support"] },
  { id: "t3", title: "Schedule renewal call with FinanceFlow", description: "Renewal in 29 days, need to discuss terms", priority: "high", status: "overdue", assignee: { name: "Rajesh Menon", initials: "RM" }, dueDate: "2026-02-08", dueDays: -2, accountId: "a3", accountName: "FinanceFlow Solutions", createdAt: "2026-02-01", tags: ["renewal"] },
  { id: "t4", title: "Send SOC2 report to DataVault", description: "Final audit report ready for client review", priority: "medium", status: "todo", assignee: { name: "Anjali Patel", initials: "AP" }, dueDate: "2026-02-14", dueDays: 4, accountId: "a4", accountName: "DataVault Australia", projectId: "p4", projectName: "Security Audit Q1", createdAt: "2026-02-09", tags: ["compliance"] },
  { id: "t5", title: "Prepare churn mitigation plan for LogiPrime", description: "Health score critical, need rescue plan", priority: "high", status: "in-progress", assignee: { name: "Rajesh Menon", initials: "RM" }, dueDate: "2026-02-13", dueDays: 3, accountId: "a7", accountName: "LogiPrime Corp", projectId: "p7", projectName: "Renewal Negotiation", createdAt: "2026-02-06", tags: ["churn-prevention"] },
  { id: "t6", title: "Training session for RetailNest team", description: "Feature adoption training - advanced analytics module", priority: "medium", status: "todo", assignee: { name: "Vikram Rajan", initials: "VR" }, dueDate: "2026-02-17", dueDays: 7, accountId: "a5", accountName: "RetailNest Pte Ltd", projectId: "p6", projectName: "Feature Adoption Drive", createdAt: "2026-02-08", tags: ["training"] },
  { id: "t7", title: "Update health score model weights", description: "Adjust engagement scoring based on Q4 learnings", priority: "low", status: "todo", assignee: { name: "Priya Sharma", initials: "PS" }, dueDate: "2026-02-20", dueDays: 10, createdAt: "2026-02-03", tags: ["internal", "health-model"] },
  { id: "t8", title: "Draft expansion proposal for HealthTech", description: "They want to add 3 new modules", priority: "medium", status: "in-progress", assignee: { name: "Priya Sharma", initials: "PS" }, dueDate: "2026-02-15", dueDays: 5, accountId: "a6", accountName: "HealthTech Innovations", createdAt: "2026-02-07", tags: ["expansion"] },
  { id: "t9", title: "Escalation review meeting with LogiPrime CEO", description: "Discuss service gaps and remediation plan", priority: "high", status: "overdue", assignee: { name: "Rajesh Menon", initials: "RM" }, dueDate: "2026-02-09", dueDays: -1, accountId: "a7", accountName: "LogiPrime Corp", contactId: "c10", contactName: "Kumar Verma", createdAt: "2026-02-04", tags: ["escalation"] },
  { id: "t10", title: "Review MediCare Plus support tickets", description: "4 open tickets, CSAT declining", priority: "medium", status: "todo", assignee: { name: "Vikram Rajan", initials: "VR" }, dueDate: "2026-02-12", dueDays: 2, accountId: "a10", accountName: "MediCare Plus", createdAt: "2026-02-09", tags: ["support"] },
  { id: "t11", title: "Complete EduSync onboarding checklist", description: "3 items remaining in onboarding playbook", priority: "low", status: "in-progress", assignee: { name: "Arun Kumar", initials: "AK" }, dueDate: "2026-02-18", dueDays: 8, accountId: "a8", accountName: "EduSync Platform", createdAt: "2026-02-01", tags: ["onboarding"] },
  { id: "t12", title: "Weekly team standup notes", description: "Compile action items from weekly standup", priority: "low", status: "done", assignee: { name: "Priya Sharma", initials: "PS" }, dueDate: "2026-02-10", dueDays: 0, createdAt: "2026-02-10", completedAt: "2026-02-10", tags: ["internal"] },
];

export const meetings: CSMMeeting[] = [
  { id: "m1", title: "TechServe Q1 QBR", type: "qbr", startTime: "2026-02-12T10:00", endTime: "2026-02-12T11:30", duration: 90, accountId: "a1", accountName: "TechServe India", participants: [{ name: "Priya Sharma", initials: "PS", role: "CSM" }, { name: "Ravi Sharma", initials: "RS", role: "CTO" }, { name: "Meera Krishnan", initials: "MK", role: "VP Eng" }], hasNotes: false, hasRecording: false, status: "scheduled", projectId: "p1", followUpTasks: 0 },
  { id: "m2", title: "CloudBridge Weekly Check-in", type: "check-in", startTime: "2026-02-11T14:00", endTime: "2026-02-11T14:30", duration: 30, accountId: "a2", accountName: "CloudBridge APAC", participants: [{ name: "Arun Kumar", initials: "AK", role: "CSM" }, { name: "David Chen", initials: "DC", role: "Head of Eng" }], hasNotes: false, hasRecording: false, status: "scheduled", followUpTasks: 0 },
  { id: "m3", title: "FinanceFlow Renewal Discussion", type: "ebr", startTime: "2026-02-13T11:00", endTime: "2026-02-13T12:00", duration: 60, accountId: "a3", accountName: "FinanceFlow Solutions", participants: [{ name: "Rajesh Menon", initials: "RM", role: "CSM" }, { name: "Neha Patel", initials: "NP", role: "CFO" }, { name: "Arjun Mehta", initials: "AM", role: "PM" }], hasNotes: false, hasRecording: false, status: "scheduled", followUpTasks: 0 },
  { id: "m4", title: "DataVault SOC2 Review", type: "check-in", startTime: "2026-02-10T09:00", endTime: "2026-02-10T09:45", duration: 45, accountId: "a4", accountName: "DataVault Australia", participants: [{ name: "Anjali Patel", initials: "AP", role: "CSM" }, { name: "James Wu", initials: "JW", role: "CISO" }], hasNotes: true, hasRecording: true, status: "completed", projectId: "p4", followUpTasks: 2 },
  { id: "m5", title: "CS Team Weekly Standup", type: "internal", startTime: "2026-02-10T08:30", endTime: "2026-02-10T09:00", duration: 30, participants: [{ name: "Priya Sharma", initials: "PS", role: "CSM Lead" }, { name: "Arun Kumar", initials: "AK", role: "CSM" }, { name: "Rajesh Menon", initials: "RM", role: "CSM" }, { name: "Anjali Patel", initials: "AP", role: "CSM" }, { name: "Vikram Rajan", initials: "VR", role: "CSM" }], hasNotes: true, hasRecording: false, status: "completed", followUpTasks: 3 },
  { id: "m6", title: "HealthTech Expansion Planning", type: "check-in", startTime: "2026-02-14T15:00", endTime: "2026-02-14T16:00", duration: 60, accountId: "a6", accountName: "HealthTech Innovations", participants: [{ name: "Priya Sharma", initials: "PS", role: "CSM" }, { name: "Dr. Suresh Rao", initials: "SR", role: "CTO" }], hasNotes: false, hasRecording: false, status: "scheduled", followUpTasks: 0 },
  { id: "m7", title: "LogiPrime Escalation Call", type: "ebr", startTime: "2026-02-11T16:00", endTime: "2026-02-11T17:00", duration: 60, accountId: "a7", accountName: "LogiPrime Corp", participants: [{ name: "Rajesh Menon", initials: "RM", role: "CSM" }, { name: "Kumar Verma", initials: "KV", role: "CEO" }], hasNotes: false, hasRecording: false, status: "scheduled", followUpTasks: 0 },
  { id: "m8", title: "RetailNest Training - Analytics", type: "training", startTime: "2026-02-17T10:00", endTime: "2026-02-17T11:30", duration: 90, accountId: "a5", accountName: "RetailNest Pte Ltd", participants: [{ name: "Vikram Rajan", initials: "VR", role: "CSM" }, { name: "Priya Nair", initials: "PN", role: "Ops Head" }], hasNotes: false, hasRecording: false, status: "scheduled", projectId: "p6", followUpTasks: 0 },
];

export const documents: CSMDocument[] = [
  { id: "d1", name: "TechServe_QBR_Q1_2026.pptx", type: "pptx", size: 4500000, accountId: "a1", accountName: "TechServe India", space: "account", uploadedBy: { name: "Priya Sharma", initials: "PS" }, uploadedAt: "2026-02-08", tags: ["qbr", "presentation"], source: "Google Drive" },
  { id: "d2", name: "CloudBridge_Migration_Plan_v2.pdf", type: "pdf", size: 2800000, accountId: "a2", accountName: "CloudBridge APAC", projectId: "p2", space: "project", uploadedBy: { name: "Arun Kumar", initials: "AK" }, uploadedAt: "2026-01-22", tags: ["migration", "plan"], source: "Notion" },
  { id: "d3", name: "FinanceFlow_Contract_Renewal.pdf", type: "pdf", size: 1200000, accountId: "a3", accountName: "FinanceFlow Solutions", space: "account", uploadedBy: { name: "Rajesh Menon", initials: "RM" }, uploadedAt: "2026-02-01", tags: ["contract", "renewal"], source: "Salesforce" },
  { id: "d4", name: "SOC2_Audit_Report_Final.pdf", type: "pdf", size: 8900000, accountId: "a4", accountName: "DataVault Australia", projectId: "p4", space: "project", uploadedBy: { name: "Anjali Patel", initials: "AP" }, uploadedAt: "2026-02-09", tags: ["compliance", "soc2"], source: "Google Drive" },
  { id: "d5", name: "CS_Team_Playbook_2026.docx", type: "docx", size: 3200000, space: "team", uploadedBy: { name: "Priya Sharma", initials: "PS" }, uploadedAt: "2026-01-15", tags: ["playbook", "internal"], source: "Notion" },
  { id: "d6", name: "Health_Score_Model_v3.xlsx", type: "xlsx", size: 1500000, space: "team", uploadedBy: { name: "Priya Sharma", initials: "PS" }, uploadedAt: "2026-01-28", tags: ["model", "health-score"], source: "Google Drive" },
  { id: "d7", name: "HealthTech_Onboarding_Checklist.docx", type: "docx", size: 800000, accountId: "a6", accountName: "HealthTech Innovations", projectId: "p5", space: "project", uploadedBy: { name: "Priya Sharma", initials: "PS" }, uploadedAt: "2025-11-10", tags: ["onboarding", "checklist"], source: "Notion" },
  { id: "d8", name: "LogiPrime_Escalation_Notes.docx", type: "docx", size: 450000, accountId: "a7", accountName: "LogiPrime Corp", space: "account", uploadedBy: { name: "Rajesh Menon", initials: "RM" }, uploadedAt: "2026-02-06", tags: ["escalation", "notes"], source: "Google Drive" },
  { id: "d9", name: "GreenEnergy_Dashboard_Mockup.png", type: "png", size: 2100000, accountId: "a9", accountName: "GreenEnergy Solutions", projectId: "p8", space: "project", uploadedBy: { name: "Anjali Patel", initials: "AP" }, uploadedAt: "2026-02-03", tags: ["design", "dashboard"], source: "Figma" },
  { id: "d10", name: "Monthly_CS_Report_Jan.xlsx", type: "xlsx", size: 960000, space: "team", uploadedBy: { name: "Priya Sharma", initials: "PS" }, uploadedAt: "2026-02-02", tags: ["report", "monthly"], source: "Google Drive" },
];

export const riskAlerts: RiskAlert[] = [
  { id: "r1", accountId: "a7", accountName: "LogiPrime Corp", severity: "high", type: "churn", title: "Critical churn risk — renewal in 19 days", description: "Health score 42, NPS -15, 7 open tickets, last touch 8 days ago. CEO unresponsive to outreach.", confidence: 91, evidenceCount: 8, createdAt: "2026-02-08", cta: "View Rescue Plan" },
  { id: "r2", accountId: "a3", accountName: "FinanceFlow Solutions", severity: "high", type: "renewal", title: "Renewal at risk — 29 days remaining", description: "ARR declining -2.1%, blocked project, 5 open tickets. CFO hasn't been contacted in 21 days.", confidence: 85, evidenceCount: 6, createdAt: "2026-02-07", cta: "Schedule Call" },
  { id: "r3", accountId: "a2", accountName: "CloudBridge APAC", severity: "medium", type: "engagement-drop", title: "Engagement declining — DAU down 15%", description: "Product usage dropped 15% week-over-week. 3 open support tickets. NPS declined from 58 to 45.", confidence: 78, evidenceCount: 4, createdAt: "2026-02-09", cta: "Review Usage" },
  { id: "r4", accountId: "a10", accountName: "MediCare Plus", severity: "medium", type: "engagement-drop", title: "Low adoption & rising tickets", description: "Only 22% product adoption. 4 open tickets with avg resolution 5 days. CSAT declining.", confidence: 72, evidenceCount: 3, createdAt: "2026-02-09", cta: "Assess Health" },
  { id: "r5", accountId: "a6", accountName: "HealthTech Innovations", severity: "low", type: "expansion", title: "Expansion opportunity detected", description: "CTO mentioned interest in 3 new modules. NPS 90, health 95. Ready for upsell conversation.", confidence: 88, evidenceCount: 5, createdAt: "2026-02-08", cta: "Draft Proposal" },
  { id: "r6", accountId: "a1", accountName: "TechServe India", severity: "low", type: "expansion", title: "Strategic growth signal", description: "ARR growing 12.5%, high engagement. Champion requesting API access for 2 additional teams.", confidence: 82, evidenceCount: 4, createdAt: "2026-02-09", cta: "Review Expansion" },
];

// Calendar events (derived from meetings + renewals + milestones)
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

export const calendarEvents: CalendarEvent[] = [
  { id: "ce1", title: "CS Team Standup", type: "meeting", date: "2026-02-10", time: "08:30", duration: 30, color: "#7C4DFF" },
  { id: "ce2", title: "DataVault SOC2 Review", type: "meeting", date: "2026-02-10", time: "09:00", duration: 45, accountName: "DataVault Australia", color: "#0066FF" },
  { id: "ce3", title: "CloudBridge Check-in", type: "meeting", date: "2026-02-11", time: "14:00", duration: 30, accountName: "CloudBridge APAC", color: "#0066FF" },
  { id: "ce4", title: "LogiPrime Escalation", type: "meeting", date: "2026-02-11", time: "16:00", duration: 60, accountName: "LogiPrime Corp", color: "#F44336" },
  { id: "ce5", title: "TechServe QBR", type: "meeting", date: "2026-02-12", time: "10:00", duration: 90, accountName: "TechServe India", color: "#0066FF" },
  { id: "ce6", title: "FinanceFlow Renewal", type: "meeting", date: "2026-02-13", time: "11:00", duration: 60, accountName: "FinanceFlow Solutions", color: "#FF9800" },
  { id: "ce7", title: "HealthTech Expansion", type: "meeting", date: "2026-02-14", time: "15:00", duration: 60, accountName: "HealthTech Innovations", color: "#00C853" },
  { id: "ce8", title: "RetailNest Training", type: "meeting", date: "2026-02-17", time: "10:00", duration: 90, accountName: "RetailNest Pte Ltd", color: "#0066FF" },
  { id: "ce9", title: "LogiPrime Renewal Due", type: "renewal", date: "2026-02-28", accountName: "LogiPrime Corp", color: "#F44336" },
  { id: "ce10", title: "FinanceFlow Renewal Due", type: "renewal", date: "2026-03-10", accountName: "FinanceFlow Solutions", color: "#FF9800" },
  { id: "ce11", title: "Security Audit Complete", type: "milestone", date: "2026-02-28", accountName: "DataVault Australia", color: "#00C853" },
  { id: "ce12", title: "Schedule renewal call", type: "task-due", date: "2026-02-08", accountName: "FinanceFlow Solutions", color: "#F44336" },
  { id: "ce13", title: "Escalation review meeting", type: "task-due", date: "2026-02-09", accountName: "LogiPrime Corp", color: "#F44336" },
];

// Utility
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
    case "positive": return "var(--iw-success)";
    case "neutral": return "var(--iw-blue)";
    case "at-risk": return "var(--iw-warning)";
    case "negative": return "var(--iw-danger)";
  }
}

export function getPriorityColor(p: string): string {
  switch (p) {
    case "high": return "var(--iw-danger)";
    case "medium": return "var(--iw-warning)";
    case "low": return "var(--iw-blue)";
    default: return "var(--muted-foreground)";
  }
}

export function getStatusColor(s: string): string {
  switch (s) {
    case "completed": case "done": return "var(--iw-success)";
    case "in-progress": return "var(--iw-blue)";
    case "planning": case "todo": return "var(--muted-foreground)";
    case "blocked": case "overdue": return "var(--iw-danger)";
    case "on-hold": return "var(--iw-warning)";
    default: return "var(--muted-foreground)";
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
