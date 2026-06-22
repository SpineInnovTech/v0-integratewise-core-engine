/**
 * IntegrateWise OS — Universal Domain Data Registry
 *
 * Consolidates ALL seed data across every domain and plane for
 * KV store initialization. Each domain follows the same pattern:
 *   { [tableName]: { idField, data[] } }
 *
 * On onboarding completion, ALL domain data is sent to the server
 * and stored as `{domain_prefix}:{tenantId}:{tableName}` in KV.
 *
 * This file imports from existing mock data sources where available
 * and adds new seed data for domains that didn't have KV-backed data.
 */

import { tenants, users, roles, auditEntries, pendingInvites } from "../admin/mock-data";
import { CSM_TABLE_REGISTRY } from "../domains/account-success/csm-intelligence-data";

// ─── Type ────────────────────────────────────────────────────────────────────

export interface TableSeedDef {
  idField: string;
  data: any[];
}

export type DomainSeedRegistry = Record<string, Record<string, TableSeedDef>>;

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN SEED DATA
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Admin Domain (from existing mock-data.ts) ──────────────────────────────

const approvalWorkflows = [
  { id: "apw-001", type: "role_change", status: "pending", priority: "high", requestedBy: { name: "Priya Sharma", initials: "PS", role: "ops_manager" }, requestedAt: "2026-02-09T14:00:00Z", expiresAt: "2026-02-16T14:00:00Z", title: "Promote Vikram Rao to Senior Sales Rep", description: "Role upgrade based on Q4 performance metrics", impactSummary: "Grants additional pipeline editing and forecast access", affectedUsers: 1, tenant: "iw-apac", approvers: [{ name: "Arun Kumar", status: "pending" }], comments: [] },
  { id: "apw-002", type: "permission_change", status: "approved", priority: "medium", requestedBy: { name: "Arun Kumar", initials: "AK", role: "super_admin" }, requestedAt: "2026-02-08T10:00:00Z", resolvedAt: "2026-02-08T16:00:00Z", resolvedBy: "System", expiresAt: "2026-02-15T10:00:00Z", title: "Enable export_data for Analyst role", description: "Allow analysts to export reports for Q1 review", impactSummary: "Analysts can now export up to 10K records", affectedUsers: 1, tenant: "iw-apac", approvers: [{ name: "System", status: "approved" }], comments: [] },
  { id: "apw-003", type: "field_access_change", status: "pending", priority: "critical", requestedBy: { name: "Anjali Patel", initials: "AP", role: "cs_lead" }, requestedAt: "2026-02-09T09:30:00Z", expiresAt: "2026-02-12T09:30:00Z", title: "Grant CS Lead access to revenue fields", description: "Need full revenue visibility for at-risk account rescue", impactSummary: "CS Lead role gains unmasked revenue_fields access", affectedUsers: 1, tenant: "iw-apac", approvers: [{ name: "Arun Kumar", status: "pending" }], comments: [] },
];

const notifications = [
  { id: "notif-001", type: "critical", category: "integration", title: "Salesforce Sync Error", message: "OAuth token expired for Salesforce connector. 3 accounts affected.", timestamp: "2026-02-09T14:30:00Z", read: false, actionLabel: "Reconnect", actionTarget: { module: "ops", view: "integrations" }, actor: "System" },
  { id: "notif-002", type: "warning", category: "rbac", title: "MFA Not Enabled", message: "Rajesh Menon has not enabled MFA. Policy requires MFA within 7 days.", timestamp: "2026-02-09T10:15:00Z", read: false, actionLabel: "View User", actionTarget: { module: "ops", view: "user-management" }, actor: "System" },
  { id: "notif-003", type: "info", category: "workflow", title: "Approval Pending", message: "Priya Sharma requested role promotion for Vikram Rao.", timestamp: "2026-02-09T14:00:00Z", read: false, actionLabel: "Review", actor: "Priya Sharma", actorInitials: "PS" },
  { id: "notif-004", type: "success", category: "sales", title: "Deal Closed Won", message: "EduSpark Growth Plan closed at $68,000. Implementation phase begins.", timestamp: "2026-02-09T11:00:00Z", read: true, actor: "Priya S.", actorInitials: "PS" },
  { id: "notif-005", type: "warning", category: "sales", title: "SLA Breach Risk", message: "FinanceFlow Solutions ticket #TKT-003 approaching SLA breach in 4 hours.", timestamp: "2026-02-09T08:15:00Z", read: false, actionLabel: "View Ticket", actor: "System" },
  { id: "notif-006", type: "info", category: "marketing", title: "Campaign Performance", message: "APAC Growth Webinar Q1 reached 5,200 sends with 3.2% conversion rate.", timestamp: "2026-02-08T18:00:00Z", read: true, actor: "Deepak Joshi", actorInitials: "DJ" },
  { id: "notif-007", type: "info", category: "system", title: "Spine SSOT Updated", message: "Data normalization complete. 8 accounts, 6 contacts, 7 deals refreshed.", timestamp: "2026-02-09T07:00:00Z", read: true, actor: "System" },
  { id: "notif-008", type: "critical", category: "approval", title: "Critical Access Request", message: "Anjali Patel requesting revenue field access for at-risk account rescue.", timestamp: "2026-02-09T09:30:00Z", read: false, actionLabel: "Review Request", actor: "Anjali Patel", actorInitials: "AP" },
];

// ─── BizOps Domain ──────────────────────────────────────────────────────────

const bizopsVendors = [
  { vendorId: "VEN-001", name: "Amazon Web Services", category: "Cloud Infrastructure", contractStart: "2025-01-01", contractEnd: "2026-12-31", owner: "Arun Kumar", riskRating: "Low", annualSpend: 180000, status: "active", paymentTerms: "Net 30", complianceCerts: ["SOC 2", "ISO 27001"], lastReview: "2026-01-15" },
  { vendorId: "VEN-002", name: "Salesforce", category: "CRM", contractStart: "2025-06-01", contractEnd: "2026-05-31", owner: "Priya Sharma", riskRating: "Low", annualSpend: 96000, status: "active", paymentTerms: "Annual", complianceCerts: ["SOC 2", "HIPAA"], lastReview: "2025-12-01" },
  { vendorId: "VEN-003", name: "DataDog", category: "Monitoring", contractStart: "2025-03-01", contractEnd: "2026-02-28", owner: "Rajesh Menon", riskRating: "Medium", annualSpend: 42000, status: "renewing", paymentTerms: "Annual", complianceCerts: ["SOC 2"], lastReview: "2026-02-01" },
  { vendorId: "VEN-004", name: "Slack Technologies", category: "Communication", contractStart: "2025-01-01", contractEnd: "2026-12-31", owner: "Arun Kumar", riskRating: "Low", annualSpend: 28800, status: "active", paymentTerms: "Monthly", complianceCerts: ["SOC 2", "ISO 27001"], lastReview: "2025-11-15" },
  { vendorId: "VEN-005", name: "Stripe", category: "Payments", contractStart: "2024-09-01", contractEnd: "2026-08-31", owner: "Priya Sharma", riskRating: "Low", annualSpend: 15600, status: "active", paymentTerms: "Pay-as-you-go", complianceCerts: ["PCI-DSS", "SOC 2"], lastReview: "2026-01-20" },
];

const bizopsInvoices = [
  { invoiceId: "INV-2026-001", vendorId: "VEN-001", vendorName: "Amazon Web Services", amount: 15420, currency: "USD", dueDate: "2026-02-28", status: "pending", approver: "Arun Kumar", category: "Cloud Infrastructure", issueDate: "2026-02-01", department: "Engineering" },
  { invoiceId: "INV-2026-002", vendorId: "VEN-002", vendorName: "Salesforce", amount: 96000, currency: "USD", dueDate: "2026-03-01", status: "approved", approver: "Priya Sharma", category: "CRM", issueDate: "2026-01-15", department: "Sales" },
  { invoiceId: "INV-2026-003", vendorId: "VEN-003", vendorName: "DataDog", amount: 3500, currency: "USD", dueDate: "2026-02-15", status: "paid", approver: "Rajesh Menon", category: "Monitoring", issueDate: "2026-01-28", department: "Engineering" },
  { invoiceId: "INV-2026-004", vendorId: "VEN-004", vendorName: "Slack Technologies", amount: 2400, currency: "USD", dueDate: "2026-02-28", status: "pending", approver: "Arun Kumar", category: "Communication", issueDate: "2026-02-01", department: "Operations" },
  { invoiceId: "INV-2026-005", vendorId: "VEN-005", vendorName: "Stripe", amount: 1300, currency: "USD", dueDate: "2026-02-20", status: "overdue", approver: "Priya Sharma", category: "Payments", issueDate: "2026-01-20", department: "Finance" },
];

