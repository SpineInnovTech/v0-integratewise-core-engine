import { Router, Response } from "express";
import { query, validationResult } from "express-validator";
import type { AuthRequest } from "../middleware/auth";
import type { SearchQuery } from "../types";
import * as search from "../services/search";

const router = Router();

/**
 * GET /v1/kb/search
 * Search session summaries via Vertex AI Search
 */
router.get(
  "/",
  [
    query("q").isString().notEmpty(),
    query("tenant_id").isString().notEmpty(),
    query("topic").optional().isString(),
    query("from").optional().isISO8601(),
    query("to").optional().isISO8601(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchQuery: SearchQuery = {
      q: req.query.q as string,
      tenant_id: req.query.tenant_id as string,
      topic: req.query.topic as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    };

    // Tenant isolation check
    if (req.auth && req.auth.tenantId !== searchQuery.tenant_id) {
      return res.status(403).json({ error: "Tenant mismatch" });
    }

    try {
      const results = await search.searchDocuments(searchQuery);

      res.status(200).json({
        results,
        count: results.length,
        query: searchQuery,
      });
    } catch (error: any) {
      console.error("Error searching documents:", error);
      res.status(500).json({
        error: "Search failed",
        details: error.message,
      });
    }
  }
);

export default router;
