import type { DeptCode } from "./entities";
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

/**
 * Knowledge model — every value carries *context*, not just a number.
 * This is the difference between a CRM (rows) and a contextual surface:
 * "$2.2M pipeline" must list the deals, the champions, the source systems,
 * confidence, freshness, and recent edits behind it.
 */

export type KnowledgeUnit = "currency" | "percent" | "count" | "days" | "ratio" | "text";
export type KnowledgeTrend = "up" | "down" | "flat";

export interface ContributorRef {
  id: string;
  label: string; // e.g. "Boreal Energy"
  meta?: string; // e.g. "$950K · Negotiation"
  amount?: number; // numeric contribution for ranking
  owner?: string;
}

export interface SourceRef {
  id: string;
  system: string; // "Salesforce", "Stripe", "Notion", "Manual"
  detail?: string; // "Deals table · 12 rows"
  syncedAt?: string; // "2m ago"
}

export interface PersonRef {
  id: string;
  name: string;
  initials: string;
  role?: string;
}

export interface EditEntry {
  by: string;
  at: string; // relative
  note: string;
}

export interface KnowledgeValue {
  id: string;
  label: string;
  value: number | string;
  unit: KnowledgeUnit;
  delta?: string;
  trend?: KnowledgeTrend;
  series?: number[];
  rationale: string; // Twin's plain-English read
  contributors: ContributorRef[]; // what's behind this number
  sources: SourceRef[]; // where it came from
  people: PersonRef[]; // who's accountable
  confidence: number; // 0-100
  syncedAt: string; // relative
  history?: EditEntry[];
  /** Optional choices when this field is an enum (e.g. status). */
  options?: readonly string[];
}

// ---------- Formatters ----------
export const formatKnowledge = (v: KnowledgeValue): string => {
  const n = typeof v.value === "number" ? v.value : Number(v.value);
  if (v.unit === "currency") {
    const a = Math.abs(n);
    const s = n < 0 ? "-" : "";
    if (a >= 1_000_000) return `${s}$${(a / 1_000_000).toFixed(2)}M`;
    if (a >= 1_000) return `${s}$${(a / 1_000).toFixed(0)}K`;
    return `${s}$${a}`;
  }
  if (v.unit === "percent") return `${n}%`;
  if (v.unit === "days") return `${n}d`;
  if (v.unit === "ratio") return `${n}×`;
  if (v.unit === "count") return n.toLocaleString();
  return String(v.value);
};

// ---------- People dictionary ----------
const PEOPLE: Record<string, PersonRef> = {
  priya: { id: "p-priya", name: "Priya R.", initials: "PR", role: "Lead CSM, Enterprise" },
  marcus: { id: "p-marcus", name: "Marcus T.", initials: "MT", role: "CSM, Pharma" },
  sana: { id: "p-sana", name: "Sana K.", initials: "SK", role: "CS Ops" },
  alex: { id: "p-alex", name: "Alex P.", initials: "AP", role: "AE, West" },
  mia: { id: "p-mia", name: "Mia S.", initials: "MS", role: "AE, East" },
  lena: { id: "p-lena", name: "Lena M.", initials: "LM", role: "Demand Lead" },
  theo: { id: "p-theo", name: "Theo D.", initials: "TD", role: "Content & SEO" },
  diego: { id: "p-diego", name: "Diego A.", initials: "DA", role: "CSM, SMB" },
  ria: { id: "p-ria", name: "Ria N.", initials: "RN", role: "RevOps Lead" },
  finance: { id: "p-fin", name: "Finance", initials: "FN", role: "AR team" },
};
export const personByOwner = (owner: string): PersonRef => {
  const key = owner.toLowerCase().split(" ")[0].replace(".", "");
  return PEOPLE[key] ?? { id: `p-${key}`, name: owner, initials: owner.slice(0, 2).toUpperCase() };
};

const series = (base: number, drift = 0.08): number[] =>
  Array.from({ length: 12 }, (_, i) => {
    const noise = Math.sin(i * 1.3) * 0.04;
    return Math.round(base * (1 + drift * (i / 11) + noise) * 100) / 100;
  });

const dedupe = <T extends { id: string }>(arr: T[]): T[] => {
  const seen = new Set<string>();
  return arr.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
};