const bizopsApprovals = [
  { approvalId: "BA-001", requestor: "Rajesh Menon", type: "spend", amount: 42000, policyId: "POL-002", status: "pending", decisionBy: "Arun Kumar", decidedAt: null, title: "DataDog Contract Renewal", description: "Annual renewal with 10% increase", createdAt: "2026-02-08T10:00:00Z" },
  { approvalId: "BA-002", requestor: "Priya Sharma", type: "vendor", amount: 18000, policyId: "POL-001", status: "approved", decisionBy: "Arun Kumar", decidedAt: "2026-02-07T16:00:00Z", title: "New Analytics Vendor Onboarding", description: "Mixpanel for product analytics", createdAt: "2026-02-06T09:00:00Z" },
  { approvalId: "BA-003", requestor: "Deepak Joshi", type: "spend", amount: 8500, policyId: "POL-002", status: "approved", decisionBy: "Priya Sharma", decidedAt: "2026-02-09T11:00:00Z", title: "Marketing Event Budget", description: "APAC Growth Summit sponsorship", createdAt: "2026-02-08T14:00:00Z" },
];

const bizopsPolicies = [
  { policyId: "POL-001", policyType: "vendor_onboarding", name: "Vendor Onboarding Policy", rules: { requireCompliance: true, minCerts: ["SOC 2"], requireSecurityReview: true, approvalThreshold: 10000 }, effectiveDate: "2025-06-01", version: 2, status: "active", owner: "Arun Kumar" },
  { policyId: "POL-002", policyType: "spend_approval", name: "Spend Approval Policy", rules: { autoApproveBelow: 5000, managerApprovalBelow: 25000, vpApprovalAbove: 25000, requireBudgetCode: true }, effectiveDate: "2025-06-01", version: 3, status: "active", owner: "Priya Sharma" },
  { policyId: "POL-003", policyType: "data_access", name: "Data Access Policy", rules: { piiRequiresMfa: true, exportLimit: 10000, auditAllAccess: true, retentionDays: 365 }, effectiveDate: "2025-09-01", version: 1, status: "active", owner: "Arun Kumar" },
  { policyId: "POL-004", policyType: "compliance", name: "Compliance Policy", rules: { gdprEnabled: true, dataResidencyEnforced: true, consentRequired: true, breachNotifyHours: 72 }, effectiveDate: "2025-06-01", version: 1, status: "active", owner: "Sarah Wong" },
];

const bizopsHeadcount = [
  { employeeId: "EMP-001", name: "Arun Kumar", team: "Engineering", role: "VP Engineering", costCenter: "ENG-001", startDate: "2025-06-15", status: "active", location: "Mumbai, India", reportsTo: null },
  { employeeId: "EMP-002", name: "Priya Sharma", team: "Revenue Operations", role: "Ops Manager", costCenter: "OPS-001", startDate: "2025-07-01", status: "active", location: "Mumbai, India", reportsTo: "EMP-001" },
  { employeeId: "EMP-003", name: "Rajesh Menon", team: "Business Intelligence", role: "Senior Analyst", costCenter: "BI-001", startDate: "2025-08-15", status: "active", location: "Mumbai, India", reportsTo: "EMP-002" },
  { employeeId: "EMP-004", name: "Anjali Patel", team: "Customer Success", role: "CS Lead", costCenter: "CS-001", startDate: "2025-07-20", status: "active", location: "Mumbai, India", reportsTo: "EMP-001" },
  { employeeId: "EMP-005", name: "Vikram Rao", team: "Sales", role: "Sales Representative", costCenter: "SALES-001", startDate: "2025-09-01", status: "active", location: "Mumbai, India", reportsTo: "EMP-002" },
  { employeeId: "EMP-006", name: "Mei Lin Chen", team: "Operations", role: "Regional Admin", costCenter: "OPS-002", startDate: "2025-09-01", status: "active", location: "Singapore", reportsTo: "EMP-001" },
  { employeeId: "EMP-007", name: "James Mitchell", team: "Operations", role: "Regional Admin", costCenter: "OPS-003", startDate: "2025-11-10", status: "active", location: "Sydney, Australia", reportsTo: "EMP-001" },
  { employeeId: "EMP-008", name: "Deepak Joshi", team: "Marketing", role: "Marketing Manager", costCenter: "MKT-001", startDate: "2025-10-01", status: "active", location: "Mumbai, India", reportsTo: "EMP-002" },
];

const bizopsWorkflows = [
  { workflowId: "WF-001", name: "New Vendor Onboarding", type: "approval", status: "active", steps: 5, completedRuns: 12, avgDuration: "3.2 days", trigger: "Manual", owner: "Priya Sharma", lastRun: "2026-02-07T16:00:00Z" },
  { workflowId: "WF-002", name: "Invoice Processing", type: "automation", status: "active", steps: 4, completedRuns: 48, avgDuration: "1.5 hours", trigger: "On invoice receipt", owner: "Rajesh Menon", lastRun: "2026-02-09T12:00:00Z" },
  { workflowId: "WF-003", name: "Employee Offboarding", type: "approval", status: "active", steps: 8, completedRuns: 3, avgDuration: "5 days", trigger: "HR trigger", owner: "Arun Kumar", lastRun: "2026-01-28T10:00:00Z" },
  { workflowId: "WF-004", name: "Compliance Review", type: "scheduled", status: "active", steps: 6, completedRuns: 24, avgDuration: "2 hours", trigger: "Weekly", owner: "Sarah Wong", lastRun: "2026-02-07T09:00:00Z" },
];

const bizopsKpis = [
  { kpiId: "KPI-001", name: "Operational Health Score", category: "Operations", currentValue: 87, targetValue: 90, unit: "%", trend: 2.3, status: "on-track", owner: "Priya Sharma", period: "Q1 2026" },
  { kpiId: "KPI-002", name: "Integration Uptime", category: "Infrastructure", currentValue: 99.7, targetValue: 99.9, unit: "%", trend: -0.1, status: "at-risk", owner: "Arun Kumar", period: "Q1 2026" },
  { kpiId: "KPI-003", name: "Vendor Compliance Rate", category: "Compliance", currentValue: 92, targetValue: 100, unit: "%", trend: 4, status: "on-track", owner: "Sarah Wong", period: "Q1 2026" },
  { kpiId: "KPI-004", name: "Mean Time to Resolution", category: "Support", currentValue: 4.2, targetValue: 3.0, unit: "hours", trend: -0.8, status: "improving", owner: "Anjali Patel", period: "Q1 2026" },
];

// ─── Sales Domain ───────────────────────────────────────────────────────────

