import { Router, type IRouter } from "express";
import { CUSTOMER_ZERO_IDENTITY } from "@workspace/spine-schema";
import { listInbox, type NormalizedEmail } from "../connectors/gmail";
import { generateGmailDeltas } from "../services/schema-ai-service";
import { normalizeGmail } from "../services/normalizer-service";
import { hydrateRecords } from "../services/spine-hydration-service";
import { verifyRecords } from "../services/verification-service";
import { remember } from "../services/memory-writer-service";

const router: IRouter = Router();

const TENANT = process.env["SPINE_TENANT_ID"] ?? "iw-customer-zero";

function clampLimit(raw: unknown): number {
  const n = typeof raw === "string" ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return 20;
  return Math.max(1, Math.min(50, n));
}

/**
 * Grow contextual memory from a Gmail pull. Each message becomes ONE interaction
 * atom keyed to its sender (a contact subject). The idempotency key folds in the
 * connector + message id + body hash, so re-ingesting the same inbox deepens
 * coverage WITHOUT duplicating — memory compounds, it does not inflate. Per-atom
 * failures are counted honestly rather than aborting the whole pull.
 */
async function rememberEmails(emails: NormalizedEmail[]): Promise<{
  attempted: number;
  created: number;
  idempotent: number;
  embedded: number;
  failed: number;
  lastError?: string;
}> {
  let created = 0;
  let idempotent = 0;
  let embedded = 0;
  let failed = 0;
  let lastError: string | undefined;

  for (const e of emails) {
    const emailLower = (e.sender_email ?? "").trim().toLowerCase();
    if (!emailLower) continue;
    const who = e.sender_name?.trim() || e.sender_email;
    const body = `${who} — ${e.subject || "(no subject)"}\n\n${e.preview ?? ""}`.trim();
    try {
      const result = await remember({
        subjectRef: {
          tenant_id: TENANT,
          entity_type: "contact",
          entity_id: `gmail:contact:${emailLower}`,
          source: "gmail",
          external_id: emailLower,
        },
        kind: "interaction",
        title: e.subject || "(no subject)",
        body,
        source: {
          connector: "gmail",
          source_id: e.id,
          external_id: `gmail:engagement:${e.id}`,
        },
        salience: e.is_starred ? 0.7 : 0.5,
      });
      if (result.created) created += 1;
      else idempotent += 1;
      if (result.embedding.available) embedded += 1;
    } catch (err) {
      failed += 1;
      lastError = err instanceof Error ? err.message : "remember failed";
    }
  }

  return {
    attempted: emails.length,
    created,
    idempotent,
    embedded,
    failed,
    ...(lastError ? { lastError } : {}),
  };
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

    // Grow the unified contextual memory from this pull. Memory atoms are local
    // connective tissue (not Spine writes), so this runs in dry-run too and is
    // idempotent — re-ingesting the same inbox deepens coverage, never duplicates.
    const memory = await rememberEmails(emails);

    if (dryRun) {
      res.json({
        mode: "dry_run",
        limit,
        fetched: emails.length,
        schema,
        normalized,
        would_hydrate: records.length,
        memory,
        note: "dryRun=true — schema deltas + contextual memory atoms were upserted (idempotent) but NO Spine writes occurred. Pass dryRun=false to propose; add approve=true for the full governed path.",
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
      memory,
      hydration,
      verification,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "gmail ingest failed";
    res.status(502).json({ error: "ingest_failed", message });
  }
});

export default router;
