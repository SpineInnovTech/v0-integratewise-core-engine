/**
 * MCP SSE Transport for Cloudflare Workers
 *
 * Adds Server-Sent Events (SSE) transport support for MCP clients that
 * don't support HTTP Streamable (e.g., Notion).
 *
 * SSE Transport Protocol:
 * 1. Client opens GET /sse → receives text/event-stream with endpoint URL
 * 2. Client POSTs JSON-RPC messages to the endpoint URL
 * 3. Server sends responses back via the SSE stream
 *
 * Note: Cloudflare Workers don't support long-lived connections well,
 * so this implementation uses a simplified request-response SSE pattern:
 * - GET /sse returns the session endpoint in an initial event
 * - POST /sse/message accepts JSON-RPC and returns response as SSE event
 */

import { Server } from "@modelcontextprotocol/sdk/server";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

/**
 * Handle GET /sse — establish SSE connection and return endpoint info
 */
export function handleSseConnect(_request: Request, baseUrl: string): Response {
  const sessionId = crypto.randomUUID();
  const messageEndpoint = `${baseUrl}/sse/message?sessionId=${sessionId}`;

  // Create SSE response with initial endpoint event
  const encoder = new TextEncoder();
  const body = encoder.encode(
    `event: endpoint\ndata: ${messageEndpoint}\n\n`
  );

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Session-Id": sessionId,
    },
  });
}

/**
 * Handle POST /sse/message — process JSON-RPC message and return SSE response
 */
export async function handleSseMessage(request: Request, server: Server): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: JSONRPCMessage;
  try {
    body = (await request.json()) as JSONRPCMessage;
  } catch {
    return sseResponse({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error" },
      id: null,
    } as any);
  }

  const requestId = (body as any).id;
  const isInitialize = (body as any).method === "initialize";
  let responseMsg: JSONRPCMessage | undefined;

  const transport: Transport = {
    start: async () => {},
    close: async () => {},
    send: async (msg: JSONRPCMessage) => {
      if ((msg as any).id === requestId) {
        responseMsg = msg;
      }
    },
  };

  await server.connect(transport);

  // Pre-initialize if needed
  if (!isInitialize && transport.onmessage) {
    transport.onmessage({
      jsonrpc: "2.0",
      id: "__internal_init__",
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "integratewise-sse-client", version: "1.0.0" },
      },
    } as JSONRPCMessage);
    await new Promise((r) => setTimeout(r, 20));
  }

  // Dispatch the request
  if (transport.onmessage) {
    transport.onmessage(body);
  }

  // Wait for response
  for (let i = 0; i < 200; i++) {
    if (responseMsg) break;
    await new Promise((r) => setTimeout(r, 10));
  }

  if (!responseMsg) {
    return sseResponse({
      jsonrpc: "2.0",
      id: requestId ?? null,
      error: { code: -32000, message: "Request timeout" },
    } as any);
  }

  return sseResponse(responseMsg);
}

/**
 * Format a JSON-RPC message as an SSE response
 */
function sseResponse(message: JSONRPCMessage): Response {
  const encoder = new TextEncoder();
  const data = JSON.stringify(message);
  const body = encoder.encode(`event: message\ndata: ${data}\n\n`);

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
