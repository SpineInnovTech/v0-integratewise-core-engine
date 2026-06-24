import { Router, type IRouter } from "express";
import {
  listMessages,
  getMessage,
  getThread,
  listLabels,
  sendMessage,
  type SendEmailInput,
} from "../connectors/gmail";

const router: IRouter = Router();

function fail(res: import("express").Response, err: unknown): void {
  const message =
    err instanceof Error ? err.message : "Gmail connector unavailable";
  res.status(503).json({ error: "gmail_unavailable", message });
}

function parseLabelIds(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.length) return value.split(",");
  return undefined;
}

// Paginated, filterable inbox. Query: maxResults, pageToken, labelIds (csv), q.
router.get("/email/inbox", async (req, res): Promise<void> => {
  try {
    const maxResults = Math.min(
      Number(req.query.maxResults) || 25,
      50,
    );
    const page = await listMessages({
      maxResults,
      pageToken:
        typeof req.query.pageToken === "string"
          ? req.query.pageToken
          : undefined,
      labelIds: parseLabelIds(req.query.labelIds),
      q: typeof req.query.q === "string" ? req.query.q : undefined,
    });
    res.json(page);
  } catch (err) {
    fail(res, err);
  }
});

// Search alias — Gmail q= query syntax.
router.get("/email/search", async (req, res): Promise<void> => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    if (!q.trim()) {
      res.status(400).json({ error: "missing_query", message: "q is required" });
      return;
    }
    const page = await listMessages({
      q,
      maxResults: Math.min(Number(req.query.maxResults) || 25, 50),
      pageToken:
        typeof req.query.pageToken === "string"
          ? req.query.pageToken
          : undefined,
    });
    res.json(page);
  } catch (err) {
    fail(res, err);
  }
});

// Label taxonomy.
router.get("/email/labels", async (_req, res): Promise<void> => {
  try {
    const labels = await listLabels();
    res.json(labels);
  } catch (err) {
    fail(res, err);
  }
});

// Full single message.
router.get("/email/messages/:id", async (req, res): Promise<void> => {
  try {
    const msg = await getMessage(req.params.id);
    res.json(msg);
  } catch (err) {
    fail(res, err);
  }
});

// Full thread.
router.get("/email/threads/:id", async (req, res): Promise<void> => {
  try {
    const thread = await getThread(req.params.id);
    res.json(thread);
  } catch (err) {
    fail(res, err);
  }
});

// Outbound send (gmail.send). Every send is gated by the GovernanceGate on the
// client; this route simply executes an already-approved human action.
router.post("/email/send", async (req, res): Promise<void> => {
  const body = req.body as Partial<SendEmailInput>;
  const errors: string[] = [];
  if (typeof body.to !== "string" || !body.to.trim()) errors.push("to is required");
  if (typeof body.subject !== "string") errors.push("subject is required");
  if (typeof body.body !== "string" || !body.body.trim())
    errors.push("body is required");
  if (errors.length) {
    res.status(400).json({ error: "invalid_request", message: errors.join("; ") });
    return;
  }

  try {
    const result = await sendMessage({
      to: body.to!.trim(),
      cc: body.cc?.trim() || undefined,
      bcc: body.bcc?.trim() || undefined,
      subject: body.subject ?? "",
      body: body.body!,
      threadId: body.threadId || undefined,
      inReplyTo: body.inReplyTo || undefined,
      references: body.references || undefined,
    });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    res.status(502).json({ error: "send_failed", message });
  }
});

export default router;
