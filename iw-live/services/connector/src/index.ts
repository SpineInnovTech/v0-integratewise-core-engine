/**
 * Consolidated Connector Worker (v3.6 Architecture)
 * Merges: loader + mcp-connector + store
 *
 * Handles all data ingestion responsibilities:
 * - Webhook reception and connector polling (loader)
 * - MCP tool server and session capture (mcp-connector)
 * - File storage and management (store)
 *
 * Cron trigger: every 5 minutes (connector polling via loader)
 */
import loaderWorker from "../../loader/src/index";
import mcpApp from "../../mcp-connector/src/index";
import storeApp from "../../store/src/index";
import internalRoutes from "./routes/internal";

export interface Env {
  [key: string]: unknown;
  DATABASE_URL: string;
  // SUPABASE retained for sub-loader (adaptive schema reads); token + spine config are D1 now.
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  PIPELINE_QUEUE: Queue;
  KNOWLEDGE_QUEUE: Queue;
  MCP_IDEMPOTENCY: KVNamespace;
  CONNECTOR_STATUS: KVNamespace;
  EDGE_DB: D1Database;
  FILES: R2Bucket;
  KNOWLEDGE: Fetcher;
  ENVIRONMENT?: string;
  /** Optional: MCP API key for /tools and /invoke (Bearer or X-MCP-Key). */
  MCP_CONNECTOR_API_KEY?: string;
  /** Nango secret key — used for Connect session creation and token retrieval */
  NANGO_SECRET_KEY?: string;
  /** Nango webhook secret — used to verify webhook signatures */
  NANGO_WEBHOOK_SECRET?: string;
  NANGO_BASE_URL?: string; // for nango dev: local nango server url
}