const salesDeals = [
  { dealId: "DEAL-001", name: "TechServe Enterprise Expansion", accountId: "acc-001", accountName: "TechServe India", stage: "negotiate", amount: 180000, probability: 80, closeDate: "2026-02-20", owner: "Priya S.", daysSinceLastActivity: 1, nextStep: "Final pricing review", source: "salesforce" },
  { dealId: "DEAL-002", name: "HealthTech Platform Migration", accountId: "acc-006", accountName: "HealthTech Innovations", stage: "proposal", amount: 210000, probability: 75, closeDate: "2026-02-25", owner: "Arun K.", daysSinceLastActivity: 2, nextStep: "Demo scheduled", source: "hubspot" },
  { dealId: "DEAL-003", name: "CloudBridge APAC Renewal", accountId: "acc-002", accountName: "CloudBridge APAC", stage: "qualify", amount: 280000, probability: 60, closeDate: "2026-02-28", owner: "Vikram R.", daysSinceLastActivity: 3, nextStep: "Stakeholder alignment", source: "salesforce" },
  { dealId: "DEAL-004", name: "DataVault Security Suite", accountId: "acc-004", accountName: "DataVault Australia", stage: "prospect", amount: 120000, probability: 35, closeDate: "2026-03-15", owner: "Anjali P.", daysSinceLastActivity: 5, nextStep: "Initial discovery call", source: "salesforce" },
  { dealId: "DEAL-005", name: "EduSpark Growth Plan", accountId: "acc-008", accountName: "EduSpark Learning", stage: "closed-won", amount: 68000, probability: 100, closeDate: "2026-01-15", owner: "Priya S.", daysSinceLastActivity: 0, nextStep: "Implementation", source: "hubspot" },
  { dealId: "DEAL-006", name: "RetailNest Onboarding", accountId: "acc-005", accountName: "RetailNest Pte Ltd", stage: "closed-won", amount: 95000, probability: 100, closeDate: "2026-01-28", owner: "Rajesh M.", daysSinceLastActivity: 0, nextStep: "Go-live support", source: "salesforce" },
  { dealId: "DEAL-007", name: "FinanceFlow Rescue Package", accountId: "acc-003", accountName: "FinanceFlow Solutions", stage: "negotiate", amount: 155000, probability: 50, closeDate: "2026-03-01", owner: "Rajesh M.", daysSinceLastActivity: 4, nextStep: "Executive alignment", source: "salesforce" },
];

const salesContacts = [
  { contactId: "CON-001", name: "Arjun Mehta", email: "arjun@techserve.in", role: "CTO", title: "Chief Technology Officer", accountId: "acc-001", accountName: "TechServe India", phone: "+91-98xxx", lastActivity: "2h ago", leadScore: 85, lifecycle: "customer", source: "salesforce" },
  { contactId: "CON-002", name: "Sarah Chen", email: "sarah@cloudbridge.sg", role: "VP Sales", title: "Vice President of Sales", accountId: "acc-002", accountName: "CloudBridge APAC", phone: "+65-xxx", lastActivity: "1d ago", leadScore: 72, lifecycle: "customer", source: "hubspot" },
  { contactId: "CON-003", name: "Deepak Sharma", email: "deepak@financeflow.com", role: "CEO", title: "Chief Executive Officer", accountId: "acc-003", accountName: "FinanceFlow Solutions", phone: "+91-97xxx", lastActivity: "5d ago", leadScore: 45, lifecycle: "customer", source: "salesforce" },
  { contactId: "CON-004", name: "Emily Torres", email: "emily@datavault.au", role: "CISO", title: "Chief Information Security Officer", accountId: "acc-004", accountName: "DataVault Australia", phone: "+61-xxx", lastActivity: "3h ago", leadScore: 90, lifecycle: "customer", source: "hubspot" },
  { contactId: "CON-005", name: "Ravi Patel", email: "ravi@healthtech.in", role: "Head of Product", title: "Head of Product", accountId: "acc-006", accountName: "HealthTech Innovations", phone: "+91-99xxx", lastActivity: "6h ago", leadScore: 88, lifecycle: "customer", source: "salesforce" },
  { contactId: "CON-006", name: "Lisa Wong", email: "lisa@retailnest.sg", role: "COO", title: "Chief Operating Officer", accountId: "acc-005", accountName: "RetailNest Pte Ltd", phone: "+65-xxx", lastActivity: "12h ago", leadScore: 62, lifecycle: "sql", source: "linkedin" },
];

const salesActivities = [
  { activityId: "ACT-001", type: "email", subject: "Follow-up on expansion proposal", accountId: "acc-001", contactId: "CON-001", dealId: "DEAL-001", date: "2026-02-09T10:30:00Z", duration: null, outcome: "Replied", owner: "Priya S.", source: "salesforce" },
  { activityId: "ACT-002", type: "call", subject: "Discovery call — security requirements", accountId: "acc-004", contactId: "CON-004", dealId: "DEAL-004", date: "2026-02-09T09:00:00Z", duration: 45, outcome: "Scheduled demo", owner: "Anjali P.", source: "salesforce" },
  { activityId: "ACT-003", type: "meeting", subject: "Quarterly business review", accountId: "acc-002", contactId: "CON-002", dealId: null, date: "2026-02-09T14:00:00Z", duration: 60, outcome: null, owner: "Arun K.", source: "calendly" },
  { activityId: "ACT-004", type: "meeting", subject: "Product demo — platform migration", accountId: "acc-006", contactId: "CON-005", dealId: "DEAL-002", date: "2026-02-10T11:00:00Z", duration: 45, outcome: null, owner: "Arun K.", source: "calendly" },
  { activityId: "ACT-005", type: "email", subject: "Renewal discussion preparation", accountId: "acc-003", contactId: "CON-003", dealId: "DEAL-007", date: "2026-02-08T16:00:00Z", duration: null, outcome: "No reply", owner: "Rajesh M.", source: "hubspot" },
];

const salesLeads = [
  { leadId: "LEAD-001", name: "Vikram Desai", email: "vikram@acmecorp.in", company: "AcmeCorp India", source: "organic", score: 82, status: "qualified", assignedTo: "Priya S.", createdAt: "2026-02-08T10:00:00Z" },
  { leadId: "LEAD-002", name: "Michelle Tan", email: "michelle@nexgen.sg", company: "NexGen Singapore", source: "paid", score: 68, status: "contacted", assignedTo: "Arun K.", createdAt: "2026-02-07T14:00:00Z" },
  { leadId: "LEAD-003", name: "James Wright", email: "james@autech.au", company: "AuTech Australia", source: "referral", score: 91, status: "qualified", assignedTo: "Vikram R.", createdAt: "2026-02-06T09:00:00Z" },
  { leadId: "LEAD-004", name: "Neha Gupta", email: "neha@startupx.in", company: "StartupX", source: "event", score: 55, status: "new", assignedTo: "Anjali P.", createdAt: "2026-02-09T08:00:00Z" },
];

const salesForecasts = [
  { forecastId: "FC-Q1-2026", period: "Q1 2026", type: "quarterly", bestCase: 1080000, commit: 850000, pipeline: 1230000, closedWon: 163000, target: 950000, confidence: 78, owner: "Priya S.", lastUpdated: "2026-02-09" },
  { forecastId: "FC-Q2-2026", period: "Q2 2026", type: "quarterly", bestCase: 1250000, commit: 720000, pipeline: 1850000, closedWon: 0, target: 1050000, confidence: 52, owner: "Priya S.", lastUpdated: "2026-02-09" },
];

const salesQuotas = [
  { quotaId: "QT-001", repName: "Priya S.", repId: "P-001", period: "Q1 2026", quotaAmount: 400000, closedWon: 68000, pipeline: 390000, attainment: 17, onTrack: true },
  { quotaId: "QT-002", repName: "Arun K.", repId: "P-002", period: "Q1 2026", quotaAmount: 300000, closedWon: 0, pipeline: 490000, attainment: 0, onTrack: true },
  { quotaId: "QT-003", repName: "Rajesh M.", repId: "P-003", period: "Q1 2026", quotaAmount: 200000, closedWon: 95000, pipeline: 155000, attainment: 47.5, onTrack: true },
  { quotaId: "QT-004", repName: "Anjali P.", repId: "P-004", period: "Q1 2026", quotaAmount: 250000, closedWon: 0, pipeline: 120000, attainment: 0, onTrack: false },
  { quotaId: "QT-005", repName: "Vikram R.", repId: "P-005", period: "Q1 2026", quotaAmount: 250000, closedWon: 0, pipeline: 280000, attainment: 0, onTrack: true },
];

