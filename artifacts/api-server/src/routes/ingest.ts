import { Router, type IRouter } from "express";
import { CUSTOMER_ZERO_IDENTITY } from "@workspace/spine-schema";
import { listInbox } from "../connectors/gmail";
import { generateGmailDeltas } from "../services/schema-ai-service";
import { normalizeGmail } from "../services/normalizer-service";
import { hydrateRecords } from "../services/spine-hydration-service";
import { verifyRecords } from "../services/verification-service";

const router: IRouter = Router();

function clampLimit(raw: unknown): number {
  const n = typeof raw === "string" ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return 20;
  return Math.max(1, Math.min(50, n));
}

/**
 * The full schema-first vertical slice:
 *   Gmail → additive schema delta → normalize → governed Spine proposal → verify
 *
 * Query params:
 *   limit   (1–50, default 20)
 *   dryRun  (default TRUE) — when true, NO Spine writes; returns the would-be
 *           canonical records + proposal args. Pass dryRun=false to propose.
 *   approve (default false) — with dryRun=false, also runs proposal.approve.
 */
router.post("/ingest/gmail", async (req, res): Promise<void> => {
  const limit = clampLimit(req.query["limit"]);
  const dryRun = req.query["dryRun"] !== "false";
  const approve = req.query["approve"] === "true";

  try {
    // 1. Connector pull
    const emails = await listInbox(limit);

    // 2. Schema-first: ensure the additive Gmail deltas exist & are active
    const schema = await generateGmailDeltas(emails);

    // 3. Normalize via the active deltas → canonical person + interaction records
    const normalized = await normalizeGmail(emails, CUSTOMER_ZERO_IDENTITY);
    const records = [...normalized.people, ...normalized.interactions];

    if (dryRun) {
      res.json({
        mode: "dry_run",
        limit,
        fetched: emails.length,
        schema,
        normalized,
        would_hydrate: records.length,
        note: "dryRun=true — schema deltas were upserted (idempotent) but NO Spine writes occurred. Pass dryRun=false to propose; add approve=true for the full governed path.",
      });
      return;
    }

    // 4. Governed hydration → Spine proposals (memory.propose), optional approve
    const hydration = await hydrateRecords(records, { dryRun: false, approve });

    // 5. Honest verification read-back
    const verification = await verifyRecords(records);

    res.json({
      mode: approve ? "propose_approve" : "propose",
      limit,
      fetched: emails.length,
      schema,
      normalized,
      hydration,
      verification,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "gmail ingest failed";
    res.status(502).json({ error: "ingest_failed", message });
  }
});

export default router;
