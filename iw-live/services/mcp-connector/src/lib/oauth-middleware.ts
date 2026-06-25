/**
 * OAuth resource-server authentication for MCP endpoints.
 */

import type { Context, Next } from "hono";
import { verifyAuth } from "../handlers/tools";
import type { StructuredLog as Log } from "./logging";
import {
  isProtectedMcpPath,
  isPublicOAuthPath,
  resolveOAuthResource,
  wwwAuthenticateChallenge,
} from "./oauth-constants";

export type OAuthMiddlewareBindings = {
  ENVIRONMENT?: string;
  MCP_OAUTH_REQUIRED?: string;
  OAUTH_RESOURCE?: string;
  MCP_CONNECTOR_API_KEY?: string;
  TRIAGE_BOT_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
};

export function isOAuthRequired(env: OAuthMiddlewareBindings): boolean {
  const flag = (env.MCP_OAUTH_REQUIRED ?? "").trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  return env.ENVIRONMENT === "prod" || env.ENVIRONMENT === "production";
}

export async function oauthResourceMiddleware(
  c: Context<{ Bindings: OAuthMiddlewareBindings; Variables: { log: Log } }>,
  next: Next
) {
  const path = c.req.path;
  if (!isProtectedMcpPath(path) || isPublicOAuthPath(path)) {
    return next();
  }

  if (!isOAuthRequired(c.env)) {
    return next();
  }

  const url = new URL(c.req.url);
  const resource = resolveOAuthResource(url.hostname, c.env.OAUTH_RESOURCE);
  const log = c.get("log");

  const authHeader = c.req.header("Authorization") || null;
  const mcpKeyHeader = c.req.header("X-MCP-Key") || null;
  const isServiceBinding = c.req.header("cf-worker") !== undefined;

  const auth = await verifyAuth(
    authHeader,
    mcpKeyHeader,
    isServiceBinding,
    log,
    {
      MCP_CONNECTOR_API_KEY: c.env.MCP_CONNECTOR_API_KEY,
      TRIAGE_BOT_API_KEY: c.env.TRIAGE_BOT_API_KEY,
      CF_ACCESS_TEAM_DOMAIN: c.env.CF_ACCESS_TEAM_DOMAIN,
      CF_ACCESS_AUD: c.env.CF_ACCESS_AUD,
    },
    c.req.header("x-tenant-id") || null,
    c.req.header("x-user-id") || null,
    c.req.header("CF-Access-JWT-Assertion") || null
  );

  if (!auth) {
    const hasToken = Boolean(authHeader?.startsWith("Bearer ") || mcpKeyHeader);
    const challenge = wwwAuthenticateChallenge(
      resource,
      hasToken ? "invalid_token" : undefined,
      hasToken ? "Missing or invalid Authorization header" : undefined
    );

    return c.json(
      {
        error: hasToken ? "invalid_token" : "unauthorized",
        message: "Bearer token required",
      },
      401,
      {
        "WWW-Authenticate": challenge,
        "Access-Control-Allow-Origin": "*",
      }
    );
  }

  return next();
}
