/**
 * Governance Workbench — L7
 *
 * The HARD GATE. No action executes without passing through here.
 *
 * Tabs: Approvals · Escalations · Policies · Audit · Handoffs
 *
 * Doctrine: Truth you own. AI you rent. Approval in between.
 */

import { useState } from "react";
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Search, FileText, Activity, PackageCheck,
  Zap, Bot, ArrowRight, Eye, Shield, User, Check, X,
  ScrollText, BarChart3
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GovTab = "Approvals" | "Escalations" | "Policies" | "Audit" | "Handoffs";

interface Proposal {
  id: string;
  action: string;
  reasoning: string;
  source: string;
  confidence: number;
  goalImpact: number;
  goal: string;
  risk: "low" | "medium" | "high";
  status: "pending" | "approved" | "denied";
  createdAt: string;
  entity?: string;
  targetSystem?: string;
}

interface Policy {
  id: string;
  name: string;
  rule: string;
  scope: string;
  level: "block" | "require_approval" | "auto_approve" | "notify";
  active: boolean;
  triggeredCount: number;
  lastTriggered?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  result: "approved" | "denied" | "executed" | "failed";
  timestamp: string;
  entity?: string;
  proposalId?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PROPOSALS: Proposal[] = [
  {
    id: "APR-2043",
    action: "Create Jira task — resolve P1 #4821 bulk export timeout, assign to engineering-lead",
    reasoning: "P1 ticket unresolved 72h. FinanceFlow is a renewal customer with $84K ARR at stake. Engineering confirmed root cause — fix is ready.",
    source: "Renewal Watchdog Agent",
    confidence: 96,
    goalImpact: 0.91,
    goal: "DG_CS_003",
    risk: "low",
    status: "pending",
    createdAt: "2 min ago",
    entity: "FinanceFlow Solutions",
    targetSystem: "Jira",
  },
  {
    id: "APR-2042",
    action: "Send Slack message to @alex — FinanceFlow champion silent, recommend direct outreach",
    reasoning: "Champion silence exceeds 10-day threshold per renewal playbook v3. Renewal Watchdog triggered notification.",
    source: "Renewal Watchdog Agent",
    confidence: 96,
    goalImpact: 0.91,
    goal: "DG_CS_003",
    risk: "low",
    status: "approved",
    createdAt: "10 min ago",
    entity: "David Park",
    targetSystem: "Slack",
  },
  {
    id: "APR-2041",
    action: "Update HubSpot lifecycle stage → Customer for FinanceFlow Solutions",
    reasoning: "Opportunity closed-won in Salesforce 14 days ago. HubSpot still shows Opportunity. CRM Reconciler flagged for correction.",
    source: "CRM Reconciler Agent",
    confidence: 94,
    goalImpact: 0.82,
    goal: "DG_SALES_001",
    risk: "low",
    status: "approved",
    createdAt: "45 min ago",
    entity: "FinanceFlow Solutions",
    targetSystem: "HubSpot",
  },
  {
    id: "APR-2040",
    action: "Auto-merge 4 duplicate contact records for 'David Park' across Salesforce and HubSpot",
    reasoning: "Entity resolution detected 4 records with >95% name + email match. Merging would deduplicate and strengthen Entity360.",
    source: "Schema AI",
    confidence: 89,
    goalImpact: 0.64,
    goal: "DG_DATA_001",
    risk: "medium",
    status: "denied",
    createdAt: "2h ago",
    entity: "David Park",
    targetSystem: "Salesforce + HubSpot",
  },
];

const POLICIES: Policy[] = [
  { id: "pol-001", name: "High-value write gate", rule: "Any write to CRM for accounts with ARR > $50K requires manual approval", scope: "CRM · All connectors", level: "require_approval", active: true, triggeredCount: 12, lastTriggered: "Today" },
  { id: "pol-002", name: "Champion outreach approval", rule: "Slack/email to executive contacts requires approval before send", scope: "Slack · Gmail", level: "require_approval", active: true, triggeredCount: 8, lastTriggered: "Today" },
  { id: "pol-003", name: "Schema auto-approve threshold", rule: "Schema AI drafts with confidence > 0.90 and no PII fields auto-advance to reviewed", scope: "Schema Pool", level: "auto_approve", active: true, triggeredCount: 34, lastTriggered: "2 days ago" },
  { id: "pol-004", name: "Low-risk CRM correction", rule: "Lifecycle stage corrections for closed-won deals auto-approved if ARR < $10K", scope: "HubSpot · Salesforce", level: "auto_approve", active: true, triggeredCount: 67, lastTriggered: "1h ago" },
  { id: "pol-005", name: "PII field block", rule: "No PII field (email, phone, name) may be written to external system without explicit governance stamp", scope: "All connectors", level: "block", active: true, triggeredCount: 3, lastTriggered: "3 days ago" },
  { id: "pol-006", name: "Billing action notify", rule: "Any action touching Stripe charges or invoices sends notification to Finance before execution", scope: "Stripe", level: "notify", active: true, triggeredCount: 5, lastTriggered: "Yesterday" },
];

const AUDIT: AuditEntry[] = [
  { id: "AUD-0891", action: "Approved APR-2042 — Slack alert for FinanceFlow champion", actor: "Alex Rivera", result: "approved", timestamp: "10:44 AM", entity: "David Park", proposalId: "APR-2042" },
  { id: "AUD-0890", action: "Approved APR-2041 — HubSpot lifecycle correction", actor: "Alex Rivera", result: "approved", timestamp: "10:00 AM", entity: "FinanceFlow Solutions", proposalId: "APR-2041" },
  { id: "AUD-0889", action: "Executed handoff to HubSpot via CRM Writeback skill", actor: "System", result: "executed", timestamp: "10:00 AM", entity: "FinanceFlow Solutions" },
  { id: "AUD-0888", action: "Denied APR-2040 — duplicate merge risk too high", actor: "Alex Rivera", result: "denied", timestamp: "9:15 AM", entity: "David Park", proposalId: "APR-2040" },
  { id: "AUD-0887", action: "Policy POL-005 blocked PII write attempt — email field exposure", actor: "System", result: "failed", timestamp: "8:42 AM" },
  { id: "AUD-0886", action: "Approved schema proposal SP-009 — GitHub pull_request entity", actor: "Alex Rivera", result: "approved", timestamp: "Yesterday 4:30 PM" },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const POLICY_LEVEL_CONFIG = {
  block:            { color: "var(--iw-danger)",  label: "Block",          bg: "rgba(220,74,74,0.1)" },
  require_approval: { color: "var(--iw-warning)", label: "Require HITL",   bg: "rgba(212,136,62,0.1)" },
  auto_approve:     { color: "var(--iw-success)", label: "Auto-approve",   bg: "rgba(61,139,110,0.1)" },
  notify:           { color: "var(--iw-blue)",    label: "Notify",         bg: "rgba(66,86,171,0.1)" },
};

const RISK_CONFIG = {
  low:    { color: "var(--iw-success)", label: "Low risk" },
  medium: { color: "var(--iw-warning)", label: "Medium risk" },
  high:   { color: "var(--iw-danger)",  label: "High risk" },
};

const AUDIT_RESULT_CONFIG = {
  approved: { icon: CheckCircle2, color: "var(--iw-success)" },
  denied:   { icon: XCircle,      color: "var(--iw-danger)" },
  executed: { icon: Zap,          color: "var(--iw-blue)" },
  failed:   { icon: AlertTriangle,color: "var(--iw-warning)" },
};

// ─── Tab views ────────────────────────────────────────────────────────────────

function ApprovalsQueue() {
  const [proposals, setProposals] = useState(PROPOSALS);
  const [selected, setSelected] = useState<Proposal | null>(null);

  const act = (id: string, status: "approved" | "denied") => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    setSelected(null);
  };

  const pending = proposals.filter(p => p.status === "pending");
  const resolved = proposals.filter(p => p.status !== "pending");

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
            Pending · {pending.length} awaiting your decision
          </p>
          <div className="space-y-2">
            {pending.map(p => (
              <div key={p.id} className="rounded-xl border overflow-hidden"
                style={{ borderColor: "rgba(212,136,62,0.3)", background: "rgba(212,136,62,0.03)" }}>
                <div className="px-4 py-3">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(212,103,128,0.12)" }}>
                      <Zap className="w-3.5 h-3.5" style={{ color: "var(--iw-pink)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{p.action}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{p.source} · {p.createdAt}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-bold"
                      style={{ background: `${RISK_CONFIG[p.risk].color}15`, color: RISK_CONFIG[p.risk].color }}>
                      {RISK_CONFIG[p.risk].label}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>{p.reasoning}</p>
                  <div className="flex items-center gap-3 text-[10px] mb-3" style={{ color: "var(--muted-foreground)" }}>
                    <span>Conf: <strong style={{ color: "var(--iw-success)" }}>{p.confidence}%</strong></span>
                    <span>·</span>
                    <span>Impact: <strong style={{ color: "var(--iw-pink)" }}>{(p.goalImpact * 100).toFixed(0)}%</strong></span>
                    <span>·</span>
                    <span className="font-mono" style={{ color: "var(--iw-blue)" }}>{p.goal}</span>
                    {p.targetSystem && <><span>·</span><span>→ {p.targetSystem}</span></>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => act(p.id, "denied")}
                      className="flex-1 py-1.5 rounded-xl text-xs transition-all"
                      style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--card)", fontWeight: 600 }}>
                      Deny
                    </button>
                    <button onClick={() => act(p.id, "approved")}
                      className="flex-1 py-1.5 rounded-xl text-xs transition-all"
                      style={{ background: "var(--iw-blue)", color: "white", fontWeight: 700 }}>
                      Approve & Execute
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>
            Resolved
          </p>
          <div className="space-y-1.5">
            {resolved.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", opacity: 0.75 }}>
                {p.status === "approved"
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--iw-success)" }} />
                  : <XCircle className="w-4 h-4 shrink-0" style={{ color: "var(--iw-danger)" }} />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "var(--foreground)", fontWeight: 500 }}>{p.action}</p>
                  <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{p.id} · {p.createdAt}</p>
                </div>
                <span className="text-[9px] shrink-0 font-bold capitalize"
                  style={{ color: p.status === "approved" ? "var(--iw-success)" : "var(--iw-danger)" }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PoliciesView() {
  return (
    <div className="space-y-2">
      <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
        Active governance rules. These determine what Twin can propose, auto-approve, or block entirely.
      </p>
      {POLICIES.map(pol => {
        const lc = POLICY_LEVEL_CONFIG[pol.level];
        return (
          <div key={pol.id} className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: lc.bg }}>
                  <Shield className="w-3.5 h-3.5" style={{ color: lc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{pol.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: lc.bg, color: lc.color }}>{lc.label}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{pol.rule}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                    <span className="font-mono">{pol.id}</span>
                    <span>·</span>
                    <span>{pol.scope}</span>
                    <span>·</span>
                    <span>Triggered {pol.triggeredCount}×</span>
                    {pol.lastTriggered && <><span>·</span><span>Last: {pol.lastTriggered}</span></>}
                  </div>
                </div>
                <div className="w-8 h-4 rounded-full shrink-0 cursor-pointer transition-all flex items-center px-0.5"
                  style={{ background: pol.active ? "var(--iw-success)" : "var(--muted)" }}>
                  <div className="w-3 h-3 rounded-full bg-white transition-all"
                    style={{ transform: pol.active ? "translateX(16px)" : "translateX(0)" }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AuditView() {
  return (
    <div className="space-y-2">
      <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
        Every governance decision, execution, and policy trigger. Immutable audit trail.
      </p>
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {AUDIT.map(entry => {
          const rc = AUDIT_RESULT_CONFIG[entry.result];
          const RIcon = rc.icon;
          return (
            <div key={entry.id} className="flex items-start gap-3 py-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${rc.color}15` }}>
                <RIcon className="w-3.5 h-3.5" style={{ color: rc.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "var(--foreground)", fontWeight: 500 }}>{entry.action}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                  <span>{entry.actor}</span>
                  <span>·</span>
                  <span>{entry.timestamp}</span>
                  {entry.entity && <><span>·</span><span>{entry.entity}</span></>}
                  {entry.proposalId && <><span>·</span><span className="font-mono">{entry.proposalId}</span></>}
                </div>
              </div>
              <span className="text-[9px] font-bold capitalize shrink-0" style={{ color: rc.color }}>{entry.result}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TAB_CONFIG: { id: GovTab; label: string; icon: any; badge?: number }[] = [
  { id: "Approvals",   label: "Approvals",   icon: ShieldCheck,  badge: 1 },
  { id: "Policies",    label: "Policies",    icon: Shield },
  { id: "Audit",       label: "Audit",       icon: ScrollText },
  { id: "Escalations", label: "Escalations", icon: AlertTriangle },
  { id: "Handoffs",    label: "Handoffs",    icon: PackageCheck },
];

export function GovernanceWorkbench() {
  const [tab, setTab] = useState<GovTab>("Approvals");

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div className="px-6 pt-5 pb-0 shrink-0" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(66,86,171,0.12)", border: "1px solid rgba(66,86,171,0.2)" }}>
            <ShieldCheck className="w-4.5 h-4.5" style={{ color: "var(--iw-blue)" }} />
          </div>
          <div>
            <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Governance</h1>
            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              Truth you own. AI you rent. Approval in between. · L7 HARD GATE
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--iw-success)" }} />
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>Gate active</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {TAB_CONFIG.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs border-b-2 transition-all relative"
              style={{
                fontWeight: tab === t.id ? 700 : 500,
                borderColor: tab === t.id ? "var(--iw-blue)" : "transparent",
                color: tab === t.id ? "var(--iw-blue)" : "var(--muted-foreground)",
              }}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.badge !== undefined && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: tab === t.id ? "var(--iw-blue)" : "var(--secondary)", color: tab === t.id ? "white" : "var(--muted-foreground)" }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === "Approvals"   && <ApprovalsQueue />}
        {tab === "Policies"    && <PoliciesView />}
        {tab === "Audit"       && <AuditView />}
        {tab === "Escalations" && (
          <div className="flex flex-col items-center py-12 text-center">
            <AlertTriangle className="w-8 h-8 mb-3" style={{ color: "var(--iw-warning)", opacity: 0.4 }} />
            <p className="text-sm" style={{ fontWeight: 600, color: "var(--foreground)" }}>No active escalations</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Escalations appear when proposals exceed policy thresholds or time limits</p>
          </div>
        )}
        {tab === "Handoffs" && (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Approved actions handed off to external systems with canonical packages.
            </p>
            {PROPOSALS.filter(p => p.status === "approved").map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--iw-success)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ fontWeight: 600, color: "var(--foreground)" }}>{p.action}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    {p.id} → {p.targetSystem} · {p.createdAt}
                  </p>
                </div>
                <span className="text-[9px] font-bold" style={{ color: "var(--iw-success)" }}>Delivered</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
