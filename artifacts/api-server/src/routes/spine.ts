import { Router, type IRouter } from "express";
import { SpineError } from "../connectors/spine";
import { getSpineStatus, invokeReadOnlyTool } from "../services/spine-service";

const router: IRouter = Router();

// Direct tool invocation through the relay uses the server-held platform
// credential, so it is OFF by default. The UI only needs status + the tool
// catalogue; turn read-only calls on deliberately with SPINE_ENABLE_CALL=true.
const CALL_ENABLED = process.env["SPINE_ENABLE_CALL"] === "true";

// Live Spine connection + tool catalogue. Honest: when the Spine is unreachable
// this still returns HTTP 200 with `connected: false` and a reason, never a
// fabricated "live" state.
router.get("/spine/status", async (_req, res): Promise<void> => {
  res.json(await getSpineStatus());
});

router.get("/spine/tools", async (_req, res): Promise<void> => {
  const status = await getSpineStatus();
  res.json({
    connected: status.connected,
    tenantId: status.tenantId,
    endpoint: status.endpoint,
    toolCount: status.toolCount,
    tools: status.tools,
    detail: status.detail,
  });
});

// Invoke a READ-ONLY Spine tool. Mutating/governed tools are refused here (403)
// — they must run through governance (HITL), never a direct relay call.
router.post("/spine/call", async (req, res): Promise<void> => {
  if (!CALL_ENABLED) {
    res.status(403).json({
      error:
        "Direct Spine tool calls are disabled on this relay. Enable read-only calls with SPINE_ENABLE_CALL=true.",
      code: "calls_disabled",
    });
    return;
  }

  const body = (req.body ?? {}) as { name?: unknown; arguments?: unknown };
  const name = typeof body.name === "string" ? body.name : "";
  const args =
    body.arguments && typeof body.arguments === "object"
      ? (body.arguments as Record<string, unknown>)
      : {};

  if (!name) {
    res.status(400).json({ error: "Missing tool name." });
    return;
  }

  try {
    const result = await invokeReadOnlyTool(name, args);
    res.json({ name, result });
  } catch (err) {
    if (err instanceof SpineError) {
      const status = err.code === "governed" ? 403 : 502;
      res.status(status).json({ error: err.message, code: err.code });
      return;
    }
    res.status(500).json({ error: "Spine call failed." });
  }
});

export default router;