const salesSequences = [
  { sequenceId: "SEQ-001", name: "Enterprise Outreach", steps: 7, activeProspects: 24, completedRate: 62, avgResponseRate: 28, status: "active", owner: "Priya S.", createdAt: "2026-01-15" },
  { sequenceId: "SEQ-002", name: "Renewal Follow-up", steps: 4, activeProspects: 8, completedRate: 45, avgResponseRate: 42, status: "active", owner: "Rajesh M.", createdAt: "2026-01-20" },
  { sequenceId: "SEQ-003", name: "Inbound Lead Nurture", steps: 5, activeProspects: 36, completedRate: 38, avgResponseRate: 35, status: "active", owner: "Vikram R.", createdAt: "2026-02-01" },
];

// ─── RevOps Domain ──────────────────────────────────────────────────────────

const revopsWaterfall = [
  { waterfallId: "RW-Q1-2026", period: "Q1 2026", startArr: 1480000, expansion: 245000, newBiz: 163000, contraction: -42000, churn: -65000, endArr: 1781000, netRetention: 112, grossRetention: 96 },
];

const revopsCohorts = [
  { cohortId: "COH-2024H1", cohortPeriod: "2024 H1", accounts: 4, startArr: 820000, currentArr: 950000, expansion: 15.8, churn: 0, netRetention: 115.8 },
  { cohortId: "COH-2024H2", cohortPeriod: "2024 H2", accounts: 2, startArr: 325000, currentArr: 375000, expansion: 15.4, churn: 0, netRetention: 115.4 },
  { cohortId: "COH-2025H1", cohortPeriod: "2025 H1", accounts: 2, startArr: 305000, currentArr: 305000, expansion: 0, churn: 0, netRetention: 100 },
];

const revopsQuotaAttainment = [
  { attainmentId: "QA-001", teamName: "APAC Sales", period: "Q1 2026", totalQuota: 1400000, totalClosed: 163000, totalPipeline: 1435000, attainmentPct: 11.6, forecastPct: 72, repCount: 5 },
];

const revopsPipelineHealth = [
  { healthId: "PH-001", period: "Q1 2026", totalPipeline: 1435000, weightedPipeline: 723000, avgDealSize: 159444, avgCycleTimeDays: 34, winRate: 67, coverageRatio: 1.5, staleDealsCount: 2, staleDealValue: 275000 },
];

// ─── Marketing Domain ───────────────────────────────────────────────────────

const mktgCampaigns = [
  { campaignId: "CAMP-001", name: "APAC Growth Webinar Q1", type: "Webinar", status: "active", channel: "email", sent: 5200, opens: 2340, clicks: 890, conversions: 166, conversionRate: 3.2, revenue: 42000, startDate: "2026-01-15", endDate: null, budget: 12000 },
  { campaignId: "CAMP-002", name: "Product Launch — Enterprise", type: "Multi-Channel", status: "active", channel: "email", sent: 12000, opens: 4800, clicks: 1920, conversions: 336, conversionRate: 2.8, revenue: 85000, startDate: "2026-01-20", endDate: null, budget: 35000 },
  { campaignId: "CAMP-003", name: "Customer Success Stories", type: "Content", status: "completed", channel: "content", sent: 8500, opens: 3400, clicks: 1360, conversions: 349, conversionRate: 4.1, revenue: 38000, startDate: "2025-12-01", endDate: "2026-01-31", budget: 8000 },
  { campaignId: "CAMP-004", name: "LinkedIn Thought Leadership", type: "Social", status: "active", channel: "social", sent: 0, opens: 0, clicks: 4200, conversions: 84, conversionRate: 2.0, revenue: 18000, startDate: "2026-01-01", endDate: null, budget: 15000 },
];

const mktgEmailSends = [
  { sendId: "ES-001", campaignId: "CAMP-001", subject: "Join Our APAC Growth Webinar", sentAt: "2026-02-01T09:00:00Z", recipients: 2600, delivered: 2540, opens: 1170, clicks: 445, bounces: 60, unsubscribes: 8, status: "sent" },
  { sendId: "ES-002", campaignId: "CAMP-001", subject: "Webinar Reminder: Tomorrow!", sentAt: "2026-02-07T09:00:00Z", recipients: 2600, delivered: 2548, opens: 1170, clicks: 445, bounces: 52, unsubscribes: 3, status: "sent" },
  { sendId: "ES-003", campaignId: "CAMP-002", subject: "Introducing Enterprise Platform v3", sentAt: "2026-01-25T10:00:00Z", recipients: 12000, delivered: 11760, opens: 4800, clicks: 1920, bounces: 240, unsubscribes: 24, status: "sent" },
];

const mktgContentAssets = [
  { assetId: "CA-001", title: "2026 APAC Integration Trends Report", type: "whitepaper", status: "published", downloads: 342, views: 1250, conversions: 89, publishDate: "2026-01-10", author: "Deepak Joshi" },
  { assetId: "CA-002", title: "API-First Architecture Best Practices", type: "blog", status: "published", downloads: 0, views: 2100, conversions: 42, publishDate: "2026-01-22", author: "Priya Sharma" },
  { assetId: "CA-003", title: "Customer Success Case Study: TechServe", type: "case-study", status: "published", downloads: 156, views: 890, conversions: 34, publishDate: "2026-02-01", author: "Anjali Patel" },
  { assetId: "CA-004", title: "ROI Calculator: Integration Platform", type: "tool", status: "published", downloads: 0, views: 780, conversions: 124, publishDate: "2025-12-15", author: "Rajesh Menon" },
];

const mktgForms = [
  { formId: "FRM-001", name: "Webinar Registration", type: "registration", submissions: 420, conversionRate: 38, fields: 6, status: "active", page: "/webinar-q1", createdAt: "2026-01-10" },
  { formId: "FRM-002", name: "Contact Sales", type: "contact", submissions: 89, conversionRate: 12, fields: 8, status: "active", page: "/contact", createdAt: "2025-06-01" },
  { formId: "FRM-003", name: "ROI Calculator", type: "interactive", submissions: 124, conversionRate: 22, fields: 5, status: "active", page: "/roi-calculator", createdAt: "2025-12-15" },
  { formId: "FRM-004", name: "Newsletter Signup", type: "subscribe", submissions: 1240, conversionRate: 45, fields: 2, status: "active", page: "/blog", createdAt: "2025-06-01" },
];

const mktgSocialPosts = [
  { postId: "SP-001", platform: "LinkedIn", content: "Excited to announce our Q1 APAC Growth Webinar!", publishedAt: "2026-01-12T10:00:00Z", impressions: 12400, engagements: 890, clicks: 342, status: "published", author: "Deepak Joshi" },
  { postId: "SP-002", platform: "LinkedIn", content: "How API-first architecture is transforming APAC enterprises", publishedAt: "2026-01-22T09:00:00Z", impressions: 18200, engagements: 1340, clicks: 678, status: "published", author: "Priya Sharma" },
  { postId: "SP-003", platform: "Twitter", content: "Our customer TechServe achieved 65% API coverage in just 18 months.", publishedAt: "2026-02-01T08:00:00Z", impressions: 8900, engagements: 445, clicks: 156, status: "published", author: "Deepak Joshi" },
];

const mktgAttribution = [
  { attributionId: "ATT-001", dealId: "DEAL-005", dealName: "EduSpark Growth Plan", touchpoints: ["organic-search", "blog-read", "webinar-attend", "demo-request"], firstTouch: "organic-search", lastTouch: "demo-request", revenueInfluenced: 68000, model: "linear", createdAt: "2026-01-15" },
  { attributionId: "ATT-002", dealId: "DEAL-001", dealName: "TechServe Enterprise Expansion", touchpoints: ["referral", "whitepaper-download", "meeting"], firstTouch: "referral", lastTouch: "meeting", revenueInfluenced: 180000, model: "linear", createdAt: "2026-02-01" },
];

// ─── Website Domain ─────────────────────────────────────────────────────────

