import { Router, Response } from "express";
import { body, query, validationResult } from "express-validator";
import type { AuthRequest } from "../middleware/auth";
import { requireRole } from "../middleware/auth";
import type { Topic } from "../types";
import * as firestore from "../services/firestore";

const router = Router();

/**
 * GET /v1/kb/topics
 * List all topics for a tenant
 */
router.get(
  "/",
  [query("tenant_id").isString().notEmpty()],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenantId = req.query.tenant_id as string;

    // Tenant isolation check
    if (req.auth && req.auth.tenantId !== tenantId) {
      return res.status(403).json({ error: "Tenant mismatch" });
    }

    try {
      const topics = await firestore.listTopics(tenantId);
      res.status(200).json({ topics, count: topics.length });
    } catch (error: any) {
      console.error("Error fetching topics:", error);
      res.status(500).json({
        error: "Failed to fetch topics",
        details: error.message,
      });
    }
  }
);

/**
 * POST /v1/kb/topics
 * Create or update a topic
 */
router.post(
  "/",
  requireRole("admin"),
  [
    body("tenant_id").isString().notEmpty(),
    body("name").isString().notEmpty(),
    body("cadence").isIn(["weekly", "biweekly"]),
    body("hourly_opt_in").optional().isBoolean(),
    body("id").optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenantId = req.body.tenant_id as string;

    // Tenant isolation check
    if (req.auth && req.auth.tenantId !== tenantId) {
      return res.status(403).json({ error: "Tenant mismatch" });
    }

    try {
      const topic: Topic = {
        id: req.body.id || `topic_${Date.now()}`,
        name: req.body.name,
        cadence: req.body.cadence,
        hourly_opt_in: req.body.hourly_opt_in || false,
        last_synced_at: req.body.last_synced_at,
        updated_at: new Date().toISOString(),
      };

      await firestore.saveTopic(tenantId, topic);

      res.status(201).json({
        message: "Topic saved successfully",
        topic,
      });
    } catch (error: any) {
      console.error("Error saving topic:", error);
      res.status(500).json({
        error: "Failed to save topic",
        details: error.message,
      });
    }
  }
);

/**
 * DELETE /v1/kb/topics/:topicId
 * Delete a topic
 */
router.delete(
  "/:topicId",
  requireRole("admin"),
  [query("tenant_id").isString().notEmpty()],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenantId = req.query.tenant_id as string;
    const topicId = req.params.topicId;

    // Tenant isolation check
    if (req.auth && req.auth.tenantId !== tenantId) {
      return res.status(403).json({ error: "Tenant mismatch" });
    }

    try {
      await firestore.deleteTopic(tenantId, topicId);
      res.status(200).json({ message: "Topic deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting topic:", error);
      res.status(500).json({
        error: "Failed to delete topic",
        details: error.message,
      });
    }
  }
);

export default router;
