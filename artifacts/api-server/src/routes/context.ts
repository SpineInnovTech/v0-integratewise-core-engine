import { Router, type IRouter } from "express";
import {
  GetContextPacketQueryParams,
  GetContextPacketResponse,
  RememberContextBody,
  ListContextGoalsQueryParams,
  ListContextGoalsResponse,
  ListContextMetricsQueryParams,
  ListContextMetricsResponse,
  GetContextCoverageQueryParams,
  GetContextCoverageResponse,
} from "@workspace/api-zod";
import { assembleContext } from "../services/context-assembler-service";
import { remember } from "../services/memory-writer-service";
import * as goalsRepo from "../repositories/goals";
import * as metricsRepo from "../repositories/metrics";

// /api/context/* — the contextual-memory surface. The packet endpoint assembles
// the ONE provenance-tagged projection per subject; remember() is the single
// idempotent doorway through which memory grows; goals/metrics/coverage expose the
// anchor and the "how deep is this memory" story. Mirrors the leads route: zod at
// the edge, services own the logic, honest availability over silent fallback.

const DEFAULT_TENANT = process.env["SPINE_TENANT_ID"] ?? "iw-customer-zero";

const router: IRouter = Router();

router.get("/context/packet", async (req, res): Promise<void> => {
  const params = GetContextPacketQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const packet = await assembleContext({
    tenantId: params.data.tenantId,
    subjectType: params.data.subjectType,
    subjectId: params.data.subjectId,
    query: params.data.query,
    limit: params.data.limit,
  });

  res.json(GetContextPacketResponse.parse(packet));
});

router.post("/context/remember", async (req, res): Promise<void> => {
  const parsed = RememberContextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const b = parsed.data;
  const tenantId = b.tenantId ?? b.subjectRef.tenant_id ?? DEFAULT_TENANT;

  const result = await remember({
    tenantId,
    subjectRef: {
      tenant_id: b.subjectRef.tenant_id ?? tenantId,
      entity_type: b.subjectRef.entity_type,
      entity_id: b.subjectRef.entity_id,
      source: b.subjectRef.source,
      external_id: b.subjectRef.external_id,
    },
    kind: b.kind,
    title: b.title,
    body: b.body,
    source: b.source,
    goalRefs: b.goalRefs,
    salience: b.salience,
    entityRef: b.entityRef ?? null,
    expiresAt: b.expiresAt ?? null,
  });

  res.status(201).json({
    atom: {
      id: result.atom.id,
      subjectType: result.atom.subjectType,
      subjectId: result.atom.subjectId,
      kind: result.atom.kind,
      title: result.atom.title,
      createdAt: result.atom.createdAt.toISOString(),
    },
    created: result.created,
    embedding: result.embedding,
  });
});

router.get("/context/goals", async (req, res): Promise<void> => {
  const params = ListContextGoalsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await goalsRepo.listGoals(params.data.tenantId ?? DEFAULT_TENANT);
  res.json(ListContextGoalsResponse.parse(rows));
});

router.get("/context/metrics", async (req, res): Promise<void> => {
  const params = ListContextMetricsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await metricsRepo.listMetricsWithGoals(
    params.data.tenantId ?? DEFAULT_TENANT,
  );

  // Automatic metric computation is deferred: surface the metric and its anchoring
  // goal, but mark it insufficient_data rather than inventing a value.
  const shaped = rows.map((m) => ({
    id: m.id,
    name: m.name,
    domain: m.domain,
    unit: m.unit ?? null,
    formula: m.formula ?? null,
    status: "insufficient_data" as const,
    statusReason:
      "No observations connected yet — wire a connector or log activity to start measuring this metric.",
    goal: m.goal ? { id: m.goal.id, name: m.goal.name } : null,
  }));

  res.json(ListContextMetricsResponse.parse(shaped));
});

router.get("/context/coverage", async (req, res): Promise<void> => {
  const params = GetContextCoverageQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const packet = await assembleContext({
    tenantId: params.data.tenantId,
    subjectType: params.data.subjectType,
    subjectId: params.data.subjectId,
  });

  res.json(GetContextCoverageResponse.parse(packet.coverage));
});

export default router;