const CONNECTOR_INFO = {
  status: "ok",
  service: "connector",
  components: ["loader", "mcp-connector", "store"],
  routes: [
    "/health",
    "/api/v1/connector/*",
    "/nango/webhook",
    "/tools",
    "/invoke",
    "/v1/mcp/*",
    "/files/*",
    "/upload/*",
  ],
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Inject a local MCP fetcher proxy to route internal loader enqueues back to our merged mcpApp.
    const mcpProxy = {
      fetch: async (req: Request) => {
        const mcpEnv = {
          ...env,
          DB: env.EDGE_DB,
          ENVIRONMENT: env.ENVIRONMENT ?? "production",
          MCP_CONNECTOR_API_KEY: env.MCP_CONNECTOR_API_KEY,
        };
        return mcpApp.fetch(req, mcpEnv as any, ctx);
      },
    } as unknown as Fetcher;
    const wrappedEnv = {
      ...env,
      MCP: mcpProxy,
    };

    // Root and health: always return 200 so probes and direct hits never get 404
    if (pathname === "/" || pathname === "/health") {
      return new Response(
        JSON.stringify({
          ...CONNECTOR_INFO,
          ts: Date.now(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
    if (pathname === "/api/v1/connector" && request.method === "GET") {
      return new Response(JSON.stringify({ ...CONNECTOR_INFO, ts: Date.now() }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (pathname.startsWith("/internal/")) {
      return internalRoutes.fetch(request, wrappedEnv as any, ctx);
    }

    // Nango Connect — public path the frontend calls; delegate to the internal handler.
    // Frontend: POST /api/v1/connector/nango/session  → createConnectSession (Nango Connect UI token)
    //           POST /api/v1/connector/nango/disconnect → deleteNangoConnection
    if (
      pathname === "/api/v1/connector/nango/session" ||
      pathname === "/api/v1/connector/nango/disconnect"
    ) {
      const internalUrl = new URL(request.url);
      internalUrl.pathname = pathname.replace("/api/v1/connector", "/internal");
      const internalReq = new Request(internalUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      });
      return internalRoutes.fetch(internalReq, wrappedEnv as any, ctx);
    }

    if (pathname === "/api/v1/loader" || pathname.startsWith("/api/v1/loader/")) {
      const loaderPath = pathname.replace(/^\/api\/v1\/loader/, "/internal") || "/internal";
      const loaderUrl = new URL(request.url);
      loaderUrl.pathname = loaderPath;
      const loaderRequest = new Request(loaderUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      });
      return loaderWorker.fetch(loaderRequest, wrappedEnv as any, ctx);
    }

    // MCP routes: /mcp/*, /tools/*, /sessions/*, /config/*, /invoke, /v1/mcp/*
    // When reached via Gateway, path is /api/v1/connector/... — strip prefix so MCP app sees /config/mcp-server, /mcp/*, etc.
    const mcpPath = pathname.startsWith("/api/v1/connector/")
      ? pathname.slice("/api/v1/connector".length) || "/"
      : pathname;
    const isMcpRoute =
      mcpPath === "/config/mcp-server" ||
      mcpPath.startsWith("/config/") ||
      mcpPath === "/mcp" ||
      mcpPath.startsWith("/mcp/") ||
      mcpPath === "/tools" ||
      mcpPath.startsWith("/tools/") ||
      mcpPath === "/sessions" ||
      mcpPath.startsWith("/sessions/") ||
      mcpPath === "/invoke" ||
      mcpPath.startsWith("/invoke") ||
      mcpPath.startsWith("/v1/mcp/");
    if (isMcpRoute) {
      const mcpUrl = new URL(mcpPath, request.url);
      const mcpRequest = new Request(mcpUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" && request.body ? request.body : undefined,
      });
      // MCP app expects DB (D1); connector exposes EDGE_DB.
      const mcpEnv = {
        ...wrappedEnv,
        DB: env.EDGE_DB,
        ENVIRONMENT: env.ENVIRONMENT ?? "production",
        MCP_CONNECTOR_API_KEY: env.MCP_CONNECTOR_API_KEY,
      };
      return mcpApp.fetch(mcpRequest, mcpEnv as Parameters<typeof mcpApp.fetch>[1], ctx);
    }

    // Store routes: /files/*, /upload/*
    if (
      url.pathname === "/files" ||
      url.pathname.startsWith("/files/") ||
      url.pathname === "/upload" ||
      url.pathname.startsWith("/upload/")
    ) {
      return storeApp.fetch(request, wrappedEnv as any, ctx);
    }

    // Execute route: called by Act service to write back to external tools
    if (
      (pathname === "/api/v1/connector/execute" || mcpPath === "/execute") &&
      request.method === "POST"
    ) {
      try {
        const body = (await request.json()) as {
          tool: string;
          operation: string;
          parameters: Record<string, any>;
          tenant_id: string;
        };
        const tenantId = request.headers.get("x-tenant-id") || body.tenant_id;

        // Dynamically import the connector adapter and call the operation
        // For now, route through the loader's sync handler which has adapter access
        const execUrl = new URL(
          `/api/v1/connector/sync/${body.tool}/${body.operation}`,
          request.url
        );
        const execReq = new Request(execUrl.toString(), {
          method: "POST",
          headers: request.headers,
          body: JSON.stringify({ ...body.parameters, tenant_id: tenantId }),
        });

        const result = await loaderWorker.fetch(execReq, wrappedEnv as any);
        const resultData = await result.json().catch(() => ({ status: "executed" }));

        // Re-ingest the result into the pipeline so Spine is updated
        if (env.PIPELINE_QUEUE) {
          const traceId = request.headers.get("x-correlation-id") || crypto.randomUUID();
          await env.PIPELINE_QUEUE.send({
            stage: "analyze",
            tenant_id: tenantId,
            source: body.tool,
            source_type: "action",
            payload: {
              ...body.parameters,
              _operation: body.operation,
              _execution_result: resultData,
            },
            metadata: {
              trace_id: traceId,
              attempt: 0,
              received_at: new Date().toISOString(),
            },
          });
        }

        return new Response(
          JSON.stringify({
            status: "executed",
            tool: body.tool,
            operation: body.operation,
            result: resultData,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: "Execution failed", message: err?.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Nango webhook — Nango POSTs here after every connection event
    if (pathname === "/nango/webhook" && request.method === "POST") {
      return loaderWorker.fetch(request, wrappedEnv as any, ctx);
    }

    // Default: loader handles webhooks, connectors, OAuth, manual uploads
    return loaderWorker.fetch(request, wrappedEnv as any);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const mcpProxy = {
      fetch: async (req: Request) => {
        const mcpEnv = {
          ...env,
          DB: env.EDGE_DB,
          ENVIRONMENT: env.ENVIRONMENT ?? "production",
          MCP_CONNECTOR_API_KEY: env.MCP_CONNECTOR_API_KEY,
        };
        return mcpApp.fetch(req, mcpEnv as any, ctx);
      },
    } as unknown as Fetcher;
    const wrappedEnv = {
      ...env,
      MCP: mcpProxy,
    };
    // Loader: cron-based connector polling (every 5 minutes)
    return loaderWorker.scheduled(event, wrappedEnv as any, ctx);
  },
};
