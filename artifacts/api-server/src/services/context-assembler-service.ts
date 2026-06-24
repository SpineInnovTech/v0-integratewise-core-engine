import type { MemoryAtomRow, SpineGoalRow } from "@workspace/db";
import * as leadsRepo from "../repositories/leads";
import * as clientsRepo from "../repositories/clients";
import * as dealsRepo from "../repositories/deals";
import * as activitiesRepo from "../repositories/activities";
import * as tasksRepo from "../repositories/tasks";
import * as memoryRepo from "../repositories/memory-atoms";
import * as goalsRepo from "../repositories/goals";
import * as metricsRepo from "../repositories/metrics";
import type { MetricWithGoal } from "../repositories/metrics";
import { embed, embeddingCapability, lexicalScore, cosine } from "./embedding-service";
import { listSpineTools } from "../connectors/spine";

// The context-assembler is the moat made visible: for one subject it composes
// every store into a SINGLE provenance-tagged projection — structured CRM records,
// the unified memory atoms, the goal/metric anchor, and a best-effort remote Spine
// reachability read. It owns NO truth. Every contributing store reports its own
// availability honestly (live | empty | unavailable); nothing is guessed or faked,
// and the coverage block makes the "memory deepens as you connect tools" story
// literal and measurable.

const DEFAULT_TENANT = process.env["SPINE_TENANT_ID"] ?? "iw-customer-zero";
const TOTAL_STORES = 5; // structured, memory, goals, metrics, spine

type StoreStatus = "live" | "empty" | "unavailable";

export interface AssembleInput {
  tenantId?: string;
  subjectType: string;
  subjectId: string;
  query?: string;
  entityRef?: Record<string, unknown> | null;
  limit?: number;
}

export interface ContextFragment {
  id: string;
  origin: "record" | "memory";
  kind: string;
  title: string;
  body: string;
  source: Record<string, unknown>;
  provenance: Record<string, unknown>;
  salience: number;
  score: number | null;
  occurredAt: string | null;
}

export interface PacketGoal {
  id: string;
  type: string;
  domain: string;
  name: string;
  description: string | null;
  status: string;
  cadence: string | null;
}

export interface PacketMetric {
  id: string;
  name: string;
  domain: string;
  unit: string | null;
  formula: string | null;
  status: "ok" | "insufficient_data";
  statusReason: string;
  goal: { id: string; name: string } | null;
}

export interface ContextPacket {
  subject: {
    tenantId: string;
    subjectType: string;
    subjectId: string;
    label: string;
    ref: Record<string, unknown>;
  };
  query: string | null;
  fragments: ContextFragment[];
  goals: PacketGoal[];
  metrics: PacketMetric[];
  spine: { availability: StoreStatus; note: string; toolsCount: number | null };
  coverage: {
    stores: Record<string, number>;
    contributingStores: number;
    totalStores: number;
    depthScore: number;
    gaps: { store: string; hint: string }[];
  };
  availability: {
    structured: StoreStatus;
    memory: StoreStatus;
    goals: StoreStatus;
    metrics: StoreStatus;
    spine: StoreStatus;
    embedding: StoreStatus;
  };
  generatedAt: string;
}

function dollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function iso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

interface StructuredResult {
  label: string;
  fragments: ContextFragment[];
  status: StoreStatus;
  note: string;
}

/**
 * Resolve a subject's structured CRM footprint into record fragments. Today the
 * live vertical slice is the lead (with its activities, deal, client, tasks);
 * other subject types degrade honestly to "unavailable" rather than faking data.
 */
