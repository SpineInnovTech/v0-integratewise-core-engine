import {
  Users,
  Briefcase,
  Megaphone,
  BarChart3,
  Headphones,
  Code2,
  Layers,
  Wallet,
  ScrollText,
  UserCog,
  Truck,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DeptCode, HealthLevel, Signal } from "./entities";
import {
  accounts,
  deals,
  campaigns,
  pipelineSlices,
  tickets,
  incidents,
  features,
  invoices,
  contracts,
  employees,
  shipments,
  engagements,
} from "./mockData";

export interface Kpi {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
}

export interface Column {
  key: string;
  label: string;
  align?: "left" | "right";
  render?: (row: Record<string, unknown>) => string;
}

export interface DeptConfig {
  code: DeptCode;
  name: string;
  tagline: string;
  icon: LucideIcon;
  primaryEntity: string;
  kpis: Kpi[];
  columns: Column[];
  rows: Record<string, unknown>[];
  signals: Signal[];
  upcoming: { label: string; when: string; meta?: string }[];
  /** Health summary the BI layer aggregates. */
  health: { score: number; level: HealthLevel; headline: string };
  /** Parent BI surface — v2.0 doctrine: departments live INSIDE surfaces. */
  surface: "grow" | "build" | "run" | "decide";
  /** URL slug under the parent surface, e.g. /grow/accounts (cs → accounts). */
  urlSlug: string;
}

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;

const acctHealthAvg = Math.round(accounts.reduce((s, a) => s + a.health, 0) / accounts.length);
const atRiskArr = accounts.filter((a) => a.health < 70).reduce((s, a) => s + a.arr, 0);

