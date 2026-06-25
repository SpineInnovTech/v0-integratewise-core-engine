import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import type { AuthRequest } from "../middleware/auth";
import type { SessionIngestPayload } from "../types";
import * as storage from "../services/storage";
import * as firestore from "../services/firestore";
import * as search from "../services/search";

const router = Router();

/**
 * POST /v1/ai/session-end
 * Canonical ingestion endpoint for AI session summaries
 */
router.post(
  "/session-end",
  [
    body("tenant_id").isString().notEmpty(),
    body("user_id").isString().notEmpty(),
    body("provider").isIn(["chatgpt", "claude", "grok", "gemini", "other"]),
    body("session_id").isString().notEmpty(),
    body("started_at").isISO8601(),
    body("ended_at").isISO8601(),
    body("summary_md").isString().notEmpty(),
    body("topics").optional().isArray(),
    body("project").optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payload: SessionIngestPayload = req.body;

    // Tenant isolation check (if authenticated)
    if (req.auth && req.auth.tenantId !== payload.tenant_id) {
      return res.status(403).json({ error: "Tenant mismatch" });
    }

    try {
      // Check if session already exists (idempotency)
      const existing = await firestore.getSessionMetadata(payload.tenant_id, payload.session_id);

      if (existing) {
        return res.status(200).json({
          message: "Session already ingested",
          session_id: payload.session_id,
        });
      }

      // Step 1: Upload summary to GCS
      const gcsPath = await storage.uploadSessionSummary(
        payload.tenant_id,
        payload.session_id,
        payload.summary_md
      );

      // Step 2: Save metadata to Firestore
      const metadata = {
        tenant_id: payload.tenant_id,
        user_id: payload.user_id,
        provider: payload.provider,
        topics: payload.topics || [],
        project: payload.project,
        summary_gcs_path: gcsPath,
        created_at: new Date().toISOString(),
      };

      await firestore.saveSessionMetadata(payload.tenant_id, payload.session_id, metadata);

      // Step 3: Upsert to Vertex AI Search
      const title = payload.summary_md.split("\n")[0].substring(0, 120);
      await search.upsertSearchDocument(
        payload.tenant_id,
        payload.session_id,
        title,
        payload.summary_md,
        payload.topics || [],
        metadata.created_at
      );

      res.status(201).json({
        message: "Session ingested successfully",
        session_id: payload.session_id,
        gcs_path: gcsPath,
      });
    } catch (error: any) {
      console.error("Error ingesting session:", error);
      res.status(500).json({
        error: "Failed to ingest session",
        details: error.message,
      });
    }
  }
);

export default router;