const webPages = [
  { pageId: "PG-001", path: "/", title: "IntegrateWise — Unified Business Operations", status: "published", views: 45200, uniqueVisitors: 28400, avgTimeOnPage: 42, bounceRate: 38, seoScore: 92, lastModified: "2026-02-08", author: "Deepak Joshi" },
  { pageId: "PG-002", path: "/features", title: "Platform Features", status: "published", views: 18900, uniqueVisitors: 12300, avgTimeOnPage: 65, bounceRate: 28, seoScore: 88, lastModified: "2026-02-05", author: "Priya Sharma" },
  { pageId: "PG-003", path: "/pricing", title: "Pricing Plans", status: "published", views: 12400, uniqueVisitors: 8900, avgTimeOnPage: 38, bounceRate: 42, seoScore: 85, lastModified: "2026-01-28", author: "Rajesh Menon" },
  { pageId: "PG-004", path: "/blog", title: "Blog", status: "published", views: 32100, uniqueVisitors: 21400, avgTimeOnPage: 180, bounceRate: 35, seoScore: 90, lastModified: "2026-02-09", author: "Deepak Joshi" },
  { pageId: "PG-005", path: "/contact", title: "Contact Sales", status: "published", views: 5600, uniqueVisitors: 4200, avgTimeOnPage: 25, bounceRate: 52, seoScore: 78, lastModified: "2026-01-15", author: "Vikram Rao" },
  { pageId: "PG-006", path: "/case-studies", title: "Customer Stories", status: "published", views: 8200, uniqueVisitors: 5600, avgTimeOnPage: 120, bounceRate: 30, seoScore: 86, lastModified: "2026-02-01", author: "Anjali Patel" },
];

const webSeoAudit = [
  { auditId: "SEO-001", page: "/pricing", issueType: "missing_meta", message: "Missing meta description tag", severity: "high", status: "open", recommendation: "Add a 155-character meta description with keywords", detectedAt: "2026-02-08" },
  { auditId: "SEO-002", page: "/blog/api-patterns", issueType: "broken_link", message: "2 broken internal links detected", severity: "medium", status: "open", recommendation: "Update links to /docs/api-patterns-v2", detectedAt: "2026-02-07" },
  { auditId: "SEO-003", page: "/features", issueType: "missing_alt", message: "3 images missing alt text", severity: "medium", status: "fixed", recommendation: "Add descriptive alt text to feature images", detectedAt: "2026-01-28" },
  { auditId: "SEO-004", page: "/", issueType: "performance", message: "LCP above 2.5s threshold", severity: "high", status: "open", recommendation: "Optimize hero image and defer non-critical JS", detectedAt: "2026-02-09" },
];

const webAnalytics = [
  { analyticsId: "WA-2026-02-09", date: "2026-02-09", visitors: 3420, uniqueVisitors: 2180, sessions: 4100, pageViews: 12400, avgSessionDuration: 185, bounceRate: 36, conversionRate: 2.8, topSource: "organic", deviceDesktop: 62, deviceMobile: 30, deviceTablet: 8 },
  { analyticsId: "WA-2026-02-08", date: "2026-02-08", visitors: 3180, uniqueVisitors: 2050, sessions: 3850, pageViews: 11800, avgSessionDuration: 178, bounceRate: 38, conversionRate: 2.5, topSource: "organic", deviceDesktop: 60, deviceMobile: 32, deviceTablet: 8 },
  { analyticsId: "WA-2026-02-07", date: "2026-02-07", visitors: 3560, uniqueVisitors: 2290, sessions: 4320, pageViews: 13100, avgSessionDuration: 192, bounceRate: 34, conversionRate: 3.1, topSource: "direct", deviceDesktop: 64, deviceMobile: 28, deviceTablet: 8 },
];

const webMediaLibrary = [
  { mediaId: "MED-001", fileName: "hero-banner.webp", type: "image", size: 245000, dimensions: "1920x1080", alt: "IntegrateWise platform dashboard", uploadedBy: "Deepak Joshi", uploadedAt: "2026-01-15", usedOn: ["/"] },
  { mediaId: "MED-002", fileName: "feature-integrations.svg", type: "svg", size: 12400, dimensions: "800x600", alt: "Integration hub diagram", uploadedBy: "Priya Sharma", uploadedAt: "2026-01-20", usedOn: ["/features"] },
  { mediaId: "MED-003", fileName: "product-demo.mp4", type: "video", size: 42000000, dimensions: "1920x1080", alt: "Product demonstration video", uploadedBy: "Deepak Joshi", uploadedAt: "2026-02-01", usedOn: ["/features", "/"] },
];

// ─── Personal Domain ────────────────────────────────────────────────────────

const personalTasks = [
  { taskId: "PT-001", title: "Review Q1 OKR alignment doc", priority: "high", status: "open", dueDate: "2026-02-10", category: "planning", createdAt: "2026-02-09" },
  { taskId: "PT-002", title: "Prepare customer health report", priority: "high", status: "open", dueDate: "2026-02-11", category: "reporting", createdAt: "2026-02-08" },
  { taskId: "PT-003", title: "Update pipeline forecasting model", priority: "medium", status: "open", dueDate: "2026-02-12", category: "analysis", createdAt: "2026-02-08" },
  { taskId: "PT-004", title: "Send follow-up to CloudBridge APAC", priority: "medium", status: "done", dueDate: "2026-02-10", category: "communication", createdAt: "2026-02-07" },
  { taskId: "PT-005", title: "Team sync preparation", priority: "low", status: "done", dueDate: "2026-02-10", category: "meetings", createdAt: "2026-02-09" },
];

const personalSchedule = [
  { eventId: "PE-001", title: "Team Standup", time: "09:00", type: "meeting", duration: 15, date: "2026-02-10", recurring: true },
  { eventId: "PE-002", title: "CloudBridge QBR Prep", time: "10:00", type: "work", duration: 90, date: "2026-02-10", recurring: false },
  { eventId: "PE-003", title: "Product Demo — HealthTech", time: "11:30", type: "meeting", duration: 45, date: "2026-02-10", recurring: false },
  { eventId: "PE-004", title: "Pipeline Review", time: "14:00", type: "meeting", duration: 60, date: "2026-02-10", recurring: true },
  { eventId: "PE-005", title: "Deep Work — Forecasting", time: "15:30", type: "focus", duration: 120, date: "2026-02-10", recurring: false },
];

const personalGoals = [
  { goalId: "PG-001", title: "Complete Q1 Pipeline Review", type: "okr", status: "in-progress", progress: 65, targetDate: "2026-03-31", keyResults: ["Review all open deals", "Update forecast model", "Present to leadership"] },
  { goalId: "PG-002", title: "Improve Customer Health Scores", type: "okr", status: "in-progress", progress: 40, targetDate: "2026-03-31", keyResults: ["Rescue 2 at-risk accounts", "Increase avg health to 80+", "Complete all QBRs"] },
  { goalId: "PG-003", title: "Master Revenue Analytics", type: "learning", status: "in-progress", progress: 30, targetDate: "2026-06-30", keyResults: ["Complete analytics certification", "Build 3 custom dashboards", "Train team on insights"] },
];

const personalBookmarks = [
  { bookmarkId: "BM-001", title: "Salesforce API Documentation", url: "https://developer.salesforce.com/docs", category: "reference", tags: ["api", "salesforce", "integration"], addedAt: "2026-01-15" },
  { bookmarkId: "BM-002", title: "MuleSoft Anypoint Platform", url: "https://anypoint.mulesoft.com", category: "tools", tags: ["mulesoft", "platform", "apis"], addedAt: "2026-01-20" },
  { bookmarkId: "BM-003", title: "APAC Growth Strategy Deck", url: "https://docs.google.com/presentation/d/xxx", category: "internal", tags: ["strategy", "apac", "growth"], addedAt: "2026-02-01" },
  { bookmarkId: "BM-004", title: "Revenue Operations Playbook", url: "https://notion.so/revops-playbook", category: "playbook", tags: ["revops", "process", "playbook"], addedAt: "2026-02-05" },
];

const personalNotes = [
  { noteId: "PN-001", title: "Q1 Pipeline Observations", content: "Pipeline coverage at 1.5x — need to increase to 3x for safety. Focus on CloudBridge and DataVault expansions.", createdAt: "2026-02-09T10:00:00Z", updatedAt: "2026-02-09T10:00:00Z", tags: ["pipeline", "q1"] },
  { noteId: "PN-002", title: "FinanceFlow Rescue Plan", content: "Key actions: 1) Exec escalation to CEO, 2) Resolve all 5 tickets, 3) Schedule emergency QBR before renewal.", createdAt: "2026-02-08T14:00:00Z", updatedAt: "2026-02-09T08:00:00Z", tags: ["risk", "financeflow", "rescue"] },
];

