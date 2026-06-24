import { Router, type IRouter } from "express";
import { listInbox } from "../connectors/gmail";

const router: IRouter = Router();

router.get("/email/inbox", async (_req, res): Promise<void> => {
  try {
    const emails = await listInbox(20);
    res.json(emails);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gmail connector unavailable";
    res.status(503).json({ error: "gmail_unavailable", message });
  }
});

export default router;
