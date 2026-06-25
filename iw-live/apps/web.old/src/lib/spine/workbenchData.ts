import type { DeptCode } from "./entities";

// ---------- Shared types ----------
export interface DocItem {
  id: string;
  title: string;
  kind:
    | "Policy"
    | "SOP"
    | "Contract"
    | "Brief"
    | "Runbook"
    | "Deck"
    | "Report"
    | "Spec"
    | "Template";
  owner: string;
  updated: string;
  status: "Approved" | "Draft" | "In review" | "Archived";
  size?: string;
}
export interface AssetItem {
  id: string;
  title: string;
  type:
    | "Deck"
    | "One-pager"
    | "Email"
    | "Landing page"
    | "Video"
    | "Case study"
    | "Blog"
    | "Whitepaper"
    | "Template"
    | "Image"
    | "Sales script";
  channel?: string;
  owner: string;
  updated: string;
  views?: number;
  ctr?: number;
  status: "Published" | "Draft" | "Review";
}
export interface VendorItem {
  id: string;
  name: string;
  category: string;
  spendYtd: number;
  contractEnds: string;
  rating: number; // 1-5
  status: "Active" | "Renewing" | "At risk" | "Paused";
  owner: string;
}
export interface BudgetLine {
  id: string;
  category: string;
  budget: number;
  spent: number;
  forecast: number;
}
export interface RevenueLine {
  id: string;
  source: string;
  amount: number;
  delta: string;
  trend: "up" | "down" | "flat";
}
export interface BillingItem {
  id: string;
  ref: string;
  party: string;
  amount: number;
  due: string;
  status: "Paid" | "Open" | "Overdue" | "Scheduled";
  type: "Invoice" | "Bill" | "PO" | "Subscription";
}
export interface AutomationItem {
  id: string;
  name: string;
  trigger: string;
  runsMo: number;
  successPct: number;
  status: "Live" | "Paused" | "Draft";
}
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  load: number;
  focus: string;
}
export interface ReportItem {
  id: string;
  title: string;
  cadence: "Daily" | "Weekly" | "Monthly" | "Quarterly";
  audience: string;
  lastRun: string;
}
export interface Initiative {
  id: string;
  title: string;
  owner: string;
  progress: number;
  due: string;
  status: "On track" | "At risk" | "Off track" | "Done";
}
export interface MetricSeries {
  label: string;
  unit?: string;
  points: number[]; // 12 points for sparkline
}

export interface DeptExtras {
  charters: string[]; // mission bullets
  metrics: MetricSeries[];
  initiatives: Initiative[];
  documents: DocItem[];
  assets: AssetItem[];
  vendors: VendorItem[];
  budget: BudgetLine[];
  revenue: RevenueLine[];
  billing: BillingItem[];
  automations: AutomationItem[];
  team: TeamMember[];
  reports: ReportItem[];
  twinActions: { id: string; title: string; rationale: string; impact: string }[];
}

// ---------- Helpers ----------
const series = (base: number, drift = 0.08): number[] =>
  Array.from({ length: 12 }, (_, i) => {
    const noise = Math.sin(i * 1.3) * 0.04 + (Math.random() - 0.5) * 0.04;
    return Math.round(base * (1 + drift * (i / 11) + noise));
  });

