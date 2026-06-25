import { Router, Response } from "express";
import { query, validationResult } from "express-validator";
import type { AuthRequest } from "../middleware/auth";
import * as firestore from "../services/firestore";
import * as storage from "../services/storage";

const router = Router();

/**
 * GET /v1/kb/inbox
 * List recent session summaries for a tenant
 */
router.get(
  "/",
  [query("tenant_id").isString().notEmpty(), query("limit").optional().isInt({ min: 1, max: 100 })],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenantId = req.query.tenant_id as string;
    const limit = parseInt((req.query.limit as string) || "20");

    // Tenant isolation check
    if (req.auth && req.auth.tenantId !== tenantId) {
      return res.status(403).json({ error: "Tenant mismatch" });
    }

    try {
      const sessions = await firestore.listRecentSessions(tenantId, limit);

      // Optionally fetch summary content for preview
      const sessionsWithContent = await Promise.all(
        sessions.map(async (session) => {
          try {
            const summary = await storage.downloadSessionSummary(session.summary_gcs_path);
            return {
              ...session,
              summary_md: summary,
            };
          } catch (error) {
            console.error(`Error loading summary for session ${session.id}:`, error);
            return {
              ...session,
              summary_md: "[Error loading summary]",
            };
          }
        })
      );

      res.status(200).json({
        sessions: sessionsWithContent,
        count: sessionsWithContent.length,
      });
    } catch (error: any) {
      console.error("Error fetching inbox:", error);
      res.status(500).json({
        error: "Failed to fetch inbox",
        details: error.message,
      });
    }
  }
);

export default router;