async function resolveStructured(
  subjectType: string,
  subjectId: string,
): Promise<StructuredResult> {
  if (subjectType !== "lead") {
    return {
      label: subjectId,
      fragments: [],
      status: "unavailable",
      note: `Structured records for subject type "${subjectType}" are not wired into the assembler yet (lead is the live slice).`,
    };
  }

  const lead = await leadsRepo.findById(subjectId);
  if (!lead) {
    return {
      label: subjectId,
      fragments: [],
      status: "empty",
      note: "No lead record found for this id.",
    };
  }

  const [client, deal, activityRows, taskRows] = await Promise.all([
    lead.clientId ? clientsRepo.findById(lead.clientId) : Promise.resolve(undefined),
    dealsRepo.findByLeadId(lead.id),
    activitiesRepo.findByLeadId(lead.id),
    tasksRepo.findByLeadId(lead.id),
  ]);

  const label = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() ||
    lead.company ||
    lead.email ||
    lead.id;

  const fragments: ContextFragment[] = [];

  fragments.push({
    id: `record:lead:${lead.id}`,
    origin: "record",
    kind: "fact",
    title: `${label}${lead.company ? ` — ${lead.company}` : ""}`,
    body: [
      lead.jobTitle ? `Role: ${lead.jobTitle}` : null,
      lead.email ? `Email: ${lead.email}` : null,
      lead.status ? `Status: ${lead.status}` : null,
      typeof lead.score === "number" ? `Score: ${lead.score}` : null,
      lead.owner ? `Owner: ${lead.owner}` : null,
      lead.source ? `Source: ${lead.source}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    source: { connector: "relay", entity_type: "lead", external_id: lead.id },
    provenance: { evidence_chain: ["table=leads", `id=${lead.id}`] },
    salience: 0.9,
    score: null,
    occurredAt: iso(lead.createdAt),
  });

  if (client) {
    fragments.push({
      id: `record:client:${client.id}`,
      origin: "record",
      kind: "fact",
      title: `Account: ${client.name}`,
      body: [
        client.industry ? `Industry: ${client.industry}` : null,
        client.status ? `Status: ${client.status}` : null,
        typeof client.healthScore === "number" ? `Health: ${client.healthScore}` : null,
        client.mrrCents != null ? `MRR: ${dollars(client.mrrCents)}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      source: { connector: "relay", entity_type: "client", external_id: client.id },
      provenance: { evidence_chain: ["table=clients", `id=${client.id}`] },
      salience: 0.7,
      score: null,
      occurredAt: iso(client.createdAt),
    });
  }

  if (deal) {
    fragments.push({
      id: `record:deal:${deal.id}`,
      origin: "record",
      kind: "signal",
      title: `Deal: ${deal.title}`,
      body: [
        deal.stage ? `Stage: ${deal.stage}` : null,
        deal.valueCents != null ? `Value: ${dollars(deal.valueCents)}` : null,
        typeof deal.probability === "number" ? `Win%: ${deal.probability}` : null,
        deal.closeDate ? `Close: ${deal.closeDate}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      source: { connector: "relay", entity_type: "deal", external_id: deal.id },
      provenance: { evidence_chain: ["table=deals", `id=${deal.id}`] },
      salience: 0.8,
      score: null,
      occurredAt: iso(deal.createdAt),
    });
  }

  for (const a of activityRows) {
    fragments.push({
      id: `record:activity:${a.id}`,
      origin: "record",
      kind: "interaction",
      title: a.summary,
      body: a.body ?? "",
      source: {
        connector: "relay",
        entity_type: "activity",
        external_id: a.id,
        type: a.type,
        actor: a.actor,
      },
      provenance: { evidence_chain: ["table=activities", `id=${a.id}`] },
      salience: 0.5,
      score: null,
      occurredAt: iso(a.occurredAt ?? a.createdAt),
    });
  }

  for (const t of taskRows) {
    fragments.push({
      id: `record:task:${t.id}`,
      origin: "record",
      kind: "signal",
      title: `Task: ${t.title}`,
      body: [
        t.status ? `Status: ${t.status}` : null,
        t.priority ? `Priority: ${t.priority}` : null,
        t.dueDate ? `Due: ${t.dueDate}` : null,
        t.assignedTo ? `Owner: ${t.assignedTo}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      source: { connector: "relay", entity_type: "task", external_id: t.id },
      provenance: { evidence_chain: ["table=tasks", `id=${t.id}`] },
      salience: 0.4,
      score: null,
      occurredAt: iso(t.createdAt),
    });
  }

  return { label, fragments, status: "live", note: "" };
}

function atomToFragment(a: MemoryAtomRow, score: number | null): ContextFragment {
  return {
    id: `memory:${a.id}`,
    origin: "memory",
    kind: a.kind,
    title: a.title,
    body: a.body,
    source: (a.source ?? {}) as Record<string, unknown>,
    provenance: (a.provenance ?? {}) as Record<string, unknown>,
    salience: a.salience,
    score,
    occurredAt: iso(a.createdAt),
  };
}

async function rankMemory(
  atoms: MemoryAtomRow[],
  query: string | undefined,
  limit: number,
): Promise<ContextFragment[]> {
  if (!query || !query.trim()) {
    // Already ordered by salience + recency from the repository.
    return atoms.slice(0, limit).map((a) => atomToFragment(a, null));
  }

  const cap = embeddingCapability();
  let qvec: number[] | null = null;
  if (cap.available) {
    const e = await embed(query);
    qvec = e.vector;
  }

  const scored = atoms
    .map((a) => {
      const score =
        qvec && a.embedding
          ? cosine(qvec, a.embedding)
          : lexicalScore(query, `${a.title} ${a.body}`);
      return { a, score };
    })
    .sort((x, y) => y.score - x.score);

  return scored.slice(0, limit).map(({ a, score }) => atomToFragment(a, score));
}

function toPacketGoal(g: SpineGoalRow): PacketGoal {
  return {
    id: g.id,
    type: g.type,
    domain: g.domain,
    name: g.name,
    description: g.description ?? null,
    status: g.status,
    cadence: g.cadence ?? null,
  };
}

function toPacketMetric(m: MetricWithGoal): PacketMetric {
  // Automatic metric computation is intentionally deferred: we surface the metric
  // and its anchoring goal but mark it insufficient_data rather than inventing a
  // value. This is the honest version of "what we could measure once data flows".
  return {
    id: m.id,
    name: m.name,
    domain: m.domain,
    unit: m.unit ?? null,
    formula: m.formula ?? null,
    status: "insufficient_data",
    statusReason:
      "No observations connected yet — wire a connector or log activity to start measuring this metric.",
    goal: m.goal ? { id: m.goal.id, name: m.goal.name } : null,
  };
}

export async function assembleContext(
  input: AssembleInput,
): Promise<ContextPacket> {
  const tenantId = input.tenantId ?? DEFAULT_TENANT;
  const { subjectType, subjectId } = input;
  const query = input.query?.trim() || undefined;
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);

  const [structured, atoms, goals, metrics] = await Promise.all([
    resolveStructured(subjectType, subjectId),
    memoryRepo.recentBySubject(tenantId, subjectType, subjectId, 200),
    goalsRepo.listGoals(tenantId),
    metricsRepo.listMetricsWithGoals(tenantId),
  ]);

  const memoryFragments = await rankMemory(atoms, query, limit);

  // Best-effort remote Spine reachability. We do NOT pull remote entities here
  // (deferred); we report whether the platform is reachable so coverage is honest
  // about local-only vs. platform-connected operation.
  let spine: ContextPacket["spine"];
  try {
    const tools = await listSpineTools();
    spine = {
      availability: "live",
      note: `Spine reachable (${tools.length} tools). Remote entity reads are deferred; running on local memory.`,
      toolsCount: tools.length,
    };
  } catch {
    spine = {
      availability: "unavailable",
      note: "Remote Spine not reachable — assembling from local memory only.",
      toolsCount: null,
    };
  }

  const availability: ContextPacket["availability"] = {
    structured: structured.status,
    memory: atoms.length > 0 ? "live" : "empty",
    goals: goals.length > 0 ? "live" : "empty",
    metrics: metrics.length > 0 ? "live" : "empty",
    spine: spine.availability,
    embedding: embeddingCapability().available ? "live" : "unavailable",
  };

  const stores: Record<string, number> = {
    structured: structured.fragments.length,
    memory: atoms.length,
    goals: goals.length,
    metrics: metrics.length,
    spine: spine.toolsCount ?? 0,
  };

  const contributingStores =
    (structured.fragments.length > 0 ? 1 : 0) +
    (atoms.length > 0 ? 1 : 0) +
    (goals.length > 0 ? 1 : 0) +
    (metrics.length > 0 ? 1 : 0) +
    (spine.availability === "live" ? 1 : 0);

  const gaps: { store: string; hint: string }[] = [];
  if (structured.fragments.length === 0)
    gaps.push({
      store: "structured",
      hint: structured.note || "No CRM records for this subject yet.",
    });
  if (atoms.length === 0)
    gaps.push({
      store: "memory",
      hint: "No memory atoms yet — connect Gmail or log activity through the Twin to start compounding.",
    });
  if (goals.length === 0)
    gaps.push({
      store: "goals",
      hint: "No goals defined — add a goal so metrics and memory ladder up to intent.",
    });
  if (metrics.length === 0)
    gaps.push({ store: "metrics", hint: "No metrics defined for this tenant." });
  if (spine.availability !== "live")
    gaps.push({ store: "spine", hint: spine.note });
  if (!availability.embedding || availability.embedding === "unavailable")
    gaps.push({
      store: "embedding",
      hint: "Semantic embeddings off — recall uses lexical + salience + recency. Wire an embeddings provider to deepen recall.",
    });

  const fragments = [...structured.fragments, ...memoryFragments];

  return {
    subject: {
      tenantId,
      subjectType,
      subjectId,
      label: structured.label,
      ref: {
        tenant_id: tenantId,
        entity_type: subjectType,
        entity_id: subjectId,
        ...(input.entityRef ?? {}),
      },
    },
    query: query ?? null,
    fragments,
    goals: goals.map(toPacketGoal),
    metrics: metrics.map(toPacketMetric),
    spine,
    coverage: {
      stores,
      contributingStores,
      totalStores: TOTAL_STORES,
      depthScore: Math.round((contributingStores / TOTAL_STORES) * 100) / 100,
      gaps,
    },
    availability,
    generatedAt: new Date().toISOString(),
  };
}