// ---------- Per-department knowledge fields ----------
export function buildDeptKnowledge(dept: DeptCode): KnowledgeValue[] {
  switch (dept) {
    case "cs": {
      const portfolio = accounts.reduce((s, a) => s + a.arr, 0);
      const atRisk = accounts.filter((a) => a.health < 70);
      const atRiskArr = atRisk.reduce((s, a) => s + a.arr, 0);
      return [
        {
          id: "cs-portfolio",
          label: "Portfolio ARR",
          value: portfolio,
          unit: "currency",
          delta: "+4.2%",
          trend: "up",
          series: series(portfolio / 1_000_000, 0.05),
          rationale: `Sum of ARR across ${accounts.length} active accounts. Up on Orion expansion (+$220K) and Aperture upsell (+$80K).`,
          contributors: accounts.map((a) => ({
            id: a.id,
            label: a.name,
            meta: `${a.segment} · health ${a.health}`,
            amount: a.arr,
            owner: a.owner,
          })),
          sources: [
            {
              id: "s1",
              system: "Salesforce",
              detail: `Accounts · ${accounts.length} rows`,
              syncedAt: "2m ago",
            },
            { id: "s2", system: "Stripe", detail: "Subscriptions · live", syncedAt: "8m ago" },
          ],
          people: dedupe(accounts.map((a) => personByOwner(a.owner))),
          confidence: 96,
          syncedAt: "2m ago",
        },
        {
          id: "cs-atrisk",
          label: "At-risk ARR",
          value: atRiskArr,
          unit: "currency",
          delta: `${atRisk.length} accts`,
          trend: "down",
          series: series(atRiskArr / 1_000_000, -0.04),
          rationale: `${atRisk.length} accounts with health below 70. Helix and Brightwave drive 73% of risk.`,
          contributors: atRisk.map((a) => ({
            id: a.id,
            label: a.name,
            meta: `health ${a.health} · renews ${a.renewalDays}d`,
            amount: a.arr,
            owner: a.owner,
          })),
          sources: [
            {
              id: "s1",
              system: "Spine signals",
              detail: "Health drops · last 30d",
              syncedAt: "5m ago",
            },
            { id: "s2", system: "Gainsight", detail: "Score model v3", syncedAt: "1h ago" },
          ],
          people: dedupe(atRisk.map((a) => personByOwner(a.owner))),
          confidence: 88,
          syncedAt: "5m ago",
        },
        {
          id: "cs-renewals",
          label: "Renewals next 90d",
          value: accounts.filter((a) => a.renewalDays <= 90).reduce((s, a) => s + a.arr, 0),
          unit: "currency",
          delta: "5 accts",
          trend: "flat",
          rationale:
            "Five accounts renew in the next 90 days. Brightwave (22d) and Orion (21d) need exec attention.",
          contributors: accounts
            .filter((a) => a.renewalDays <= 90)
            .map((a) => ({
              id: a.id,
              label: a.name,
              meta: `${a.renewalDays}d · $${(a.arr / 1000).toFixed(0)}K`,
              amount: a.arr,
              owner: a.owner,
            })),
          sources: [
            { id: "s1", system: "Salesforce", detail: "Contract end dates", syncedAt: "12m ago" },
          ],
          people: dedupe(
            accounts.filter((a) => a.renewalDays <= 90).map((a) => personByOwner(a.owner))
          ),
          confidence: 99,
          syncedAt: "12m ago",
        },
      ];
    }
    case "sales": {
      const pipeline = deals.reduce((s, d) => s + d.amount, 0);
      const stalled = deals.filter((d) => d.daysInStage > 14);
      return [
        {
          id: "sl-pipeline",
          label: "Open pipeline",
          value: pipeline,
          unit: "currency",
          delta: "+12%",
          trend: "up",
          series: series(pipeline / 1_000_000, 0.12),
          rationale: `${deals.length} open deals across Discovery → Negotiation. Boreal Energy ($950K) and Crestline ($620K) lead the book; Vertex is closest to close.`,
          contributors: deals.map((d) => ({
            id: d.id,
            label: d.name,
            meta: `${d.stage} · ${d.daysInStage}d · ${d.champion}`,
            amount: d.amount,
            owner: d.owner,
          })),
          sources: [
            {
              id: "s1",
              system: "Salesforce",
              detail: `Opportunities · ${deals.length} rows`,
              syncedAt: "3m ago",
            },
            { id: "s2", system: "Gong", detail: "Call sentiment", syncedAt: "20m ago" },
          ],
          people: dedupe(deals.map((d) => personByOwner(d.owner))),
          confidence: 91,
          syncedAt: "3m ago",
        },
        {
          id: "sl-stalled",
          label: "Stalled deals",
          value: stalled.length,
          unit: "count",
          delta: "+1 this week",
          trend: "down",
          rationale: `${stalled.length} deals >14 days in stage. Crestline (22d, Proposal) is the largest blocker.`,
          contributors: stalled.map((d) => ({
            id: d.id,
            label: d.name,
            meta: `${d.daysInStage}d in ${d.stage}`,
            amount: d.amount,
            owner: d.owner,
          })),
          sources: [
            { id: "s1", system: "Spine signals", detail: "Stage age > 14d", syncedAt: "8m ago" },
          ],
          people: dedupe(stalled.map((d) => personByOwner(d.owner))),
          confidence: 94,
          syncedAt: "8m ago",
        },
        {
          id: "sl-winrate",
          label: "Win rate (90d)",
          value: 31,
          unit: "percent",
          delta: "+2pp",
          trend: "up",
          series: series(29, 0.07),
          rationale:
            "Trailing 90-day win rate, weighted by deal size. Up on Boreal-class enterprise wins.",
          contributors: deals.slice(0, 3).map((d) => ({
            id: d.id,
            label: d.name,
            meta: `${d.stage}`,
            owner: d.owner,
          })),
          sources: [
            {
              id: "s1",
              system: "Salesforce",
              detail: "Closed-won / closed-lost",
              syncedAt: "1h ago",
            },
          ],
          people: dedupe(deals.map((d) => personByOwner(d.owner))),
          confidence: 86,
          syncedAt: "1h ago",
        },
        {
          id: "sl-coverage",
          label: "Coverage",
          value: 3.2,
          unit: "ratio",
          delta: "+0.4",
          trend: "up",
          rationale: "Pipeline ÷ remaining quota. Above 3× target across all segments.",
          contributors: pipelineSlices.map((p) => ({
            id: p.id,
            label: p.name,
            meta: `${p.coverage}× · NRR ${p.nrr}%`,
            amount: p.arr,
          })),
          sources: [
            { id: "s1", system: "RevOps model", detail: "Forecast v4", syncedAt: "15m ago" },
          ],
          people: [personByOwner("Ria N.")],
          confidence: 82,
          syncedAt: "15m ago",
        },
      ];
    }
    case "marketing": {
      const mqls = campaigns.reduce((s, c) => s + c.mqls, 0);
      const avgCpl = Math.round(campaigns.reduce((s, c) => s + c.cpl, 0) / campaigns.length);
      return [
        {
          id: "mk-mql",
          label: "MQLs (30d)",
          value: mqls,
          unit: "count",
          delta: "+18%",
          trend: "up",
          series: series(mqls, 0.15),
          rationale: `Driven by Spine Launch Webinar (318 MQLs, $22 CPL) and Q4 ABM (142 MQLs).`,
          contributors: campaigns.map((c) => ({
            id: c.id,
            label: c.name,
            meta: `${c.channel} · ${c.mqls} MQLs · $${c.cpl} CPL`,
            amount: c.mqls,
            owner: c.owner,
          })),
          sources: [
            { id: "s1", system: "HubSpot", detail: "Lifecycle stage = MQL", syncedAt: "4m ago" },
            { id: "s2", system: "Google Ads", detail: "Conversions API", syncedAt: "1h ago" },
          ],
          people: dedupe(campaigns.map((c) => personByOwner(c.owner))),
          confidence: 92,
          syncedAt: "4m ago",
        },
        {
          id: "mk-cpl",
          label: "Average CPL",
          value: avgCpl,
          unit: "currency",
          delta: "-6%",
          trend: "up",
          series: series(avgCpl, -0.1),
          rationale:
            "Webinar program is dragging blended CPL down. Paid logistics is 40% above target.",
          contributors: campaigns.map((c) => ({
            id: c.id,
            label: c.name,
            meta: `$${c.cpl} CPL · ${c.channel}`,
            amount: c.cpl,
            owner: c.owner,
          })),
          sources: [
            { id: "s1", system: "HubSpot", detail: "Campaign spend / leads", syncedAt: "4m ago" },
          ],
          people: dedupe(campaigns.map((c) => personByOwner(c.owner))),
          confidence: 88,
          syncedAt: "4m ago",
        },
        {
          id: "mk-pipeline",
          label: "Pipeline sourced",
          value: 4_800_000,
          unit: "currency",
          delta: "+22%",
          trend: "up",
          series: series(4.2, 0.2),
          rationale:
            "Marketing-attributed opportunities created in the last 30 days, first-touch model.",
          contributors: deals.slice(0, 3).map((d) => ({
            id: d.id,
            label: d.name,
            meta: `${d.stage} · sourced by ABM`,
            amount: d.amount,
            owner: d.owner,
          })),
          sources: [
            {
              id: "s1",
              system: "Salesforce",
              detail: "Opp campaign attribution",
              syncedAt: "10m ago",
            },
          ],
          people: [personByOwner("Lena M."), personByOwner("Theo D.")],
          confidence: 78,
          syncedAt: "10m ago",
        },
      ];
    }
    case "revops": {
      const total = pipelineSlices[0];
      return [
        {
          id: "ro-arr",
          label: "ARR",
          value: total.arr,
          unit: "currency",
          delta: "+4.2%",
          trend: "up",
          series: series(total.arr / 1_000_000, 0.04),
          rationale: "Total book ARR across all segments. Enterprise contributes 67% of the book.",
          contributors: pipelineSlices.slice(1).map((p) => ({
            id: p.id,
            label: p.name,
            meta: `NRR ${p.nrr}% · GRR ${p.grr}%`,
            amount: p.arr,
          })),
          sources: [
            { id: "s1", system: "Stripe + SFDC", detail: "Reconciled nightly", syncedAt: "2h ago" },
          ],
          people: [personByOwner("Ria N.")],
          confidence: 99,
          syncedAt: "2h ago",
        },
        {
          id: "ro-nrr",
          label: "NRR",
          value: total.nrr,
          unit: "percent",
          delta: "+3pp",
          trend: "up",
          series: series(total.nrr, 0.02),
          rationale:
            "Net retention. Enterprise NRR 121% pulls the book up; SMB at 96% is the soft spot.",
          contributors: pipelineSlices.slice(1).map((p) => ({
            id: p.id,
            label: p.name,
            meta: `NRR ${p.nrr}%`,
            amount: p.arr,
          })),
          sources: [
            { id: "s1", system: "RevOps model", detail: "Cohort 12m trailing", syncedAt: "6h ago" },
          ],
          people: [personByOwner("Ria N.")],
          confidence: 94,
          syncedAt: "6h ago",
        },
        {
          id: "ro-coverage",
          label: "Forecast coverage",
          value: total.coverage,
          unit: "ratio",
          delta: "+0.4",
          trend: "up",
          rationale: "Above 3× target. Enterprise coverage strongest at 3.8×.",
          contributors: pipelineSlices.slice(1).map((p) => ({
            id: p.id,
            label: p.name,
            meta: `${p.coverage}× coverage`,
            amount: p.arr,
          })),
          sources: [
            {
              id: "s1",
              system: "Salesforce",
              detail: "Open pipeline / quota",
              syncedAt: "30m ago",
            },
          ],
          people: [personByOwner("Ria N."), personByOwner("Mia S.")],
          confidence: 86,
          syncedAt: "30m ago",
        },
      ];
    }
    case "support": {
      const open = tickets.filter((t) => t.status !== "Resolved");
      const breaches = tickets.filter((t) => t.slaBreach);
      return [
        {
          id: "sp-open",
          label: "Open tickets",
          value: open.length,
          unit: "count",
          delta: "+2",
          trend: "down",
          rationale: `${open.length} open, ${breaches.length} in SLA breach. Brightwave Salesforce sync is the hot one.`,
          contributors: open.map((t) => ({
            id: t.id,
            label: t.name,
            meta: `${t.priority} · ${t.account}${t.slaBreach ? " · BREACH" : ""}`,
            owner: t.owner,
          })),
          sources: [{ id: "s1", system: "Zendesk", detail: "Open queue", syncedAt: "1m ago" }],
          people: [personByOwner("Sana K.")],
          confidence: 100,
          syncedAt: "1m ago",
        },
        {
          id: "sp-csat",
          label: "CSAT (30d)",
          value: 4.4,
          unit: "text",
          delta: "-0.1",
          trend: "down",
          rationale: "CSAT dropped after Brightwave sync incident. Excluding that, CSAT is 4.6.",
          contributors: open
            .slice(0, 3)
            .map((t) => ({ id: t.id, label: t.account, meta: `Ticket ${t.name}` })),
          sources: [
            { id: "s1", system: "Zendesk", detail: "Post-resolve survey", syncedAt: "1h ago" },
          ],
          people: [personByOwner("Sana K.")],
          confidence: 90,
          syncedAt: "1h ago",
        },
      ];
    }
    case "eng": {
      const open = incidents.filter((i) => i.status !== "Resolved");
      return [
        {
          id: "en-incidents",
          label: "Open incidents",
          value: open.length,
          unit: "count",
          delta: "+1",
          trend: "down",
          rationale: "Ingestion lag (SEV2) is mitigating. Webhook retry storm is new.",
          contributors: open.map((i) => ({
            id: i.id,
            label: i.name,
            meta: `${i.severity} · ${i.service}`,
            owner: i.owner,
          })),
          sources: [
            { id: "s1", system: "PagerDuty", detail: "Active incidents", syncedAt: "30s ago" },
          ],
          people: [personByOwner("Sana K.")],
          confidence: 100,
          syncedAt: "30s ago",
        },
        {
          id: "en-mttr",
          label: "MTTR",
          value: 31,
          unit: "days",
          delta: "-8m",
          trend: "up",
          series: series(38, -0.18),
          rationale: "Mean time to recover (minutes). Trending down after on-call rotation change.",
          contributors: incidents.map((i) => ({ id: i.id, label: i.name, meta: `${i.mttrMin}m` })),
          sources: [
            { id: "s1", system: "PagerDuty", detail: "Last 30 incidents", syncedAt: "10m ago" },
          ],
          people: [personByOwner("Sana K.")],
          confidence: 92,
          syncedAt: "10m ago",
        },
      ];
    }
    case "product": {
      const inflight = features.filter((f) => f.state === "In progress");
      return [
        {
          id: "pr-inflight",
          label: "Features in flight",
          value: inflight.length,
          unit: "count",
          delta: "0",
          trend: "flat",
          rationale: "Approval Gate v2 is the largest in-flight bet (Core squad).",
          contributors: features.map((f) => ({
            id: f.id,
            label: f.name,
            meta: `${f.state} · ${f.squad} · ${f.votes} votes`,
            owner: f.owner,
          })),
          sources: [{ id: "s1", system: "Linear", detail: "Active issues", syncedAt: "5m ago" }],
          people: dedupe(features.map((f) => personByOwner(f.owner))),
          confidence: 95,
          syncedAt: "5m ago",
        },
      ];
    }
    case "finance": {
      const open = invoices.filter((v) => v.status !== "Paid");
      const ar = open.reduce((s, v) => s + v.amount, 0);
      const overdue = invoices.filter((v) => v.status === "Overdue");
      return [
        {
          id: "fn-ar",
          label: "AR outstanding",
          value: ar,
          unit: "currency",
          delta: "+$22K",
          trend: "down",
          rationale: `${open.length} open invoices. Helix ($96K, 47d) and Brightwave ($26K, 62d) are the laggards.`,
          contributors: open.map((v) => ({
            id: v.id,
            label: v.account,
            meta: `${v.name} · ${v.ageDays}d · ${v.status}`,
            amount: v.amount,
            owner: v.owner,
          })),
          sources: [{ id: "s1", system: "Stripe", detail: "Invoices · open", syncedAt: "5m ago" }],
          people: [personByOwner("Finance")],
          confidence: 99,
          syncedAt: "5m ago",
        },
        {
          id: "fn-overdue",
          label: "Overdue invoices",
          value: overdue.length,
          unit: "count",
          delta: "+1",
          trend: "down",
          rationale: `${overdue.length} invoices past due. Total exposure $${(overdue.reduce((s, v) => s + v.amount, 0) / 1000).toFixed(0)}K.`,
          contributors: overdue.map((v) => ({
            id: v.id,
            label: v.account,
            meta: `${v.name} · ${v.ageDays}d overdue`,
            amount: v.amount,
            owner: v.owner,
          })),
          sources: [
            { id: "s1", system: "Stripe", detail: "Invoices · overdue", syncedAt: "5m ago" },
          ],
          people: [personByOwner("Finance")],
          confidence: 100,
          syncedAt: "5m ago",
        },
      ];
    }
    case "legal": {
      const expiring = contracts.filter((c) => c.expiresDays <= 30);
      return [
        {
          id: "lg-expiring",
          label: "Expiring in 30d",
          value: expiring.length,
          unit: "count",
          delta: "+1",
          trend: "down",
          rationale: `${expiring.length} contracts close to expiry. Aperture NDA in 7d, Helix DPA in 12d.`,
          contributors: expiring.map((c) => ({
            id: c.id,
            label: c.name,
            meta: `${c.account} · ${c.type} · ${c.expiresDays}d`,
            owner: c.owner,
          })),
          sources: [
            { id: "s1", system: "Ironclad", detail: "Contract end dates", syncedAt: "1h ago" },
          ],
          people: [personByOwner("Legal")],
          confidence: 99,
          syncedAt: "1h ago",
        },
      ];
    }
    case "hr": {
      const overloaded = employees.filter((e) => e.load > 85);
      return [
        {
          id: "hr-load",
          label: "Overloaded (>85)",
          value: overloaded.length,
          unit: "count",
          delta: "+1",
          trend: "down",
          rationale: `${overloaded.length} ICs sustained above 85% load for 2+ weeks. Priya R. is the immediate concern.`,
          contributors: overloaded.map((e) => ({
            id: e.id,
            label: e.name,
            meta: `${e.role} · load ${e.load}`,
            owner: e.owner,
          })),
          sources: [
            { id: "s1", system: "Workday + Linear", detail: "Capacity model", syncedAt: "1d ago" },
          ],
          people: dedupe(employees.map((e) => personByOwner(e.name))),
          confidence: 80,
          syncedAt: "1d ago",
        },
      ];
    }
    case "sc": {
      const atRisk = shipments.filter((s) => s.status !== "On time");
      return [
        {
          id: "sc-risk",
          label: "Shipments at risk",
          value: atRisk.length,
          unit: "count",
          delta: "+1",
          trend: "down",
          rationale: `${atRisk.length} POs slipping. Fiber cable PO is the largest exposure (240 units, delayed).`,
          contributors: atRisk.map((s) => ({
            id: s.id,
            label: s.name,
            meta: `${s.sku} · ${s.qty} units · ${s.status}`,
            owner: s.owner,
          })),
          sources: [{ id: "s1", system: "NetSuite", detail: "PO statuses", syncedAt: "30m ago" }],
          people: [personByOwner("Ops")],
          confidence: 88,
          syncedAt: "30m ago",
        },
      ];
    }
    case "svc": {
      const red = engagements.filter((e) => e.status === "Red");
      return [
        {
          id: "sv-red",
          label: "Red engagements",
          value: red.length,
          unit: "count",
          delta: "+1",
          trend: "down",
          rationale: `${red.length} engagements with red status. Helix implementation is the priority.`,
          contributors: red.map((e) => ({
            id: e.id,
            label: e.name,
            meta: `${e.account} · ${e.type} · ${e.progress}%`,
            owner: e.owner,
          })),
          sources: [{ id: "s1", system: "Asana", detail: "Project status", syncedAt: "2h ago" }],
          people: dedupe(engagements.map((e) => personByOwner(e.owner))),
          confidence: 92,
          syncedAt: "2h ago",
        },
      ];
    }
  }
}