export const DEPARTMENTS: Record<DeptCode, DeptConfig> = {
  cs: {
    code: "cs",
    surface: "grow",
    urlSlug: "accounts",
    name: "Account Success",
    tagline: "Retention, expansion and renewal posture",
    icon: Users,
    primaryEntity: "Accounts",
    kpis: [
      {
        label: "Portfolio ARR",
        value: fmt$(accounts.reduce((s, a) => s + a.arr, 0)),
        delta: "+4.2%",
        trend: "up",
      },
      { label: "At-risk ARR", value: fmt$(atRiskArr), delta: "-1.8%", trend: "down" },
      { label: "Avg health", value: String(acctHealthAvg), delta: "+3", trend: "up" },
      {
        label: "Renewals 90d",
        value: fmt$(accounts.filter((a) => a.renewalDays <= 90).reduce((s, a) => s + a.arr, 0)),
        delta: `${accounts.filter((a) => a.renewalDays <= 90).length} accts`,
        trend: "flat",
      },
    ],
    columns: [
      { key: "name", label: "Account" },
      { key: "segment", label: "Segment" },
      { key: "arr", label: "ARR", align: "right", render: (r) => fmt$(r.arr as number) },
      { key: "health", label: "Health", align: "right" },
      { key: "renewalDays", label: "Renewal", align: "right", render: (r) => `${r.renewalDays}d` },
      { key: "owner", label: "Owner" },
    ],
    rows: accounts as unknown as Record<string, unknown>[],
    signals: accounts
      .filter((a) => a.health < 70)
      .map((a) => ({
        id: `cs-${a.id}`,
        dept: "cs",
        entity: a.name,
        message:
          a.health < 50 ? `Health ${a.health} — escalate` : `Health ${a.health} — engage champion`,
        level: a.health < 50 ? "critical" : "warn",
        impact: a.arr,
      })),
    upcoming: [
      { label: "Orion QBR", when: "in 4d", meta: "$1.6M ARR" },
      { label: "Brightwave renewal", when: "in 22d", meta: "$310K" },
      { label: "Northwind exec sync", when: "in 6d" },
    ],
    health: {
      score: acctHealthAvg,
      level: acctHealthAvg < 60 ? "critical" : acctHealthAvg < 75 ? "warn" : "ok",
      headline: `${fmt$(atRiskArr)} at risk`,
    },
  },

  sales: {
    code: "sales",
    surface: "grow",
    urlSlug: "sales",
    name: "Sales",
    tagline: "Pipeline, deals and forecast",
    icon: Briefcase,
    primaryEntity: "Deals",
    kpis: [
      {
        label: "Pipeline",
        value: fmt$(deals.reduce((s, d) => s + d.amount, 0)),
        delta: "+12%",
        trend: "up",
      },
      {
        label: "Avg deal size",
        value: fmt$(deals.reduce((s, d) => s + d.amount, 0) / deals.length),
        delta: "+8%",
        trend: "up",
      },
      {
        label: "Stalled deals",
        value: String(deals.filter((d) => d.daysInStage > 14).length),
        delta: "+1",
        trend: "down",
      },
      { label: "Win rate", value: "31%", delta: "+2pp", trend: "up" },
    ],
    columns: [
      { key: "name", label: "Deal" },
      { key: "stage", label: "Stage" },
      { key: "amount", label: "Amount", align: "right", render: (r) => fmt$(r.amount as number) },
      { key: "daysInStage", label: "Days in stage", align: "right" },
      { key: "champion", label: "Champion" },
      { key: "owner", label: "Owner" },
    ],
    rows: deals as unknown as Record<string, unknown>[],
    signals: deals
      .filter((d) => d.daysInStage > 14)
      .map((d) => ({
        id: `sl-${d.id}`,
        dept: "sales",
        entity: d.name,
        message: `${d.daysInStage}d in ${d.stage} — propose next step`,
        level: d.daysInStage > 20 ? "critical" : "warn",
        impact: d.amount,
      })),
    upcoming: [
      { label: "Boreal Energy close target", when: "in 7d", meta: "$950K" },
      { label: "Vertex Mfg negotiation", when: "in 14d", meta: "$380K" },
      { label: "Weekly forecast call", when: "Mon 9am" },
    ],
    health: { score: 78, level: "ok", headline: "Coverage 3.2× plan" },
  },

  marketing: {
    code: "marketing",
    surface: "grow",
    urlSlug: "marketing",
    name: "Marketing",
    tagline: "Demand, content and pipeline contribution",
    icon: Megaphone,
    primaryEntity: "Campaigns",
    kpis: [
      {
        label: "MQLs (30d)",
        value: String(campaigns.reduce((s, c) => s + c.mqls, 0)),
        delta: "+18%",
        trend: "up",
      },
      {
        label: "Avg CPL",
        value: `$${Math.round(campaigns.reduce((s, c) => s + c.cpl, 0) / campaigns.length)}`,
        delta: "-6%",
        trend: "up",
      },
      {
        label: "Live campaigns",
        value: String(campaigns.filter((c) => c.status === "Live").length),
        delta: "+1",
        trend: "flat",
      },
      { label: "Pipeline sourced", value: "$4.8M", delta: "+22%", trend: "up" },
    ],
    columns: [
      { key: "name", label: "Campaign" },
      { key: "channel", label: "Channel" },
      { key: "mqls", label: "MQLs", align: "right" },
      { key: "cpl", label: "CPL", align: "right", render: (r) => `$${r.cpl}` },
      { key: "status", label: "Status" },
      { key: "owner", label: "Owner" },
    ],
    rows: campaigns as unknown as Record<string, unknown>[],
    signals: campaigns
      .filter((c) => c.cpl > 60 && c.status === "Live")
      .map((c) => ({
        id: `mk-${c.id}`,
        dept: "marketing",
        entity: c.name,
        message: `CPL $${c.cpl} above target — rebalance spend`,
        level: "warn",
        impact: c.mqls,
      })),
    upcoming: [
      { label: "Spine launch webinar", when: "in 3d", meta: "318 registered" },
      { label: "Q1 content calendar review", when: "in 5d" },
    ],
    health: { score: 84, level: "ok", headline: "Pipeline +22% MoM" },
  },

  revops: {
    code: "revops",
    surface: "run",
    urlSlug: "revenue-ops",
    name: "Revenue Operations",
    tagline: "ARR, NRR/GRR and forecast hygiene",
    icon: BarChart3,
    primaryEntity: "Pipeline slices",
    kpis: [
      { label: "ARR", value: fmt$(pipelineSlices[0].arr), delta: "+4.2%", trend: "up" },
      { label: "NRR", value: `${pipelineSlices[0].nrr}%`, delta: "+3pp", trend: "up" },
      { label: "GRR", value: `${pipelineSlices[0].grr}%`, delta: "-1pp", trend: "down" },
      { label: "Coverage", value: `${pipelineSlices[0].coverage}×`, delta: "+0.4", trend: "up" },
    ],
    columns: [
      { key: "name", label: "Slice" },
      { key: "arr", label: "ARR", align: "right", render: (r) => fmt$(r.arr as number) },
      { key: "mrr", label: "MRR", align: "right", render: (r) => fmt$(r.mrr as number) },
      { key: "nrr", label: "NRR", align: "right", render: (r) => `${r.nrr}%` },
      { key: "grr", label: "GRR", align: "right", render: (r) => `${r.grr}%` },
      { key: "coverage", label: "Coverage", align: "right", render: (r) => `${r.coverage}×` },
    ],
    rows: pipelineSlices as unknown as Record<string, unknown>[],
    signals: pipelineSlices
      .filter((p) => p.grr < 90)
      .map((p) => ({
        id: `ro-${p.id}`,
        dept: "revops",
        entity: p.name,
        message: `GRR ${p.grr}% below 90% target`,
        level: p.grr < 85 ? "critical" : "warn",
        impact: p.arr,
      })),
    upcoming: [
      { label: "Board forecast lock", when: "in 9d" },
      { label: "Comp plan review", when: "in 18d" },
    ],
    health: { score: 86, level: "ok", headline: "NRR 114%" },
  },

  support: {
    code: "support",
    surface: "grow",
    urlSlug: "support",
    name: "Support",
    tagline: "Tickets, SLA and CSAT",
    icon: Headphones,
    primaryEntity: "Tickets",
    kpis: [
      {
        label: "Open tickets",
        value: String(tickets.filter((t) => t.status !== "Resolved").length),
        delta: "+2",
        trend: "down",
      },
      {
        label: "P1 open",
        value: String(tickets.filter((t) => t.priority === "P1" && t.status !== "Resolved").length),
        delta: "0",
        trend: "flat",
      },
      {
        label: "SLA breaches",
        value: String(tickets.filter((t) => t.slaBreach).length),
        delta: "+1",
        trend: "down",
      },
      { label: "CSAT (30d)", value: "4.4", delta: "-0.1", trend: "down" },
    ],
    columns: [
      { key: "name", label: "Ticket" },
      { key: "account", label: "Account" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "slaBreach", label: "SLA", render: (r) => (r.slaBreach ? "Breach" : "OK") },
    ],
    rows: tickets as unknown as Record<string, unknown>[],
    signals: tickets
      .filter((t) => t.slaBreach)
      .map((t) => ({
        id: `sp-${t.id}`,
        dept: "support",
        entity: t.name,
        message: `SLA breach on ${t.account}`,
        level: "critical",
        impact: 1,
      })),
    upcoming: [
      { label: "Brightwave P1 standup", when: "in 2h" },
      { label: "Quarterly CSAT review", when: "in 11d" },
    ],
    health: { score: 68, level: "warn", headline: "2 SLA breaches" },
  },

  eng: {
    code: "eng",
    surface: "build",
    urlSlug: "engineering",
    name: "Engineering",
    tagline: "Incidents, deploys and reliability",
    icon: Code2,
    primaryEntity: "Incidents",
    kpis: [
      {
        label: "Open incidents",
        value: String(incidents.filter((i) => i.status !== "Resolved").length),
        delta: "+1",
        trend: "down",
      },
      { label: "Deploys (7d)", value: "42", delta: "+9", trend: "up" },
      { label: "MTTR", value: "31m", delta: "-8m", trend: "up" },
      { label: "Change fail rate", value: "4.1%", delta: "-0.6pp", trend: "up" },
    ],
    columns: [
      { key: "name", label: "Incident" },
      { key: "service", label: "Service" },
      { key: "severity", label: "Severity" },
      { key: "status", label: "Status" },
      { key: "mttrMin", label: "MTTR", align: "right", render: (r) => `${r.mttrMin}m` },
    ],
    rows: incidents as unknown as Record<string, unknown>[],
    signals: incidents
      .filter((i) => i.status !== "Resolved")
      .map((i) => ({
        id: `en-${i.id}`,
        dept: "eng",
        entity: i.name,
        message: `${i.severity} on ${i.service}`,
        level: i.severity === "SEV1" ? "critical" : "warn",
        impact: 1,
      })),
    upcoming: [
      { label: "Release v2.42", when: "in 4d" },
      { label: "Postmortem: auth 5xx", when: "in 2d" },
    ],
    health: { score: 82, level: "ok", headline: "MTTR trending down" },
  },

  product: {
    code: "product",
    surface: "build",
    urlSlug: "product",
    name: "Product",
    tagline: "Roadmap, adoption and feedback",
    icon: Layers,
    primaryEntity: "Features",
    kpis: [
      {
        label: "In flight",
        value: String(features.filter((f) => f.state === "In progress").length),
        delta: "0",
        trend: "flat",
      },
      {
        label: "Beta features",
        value: String(features.filter((f) => f.state === "Beta").length),
        delta: "+1",
        trend: "up",
      },
      {
        label: "Backlog votes",
        value: String(features.reduce((s, f) => s + f.votes, 0)),
        delta: "+18",
        trend: "up",
      },
      { label: "Adoption (NPS)", value: "47", delta: "+4", trend: "up" },
    ],
    columns: [
      { key: "name", label: "Feature" },
      { key: "squad", label: "Squad" },
      { key: "state", label: "State" },
      { key: "votes", label: "Votes", align: "right" },
      { key: "owner", label: "Owner" },
    ],
    rows: features as unknown as Record<string, unknown>[],
    signals: features
      .filter((f) => f.state === "Backlog" && f.votes > 30)
      .map((f) => ({
        id: `pr-${f.id}`,
        dept: "product",
        entity: f.name,
        message: `${f.votes} votes in backlog — prioritize?`,
        level: "warn",
        impact: f.votes,
      })),
    upcoming: [
      { label: "Discovery: Memory replay", when: "in 5d" },
      { label: "Roadmap review", when: "Fri" },
    ],
    health: { score: 80, level: "ok", headline: "NPS 47, +4 QoQ" },
  },

  finance: {
    code: "finance",
    surface: "run",
    urlSlug: "finance",
    name: "Finance",
    tagline: "AR, cash and invoice aging",
    icon: Wallet,
    primaryEntity: "Invoices",
    kpis: [
      {
        label: "AR outstanding",
        value: fmt$(invoices.filter((v) => v.status !== "Paid").reduce((s, v) => s + v.amount, 0)),
        delta: "+$22K",
        trend: "down",
      },
      {
        label: "Overdue",
        value: String(invoices.filter((v) => v.status === "Overdue").length),
        delta: "+1",
        trend: "down",
      },
      { label: "Avg DSO", value: "38d", delta: "+3d", trend: "down" },
      { label: "Cash runway", value: "21mo", delta: "+1mo", trend: "up" },
    ],
    columns: [
      { key: "name", label: "Invoice" },
      { key: "account", label: "Account" },
      { key: "amount", label: "Amount", align: "right", render: (r) => fmt$(r.amount as number) },
      { key: "ageDays", label: "Age", align: "right", render: (r) => `${r.ageDays}d` },
      { key: "status", label: "Status" },
    ],
    rows: invoices as unknown as Record<string, unknown>[],
    signals: invoices
      .filter((v) => v.status === "Overdue")
      .map((v) => ({
        id: `fn-${v.id}`,
        dept: "finance",
        entity: v.name,
        message: `${v.account} overdue ${v.ageDays}d — dunning`,
        level: v.ageDays > 60 ? "critical" : "warn",
        impact: v.amount,
      })),
    upcoming: [
      { label: "Month-end close", when: "in 8d" },
      { label: "Board pack draft", when: "in 12d" },
    ],
    health: { score: 72, level: "warn", headline: "2 invoices overdue 45d+" },
  },

  legal: {
    code: "legal",
    surface: "run",
    urlSlug: "legal",
    name: "Legal",
    tagline: "Contracts, DPAs and compliance",
    icon: ScrollText,
    primaryEntity: "Contracts",
    kpis: [
      {
        label: "Active contracts",
        value: String(
          contracts.filter((c) => c.status === "Active").length +
            contracts.filter((c) => c.status === "Expiring").length
        ),
        delta: "+1",
        trend: "up",
      },
      {
        label: "Expiring 30d",
        value: String(contracts.filter((c) => c.expiresDays <= 30).length),
        delta: "+1",
        trend: "down",
      },
      {
        label: "In review",
        value: String(contracts.filter((c) => c.status === "In review").length),
        delta: "0",
        trend: "flat",
      },
      { label: "Compliance score", value: "94%", delta: "+1pp", trend: "up" },
    ],
    columns: [
      { key: "name", label: "Contract" },
      { key: "account", label: "Account" },
      { key: "type", label: "Type" },
      { key: "expiresDays", label: "Expires", align: "right", render: (r) => `${r.expiresDays}d` },
      { key: "status", label: "Status" },
    ],
    rows: contracts as unknown as Record<string, unknown>[],
    signals: contracts
      .filter((c) => c.expiresDays <= 30)
      .map((c) => ({
        id: `lg-${c.id}`,
        dept: "legal",
        entity: c.name,
        message: `Expires in ${c.expiresDays}d — initiate renewal`,
        level: c.expiresDays <= 14 ? "critical" : "warn",
        impact: 1,
      })),
    upcoming: [
      { label: "Aperture NDA renewal", when: "in 7d" },
      { label: "SOC2 audit window", when: "in 28d" },
    ],
    health: { score: 90, level: "ok", headline: "94% compliance score" },
  },

  hr: {
    code: "hr",
    surface: "run",
    urlSlug: "people",
    name: "People",
    tagline: "Headcount, load and onboarding",
    icon: UserCog,
    primaryEntity: "Employees",
    kpis: [
      { label: "Headcount", value: String(employees.length + 24), delta: "+3", trend: "up" },
      { label: "Open roles", value: "6", delta: "+1", trend: "flat" },
      {
        label: "Overloaded (>85)",
        value: String(employees.filter((e) => e.load > 85).length),
        delta: "+1",
        trend: "down",
      },
      { label: "eNPS", value: "38", delta: "+5", trend: "up" },
    ],
    columns: [
      { key: "name", label: "Person" },
      { key: "role", label: "Role" },
      { key: "load", label: "Load", align: "right" },
      { key: "status", label: "Status" },
    ],
    rows: employees as unknown as Record<string, unknown>[],
    signals: employees
      .filter((e) => e.load > 85)
      .map((e) => ({
        id: `hr-${e.id}`,
        dept: "hr",
        entity: e.name,
        message: `Load ${e.load} — rebalance workload`,
        level: "warn",
        impact: e.load,
      })),
    upcoming: [
      { label: "Nia O. onboarding day 30", when: "in 14d" },
      { label: "Quarterly comp review", when: "in 21d" },
    ],
    health: { score: 76, level: "warn", headline: "1 IC overloaded" },
  },

  sc: {
    code: "sc",
    surface: "run",
    urlSlug: "operations",
    name: "Operations",
    tagline: "Shipments, inventory and lead time",
    icon: Truck,
    primaryEntity: "Shipments",
    kpis: [
      { label: "Open shipments", value: String(shipments.length), delta: "0", trend: "flat" },
      {
        label: "At risk",
        value: String(shipments.filter((s) => s.status === "At risk").length),
        delta: "+1",
        trend: "down",
      },
      { label: "On-time %", value: "82%", delta: "-3pp", trend: "down" },
      { label: "Inventory cover", value: "47d", delta: "-2d", trend: "flat" },
    ],
    columns: [
      { key: "name", label: "PO" },
      { key: "sku", label: "SKU" },
      { key: "qty", label: "Qty", align: "right" },
      { key: "status", label: "Status" },
    ],
    rows: shipments as unknown as Record<string, unknown>[],
    signals: shipments
      .filter((s) => s.status !== "On time")
      .map((s) => ({
        id: `sc-${s.id}`,
        dept: "sc",
        entity: s.name,
        message: `${s.sku} ${s.status.toLowerCase()}`,
        level: s.status === "Delayed" ? "critical" : "warn",
        impact: s.qty,
      })),
    upcoming: [
      { label: "Q1 capacity review", when: "in 9d" },
      { label: "Vendor QBR — Anker", when: "in 16d" },
    ],
    health: { score: 70, level: "warn", headline: "On-time slipping" },
  },

  svc: {
    code: "svc",
    surface: "build",
    urlSlug: "services",
    name: "Services",
    tagline: "Onboarding and implementations",
    icon: Wrench,
    primaryEntity: "Engagements",
    kpis: [
      { label: "Active engagements", value: String(engagements.length), delta: "+1", trend: "up" },
      {
        label: "Red status",
        value: String(engagements.filter((e) => e.status === "Red").length),
        delta: "+1",
        trend: "down",
      },
      { label: "Avg time to value", value: "42d", delta: "-4d", trend: "up" },
      { label: "Utilization", value: "76%", delta: "+2pp", trend: "up" },
    ],
    columns: [
      { key: "name", label: "Engagement" },
      { key: "account", label: "Account" },
      { key: "type", label: "Type" },
      { key: "progress", label: "Progress", align: "right", render: (r) => `${r.progress}%` },
      { key: "status", label: "Status" },
    ],
    rows: engagements as unknown as Record<string, unknown>[],
    signals: engagements
      .filter((e) => e.status === "Red")
      .map((e) => ({
        id: `sv-${e.id}`,
        dept: "svc",
        entity: e.name,
        message: `${e.account} in Red — exec sponsor needed`,
        level: "critical",
        impact: e.progress,
      })),
    upcoming: [
      { label: "Helix go-live target", when: "in 21d" },
      { label: "Northwind milestone review", when: "in 6d" },
    ],
    health: { score: 65, level: "warn", headline: "Helix implementation Red" },
  },
};

