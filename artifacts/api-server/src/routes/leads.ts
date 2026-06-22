import { Router, type IRouter } from "express";
import {
  ListLeadsResponse,
  ListLeadsResponseItem,
  CreateLeadBody,
  GetLeadParams,
  GetLeadResponse,
  UpdateLeadParams,
  UpdateLeadBody,
  UpdateLeadResponse,
  QualifyLeadParams,
  QualifyLeadBody,
  QualifyLeadResponse,
  ConvertLeadParams,
  ConvertLeadBody,
  ConvertLeadResponse,
  ListLeadActivitiesParams,
  ListLeadActivitiesResponse,
  ListLeadActivitiesResponseItem,
  CreateLeadActivityParams,
  CreateLeadActivityBody,
} from "@workspace/api-zod";
import * as leads from "../repositories/leads";
import * as clients from "../repositories/clients";
import * as deals from "../repositories/deals";
import * as activities from "../repositories/activities";
import * as tasks from "../repositories/tasks";
import * as leadsService from "../services/leads-service";

const router: IRouter = Router();

router.get("/leads", async (_req, res): Promise<void> => {
  const rows = await leads.findAll();
  res.json(ListLeadsResponse.parse(rows));
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const lead = await leads.create(parsed.data);
  res.status(201).json(ListLeadsResponseItem.parse(lead));
});

router.get("/leads/:id", async (req, res): Promise<void> => {
  const params = GetLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const lead = await leads.findById(params.data.id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const [client, deal, activityRows, taskRows] = await Promise.all([
    lead.clientId ? clients.findById(lead.clientId) : Promise.resolve(undefined),
    deals.findByLeadId(lead.id),
    activities.findByLeadId(lead.id),
    tasks.findByLeadId(lead.id),
  ]);

  res.json(
    GetLeadResponse.parse({
      lead,
      client: client ?? null,
      deal: deal ?? null,
      activities: activityRows,
      tasks: taskRows,
    }),
  );
});

router.patch("/leads/:id", async (req, res): Promise<void> => {
  const params = UpdateLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const lead = await leads.update(params.data.id, parsed.data);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(UpdateLeadResponse.parse(lead));
});

router.post("/leads/:id/qualify", async (req, res): Promise<void> => {
  const params = QualifyLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = QualifyLeadBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const lead = await leadsService.qualifyLead(params.data.id, parsed.data);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(QualifyLeadResponse.parse(lead));
});

router.post("/leads/:id/convert", async (req, res): Promise<void> => {
  const params = ConvertLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ConvertLeadBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await leadsService.convertLead(params.data.id, parsed.data);
  if (!result) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  res.json(ConvertLeadResponse.parse(result));
});

router.get("/leads/:id/activities", async (req, res): Promise<void> => {
  const params = ListLeadActivitiesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await activities.findByLeadId(params.data.id);
  res.json(ListLeadActivitiesResponse.parse(rows));
});

router.post("/leads/:id/activities", async (req, res): Promise<void> => {
  const params = CreateLeadActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateLeadActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const lead = await leads.findById(params.data.id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const activity = await activities.create({
    type: parsed.data.type ?? "note",
    summary: parsed.data.summary,
    body: parsed.data.body ?? null,
    actor: "You",
    leadId: params.data.id,
  });

  res.status(201).json(ListLeadActivitiesResponseItem.parse(activity));
});

export default router;
