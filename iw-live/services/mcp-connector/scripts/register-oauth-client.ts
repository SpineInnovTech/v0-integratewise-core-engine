#!/usr/bin/env npx tsx
/**
 * Register an OAuth client in the D1 oauth_clients table.
 *
 * Usage:
 *   unset CLOUDFLARE_API_TOKEN
 *   npx tsx scripts/register-oauth-client.ts
 *
 * Or deploy the migration first then use wrangler d1 execute:
 *   wrangler d1 execute integratewise-spine-cache --file ./migrations/0001_oauth_tables.sql
 *
 * Then register clients via SQL or this script (local dev via Miniflare D1).
 */

import { hashClientSecret } from "../src/lib/oauth-clients";

// ── Client definitions ──────────────────────────────────────────────────────

const CLIENTS = [
  {
    client_id: "claude-desktop-iw",
    client_secret: "iw-claude-" + crypto.randomUUID().slice(0, 16), // Generate & store safely
    client_name: "Claude Desktop (Customer Zero)",
    redirect_uris: ["http://localhost:3000/oauth/callback", "http://127.0.0.1/oauth/callback"],
    allowed_scopes: ["mcp:tools", "mcp:resources", "memory:read", "memory:write", "tenant:read"],
    tenant_id: "integratewise",
    grant_types: ["authorization_code", "client_credentials", "refresh_token"],
  },
  {
    client_id: "cursor-iw",
    client_secret: "iw-cursor-" + crypto.randomUUID().slice(0, 16),
    client_name: "Cursor IDE",
    redirect_uris: ["http://localhost:3000/oauth/callback", "vscode://"],
    allowed_scopes: ["mcp:tools", "mcp:resources", "memory:read", "tenant:read"],
    tenant_id: "integratewise",
    grant_types: ["authorization_code", "client_credentials", "refresh_token"],
  },
  {
    client_id: "kiro-iw",
    client_secret: "iw-kiro-" + crypto.randomUUID().slice(0, 16),
    client_name: "Kiro IDE",
    redirect_uris: ["http://localhost:3000/oauth/callback"],
    allowed_scopes: [
      "mcp:tools",
      "mcp:resources",
      "memory:read",
      "memory:write",
      "tenant:read",
      "tenant:write",
    ],
    tenant_id: "integratewise",
    grant_types: ["authorization_code", "client_credentials", "refresh_token"],
  },
];

// ── Generate SQL ────────────────────────────────────────────────────────────

async function main() {
  console.log("-- OAuth Client Registration SQL");
  console.log('-- Run via: wrangler d1 execute integratewise-spine-cache --command "<SQL>"');
  console.log("-- IMPORTANT: Store the client_secret values securely before deploying.\n");

  for (const client of CLIENTS) {
    const secretHash = await hashClientSecret(client.client_secret);

    console.log(`-- Client: ${client.client_name}`);
    console.log(`-- Secret (store this): ${client.client_secret}`);
    console.log(`INSERT INTO oauth_clients (client_id, client_secret_hash, client_name, redirect_uris, allowed_scopes, tenant_id, grant_types)
VALUES ('${client.client_id}', '${secretHash}', '${client.client_name}', '${JSON.stringify(client.redirect_uris)}', '${JSON.stringify(client.allowed_scopes)}', '${client.tenant_id}', '${JSON.stringify(client.grant_types)}');
`);
  }
}

main().catch(console.error);
