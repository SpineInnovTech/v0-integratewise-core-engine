import { Router, type IRouter } from "express";
import { TwinChatBody, TwinChatResponse } from "@workspace/api-zod";
import * as leads from "../repositories/leads";
import * as activities from "../repositories/activities";
import { buildLeadReply, buildLeadSuggestions } from "../services/twin-service";

const router: IRouter = Router();

// The Twin is a grounded companion: when given an entity it reads the real
// record before replying, and it only ever returns suggestions (drafts). It
// never mutates data — the human stays in control of every action.
router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = TwinChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, entityType, entityId } = parsed.data;

  if (entityType === "lead" && entityId) {
    const lead = await leads.findById(entityId);
    if (lead) {
      const recent = await activities.findByLeadId(lead.id);
      res.json(
        TwinChatResponse.parse({
          reply: buildLeadReply(lead, recent.length, message),
          suggestions: buildLeadSuggestions(lead),
        }),
      );
      return;
    }
  }

  res.json(
    TwinChatResponse.parse({
      reply:
        "I stay grounded in a specific record. Open a lead and ask again — I will read its real context before suggesting anything, and every suggestion is a draft for you to run.",
      suggestions: [],
    }),
  );
});

export default router;