const personalFocusSessions = [
  { sessionId: "FS-001", task: "Review Q1 alignment", duration: 25, mode: "focus", completedAt: "2026-02-09T09:25:00Z", date: "2026-02-09" },
  { sessionId: "FS-002", task: "Pipeline analysis", duration: 25, mode: "focus", completedAt: "2026-02-09T10:00:00Z", date: "2026-02-09" },
  { sessionId: "FS-003", task: "Draft customer report", duration: 25, mode: "focus", completedAt: "2026-02-09T10:30:00Z", date: "2026-02-09" },
  { sessionId: "FS-004", task: "Break", duration: 5, mode: "short-break", completedAt: "2026-02-09T10:35:00Z", date: "2026-02-09" },
];

// ─── MCP (Moderated Connector Plane) ────────────────────────────────────────

const mcpConnectorRegistry = [
  { connectorId: "salesforce", name: "Salesforce", status: "connected", authType: "oauth2", capabilities: ["read", "write", "subscribe"], entityTypes: ["accounts", "contacts", "deals", "activities"], lastSync: "2026-02-09T14:00:00Z", recordsIngested: 1240, confidence: 0.95, policyGated: true, rbacScope: ["admin", "ops_manager", "sales_rep"] },
  { connectorId: "hubspot", name: "HubSpot", status: "connected", authType: "oauth2", capabilities: ["read", "write"], entityTypes: ["contacts", "leads", "campaigns", "deals"], lastSync: "2026-02-09T13:30:00Z", recordsIngested: 890, confidence: 0.88, policyGated: true, rbacScope: ["admin", "ops_manager", "marketing_mgr"] },
  { connectorId: "slack", name: "Slack", status: "connected", authType: "oauth2", capabilities: ["read", "subscribe"], entityTypes: ["activities"], lastSync: "2026-02-09T14:28:00Z", recordsIngested: 3200, confidence: 0.80, policyGated: true, rbacScope: ["admin", "ops_manager"] },
  { connectorId: "stripe", name: "Stripe", status: "connected", authType: "api_key", capabilities: ["read"], entityTypes: ["invoices", "accounts"], lastSync: "2026-02-09T12:00:00Z", recordsIngested: 456, confidence: 0.92, policyGated: true, rbacScope: ["admin", "ops_manager"] },
  { connectorId: "jira", name: "Jira", status: "connected", authType: "oauth2", capabilities: ["read", "write"], entityTypes: ["tickets", "activities"], lastSync: "2026-02-09T13:00:00Z", recordsIngested: 678, confidence: 0.90, policyGated: true, rbacScope: ["admin", "ops_manager"] },
  { connectorId: "google-workspace", name: "Google Workspace", status: "connected", authType: "oauth2", capabilities: ["read"], entityTypes: ["activities"], lastSync: "2026-02-09T11:00:00Z", recordsIngested: 1890, confidence: 0.82, policyGated: true, rbacScope: ["admin"] },
  { connectorId: "zendesk", name: "Zendesk", status: "disconnected", authType: "oauth2", capabilities: ["read", "write"], entityTypes: ["tickets"], lastSync: null, recordsIngested: 0, confidence: 0, policyGated: true, rbacScope: ["admin", "cs_lead"] },
  { connectorId: "calendly", name: "Calendly", status: "connected", authType: "api_key", capabilities: ["read", "subscribe"], entityTypes: ["activities"], lastSync: "2026-02-09T14:15:00Z", recordsIngested: 234, confidence: 0.88, policyGated: true, rbacScope: ["admin", "ops_manager", "sales_rep"] },
];

const mcpRequestLog = [
  { requestId: "REQ-001", connectorId: "salesforce", operation: "read", entityType: "accounts", recordCount: 8, status: "success", userId: "u1", roleScope: "super_admin", timestamp: "2026-02-09T14:00:00Z", durationMs: 342, policyChecked: true, rbacValidated: true },
  { requestId: "REQ-002", connectorId: "hubspot", operation: "write", entityType: "contacts", recordCount: 1, status: "success", userId: "u2", roleScope: "ops_manager", timestamp: "2026-02-09T13:30:00Z", durationMs: 189, policyChecked: true, rbacValidated: true },
  { requestId: "REQ-003", connectorId: "slack", operation: "subscribe", entityType: "activities", recordCount: 0, status: "success", userId: "u1", roleScope: "super_admin", timestamp: "2026-02-09T14:28:00Z", durationMs: 56, policyChecked: true, rbacValidated: true },
  { requestId: "REQ-004", connectorId: "salesforce", operation: "write", entityType: "deals", recordCount: 1, status: "denied", userId: "u5", roleScope: "sales_rep", timestamp: "2026-02-09T12:00:00Z", durationMs: 12, policyChecked: true, rbacValidated: false, denialReason: "sales_rep cannot write to deals without manager approval" },
];

const mcpConnectorPolicies = [
  { policyId: "MCP-POL-001", connectorId: "salesforce", policyType: "rate_limit", rules: { maxRequestsPerMinute: 100, maxBatchSize: 200, retryOnError: true }, effectiveDate: "2025-06-01", version: 1 },
  { policyId: "MCP-POL-002", connectorId: "*", policyType: "audit", rules: { logAllOperations: true, logDenials: true, retentionDays: 365 }, effectiveDate: "2025-06-01", version: 1 },
  { policyId: "MCP-POL-003", connectorId: "*", policyType: "rbac_enforcement", rules: { requireValidRole: true, requirePolicyGating: true, denyUnauthorized: true }, effectiveDate: "2025-06-01", version: 1 },
];

// ─── Context Plane ──────────────────────────────────────────────────────────

const contextWorkSessions = [
  { sessionId: "WS-001", userId: "u1", startedAt: "2026-02-09T09:00:00Z", endedAt: null, domain: "integratewise-apac", activePage: "dashboard", focusEntity: { type: "account", id: "acc-001", name: "TechServe India" }, actionsPerformed: 24, status: "active" },
  { sessionId: "WS-002", userId: "u4", startedAt: "2026-02-09T08:30:00Z", endedAt: "2026-02-09T12:00:00Z", domain: "account-success", activePage: "account-master", focusEntity: { type: "account", id: "ACC-003", name: "FinanceFlow Solutions" }, actionsPerformed: 18, status: "completed" },
  { sessionId: "WS-003", userId: "u5", startedAt: "2026-02-09T10:00:00Z", endedAt: null, domain: "salesops", activePage: "pipeline-kanban", focusEntity: { type: "deal", id: "DEAL-001", name: "TechServe Enterprise Expansion" }, actionsPerformed: 12, status: "active" },
];

const contextObjects = [
  { contextId: "CTX-001", type: "decision", title: "Approved DataDog renewal at 10% increase", entityLinks: [{ type: "vendor", id: "VEN-003" }, { type: "approval", id: "BA-001" }], createdBy: "u1", createdAt: "2026-02-08T16:00:00Z", evidence: ["Invoice comparison", "Usage metrics"], searchable: true },
  { contextId: "CTX-002", type: "incident", title: "Salesforce sync OAuth token expiration", entityLinks: [{ type: "connector", id: "salesforce" }], createdBy: "system", createdAt: "2026-02-09T14:30:00Z", evidence: ["Error log", "Connector status"], searchable: true },
  { contextId: "CTX-003", type: "workflow", title: "FinanceFlow rescue plan initiated", entityLinks: [{ type: "account", id: "ACC-003" }, { type: "risk", id: "RSK-001" }], createdBy: "u4", createdAt: "2026-02-09T09:00:00Z", evidence: ["Health score trend", "Ticket backlog"], searchable: true },
];

