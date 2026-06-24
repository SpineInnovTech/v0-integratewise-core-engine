import { Router, type IRouter } from "express";
import { CUSTOMER_ZERO_IDENTITY } from "@workspace/spine-schema";
import {
  getBaseCatalog,
  getResolvedConfig,
  getDeltas,
} from "../services/schema-registry-service";
import { generateGmailDeltas } from "../services/schema-ai-service";

const router: IRouter = Router();

// The canonical base catalogue: departments, industries, profiles, base version.
router.get("/schema/base", (_req, res): void => {
  res.json(getBaseCatalog());
});

// Resolved canonical config for (industry, department). Defaults to Customer
// Zero's own identity (SaaS × Customer Success) when params are omitted.
router.get("/schema/config", (req, res): void => {
  const industry =
    typeof req.query["industry"] === "string"
      ? req.query["industry"]
      : CUSTOMER_ZERO_IDENTITY.industry;
  const department =
    typeof req.query["department"] === "string"
      ? req.query["department"]
      : CUSTOMER_ZERO_IDENTITY.department;
  res.json(getResolvedConfig(industry, department));
});

// Connector schema deltas from the pool. Filter by connector / entityType /
// lifecycle state (proposed|reviewed|approved|active|deprecated).
router.get("/schema/deltas", async (req, res): Promise<void> => {
  const connectorName =
    typeof req.query["connector"] === "string"
      ? req.query["connector"]
      : undefined;
  const entityType =
    typeof req.query["entityType"] === "string"
      ? req.query["entityType"]
      : undefined;
  const lifecycleState =
    typeof req.query["state"] === "string" ? req.query["state"] : undefined;
  try {
    const deltas = await getDeltas({ connectorName, entityType, lifecycleState });
    res.json({ deltas, count: deltas.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "schema deltas query failed";
    res.status(500).json({ error: "schema_deltas_failed", message });
  }
});

// Deterministically (re)generate the additive, versioned Gmail deltas on top of
// the canonical base and upsert them active. Idempotent — safe to call anytime.
router.post("/schema/deltas/gmail/generate", async (_req, res): Promise<void> => {
  try {
    const result = await generateGmailDeltas();
    res.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "gmail delta generation failed";
    res.status(500).json({ error: "delta_generate_failed", message });
  }
});

export default router;
