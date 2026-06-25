/**
 * MCP HTTP Transport for Cloudflare Workers — Stateless Request/Response
 *
 * The official WebStandardStreamableHTTPServerTransport maintains session state in memory,
 * which is lost between Worker requests. This lightweight transport handles a single
 * JSON-RPC request-response pair without persistent state.
 *
 * Each POST to /mcp is treated as an independent request. The Server is pre-initialized
 * internally so clients don't need to send initialize before every call.
 */

import { Server } from "@modelcontextprotocol/sdk/server";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

const DEFAULT_INIT_REQUEST: JSONRPCMessage = {
  jsonrpc: "2.0",
  id: "__internal_init__",
  method: "initialize",
  params: {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "integratewise-stateless-client", version: "1.0.0" },
  },
} as JSONRPCMessage;

export async function handleMcpRequest(request: Request, server: Server): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: JSONRPCMessage;
  try {
    body = (await request.json()) as JSONRPCMessage;
  } catch {
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const requestId = (body as any).id;
  const isInitialize = (body as any).method === "initialize";

  let responseMsg: JSONRPCMessage | undefined;

  const transport: Transport = {
    start: async () => {},
    close: async () => {},
    send: async (msg: JSONRPCMessage) => {
      // Capture only the response matching our request ID (ignore internal init response)
      if ((msg as any).id === requestId) {
        responseMsg = msg;
      }
    },
  };

  await server.connect(transport);

  // Pre-initialize if the incoming request is not initialize itself
  if (!isInitialize) {
    if (transport.onmessage) {
      transport.onmessage(DEFAULT_INIT_REQUEST);
    }
    // Small delay to let the server process initialization
    await new Promise((r) => setTimeout(r, 20));
  }

  // Dispatch the actual request
  if (transport.onmessage) {
    transport.onmessage(body);
  }

  // Poll for response (max 2s)
  for (let i = 0; i < 200; i++) {
    if (responseMsg) break;
    await new Promise((r) => setTimeout(r, 10));
  }

  if (!responseMsg) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: requestId ?? null,
        error: { code: -32000, message: "Request timeout" },
      }),
      { status: 504, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify(responseMsg), {
    headers: { "Content-Type": "application/json" },
  });
}