const contextIndex = [
  { indexId: "IDX-001", objectId: "CTX-001", keywords: ["datadog", "renewal", "vendor", "approval", "spend"], entityRefs: ["VEN-003", "BA-001"], semanticVector: null, indexedAt: "2026-02-08T16:01:00Z" },
  { indexId: "IDX-002", objectId: "CTX-002", keywords: ["salesforce", "oauth", "sync", "error", "connector"], entityRefs: ["salesforce"], semanticVector: null, indexedAt: "2026-02-09T14:31:00Z" },
  { indexId: "IDX-003", objectId: "CTX-003", keywords: ["financeflow", "rescue", "risk", "churn", "health"], entityRefs: ["ACC-003", "RSK-001"], semanticVector: null, indexedAt: "2026-02-09T09:01:00Z" },
];

// ─── AI Chats Plane (Immutable Ledger) ──────────────────────────────────────

const chatLedger = [
  { chatId: "CHAT-001", sessionId: "CSESS-001", role: "user", content: "What accounts are at risk of churning this quarter?", timestamp: "2026-02-09T10:00:00Z", userId: "u4", citations: [], toolCalls: [], approvals: [] },
  { chatId: "CHAT-002", sessionId: "CSESS-001", role: "assistant", content: "Based on Spine SSOT data, 2 accounts are at critical risk:\n1. FinanceFlow Solutions (Health: 54, Renewal: 29 days)\n2. LogiPrime Corp (Health: 42, Renewal: 19 days)\nBoth show declining health trends and engagement gaps.", timestamp: "2026-02-09T10:00:05Z", userId: null, citations: [{ type: "spine", entityType: "account", entityId: "ACC-003" }, { type: "spine", entityType: "account", entityId: "ACC-006" }], toolCalls: [{ tool: "fetchCSMTable", args: { table: "account_master" } }], approvals: [] },
  { chatId: "CHAT-003", sessionId: "CSESS-001", role: "user", content: "Create a rescue plan for FinanceFlow Solutions", timestamp: "2026-02-09T10:01:00Z", userId: "u4", citations: [], toolCalls: [], approvals: [] },
  { chatId: "CHAT-004", sessionId: "CSESS-001", role: "assistant", content: "Here's a recommended rescue plan:\n1. Executive escalation: Schedule CEO meeting within 48h\n2. Ticket resolution: Clear all 5 open tickets by Feb 12\n3. Emergency QBR: Before renewal date (Mar 10)\n4. Value demonstration: Prepare ROI report\nShall I create these as tasks in the Task Manager?", timestamp: "2026-02-09T10:01:10Z", userId: null, citations: [{ type: "spine", entityType: "account", entityId: "ACC-003" }, { type: "context", entityType: "risk", entityId: "RSK-001" }], toolCalls: [{ tool: "fetchCSMTable", args: { table: "risk_register" } }, { tool: "fetchCSMTable", args: { table: "engagement_log" } }], approvals: [{ action: "create_tasks", status: "pending", requiredBy: "u4" }] },
];

const chatSessions = [
  { sessionId: "CSESS-001", userId: "u4", title: "At-Risk Account Analysis", domain: "account-success", startedAt: "2026-02-09T10:00:00Z", messageCount: 4, status: "active", contextEntities: ["ACC-003", "ACC-006"] },
  { sessionId: "CSESS-002", userId: "u1", title: "Integration Health Check", domain: "integratewise-apac", startedAt: "2026-02-08T14:00:00Z", messageCount: 8, status: "completed", contextEntities: ["salesforce", "hubspot"] },
];

// ─── Governed Memory Plane ──────────────────────────────────────────────────

const memoryStore = [
  { memoryId: "MEM-001", memoryType: "stable_fact", scope: { orgId: "t1", teamId: "cs" }, content: "FinanceFlow Solutions CFO (Neha Patel) prefers email communication over phone calls. Always CC arjun@financeflow.io on escalations.", evidence: ["ENG-003", "ENG-007"], linkedEntities: [{ type: "account", id: "ACC-003" }], version: 1, supersedes: null, ttl: null, createdAt: "2026-01-15T10:00:00Z", createdBy: "u4", approvedBy: "u4", status: "committed" },
  { memoryId: "MEM-002", memoryType: "approved_decision", scope: { orgId: "t1" }, content: "All enterprise renewals below 80 health score require VP CS review before renewal proposal is sent.", evidence: ["POL-003"], linkedEntities: [], version: 2, supersedes: "MEM-002-v1", ttl: null, createdAt: "2026-01-20T14:00:00Z", createdBy: "u1", approvedBy: "u1", status: "committed" },
  { memoryId: "MEM-003", memoryType: "normalization_rule", scope: { orgId: "t1" }, content: "Salesforce 'Account.Type' field maps to Spine 'tier': 'Enterprise' → 'enterprise', 'SMB' → 'smb', 'Mid-Market' → 'mid-market'.", evidence: ["schema_registry"], linkedEntities: [], version: 1, supersedes: null, ttl: null, createdAt: "2025-06-15T10:00:00Z", createdBy: "u1", approvedBy: "u1", status: "committed" },
  { memoryId: "MEM-004", memoryType: "playbook", scope: { orgId: "t1", teamId: "cs" }, content: "Account Rescue Playbook: 1) Identify root cause from risk register, 2) Schedule exec alignment within 48h, 3) Resolve all P1/P2 tickets, 4) Prepare value demonstration, 5) Present rescue plan at QBR.", evidence: ["CTX-003"], linkedEntities: [], version: 1, supersedes: null, ttl: null, createdAt: "2026-02-01T10:00:00Z", createdBy: "u4", approvedBy: "u1", status: "committed" },
];

const memoryCandidates = [
  { candidateId: "CAND-001", sourceChat: "CHAT-004", extractedFrom: "assistant response", proposedType: "playbook", proposedContent: "FinanceFlow-specific rescue steps: 1) CEO meeting within 48h, 2) Clear 5 tickets by Feb 12, 3) Emergency QBR before Mar 10, 4) ROI report.", validationStatus: "pending", safetyCheck: "passed", scopeCheck: "passed", proposedScope: { orgId: "t1", teamId: "cs" }, proposedAt: "2026-02-09T10:01:15Z", proposedBy: "system" },
];

const memoryVersions = [
  { versionId: "MEM-002-v1", memoryId: "MEM-002", version: 1, content: "All renewals below 80 health score require manager review.", createdAt: "2026-01-10T10:00:00Z", supersededBy: "MEM-002", supersededAt: "2026-01-20T14:00:00Z", reason: "Upgraded to VP-level review for enterprise accounts" },
];

// ─── Schema & Provenance ────────────────────────────────────────────────────

const schemaRegistry = [
  { fieldId: "SF-001", domain: "csm", entityType: "account_master", fieldKey: "healthScore", fieldType: "number", required: true, piiClass: "none", writePolicy: "spine_only", version: 1, description: "Composite health score 0-100" },
  { fieldId: "SF-002", domain: "csm", entityType: "account_master", fieldKey: "arr", fieldType: "currency", required: true, piiClass: "sensitive", writePolicy: "spine_only", version: 1, description: "Annual Recurring Revenue" },
  { fieldId: "SF-003", domain: "csm", entityType: "account_master", fieldKey: "primaryContactEmail", fieldType: "email", required: false, piiClass: "pii", writePolicy: "spine_only", version: 1, description: "Primary contact email address" },
  { fieldId: "SF-004", domain: "sales", entityType: "deals", fieldKey: "amount", fieldType: "currency", required: true, piiClass: "sensitive", writePolicy: "spine_only", version: 1, description: "Deal value in USD" },
  { fieldId: "SF-005", domain: "sales", entityType: "contacts", fieldKey: "email", fieldType: "email", required: true, piiClass: "pii", writePolicy: "spine_only", version: 1, description: "Contact email address" },
  { fieldId: "SF-006", domain: "bizops", entityType: "invoices", fieldKey: "amount", fieldType: "currency", required: true, piiClass: "sensitive", writePolicy: "spine_only", version: 1, description: "Invoice amount" },
  { fieldId: "SF-007", domain: "admin", entityType: "users", fieldKey: "email", fieldType: "email", required: true, piiClass: "pii", writePolicy: "admin_only", version: 1, description: "User email address" },
];

