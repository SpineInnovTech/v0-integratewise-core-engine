// Canonical entity types modeled after the Spine schemas.
// Each department's primary entity extends EntityBase.

export type DeptCode =
  | "cs"
  | "sales"
  | "marketing"
  | "revops"
  | "support"
  | "eng"
  | "product"
  | "finance"
  | "legal"
  | "hr"
  | "sc"
  | "svc";

export type HealthLevel = "ok" | "warn" | "critical";

export interface EntityBase {
  id: string;
  name: string;
  owner: string;
  updatedAt: string; // ISO
}

export interface Account extends EntityBase {
  arr: number;
  health: number; // 0-100
  renewalDays: number;
  segment: "SMB" | "Mid" | "Enterprise";
}

export interface Deal extends EntityBase {
  stage: "Discovery" | "Demo" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";
  amount: number;
  closeDate: string;
  champion: string;
  daysInStage: number;
}

export interface Campaign extends EntityBase {
  channel: "Email" | "Paid" | "Organic" | "Event" | "Partner";
  mqls: number;
  cpl: number;
  status: "Live" | "Paused" | "Draft";
}

export interface PipelineSlice extends EntityBase {
  arr: number;
  mrr: number;
  nrr: number;
  grr: number;
  coverage: number; // pipeline coverage ratio
}

export interface Ticket extends EntityBase {
  priority: "P1" | "P2" | "P3";
  status: "Open" | "Pending" | "Resolved";
  slaBreach: boolean;
  account: string;
}

export interface Incident extends EntityBase {
  severity: "SEV1" | "SEV2" | "SEV3";
  status: "Open" | "Mitigating" | "Resolved";
  service: string;
  mttrMin: number;
}

export interface FeatureItem extends EntityBase {
  state: "Backlog" | "In progress" | "Beta" | "Shipped";
  votes: number;
  squad: string;
}

export interface Invoice extends EntityBase {
  account: string;
  amount: number;
  ageDays: number;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
}

export interface Contract extends EntityBase {
  account: string;
  expiresDays: number;
  type: "MSA" | "DPA" | "Order Form" | "NDA";
  status: "Active" | "Expiring" | "In review";
}

export interface Employee extends EntityBase {
  role: string;
  load: number; // 0-100
  status: "Active" | "Onboarding" | "On leave";
}

export interface Shipment extends EntityBase {
  sku: string;
  qty: number;
  eta: string;
  status: "On time" | "At risk" | "Delayed";
}

export interface Engagement extends EntityBase {
  account: string;
  type: "Onboarding" | "Implementation" | "Advisory";
  progress: number;
  status: "Green" | "Yellow" | "Red";
}

/** Strategy & Leadership — company-level objectives the founder tracks. */
export interface Objective extends EntityBase {
  horizon: "Q" | "H" | "Y";
  progress: number; // 0-100
  confidence: "high" | "med" | "low";
  metric: string;
  target: string;
  current: string;
  status: "On track" | "At risk" | "Off track";
}

/** Knowledge Management — promoted artifacts in the Spine. */
export interface KnowledgeArtifact extends EntityBase {
  kind: "Doctrine" | "Playbook" | "Spec" | "Memo" | "Runbook" | "Brief";
  promotions: number;
  citations: number;
  status: "Draft" | "Promoted" | "Canonical" | "Retired";
}

export interface Signal {
  id: string;
  dept: DeptCode;
  entity: string;
  message: string;
  level: HealthLevel;
  impact: number; // currency or score
}

/** Commitment — a promise made to a counterparty. Surface: DECIDE. */
export interface Commitment extends EntityBase {
  to: string; // counterparty (account, board, regulator, candidate)
  promise: string;
  dueDays: number; // negative = overdue
  surface: "decide" | "build" | "grow" | "run";
  status: "Open" | "At risk" | "Kept" | "Missed";
  source: string; // where the promise was captured (deal note, email, contract)
}

/** Decision — a recorded choice with rationale. Surface: DECIDE. */
export interface Decision extends EntityBase {
  decision: string;
  rationale: string;
  decidedOn: string; // ISO
  decidedBy: string;
  status: "Active" | "Superseded" | "Revisit";
  surface: "decide" | "build" | "grow" | "run";
}

/** Blocker — anything preventing forward motion. Surface: BUILD. */
export interface Blocker extends EntityBase {
  blocks: string; // what is blocked (task / commitment / deal)
  reason: string;
  ageDays: number;
  surface: "decide" | "build" | "grow" | "run";
  severity: "low" | "med" | "high";
  needs: string; // what would unblock it
}