export const DEPT_ORDER: DeptCode[] = [
  "cs",
  "sales",
  "marketing",
  "revops",
  "support",
  "eng",
  "product",
  "finance",
  "legal",
  "hr",
  "sc",
  "svc",
];

/**
 * v2.0 nav order — departments are now top-level routes (`/sales`,
 * `/engineering`, etc). Order shown in the sidebar.
 */
export const PRIMARY_DEPT_NAV: DeptCode[] = [
  "sales",
  "marketing",
  "cs",
  "support",
  "product",
  "eng",
  "svc",
  "finance",
  "legal",
  "hr",
  "sc",
  "revops",
];

/** Resolve a top-level slug (e.g. "accounts", "engineering") to a DeptCode. */
export function findDeptByTopSlug(slug: string): DeptCode | null {
  for (const code of DEPT_ORDER) {
    if (DEPARTMENTS[code].urlSlug === slug) return code;
  }
  return null;
}

/** Aggregator the BI layer uses — combines signals + headline scores. */
export function getAllSignals(): Signal[] {
  return DEPT_ORDER.flatMap((d) => DEPARTMENTS[d].signals);
}

export function getBusinessIntelligence() {
  const signals = getAllSignals();
  const critical = signals.filter((s) => s.level === "critical").length;
  const warn = signals.filter((s) => s.level === "warn").length;
  const avgScore = Math.round(
    DEPT_ORDER.reduce((s, d) => s + DEPARTMENTS[d].health.score, 0) / DEPT_ORDER.length
  );
  return { signals, critical, warn, avgScore, depts: DEPT_ORDER.map((d) => DEPARTMENTS[d]) };
}

/** v2.0 route helpers — surfaces own departments, not the other way around. */
export type SurfaceKey = "grow" | "build" | "run" | "decide";

export const DEPTS_BY_SURFACE: Record<SurfaceKey, DeptCode[]> = DEPT_ORDER.reduce(
  (acc, code) => {
    const surf = DEPARTMENTS[code].surface;
    (acc[surf] ||= []).push(code);
    return acc;
  },
  { grow: [], build: [], run: [], decide: [] } as Record<SurfaceKey, DeptCode[]>
);

/** Resolve a URL slug under a parent surface back to a DeptCode. */
export function findDeptBySlug(surface: SurfaceKey, slug: string): DeptCode | null {
  for (const code of DEPTS_BY_SURFACE[surface]) {
    if (DEPARTMENTS[code].urlSlug === slug) return code;
  }
  return null;
}