const ssotCompleteness = [
  { completenessId: "COMP-001", orgId: "t1", domain: "csm", entityType: "account_master", coveragePct: 100, missingFields: [], lastScoredAt: "2026-02-09T14:00:00Z", recordCount: 8, totalFields: 52, populatedFields: 52 },
  { completenessId: "COMP-002", orgId: "t1", domain: "csm", entityType: "api_portfolio", coveragePct: 85, missingFields: ["linkedMetrics"], lastScoredAt: "2026-02-09T14:00:00Z", recordCount: 7, totalFields: 18, populatedFields: 15 },
  { completenessId: "COMP-003", orgId: "t1", domain: "sales", entityType: "deals", coveragePct: 95, missingFields: ["probability"], lastScoredAt: "2026-02-09T14:00:00Z", recordCount: 7, totalFields: 12, populatedFields: 11 },
  { completenessId: "COMP-004", orgId: "t1", domain: "bizops", entityType: "vendors", coveragePct: 90, missingFields: ["complianceCerts"], lastScoredAt: "2026-02-09T14:00:00Z", recordCount: 5, totalFields: 12, populatedFields: 11 },
  { completenessId: "COMP-005", orgId: "t1", domain: "marketing", entityType: "campaigns", coveragePct: 100, missingFields: [], lastScoredAt: "2026-02-09T14:00:00Z", recordCount: 4, totalFields: 14, populatedFields: 14 },
  { completenessId: "COMP-006", orgId: "t1", domain: "website", entityType: "pages", coveragePct: 92, missingFields: ["seoScore"], lastScoredAt: "2026-02-09T14:00:00Z", recordCount: 6, totalFields: 12, populatedFields: 11 },
];

const provenanceLog = [
  { provenanceId: "PROV-001", sourceSystem: "salesforce", sourceRecordId: "001xx000003abc", ingestionRunId: "RUN-2026-02-09-001", rawHash: "a3f2e8c1d9b4", evidenceUri: "salesforce://Account/001xx000003abc", capturedAt: "2026-02-09T14:00:00Z", entityType: "account", entityId: "acc-001", confidence: 0.95 },
  { provenanceId: "PROV-002", sourceSystem: "hubspot", sourceRecordId: "comp-12345", ingestionRunId: "RUN-2026-02-09-001", rawHash: "b4c1e9d2f3a5", evidenceUri: "hubspot://Company/comp-12345", capturedAt: "2026-02-09T13:30:00Z", entityType: "account", entityId: "acc-002", confidence: 0.88 },
  { provenanceId: "PROV-003", sourceSystem: "stripe", sourceRecordId: "cus_abc123", ingestionRunId: "RUN-2026-02-09-002", rawHash: "c5d2f0e3a6b7", evidenceUri: "stripe://Customer/cus_abc123", capturedAt: "2026-02-09T12:00:00Z", entityType: "invoice", entityId: "INV-2026-001", confidence: 0.92 },
  { provenanceId: "PROV-004", sourceSystem: "jira", sourceRecordId: "IW-1234", ingestionRunId: "RUN-2026-02-09-003", rawHash: "d6e3a1b4c8f9", evidenceUri: "jira://Issue/IW-1234", capturedAt: "2026-02-09T13:00:00Z", entityType: "ticket", entityId: "tkt-001", confidence: 0.90 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MASTER REGISTRY — Maps domain → { table → { idField, data[] } }
// ═══════════════════════════════════════════════════════════════════════════════

export const FULL_DOMAIN_SEED_REGISTRY: DomainSeedRegistry = {
  // CSM — already exists, re-export from CSM_TABLE_REGISTRY
  csm: CSM_TABLE_REGISTRY,

  // BizOps
  bizops: {
    vendors: { idField: "vendorId", data: bizopsVendors },
    invoices: { idField: "invoiceId", data: bizopsInvoices },
    approvals: { idField: "approvalId", data: bizopsApprovals },
    policies: { idField: "policyId", data: bizopsPolicies },
    headcount: { idField: "employeeId", data: bizopsHeadcount },
    workflows: { idField: "workflowId", data: bizopsWorkflows },
    kpis: { idField: "kpiId", data: bizopsKpis },
  },

  // Sales
  sales: {
    deals: { idField: "dealId", data: salesDeals },
    contacts: { idField: "contactId", data: salesContacts },
    activities: { idField: "activityId", data: salesActivities },
    leads: { idField: "leadId", data: salesLeads },
    forecasts: { idField: "forecastId", data: salesForecasts },
    quotas: { idField: "quotaId", data: salesQuotas },
    sequences: { idField: "sequenceId", data: salesSequences },
  },

  // RevOps
  revops: {
    revenue_waterfall: { idField: "waterfallId", data: revopsWaterfall },
    cohort_analysis: { idField: "cohortId", data: revopsCohorts },
    quota_attainment: { idField: "attainmentId", data: revopsQuotaAttainment },
    pipeline_health: { idField: "healthId", data: revopsPipelineHealth },
  },

  // Marketing
  marketing: {
    campaigns: { idField: "campaignId", data: mktgCampaigns },
    email_sends: { idField: "sendId", data: mktgEmailSends },
    content_assets: { idField: "assetId", data: mktgContentAssets },
    forms: { idField: "formId", data: mktgForms },
    social_posts: { idField: "postId", data: mktgSocialPosts },
    attribution: { idField: "attributionId", data: mktgAttribution },
  },

  // Website
  website: {
    pages: { idField: "pageId", data: webPages },
    seo_audit: { idField: "auditId", data: webSeoAudit },
    web_analytics: { idField: "analyticsId", data: webAnalytics },
    media_library: { idField: "mediaId", data: webMediaLibrary },
  },

  // Personal
  personal: {
    tasks: { idField: "taskId", data: personalTasks },
    schedule: { idField: "eventId", data: personalSchedule },
    goals: { idField: "goalId", data: personalGoals },
    bookmarks: { idField: "bookmarkId", data: personalBookmarks },
    notes: { idField: "noteId", data: personalNotes },
    focus_sessions: { idField: "sessionId", data: personalFocusSessions },
  },

  // Admin
  admin: {
    tenants: { idField: "id", data: tenants },
    users: { idField: "id", data: users },
    roles: { idField: "id", data: roles },
    audit_log: { idField: "id", data: auditEntries },
    invites: { idField: "id", data: pendingInvites },
    approval_workflows: { idField: "id", data: approvalWorkflows },
    notifications: { idField: "id", data: notifications },
  },

  // MCP (Connector Plane)
  mcp: {
    connector_registry: { idField: "connectorId", data: mcpConnectorRegistry },
    request_log: { idField: "requestId", data: mcpRequestLog },
    connector_policies: { idField: "policyId", data: mcpConnectorPolicies },
  },

  // Context Plane
  context: {
    work_sessions: { idField: "sessionId", data: contextWorkSessions },
    context_objects: { idField: "contextId", data: contextObjects },
    context_index: { idField: "indexId", data: contextIndex },
  },

  // AI Chats Plane
  chats: {
    chat_ledger: { idField: "chatId", data: chatLedger },
    chat_sessions: { idField: "sessionId", data: chatSessions },
  },

  // Memory Plane
  memory: {
    memory_store: { idField: "memoryId", data: memoryStore },
    memory_candidates: { idField: "candidateId", data: memoryCandidates },
    memory_versions: { idField: "versionId", data: memoryVersions },
  },

  // Schema & Provenance
  schema: {
    schema_registry: { idField: "fieldId", data: schemaRegistry },
    ssot_completeness: { idField: "completenessId", data: ssotCompleteness },
    provenance_log: { idField: "provenanceId", data: provenanceLog },
  },
};

/**
 * Get summary stats for all domains.
 */
export function getDomainSeedSummary(): Record<string, { tables: number; totalRecords: number }> {
  const result: Record<string, { tables: number; totalRecords: number }> = {};
  for (const [domain, tables] of Object.entries(FULL_DOMAIN_SEED_REGISTRY)) {
    const tableEntries = Object.values(tables);
    result[domain] = {
      tables: tableEntries.length,
      totalRecords: tableEntries.reduce((sum, t) => sum + t.data.length, 0),
    };
  }
  return result;
}