// ---------- Per-department extras ----------
export const DEPT_EXTRAS: Record<DeptCode, DeptExtras> = {
  cs: {
    charters: [
      "Drive NRR ≥ 115% through proactive engagement",
      "Cut time-to-value by 30% across new logos",
      "Surface churn risk 60 days before renewal",
    ],
    metrics: [
      { label: "NRR", unit: "%", points: series(112, 0.04) },
      { label: "Health avg", points: series(74, 0.05) },
      { label: "QBRs / wk", points: series(8, 0.2) },
      { label: "Champion silence", unit: "d", points: series(12, -0.1) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "Northwind expansion play",
        owner: "Priya R.",
        progress: 62,
        due: "in 18d",
        status: "On track",
      },
      {
        id: "i2",
        title: "Helix exec sponsor program",
        owner: "Marcus T.",
        progress: 28,
        due: "in 30d",
        status: "At risk",
      },
      {
        id: "i3",
        title: "Risk scorecard v2 rollout",
        owner: "Sana K.",
        progress: 84,
        due: "in 9d",
        status: "On track",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "QBR template — Enterprise",
        kind: "Template",
        owner: "Priya R.",
        updated: "2d",
        status: "Approved",
        size: "1.2 MB",
      },
      {
        id: "d2",
        title: "Save play — at-risk",
        kind: "SOP",
        owner: "Marcus T.",
        updated: "5d",
        status: "Approved",
      },
      {
        id: "d3",
        title: "Customer journey map 2026",
        kind: "Brief",
        owner: "Sana K.",
        updated: "1d",
        status: "In review",
      },
      {
        id: "d4",
        title: "Renewal forecast methodology",
        kind: "Policy",
        owner: "RevOps",
        updated: "12d",
        status: "Approved",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Customer success story — Orion",
        type: "Case study",
        owner: "Lena M.",
        updated: "3d",
        views: 412,
        status: "Published",
      },
      {
        id: "a2",
        title: "Health score one-pager",
        type: "One-pager",
        owner: "Sana K.",
        updated: "6d",
        views: 88,
        status: "Published",
      },
      {
        id: "a3",
        title: "Renewal kickoff deck",
        type: "Deck",
        owner: "Priya R.",
        updated: "1d",
        views: 24,
        status: "Draft",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "Gainsight",
        category: "CS Platform",
        spendYtd: 84_000,
        contractEnds: "in 132d",
        rating: 4,
        status: "Active",
        owner: "Ops",
      },
      {
        id: "v2",
        name: "Catalyst",
        category: "Health scoring",
        spendYtd: 18_000,
        contractEnds: "in 64d",
        rating: 3,
        status: "Renewing",
        owner: "Ops",
      },
      {
        id: "v3",
        name: "Vitally",
        category: "Playbooks",
        spendYtd: 22_000,
        contractEnds: "in 280d",
        rating: 4,
        status: "Active",
        owner: "Ops",
      },
    ],
    budget: [
      { id: "b1", category: "Tooling", budget: 180_000, spent: 124_000, forecast: 174_000 },
      { id: "b2", category: "Headcount", budget: 1_400_000, spent: 980_000, forecast: 1_360_000 },
      { id: "b3", category: "Travel & QBRs", budget: 90_000, spent: 41_000, forecast: 82_000 },
    ],
    revenue: [
      { id: "r1", source: "Expansion ARR", amount: 1_240_000, delta: "+18%", trend: "up" },
      { id: "r2", source: "Renewal ARR", amount: 4_820_000, delta: "+3%", trend: "up" },
      { id: "r3", source: "Churn (lost)", amount: -380_000, delta: "-12%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "EXP-9201",
        party: "Orion Capital",
        amount: 220_000,
        due: "in 12d",
        status: "Open",
        type: "Invoice",
      },
      {
        id: "bl2",
        ref: "REN-1840",
        party: "Aperture Robotics",
        amount: 520_000,
        due: "in 40d",
        status: "Scheduled",
        type: "Invoice",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "Champion silent 14d → outreach",
        trigger: "Activity stream",
        runsMo: 38,
        successPct: 92,
        status: "Live",
      },
      {
        id: "au2",
        name: "Health drop > 10 → playbook",
        trigger: "Score change",
        runsMo: 12,
        successPct: 88,
        status: "Live",
      },
      {
        id: "au3",
        name: "Renewal -90d kickoff",
        trigger: "Date",
        runsMo: 9,
        successPct: 100,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Priya R.", role: "Lead CSM, Enterprise", load: 92, focus: "Orion, Helix" },
      { id: "t2", name: "Marcus T.", role: "CSM, Pharma", load: 78, focus: "Helix, Brightwave" },
      { id: "t3", name: "Sana K.", role: "CS Ops", load: 64, focus: "Tooling, scoring" },
    ],
    reports: [
      {
        id: "rp1",
        title: "Weekly health digest",
        cadence: "Weekly",
        audience: "CS leadership",
        lastRun: "Mon",
      },
      {
        id: "rp2",
        title: "Renewal forecast pack",
        cadence: "Monthly",
        audience: "RevOps + Finance",
        lastRun: "1mo",
      },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Draft Northwind exec recap",
        rationale: "Champion silent 14d",
        impact: "$840K ARR",
      },
      {
        id: "ta2",
        title: "Queue Brightwave save play",
        rationale: "Health 41, renewal 22d",
        impact: "$310K ARR",
      },
    ],
  },

  sales: {
    charters: [
      "Hit $24M new ARR with 3.2× pipeline coverage",
      "Compress sales cycle to 62d",
      "Lift win-rate to 33%",
    ],
    metrics: [
      { label: "Pipeline", unit: "$M", points: series(18, 0.12) },
      { label: "Win rate", unit: "%", points: series(29, 0.07) },
      { label: "Avg cycle", unit: "d", points: series(74, -0.08) },
      { label: "Quota attain", unit: "%", points: series(82, 0.05) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "Boreal Energy close",
        owner: "Mia S.",
        progress: 78,
        due: "in 7d",
        status: "On track",
      },
      {
        id: "i2",
        title: "Outbound 2.0 launch",
        owner: "Alex P.",
        progress: 45,
        due: "in 28d",
        status: "On track",
      },
      {
        id: "i3",
        title: "Partner-sourced motion",
        owner: "Theo D.",
        progress: 22,
        due: "in 60d",
        status: "At risk",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "MSA — standard 2026",
        kind: "Contract",
        owner: "Legal",
        updated: "8d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "Discovery playbook",
        kind: "SOP",
        owner: "Sales Ena.",
        updated: "2d",
        status: "Approved",
      },
      {
        id: "d3",
        title: "Pricing & packaging spec",
        kind: "Spec",
        owner: "RevOps",
        updated: "4d",
        status: "Approved",
      },
      {
        id: "d4",
        title: "Mutual action plan template",
        kind: "Template",
        owner: "Alex P.",
        updated: "1d",
        status: "In review",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Master sales deck v6",
        type: "Deck",
        owner: "Sales Ena.",
        updated: "1d",
        views: 1280,
        status: "Published",
      },
      {
        id: "a2",
        title: "ROI calculator",
        type: "Template",
        owner: "RevOps",
        updated: "7d",
        views: 642,
        status: "Published",
      },
      {
        id: "a3",
        title: "Vertical: Logistics one-pager",
        type: "One-pager",
        owner: "Lena M.",
        updated: "3d",
        views: 312,
        status: "Published",
      },
      {
        id: "a4",
        title: "Cold email sequence — CFO",
        type: "Email",
        owner: "Alex P.",
        updated: "2d",
        ctr: 4.8,
        status: "Published",
      },
      {
        id: "a5",
        title: "Demo script — Spine",
        type: "Sales script",
        owner: "Mia S.",
        updated: "5d",
        status: "Review",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "Gong",
        category: "Conversation intel",
        spendYtd: 96_000,
        contractEnds: "in 210d",
        rating: 5,
        status: "Active",
        owner: "Ops",
      },
      {
        id: "v2",
        name: "Outreach",
        category: "Sales engagement",
        spendYtd: 144_000,
        contractEnds: "in 84d",
        rating: 4,
        status: "Renewing",
        owner: "Ops",
      },
      {
        id: "v3",
        name: "ZoomInfo",
        category: "Data",
        spendYtd: 72_000,
        contractEnds: "in 30d",
        rating: 3,
        status: "At risk",
        owner: "Ops",
      },
    ],
    budget: [
      { id: "b1", category: "Sales tooling", budget: 420_000, spent: 312_000, forecast: 418_000 },
      {
        id: "b2",
        category: "Commissions",
        budget: 2_800_000,
        spent: 1_980_000,
        forecast: 2_760_000,
      },
      { id: "b3", category: "Field & events", budget: 320_000, spent: 184_000, forecast: 308_000 },
    ],
    revenue: [
      { id: "r1", source: "New logo ARR", amount: 8_400_000, delta: "+22%", trend: "up" },
      { id: "r2", source: "Upsell", amount: 2_640_000, delta: "+9%", trend: "up" },
      { id: "r3", source: "Closed-lost recovered", amount: 420_000, delta: "+14%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "ORD-3041",
        party: "Vertex Mfg",
        amount: 380_000,
        due: "in 14d",
        status: "Scheduled",
        type: "Invoice",
      },
      {
        id: "bl2",
        ref: "ORD-3066",
        party: "Boreal Energy",
        amount: 950_000,
        due: "in 7d",
        status: "Open",
        type: "Invoice",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "Stalled deal 14d → MAP nudge",
        trigger: "Days in stage",
        runsMo: 22,
        successPct: 86,
        status: "Live",
      },
      {
        id: "au2",
        name: "Lost-to-quoted → ROI follow-up",
        trigger: "Stage change",
        runsMo: 14,
        successPct: 71,
        status: "Live",
      },
      {
        id: "au3",
        name: "Closed-won → handoff to CS",
        trigger: "Stage = Won",
        runsMo: 9,
        successPct: 100,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Alex P.", role: "AE, West", load: 71, focus: "Vertex, Lumen" },
      { id: "t2", name: "Mia S.", role: "AE, East", load: 88, focus: "Boreal, Crestline" },
      { id: "t3", name: "Nia O.", role: "AE, EMEA", load: 22, focus: "Onboarding" },
    ],
    reports: [
      {
        id: "rp1",
        title: "Pipeline & forecast",
        cadence: "Weekly",
        audience: "GTM leadership",
        lastRun: "Mon",
      },
      {
        id: "rp2",
        title: "Win/loss analysis",
        cadence: "Quarterly",
        audience: "Product + Sales",
        lastRun: "42d",
      },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Generate Boreal redline",
        rationale: "Negotiation 18d, CFO pricing concern",
        impact: "$950K",
      },
      {
        id: "ta2",
        title: "Build Crestline MAP",
        rationale: "22d in Proposal, no next step",
        impact: "$620K",
      },
    ],
  },

  marketing: {
    charters: [
      "Source $20M pipeline at <$80 CPL",
      "Lift brand search +40%",
      "Ship 4 vertical motions",
    ],
    metrics: [
      { label: "MQLs", points: series(550, 0.15) },
      { label: "CPL", unit: "$", points: series(58, -0.1) },
      { label: "Pipeline $", unit: "M", points: series(4.2, 0.2) },
      { label: "Brand search", points: series(820, 0.18) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "Spine launch wave",
        owner: "Lena M.",
        progress: 72,
        due: "in 10d",
        status: "On track",
      },
      {
        id: "i2",
        title: "Pharma vertical hub",
        owner: "Theo D.",
        progress: 38,
        due: "in 35d",
        status: "On track",
      },
      {
        id: "i3",
        title: "Webinar program Q1",
        owner: "Lena M.",
        progress: 90,
        due: "in 4d",
        status: "On track",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "Brand guidelines 2026",
        kind: "Policy",
        owner: "Brand",
        updated: "20d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "Content calendar Q1",
        kind: "Brief",
        owner: "Lena M.",
        updated: "1d",
        status: "In review",
      },
      {
        id: "d3",
        title: "Messaging house — Spine",
        kind: "Spec",
        owner: "PMM",
        updated: "6d",
        status: "Approved",
      },
      {
        id: "d4",
        title: "Paid media playbook",
        kind: "SOP",
        owner: "Theo D.",
        updated: "11d",
        status: "Approved",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Spine launch — landing page",
        type: "Landing page",
        channel: "Web",
        owner: "Lena M.",
        updated: "1d",
        views: 8420,
        ctr: 6.4,
        status: "Published",
      },
      {
        id: "a2",
        title: "Hero demo video (90s)",
        type: "Video",
        channel: "YouTube",
        owner: "Brand",
        updated: "3d",
        views: 12_400,
        status: "Published",
      },
      {
        id: "a3",
        title: "Whitepaper — Twin pattern",
        type: "Whitepaper",
        channel: "Gated",
        owner: "PMM",
        updated: "9d",
        views: 612,
        status: "Published",
      },
      {
        id: "a4",
        title: "Customer blog — Orion",
        type: "Blog",
        channel: "Web",
        owner: "Theo D.",
        updated: "2d",
        views: 1840,
        status: "Published",
      },
      {
        id: "a5",
        title: "Q4 ABM email — Logistics",
        type: "Email",
        channel: "Email",
        owner: "Lena M.",
        updated: "4d",
        ctr: 3.2,
        status: "Published",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "HubSpot",
        category: "Marketing automation",
        spendYtd: 184_000,
        contractEnds: "in 92d",
        rating: 4,
        status: "Active",
        owner: "Ops",
      },
      {
        id: "v2",
        name: "Mutiny",
        category: "Personalization",
        spendYtd: 72_000,
        contractEnds: "in 240d",
        rating: 4,
        status: "Active",
        owner: "Ops",
      },
      {
        id: "v3",
        name: "Brand Agency · North",
        category: "Creative",
        spendYtd: 220_000,
        contractEnds: "in 60d",
        rating: 5,
        status: "Renewing",
        owner: "Brand",
      },
    ],
    budget: [
      { id: "b1", category: "Paid media", budget: 800_000, spent: 612_000, forecast: 790_000 },
      { id: "b2", category: "Events", budget: 420_000, spent: 184_000, forecast: 380_000 },
      {
        id: "b3",
        category: "Content & creative",
        budget: 280_000,
        spent: 188_000,
        forecast: 274_000,
      },
    ],
    revenue: [
      {
        id: "r1",
        source: "Marketing-sourced pipeline",
        amount: 4_800_000,
        delta: "+22%",
        trend: "up",
      },
      { id: "r2", source: "Marketing-influenced", amount: 11_200_000, delta: "+14%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "BILL-2201",
        party: "Brand Agency · North",
        amount: 48_000,
        due: "in 9d",
        status: "Open",
        type: "Bill",
      },
      {
        id: "bl2",
        ref: "BILL-2208",
        party: "Mutiny",
        amount: 12_000,
        due: "in 21d",
        status: "Scheduled",
        type: "Subscription",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "MQL → SDR routing",
        trigger: "Score ≥ 80",
        runsMo: 412,
        successPct: 96,
        status: "Live",
      },
      {
        id: "au2",
        name: "Webinar reg → 5-touch nurture",
        trigger: "Form submit",
        runsMo: 318,
        successPct: 88,
        status: "Live",
      },
      {
        id: "au3",
        name: "Churned account suppression",
        trigger: "Churn event",
        runsMo: 8,
        successPct: 100,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Lena M.", role: "Demand Lead", load: 84, focus: "ABM, webinars" },
      { id: "t2", name: "Theo D.", role: "Content & SEO", load: 62, focus: "Pharma, Logistics" },
      { id: "t3", name: "Aria V.", role: "PMM", load: 71, focus: "Spine launch" },
    ],
    reports: [
      { id: "rp1", title: "Demand dashboard", cadence: "Weekly", audience: "GTM", lastRun: "Mon" },
      { id: "rp2", title: "Channel ROI", cadence: "Monthly", audience: "CFO", lastRun: "8d" },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Rebalance Q4 ABM spend",
        rationale: "CPL $84 above $60 target",
        impact: "+62 MQLs",
      },
      {
        id: "ta2",
        title: "Draft Helix expansion email",
        rationale: "Usage +38% MoM",
        impact: "Pipeline lift",
      },
    ],
  },

  revops: {
    charters: [
      "Forecast accuracy ≥ 92%",
      "Data quality > 95% on critical fields",
      "Compress quote-to-cash to 4d",
    ],
    metrics: [
      { label: "Forecast accy", unit: "%", points: series(88, 0.05) },
      { label: "NRR", unit: "%", points: series(114, 0.02) },
      { label: "Data quality", unit: "%", points: series(93, 0.03) },
      { label: "Coverage", unit: "×", points: series(3.0, 0.08) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "CPQ rollout phase 2",
        owner: "Ops",
        progress: 54,
        due: "in 22d",
        status: "On track",
      },
      {
        id: "i2",
        title: "Territory carve 2026",
        owner: "RevOps",
        progress: 80,
        due: "in 12d",
        status: "On track",
      },
      {
        id: "i3",
        title: "Attribution model v3",
        owner: "Data",
        progress: 30,
        due: "in 45d",
        status: "At risk",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "Forecast methodology",
        kind: "Policy",
        owner: "RevOps",
        updated: "3d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "Comp plan 2026",
        kind: "Spec",
        owner: "Finance + Sales",
        updated: "9d",
        status: "In review",
      },
      {
        id: "d3",
        title: "Lead routing SOP",
        kind: "SOP",
        owner: "Ops",
        updated: "14d",
        status: "Approved",
      },
      {
        id: "d4",
        title: "Deal desk runbook",
        kind: "Runbook",
        owner: "Ops",
        updated: "2d",
        status: "Approved",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Board pipeline pack",
        type: "Deck",
        owner: "RevOps",
        updated: "5d",
        views: 18,
        status: "Draft",
      },
      {
        id: "a2",
        title: "QBR data export template",
        type: "Template",
        owner: "Ops",
        updated: "11d",
        status: "Published",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "Clari",
        category: "Forecasting",
        spendYtd: 132_000,
        contractEnds: "in 180d",
        rating: 5,
        status: "Active",
        owner: "Ops",
      },
      {
        id: "v2",
        name: "DealHub",
        category: "CPQ",
        spendYtd: 84_000,
        contractEnds: "in 70d",
        rating: 4,
        status: "Renewing",
        owner: "Ops",
      },
    ],
    budget: [
      { id: "b1", category: "Systems", budget: 380_000, spent: 268_000, forecast: 372_000 },
      {
        id: "b2",
        category: "Analytics & data",
        budget: 220_000,
        spent: 142_000,
        forecast: 214_000,
      },
    ],
    revenue: [
      { id: "r1", source: "Total ARR", amount: 24_600_000, delta: "+4.2%", trend: "up" },
      { id: "r2", source: "Enterprise ARR", amount: 16_400_000, delta: "+6%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "BILL-RV-12",
        party: "Clari",
        amount: 11_000,
        due: "in 18d",
        status: "Scheduled",
        type: "Subscription",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "Forecast roll-up nightly",
        trigger: "Cron",
        runsMo: 30,
        successPct: 100,
        status: "Live",
      },
      {
        id: "au2",
        name: "Stale deal flag → AE nudge",
        trigger: "Days in stage",
        runsMo: 42,
        successPct: 84,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Sana K.", role: "RevOps Lead", load: 78, focus: "Forecast, CPQ" },
      { id: "t2", name: "Jules H.", role: "Analytics", load: 64, focus: "Attribution" },
    ],
    reports: [
      { id: "rp1", title: "Board forecast", cadence: "Monthly", audience: "Board", lastRun: "12d" },
      {
        id: "rp2",
        title: "Pipeline hygiene",
        cadence: "Weekly",
        audience: "Sales mgmt",
        lastRun: "Mon",
      },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Flag 7 stale Enterprise deals",
        rationale: "Days in stage > 21",
        impact: "$3.2M coverage",
      },
    ],
  },

  support: {
    charters: ["P1 SLA ≥ 99%", "CSAT ≥ 4.6", "Deflect 35% with self-serve"],
    metrics: [
      { label: "Tickets/wk", points: series(180, 0.05) },
      { label: "CSAT", points: series(44, 0.02) },
      { label: "Avg FRT", unit: "m", points: series(38, -0.08) },
      { label: "Backlog", points: series(46, -0.04) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "Self-serve KB v2",
        owner: "Support",
        progress: 60,
        due: "in 24d",
        status: "On track",
      },
      {
        id: "i2",
        title: "Tier-1 macros rewrite",
        owner: "Support Ops",
        progress: 35,
        due: "in 30d",
        status: "On track",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "P1 incident runbook",
        kind: "Runbook",
        owner: "Support",
        updated: "2d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "Escalation matrix",
        kind: "Policy",
        owner: "Support",
        updated: "9d",
        status: "Approved",
      },
      {
        id: "d3",
        title: "Macro library",
        kind: "Template",
        owner: "Support Ops",
        updated: "1d",
        status: "In review",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "KB: Connector setup",
        type: "Blog",
        owner: "Support",
        updated: "3d",
        views: 4200,
        status: "Published",
      },
      {
        id: "a2",
        title: "Status page incident template",
        type: "Template",
        owner: "Support",
        updated: "12d",
        status: "Published",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "Zendesk",
        category: "Ticketing",
        spendYtd: 96_000,
        contractEnds: "in 110d",
        rating: 4,
        status: "Active",
        owner: "Ops",
      },
      {
        id: "v2",
        name: "Intercom",
        category: "In-app messaging",
        spendYtd: 54_000,
        contractEnds: "in 200d",
        rating: 4,
        status: "Active",
        owner: "Ops",
      },
    ],
    budget: [
      { id: "b1", category: "Tooling", budget: 220_000, spent: 156_000, forecast: 216_000 },
      { id: "b2", category: "Headcount", budget: 1_100_000, spent: 760_000, forecast: 1_080_000 },
    ],
    revenue: [
      { id: "r1", source: "Premium support plans", amount: 480_000, delta: "+8%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "BILL-SP-04",
        party: "Zendesk",
        amount: 8_000,
        due: "in 14d",
        status: "Scheduled",
        type: "Subscription",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "P1 open > 30m → page on-call",
        trigger: "Ticket age",
        runsMo: 6,
        successPct: 100,
        status: "Live",
      },
      {
        id: "au2",
        name: "CSAT < 3 → manager review",
        trigger: "Survey",
        runsMo: 18,
        successPct: 100,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Rhea P.", role: "Support Lead", load: 82, focus: "P1 triage" },
      { id: "t2", name: "Owen K.", role: "Tier 2", load: 71, focus: "Connectors" },
    ],
    reports: [
      {
        id: "rp1",
        title: "SLA & CSAT weekly",
        cadence: "Weekly",
        audience: "CS + Eng",
        lastRun: "Mon",
      },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Draft Brightwave P1 update",
        rationale: "SLA breached 1h ago",
        impact: "Trust",
      },
    ],
  },

  eng: {
    charters: ["MTTR < 30m on SEV1", "Change fail rate < 5%", "DORA elite on all 4"],
    metrics: [
      { label: "Deploys/wk", points: series(42, 0.1) },
      { label: "MTTR", unit: "m", points: series(34, -0.1) },
      { label: "CFR", unit: "%", points: series(4.6, -0.06) },
      { label: "Lead time", unit: "h", points: series(18, -0.08) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "Auth hardening",
        owner: "SRE",
        progress: 70,
        due: "in 14d",
        status: "On track",
      },
      {
        id: "i2",
        title: "Ingestion v3 GA",
        owner: "Platform",
        progress: 48,
        due: "in 28d",
        status: "On track",
      },
      {
        id: "i3",
        title: "Cost cut on inference",
        owner: "ML",
        progress: 30,
        due: "in 40d",
        status: "At risk",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "Incident response runbook",
        kind: "Runbook",
        owner: "SRE",
        updated: "4d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "Architecture decision log",
        kind: "Spec",
        owner: "Platform",
        updated: "1d",
        status: "Approved",
      },
      {
        id: "d3",
        title: "On-call rotation policy",
        kind: "Policy",
        owner: "Eng Mgmt",
        updated: "20d",
        status: "Approved",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Postmortem: auth 5xx",
        type: "Case study",
        owner: "SRE",
        updated: "1d",
        status: "Published",
      },
      {
        id: "a2",
        title: "Service catalog",
        type: "Template",
        owner: "Platform",
        updated: "9d",
        status: "Published",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "Datadog",
        category: "Observability",
        spendYtd: 380_000,
        contractEnds: "in 150d",
        rating: 4,
        status: "Active",
        owner: "Platform",
      },
      {
        id: "v2",
        name: "PagerDuty",
        category: "On-call",
        spendYtd: 48_000,
        contractEnds: "in 240d",
        rating: 5,
        status: "Active",
        owner: "SRE",
      },
      {
        id: "v3",
        name: "GitHub Enterprise",
        category: "Source",
        spendYtd: 120_000,
        contractEnds: "in 90d",
        rating: 5,
        status: "Active",
        owner: "Platform",
      },
    ],
    budget: [
      {
        id: "b1",
        category: "Cloud infra",
        budget: 2_400_000,
        spent: 1_680_000,
        forecast: 2_360_000,
      },
      { id: "b2", category: "Tooling", budget: 620_000, spent: 412_000, forecast: 604_000 },
      { id: "b3", category: "Headcount", budget: 6_200_000, spent: 4_240_000, forecast: 6_100_000 },
    ],
    revenue: [
      { id: "r1", source: "Platform attach", amount: 1_240_000, delta: "+12%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "AWS-Q1",
        party: "AWS",
        amount: 412_000,
        due: "in 8d",
        status: "Open",
        type: "Bill",
      },
      {
        id: "bl2",
        ref: "DD-Q1",
        party: "Datadog",
        amount: 96_000,
        due: "in 20d",
        status: "Scheduled",
        type: "Subscription",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "SEV1 open → war room",
        trigger: "Alert",
        runsMo: 4,
        successPct: 100,
        status: "Live",
      },
      {
        id: "au2",
        name: "Failed deploy → auto-rollback",
        trigger: "CI signal",
        runsMo: 22,
        successPct: 96,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Sana K.", role: "Eng Lead", load: 78, focus: "Core" },
      { id: "t2", name: "Ravi M.", role: "SRE", load: 88, focus: "Auth" },
      { id: "t3", name: "Iris L.", role: "ML Eng", load: 72, focus: "Inference cost" },
    ],
    reports: [
      {
        id: "rp1",
        title: "DORA scorecard",
        cadence: "Monthly",
        audience: "Eng leadership",
        lastRun: "5d",
      },
      {
        id: "rp2",
        title: "Reliability review",
        cadence: "Weekly",
        audience: "All eng",
        lastRun: "Mon",
      },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Draft auth postmortem v2",
        rationale: "Recurring 5xx pattern",
        impact: "Reliability",
      },
    ],
  },

  product: {
    charters: ["NPS ≥ 50", "WAU/MAU ≥ 55%", "Ship 6 named bets per half"],
    metrics: [
      { label: "NPS", points: series(46, 0.04) },
      { label: "WAU/MAU", unit: "%", points: series(52, 0.03) },
      { label: "Adoption", unit: "%", points: series(38, 0.08) },
      { label: "Feature votes", points: series(220, 0.12) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "Approval Gate v2",
        owner: "Sana K.",
        progress: 60,
        due: "in 18d",
        status: "On track",
      },
      {
        id: "i2",
        title: "Memory replay UI",
        owner: "Theo D.",
        progress: 78,
        due: "in 9d",
        status: "On track",
      },
      {
        id: "i3",
        title: "Connector marketplace",
        owner: "Alex P.",
        progress: 24,
        due: "in 60d",
        status: "At risk",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "PRD: Approval Gate v2",
        kind: "Spec",
        owner: "Sana K.",
        updated: "2d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "Discovery: Memory replay",
        kind: "Brief",
        owner: "Theo D.",
        updated: "4d",
        status: "In review",
      },
      {
        id: "d3",
        title: "Roadmap 2026 H1",
        kind: "Spec",
        owner: "PM",
        updated: "6d",
        status: "Approved",
      },
      {
        id: "d4",
        title: "Beta program policy",
        kind: "Policy",
        owner: "PMM",
        updated: "21d",
        status: "Approved",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Roadmap public site",
        type: "Landing page",
        owner: "PM",
        updated: "3d",
        views: 3120,
        status: "Published",
      },
      {
        id: "a2",
        title: "Changelog Q4",
        type: "Blog",
        owner: "PMM",
        updated: "5d",
        views: 1840,
        status: "Published",
      },
      {
        id: "a3",
        title: "Beta invite email",
        type: "Email",
        owner: "PMM",
        updated: "1d",
        status: "Draft",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "Productboard",
        category: "Roadmapping",
        spendYtd: 36_000,
        contractEnds: "in 140d",
        rating: 4,
        status: "Active",
        owner: "PM",
      },
      {
        id: "v2",
        name: "Sprig",
        category: "Research",
        spendYtd: 28_000,
        contractEnds: "in 90d",
        rating: 4,
        status: "Active",
        owner: "PM",
      },
    ],
    budget: [
      { id: "b1", category: "Research", budget: 180_000, spent: 122_000, forecast: 176_000 },
      { id: "b2", category: "Tooling", budget: 120_000, spent: 78_000, forecast: 116_000 },
    ],
    revenue: [
      { id: "r1", source: "New feature attach", amount: 820_000, delta: "+18%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "BILL-PR-09",
        party: "Productboard",
        amount: 6_000,
        due: "in 24d",
        status: "Scheduled",
        type: "Subscription",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "Feedback → Productboard",
        trigger: "Inbox tag",
        runsMo: 184,
        successPct: 94,
        status: "Live",
      },
      {
        id: "au2",
        name: "Beta opt-in → cohort",
        trigger: "Form",
        runsMo: 62,
        successPct: 100,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Theo D.", role: "Sr PM, Memory", load: 76, focus: "Replay UI" },
      { id: "t2", name: "Mia S.", role: "PM, Twin", load: 71, focus: "Proposals" },
    ],
    reports: [
      {
        id: "rp1",
        title: "Adoption funnel",
        cadence: "Weekly",
        audience: "Product + GTM",
        lastRun: "Tue",
      },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Cluster 184 feedback items",
        rationale: "New themes detected",
        impact: "Roadmap signal",
      },
    ],
  },

  finance: {
    charters: ["DSO < 35d", "Close in 5 business days", "Cash runway ≥ 24mo"],
    metrics: [
      { label: "Cash", unit: "$M", points: series(42, 0.04) },
      { label: "Burn", unit: "$K", points: series(820, -0.05) },
      { label: "DSO", unit: "d", points: series(37, -0.04) },
      { label: "AR", unit: "$K", points: series(620, 0.06) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "ERP migration phase 1",
        owner: "Finance",
        progress: 42,
        due: "in 60d",
        status: "On track",
      },
      {
        id: "i2",
        title: "Dunning automation",
        owner: "AR",
        progress: 78,
        due: "in 12d",
        status: "On track",
      },
      {
        id: "i3",
        title: "Audit prep",
        owner: "Controller",
        progress: 25,
        due: "in 90d",
        status: "On track",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "Revenue recognition policy",
        kind: "Policy",
        owner: "Controller",
        updated: "30d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "FP&A model 2026",
        kind: "Spec",
        owner: "FP&A",
        updated: "2d",
        status: "In review",
      },
      {
        id: "d3",
        title: "Procurement SOP",
        kind: "SOP",
        owner: "AP",
        updated: "14d",
        status: "Approved",
      },
      {
        id: "d4",
        title: "Board pack template",
        kind: "Template",
        owner: "CFO",
        updated: "8d",
        status: "Approved",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Q4 board pack draft",
        type: "Deck",
        owner: "CFO",
        updated: "1d",
        status: "Draft",
      },
      {
        id: "a2",
        title: "Investor update — Nov",
        type: "Email",
        owner: "CFO",
        updated: "9d",
        status: "Published",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "NetSuite",
        category: "ERP",
        spendYtd: 220_000,
        contractEnds: "in 180d",
        rating: 4,
        status: "Active",
        owner: "Finance",
      },
      {
        id: "v2",
        name: "Stripe",
        category: "Payments",
        spendYtd: 0,
        contractEnds: "Evergreen",
        rating: 5,
        status: "Active",
        owner: "Finance",
      },
      {
        id: "v3",
        name: "Carta",
        category: "Cap table",
        spendYtd: 24_000,
        contractEnds: "in 220d",
        rating: 4,
        status: "Active",
        owner: "Finance",
      },
    ],
    budget: [
      { id: "b1", category: "G&A — tooling", budget: 420_000, spent: 284_000, forecast: 410_000 },
      { id: "b2", category: "Audit & tax", budget: 180_000, spent: 64_000, forecast: 172_000 },
    ],
    revenue: [
      {
        id: "r1",
        source: "Recognized revenue (YTD)",
        amount: 18_400_000,
        delta: "+19%",
        trend: "up",
      },
      { id: "r2", source: "Deferred revenue", amount: 7_200_000, delta: "+12%", trend: "up" },
      { id: "r3", source: "Cash collected (90d)", amount: 6_800_000, delta: "+8%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "INV-2041",
        party: "Helix Pharma",
        amount: 96_000,
        due: "-47d",
        status: "Overdue",
        type: "Invoice",
      },
      {
        id: "bl2",
        ref: "INV-2031",
        party: "Brightwave Foods",
        amount: 26_000,
        due: "-62d",
        status: "Overdue",
        type: "Invoice",
      },
      {
        id: "bl3",
        ref: "INV-2058",
        party: "Orion Capital",
        amount: 130_000,
        due: "in 27d",
        status: "Open",
        type: "Invoice",
      },
      {
        id: "bl4",
        ref: "BILL-AWS",
        party: "AWS",
        amount: 412_000,
        due: "in 8d",
        status: "Open",
        type: "Bill",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "Invoice overdue 7d → dunning",
        trigger: "AR aging",
        runsMo: 28,
        successPct: 78,
        status: "Live",
      },
      {
        id: "au2",
        name: "Bill approval > $10K → CFO",
        trigger: "Bill posted",
        runsMo: 14,
        successPct: 100,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Yara F.", role: "Controller", load: 86, focus: "Close, audit" },
      { id: "t2", name: "Jon T.", role: "FP&A", load: 72, focus: "Model 2026" },
      { id: "t3", name: "Eli K.", role: "AR", load: 68, focus: "Dunning" },
    ],
    reports: [
      {
        id: "rp1",
        title: "Cash & burn weekly",
        cadence: "Weekly",
        audience: "CEO + CFO",
        lastRun: "Mon",
      },
      { id: "rp2", title: "AR aging", cadence: "Weekly", audience: "Finance + CS", lastRun: "Mon" },
      { id: "rp3", title: "Board pack", cadence: "Quarterly", audience: "Board", lastRun: "45d" },
    ],
    twinActions: [
      { id: "ta1", title: "Send dunning to Helix", rationale: "47d overdue, $96K", impact: "Cash" },
      {
        id: "ta2",
        title: "Draft Q4 board narrative",
        rationale: "Pack due in 12d",
        impact: "Governance",
      },
    ],
  },

  legal: {
    charters: [
      "MSA turnaround < 5 days",
      "100% DPA coverage on EU customers",
      "Zero unresolved compliance gaps",
    ],
    metrics: [
      { label: "Turnaround", unit: "d", points: series(6, -0.1) },
      { label: "Active contracts", points: series(124, 0.04) },
      { label: "Compliance", unit: "%", points: series(93, 0.02) },
      { label: "In review", points: series(8, -0.05) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "SOC2 Type II renewal",
        owner: "Legal + Sec",
        progress: 64,
        due: "in 28d",
        status: "On track",
      },
      {
        id: "i2",
        title: "EU DPA template refresh",
        owner: "Legal",
        progress: 40,
        due: "in 45d",
        status: "On track",
      },
      {
        id: "i3",
        title: "Vendor risk program",
        owner: "Legal Ops",
        progress: 22,
        due: "in 70d",
        status: "At risk",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "MSA — Enterprise 2026",
        kind: "Contract",
        owner: "GC",
        updated: "10d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "DPA — EU customers",
        kind: "Contract",
        owner: "Privacy",
        updated: "4d",
        status: "In review",
      },
      {
        id: "d3",
        title: "Acceptable use policy",
        kind: "Policy",
        owner: "Legal",
        updated: "30d",
        status: "Approved",
      },
      {
        id: "d4",
        title: "Redline guidelines",
        kind: "SOP",
        owner: "Legal Ops",
        updated: "12d",
        status: "Approved",
      },
      {
        id: "d5",
        title: "Sub-processor list",
        kind: "Policy",
        owner: "Privacy",
        updated: "2d",
        status: "Approved",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Trust center",
        type: "Landing page",
        owner: "Legal + Marketing",
        updated: "6d",
        views: 4200,
        status: "Published",
      },
      {
        id: "a2",
        title: "Security one-pager",
        type: "One-pager",
        owner: "Sec",
        updated: "8d",
        views: 720,
        status: "Published",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "Ironclad",
        category: "CLM",
        spendYtd: 84_000,
        contractEnds: "in 200d",
        rating: 4,
        status: "Active",
        owner: "Legal",
      },
      {
        id: "v2",
        name: "Vanta",
        category: "Compliance",
        spendYtd: 36_000,
        contractEnds: "in 90d",
        rating: 5,
        status: "Active",
        owner: "Sec",
      },
    ],
    budget: [
      { id: "b1", category: "Outside counsel", budget: 320_000, spent: 184_000, forecast: 308_000 },
      { id: "b2", category: "Tooling", budget: 180_000, spent: 112_000, forecast: 174_000 },
    ],
    revenue: [
      {
        id: "r1",
        source: "Trust as enabler (won deals citing trust)",
        amount: 2_400_000,
        delta: "+22%",
        trend: "up",
      },
    ],
    billing: [
      {
        id: "bl1",
        ref: "BILL-LG-22",
        party: "Outside counsel · Acme",
        amount: 38_000,
        due: "in 14d",
        status: "Open",
        type: "Bill",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "Contract expiring 30d → owner",
        trigger: "Date",
        runsMo: 12,
        successPct: 100,
        status: "Live",
      },
      {
        id: "au2",
        name: "NDA request → auto-redline",
        trigger: "Form",
        runsMo: 42,
        successPct: 88,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Hadi N.", role: "GC", load: 84, focus: "Enterprise deals" },
      { id: "t2", name: "Ines V.", role: "Privacy", load: 76, focus: "DPA, SOC2" },
    ],
    reports: [
      {
        id: "rp1",
        title: "Contract pipeline",
        cadence: "Weekly",
        audience: "GC + RevOps",
        lastRun: "Mon",
      },
      {
        id: "rp2",
        title: "Compliance posture",
        cadence: "Monthly",
        audience: "Exec",
        lastRun: "11d",
      },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Auto-redline Aperture NDA",
        rationale: "Expires 7d, standard terms",
        impact: "Speed",
      },
    ],
  },

  hr: {
    charters: ["eNPS ≥ 40", "Fill critical roles in 45d", "Onboarding NPS ≥ 60"],
    metrics: [
      { label: "Headcount", points: series(118, 0.05) },
      { label: "Open roles", points: series(7, -0.1) },
      { label: "Time to hire", unit: "d", points: series(48, -0.06) },
      { label: "eNPS", points: series(36, 0.05) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "Career framework rollout",
        owner: "People Ops",
        progress: 70,
        due: "in 14d",
        status: "On track",
      },
      {
        id: "i2",
        title: "EMEA recruiting",
        owner: "TA",
        progress: 38,
        due: "in 45d",
        status: "On track",
      },
      {
        id: "i3",
        title: "Manager training",
        owner: "L&D",
        progress: 22,
        due: "in 60d",
        status: "At risk",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "Employee handbook 2026",
        kind: "Policy",
        owner: "People Ops",
        updated: "9d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "Comp bands",
        kind: "Spec",
        owner: "Total Rewards",
        updated: "30d",
        status: "Approved",
      },
      {
        id: "d3",
        title: "Onboarding SOP",
        kind: "SOP",
        owner: "People Ops",
        updated: "12d",
        status: "Approved",
      },
      {
        id: "d4",
        title: "Performance review template",
        kind: "Template",
        owner: "L&D",
        updated: "4d",
        status: "In review",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Careers landing page",
        type: "Landing page",
        owner: "Brand + TA",
        updated: "5d",
        views: 8400,
        status: "Published",
      },
      {
        id: "a2",
        title: "Culture deck",
        type: "Deck",
        owner: "People Ops",
        updated: "21d",
        views: 612,
        status: "Published",
      },
      {
        id: "a3",
        title: "Recruiter outreach script",
        type: "Sales script",
        owner: "TA",
        updated: "6d",
        status: "Published",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "Rippling",
        category: "HRIS",
        spendYtd: 124_000,
        contractEnds: "in 160d",
        rating: 4,
        status: "Active",
        owner: "People",
      },
      {
        id: "v2",
        name: "Greenhouse",
        category: "ATS",
        spendYtd: 84_000,
        contractEnds: "in 90d",
        rating: 5,
        status: "Renewing",
        owner: "TA",
      },
      {
        id: "v3",
        name: "Lattice",
        category: "Performance",
        spendYtd: 36_000,
        contractEnds: "in 280d",
        rating: 4,
        status: "Active",
        owner: "L&D",
      },
    ],
    budget: [
      { id: "b1", category: "Recruiting", budget: 320_000, spent: 212_000, forecast: 312_000 },
      { id: "b2", category: "L&D", budget: 180_000, spent: 84_000, forecast: 168_000 },
      { id: "b3", category: "Tooling", budget: 260_000, spent: 168_000, forecast: 254_000 },
    ],
    revenue: [
      { id: "r1", source: "Productivity uplift (proxy)", amount: 0, delta: "+9%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "BILL-HR-04",
        party: "Greenhouse",
        amount: 8_000,
        due: "in 22d",
        status: "Scheduled",
        type: "Subscription",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "Offer accepted → onboarding",
        trigger: "ATS stage",
        runsMo: 6,
        successPct: 100,
        status: "Live",
      },
      {
        id: "au2",
        name: "30/60/90 surveys",
        trigger: "Tenure",
        runsMo: 18,
        successPct: 96,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Nora B.", role: "CPO", load: 88, focus: "Career framework" },
      { id: "t2", name: "Kai S.", role: "TA Lead", load: 82, focus: "EMEA hiring" },
    ],
    reports: [
      {
        id: "rp1",
        title: "Hiring dashboard",
        cadence: "Weekly",
        audience: "Hiring mgrs",
        lastRun: "Mon",
      },
      {
        id: "rp2",
        title: "Headcount & attrition",
        cadence: "Monthly",
        audience: "Exec",
        lastRun: "6d",
      },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Draft EMEA AE JD",
        rationale: "Open req 18d, low pipeline",
        impact: "Hiring speed",
      },
    ],
  },

  sc: {
    charters: ["On-time ≥ 95%", "Inventory cover 30–60d", "Cut landed cost 8%"],
    metrics: [
      { label: "On-time", unit: "%", points: series(86, 0.03) },
      { label: "Cover", unit: "d", points: series(48, -0.04) },
      { label: "Shipments", points: series(120, 0.06) },
      { label: "Lead time", unit: "d", points: series(28, -0.05) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "Dual-source rack SKUs",
        owner: "Sourcing",
        progress: 55,
        due: "in 28d",
        status: "On track",
      },
      {
        id: "i2",
        title: "WMS upgrade",
        owner: "Ops",
        progress: 30,
        due: "in 60d",
        status: "At risk",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "Vendor onboarding SOP",
        kind: "SOP",
        owner: "Sourcing",
        updated: "10d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "Incoterms cheat sheet",
        kind: "Template",
        owner: "Logistics",
        updated: "30d",
        status: "Approved",
      },
      {
        id: "d3",
        title: "Quality spec — SVR-RACK-42U",
        kind: "Spec",
        owner: "QA",
        updated: "6d",
        status: "Approved",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Supplier scorecard template",
        type: "Template",
        owner: "Sourcing",
        updated: "12d",
        status: "Published",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "Anker Manufacturing",
        category: "Hardware",
        spendYtd: 1_240_000,
        contractEnds: "in 70d",
        rating: 4,
        status: "Renewing",
        owner: "Sourcing",
      },
      {
        id: "v2",
        name: "Pacific Freight",
        category: "Logistics",
        spendYtd: 420_000,
        contractEnds: "in 180d",
        rating: 3,
        status: "Active",
        owner: "Logistics",
      },
      {
        id: "v3",
        name: "FiberCo",
        category: "Cables",
        spendYtd: 184_000,
        contractEnds: "in 30d",
        rating: 3,
        status: "At risk",
        owner: "Sourcing",
      },
    ],
    budget: [
      {
        id: "b1",
        category: "COGS — hardware",
        budget: 4_200_000,
        spent: 2_980_000,
        forecast: 4_180_000,
      },
      { id: "b2", category: "Logistics", budget: 620_000, spent: 432_000, forecast: 608_000 },
    ],
    revenue: [
      { id: "r1", source: "Hardware bundle attach", amount: 1_840_000, delta: "+12%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "PO-7741",
        party: "Anker Manufacturing",
        amount: 220_000,
        due: "in 18d",
        status: "Open",
        type: "PO",
      },
      {
        id: "bl2",
        ref: "PO-7745",
        party: "Pacific Freight",
        amount: 64_000,
        due: "in 7d",
        status: "Open",
        type: "Bill",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "ETA slip > 3d → CS notify",
        trigger: "Carrier event",
        runsMo: 14,
        successPct: 92,
        status: "Live",
      },
      {
        id: "au2",
        name: "Stock < safety → reorder draft",
        trigger: "Inventory",
        runsMo: 22,
        successPct: 86,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Bryn O.", role: "Head of SC", load: 82, focus: "Dual-source" },
      { id: "t2", name: "Tomás L.", role: "Logistics", load: 74, focus: "Carriers" },
    ],
    reports: [
      {
        id: "rp1",
        title: "On-time & cover",
        cadence: "Weekly",
        audience: "Ops + CS",
        lastRun: "Mon",
      },
      { id: "rp2", title: "Landed cost", cadence: "Monthly", audience: "Finance", lastRun: "8d" },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Open RFQ for FiberCo alt",
        rationale: "Contract 30d, rating 3",
        impact: "Risk",
      },
    ],
  },

  svc: {
    charters: ["TTV ≤ 45d", "Utilization 75–80%", "Engagement health ≥ 80% Green"],
    metrics: [
      { label: "TTV", unit: "d", points: series(46, -0.06) },
      { label: "Utilization", unit: "%", points: series(74, 0.04) },
      { label: "Active engs.", points: series(18, 0.08) },
      { label: "Margin", unit: "%", points: series(38, 0.05) },
    ],
    initiatives: [
      {
        id: "i1",
        title: "Helix recovery plan",
        owner: "Marcus T.",
        progress: 35,
        due: "in 21d",
        status: "At risk",
      },
      {
        id: "i2",
        title: "Partner-led delivery pilot",
        owner: "Services",
        progress: 50,
        due: "in 40d",
        status: "On track",
      },
    ],
    documents: [
      {
        id: "d1",
        title: "SOW template — Implementation",
        kind: "Template",
        owner: "Services",
        updated: "9d",
        status: "Approved",
      },
      {
        id: "d2",
        title: "Onboarding playbook",
        kind: "SOP",
        owner: "Services",
        updated: "3d",
        status: "Approved",
      },
      {
        id: "d3",
        title: "RACI — Implementation",
        kind: "Spec",
        owner: "PMO",
        updated: "12d",
        status: "Approved",
      },
    ],
    assets: [
      {
        id: "a1",
        title: "Implementation deck",
        type: "Deck",
        owner: "Services",
        updated: "4d",
        views: 312,
        status: "Published",
      },
      {
        id: "a2",
        title: "Kickoff checklist",
        type: "Template",
        owner: "PMO",
        updated: "8d",
        status: "Published",
      },
    ],
    vendors: [
      {
        id: "v1",
        name: "Partner · NorthStar",
        category: "Implementation partner",
        spendYtd: 320_000,
        contractEnds: "in 120d",
        rating: 4,
        status: "Active",
        owner: "Services",
      },
      {
        id: "v2",
        name: "Smartsheet",
        category: "PMO tooling",
        spendYtd: 28_000,
        contractEnds: "in 220d",
        rating: 4,
        status: "Active",
        owner: "PMO",
      },
    ],
    budget: [
      {
        id: "b1",
        category: "Delivery headcount",
        budget: 1_800_000,
        spent: 1_240_000,
        forecast: 1_770_000,
      },
      { id: "b2", category: "Partner spend", budget: 420_000, spent: 312_000, forecast: 416_000 },
    ],
    revenue: [
      { id: "r1", source: "Services revenue", amount: 1_640_000, delta: "+14%", trend: "up" },
      { id: "r2", source: "Partner-attached", amount: 380_000, delta: "+24%", trend: "up" },
    ],
    billing: [
      {
        id: "bl1",
        ref: "SOW-220",
        party: "Northwind Logistics",
        amount: 84_000,
        due: "in 30d",
        status: "Open",
        type: "Invoice",
      },
      {
        id: "bl2",
        ref: "SOW-231",
        party: "Helix Pharma",
        amount: 120_000,
        due: "in 14d",
        status: "Open",
        type: "Invoice",
      },
    ],
    automations: [
      {
        id: "au1",
        name: "Engagement Red → exec ping",
        trigger: "Status change",
        runsMo: 4,
        successPct: 100,
        status: "Live",
      },
      {
        id: "au2",
        name: "Milestone done → invoice draft",
        trigger: "Project event",
        runsMo: 12,
        successPct: 92,
        status: "Live",
      },
    ],
    team: [
      { id: "t1", name: "Owen K.", role: "Delivery Lead", load: 82, focus: "Helix" },
      { id: "t2", name: "Reya P.", role: "PMO", load: 68, focus: "Northwind" },
    ],
    reports: [
      {
        id: "rp1",
        title: "Engagement health",
        cadence: "Weekly",
        audience: "Services + CS",
        lastRun: "Mon",
      },
      {
        id: "rp2",
        title: "Utilization & margin",
        cadence: "Monthly",
        audience: "COO + CFO",
        lastRun: "9d",
      },
    ],
    twinActions: [
      {
        id: "ta1",
        title: "Build Helix recovery plan",
        rationale: "Engagement Red, 34% progress",
        impact: "$1.2M ARR",
      },
    ],
  },
};
