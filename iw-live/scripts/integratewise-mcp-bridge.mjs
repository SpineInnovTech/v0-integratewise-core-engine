#!/usr/bin/env node
/**
 * IntegrateWise MCP stdio bridge — translates MCP JSON-RPC (stdio) to the
 * cloud MCP server at https://mcp.integratewise.ai via native MCP protocol.
 *
 * Features:
 *   - Auto-acquires OAuth token via client_credentials grant
 *   - Auto-refreshes token before expiry (no manual token management)
 *   - Passes all MCP JSON-RPC methods through to the cloud server
 *
 * Env:
 *   INTEGRATEWISE_MCP_URL    Base URL (default: https://mcp.integratewise.ai)
 *   INTEGRATEWISE_MCP_TOKEN  Static Bearer token (optional, skips OAuth if set)
 *   INTEGRATEWISE_TENANT_ID  Tenant ID for client_credentials grant
 *   INTEGRATEWISE_CLIENT_ID  OAuth client_id (default: kiro-iw)
 *   INTEGRATEWISE_SCOPE      OAuth scope (default: mcp:tools mcp:resources memory:read memory:write tenant:read)
 */

import { createInterface } from "readline";

const BASE = (process.env.INTEGRATEWISE_MCP_URL || "https://mcp.integratewise.ai").replace(
  /\/$/,
  ""
);
const STATIC_TOKEN = (process.env.INTEGRATEWISE_MCP_TOKEN || "").trim();
const TENANT_ID = (process.env.INTEGRATEWISE_TENANT_ID || "integratewise").trim();
const CLIENT_ID = (process.env.INTEGRATEWISE_CLIENT_ID || "kiro-iw").trim();
const SCOPE = (
  process.env.INTEGRATEWISE_SCOPE || "mcp:tools mcp:resources memory:read memory:write tenant:read"
).trim();

let cachedToken = STATIC_TOKEN || "";
let tokenExpiresAt = STATIC_TOKEN ? Infinity : 0;

function log(...args) {
  process.stderr.write(["[iw-mcp-bridge]", ...args].join(" ") + "\n");
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

/**
 * Get a valid Bearer token. Uses static token if configured,
 * otherwise acquires via client_credentials and caches.
 */
async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  // Refresh 60s before expiry
  if (cachedToken && now < tokenExpiresAt - 60) {
    return cachedToken;
  }

  if (STATIC_TOKEN) {
    cachedToken = STATIC_TOKEN;
    tokenExpiresAt = Infinity;
    return cachedToken;
  }

  log("Acquiring OAuth token via client_credentials...");
  const res = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-tenant-id": TENANT_ID,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      scope: SCOPE,
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600);
  log(`Token acquired, expires in ${data.expires_in}s`);
  return cachedToken;
}

/**
 * Forward a JSON-RPC request to the cloud MCP server.
 */
async function forwardToCloud(msg) {
  const token = await getToken();
  const res = await fetch(`${BASE}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      jsonrpc: "2.0",
      id: msg.id ?? null,
      error: { code: -32000, message: `Cloud MCP error: ${res.status} ${text}` },
    };
  }

  return await res.json();
}

/**
 * Handle initialize locally (client expects immediate response with server info).
 */
function handleInitialize(id) {
  send({
    jsonrpc: "2.0",
    id,
    result: {
      protocolVersion: "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: {
        name: "integratewise-cloud",
        version: "2.0.0",
      },
    },
  });
}

/**
 * Process incoming JSON-RPC message from stdio.
 */
async function handleMessage(msg) {
  const method = msg.method;
  const id = msg.id;

  // Notifications — no response needed
  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return;
  }

  // Initialize handled locally for speed
  if (method === "initialize") {
    handleInitialize(id);
    return;
  }

  // Everything else (tools/list, tools/call, etc.) forwards to cloud
  try {
    const response = await forwardToCloud(msg);
    send(response);
  } catch (err) {
    log("Error forwarding to cloud:", err.message);
    send({
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code: -32603, message: err.message },
    });
  }
}

function main() {
  log(`Bridge started → ${BASE}`);
  log(`Client: ${CLIENT_ID}, Tenant: ${TENANT_ID}`);

  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on("line", (line) => {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    if (msg?.jsonrpc === "2.0" && msg.method !== undefined) {
      handleMessage(msg);
    }
  });
}

main();
