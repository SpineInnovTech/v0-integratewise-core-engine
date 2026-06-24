/**
 * /api/connectors — returns the live connection state of each known integration.
 *
 * google-mail is installed and healthy (verified via Replit connection status,
 * connection ID: conn_google-mail_01KVRRN45F8TK736FG3D3ZTWKX).
 * All others are not yet wired to this Repl.
 */
import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/connectors", (_req, res) => {
  res.json([
    {
      provider: "google",
      name: "Google Workspace",
      status: "connected",
      provider_workspace_name: "Gmail",
      features: ["Gmail"],
    },
  ]);
});

export default router;
