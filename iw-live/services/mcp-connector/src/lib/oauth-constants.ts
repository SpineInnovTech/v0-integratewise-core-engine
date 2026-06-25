/** OAuth scopes supported by the IntegrateWise MCP resource server. */
export const MCP_OAUTH_SCOPES = [
  "mcp:tools",
  "mcp:resources",
  "tenant:read",
  "tenant:write",
  "memory:read",
  "memory:write",
] as const;

export type McpOAuthScope = (typeof MCP_OAUTH_SCOPES)[number];

export function resolveOAuthIssuer(hostname: string, configured?: string): string {
  if (configured?.trim()) return configured.trim();
  if (hostname.startsWith("mcp.")) {
    return `https://${hostname.replace("mcp.", "auth.")}`;
  }
  return `https://${hostname}`;
}

export function resolveOAuthResource(hostname: string, configured?: string): string {
  if (configured?.trim()) return configured.trim();
  if (hostname.startsWith("auth.")) {
    return `https://${hostname.replace("auth.", "mcp.")}`;
  }
  return `https://${hostname}`;
}

/** Paths that MUST be publicly accessible (no auth) per OAuth spec */
export function isPublicOAuthPath(path: string): boolean {
  return (
    path === "/.well-known/oauth-protected-resource" ||
    path === "/.well-known/oauth-authorization-server" ||
    path === "/.well-known/openid-configuration" ||
    path === "/.well-known/jwks.json" ||
    path === "/oauth/authorize" ||
    path === "/oauth/authorize/confirm" ||
    path === "/oauth/token" ||
    path === "/oauth/register" || // RFC 7591 Dynamic Client Registration
    path === "/oauth/revoke" ||
    path === "/health" ||
    path === "/sse" || // SSE initial connection (auth on /sse/message)
    path === "/" // Root info endpoint (GET only)
  );
}

export function isProtectedMcpPath(path: string): boolean {
  return (
    path === "/tools" ||
    path.startsWith("/tools/") ||
    path === "/invoke" ||
    path.startsWith("/invoke") ||
    path === "/mcp" ||
    path.startsWith("/mcp/") ||
    path === "/sessions" ||
    path.startsWith("/sessions/") ||
    path === "/config/mcp-server" ||
    path.startsWith("/config/") ||
    path.startsWith("/v1/mcp/")
  );
}

export function protectedResourceMetadataUrl(resource: string): string {
  return `${resource.replace(/\/$/, "")}/.well-known/oauth-protected-resource`;
}

export function wwwAuthenticateChallenge(
  resource: string,
  error?: string,
  errorDescription?: string
): string {
  const metadata = protectedResourceMetadataUrl(resource);
  if (error) {
    return `Bearer error="${error}", error_description="${errorDescription || error}", resource_metadata="${metadata}"`;
  }
  return `Bearer resource_metadata="${metadata}"`;
}
