import { Router, type IRouter } from "express";
import { TwinChatBody, TwinChatResponse } from "@workspace/api-zod";
import * as leads from "../repositories/leads";
import * as activities from "../repositories/activities";
import {
  buildLeadReply,
  buildLeadSuggestions,
  buildEmailReply,
  buildEmailReplyDraft,
  buildEmailSuggestions,
  type EmailContext,
} from "../services/twin-service";

/**
 * The Email Twin is grounded in the message the user is reading. The client
 * passes that context inside the chat message as labelled lines (FROM / SUBJECT
 * / BODY) — we parse them so the draft stays specific to the real message.
 */
function parseEmailContext(message: string): EmailContext {
  const grab = (label: string): string => {
    const m = message.match(new RegExp(`^${label}:\\s*(.+)$`, "im"));
    return m ? m[1].trim() : "";
  };
  const fromLine = grab("FROM");
  const senderMatch = fromLine.match(/^(.*?)\s*<(.+?)>$/);
  const bodyIdx = message.search(/^BODY:/im);
  return {
    senderName: senderMatch ? senderMatch[1].trim() : fromLine,
    senderEmail: senderMatch ? senderMatch[2].trim() : "",
    subject: grab("SUBJECT"),
    excerpt: bodyIdx >= 0 ? message.slice(bodyIdx + 5).trim().slice(0, 1000) : "",
  };
}

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

  if (entityType === "email") {
    const ctx = parseEmailContext(message);
    res.json(
      TwinChatResponse.parse({
        reply: `${buildEmailReply(ctx)}\n\n---\n${buildEmailReplyDraft(ctx)}`,
        suggestions: buildEmailSuggestions(ctx),
      }),
    );
    return;
  }

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
