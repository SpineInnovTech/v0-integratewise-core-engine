/**
 * OAuth 2.0 Scope Enforcement for MCP tools.
 *
 * Maps MCP tool namespaces to required OAuth scopes.
 * If a token has limited scopes, it cannot invoke tools outside those scopes.
 */

/**
 * Mapping of tool name prefixes to required scopes.
 * A tool requires ANY ONE of its mapped scopes to execute.
 */
const TOOL_SCOPE_MAP: Record<string, string[]> = {
  // Knowledge Bank tools — require mcp:tools or tenant:read/write
  "kb.write_session_summary": ["mcp:tools", "tenant:write", "memory:write"],
  "kb.write_article": ["mcp:tools", "tenant:write", "memory:write"],
  "kb.get_artifact": ["mcp:tools", "mcp:resources", "tenant:read"],
  "kb.list_recent": ["mcp:tools", "mcp:resources", "tenant:read"],
  "kb.search": ["mcp:tools", "mcp:resources", "tenant:read"],
  "kb.topic_upsert": ["mcp:tools", "tenant:write"],
  "kb.topic_list": ["mcp:tools", "mcp:resources", "tenant:read"],

  // Memory tools
  "memory.write_conversational": ["mcp:tools", "memory:write"],
  "memory.read_conversational": ["mcp:tools", "mcp:resources", "memory:read"],
  "memory.search_org": ["mcp:tools", "mcp:resources", "memory:read"],
  "memory.propose": ["mcp:tools", "memory:write"],

  // Spine tools — read-only via mcp:resources or tenant:read
  "spine.entity.get": ["mcp:tools", "mcp:resources", "tenant:read"],
  "spine.entity.list": ["mcp:tools", "mcp:resources", "tenant:read"],
  "spine.entity.search": ["mcp:tools", "mcp:resources", "tenant:read"],

  // Signal + governance
  "signal.list": ["mcp:tools", "mcp:resources", "tenant:read"],
  "proposal.list": ["mcp:tools", "mcp:resources", "tenant:read"],
  "proposal.approve": ["mcp:tools", "tenant:write"],
  "proposal.reject": ["mcp:tools", "tenant:write"],

  // Semantic search
  "search.semantic": ["mcp:tools", "mcp:resources", "tenant:read", "memory:read"],
};

/**
 * Check if the given token scopes allow access to a specific tool.
 *
 * Rules:
 * - If tokenScopes is empty or undefined, access is granted (legacy API key / service binding).
 * - If tokenScopes contains "mcp:tools", all tools are allowed (superscope).
 * - Otherwise, the token must have at least one scope from the tool's required scopes.
 */
export function hasToolScope(toolName: string, tokenScopes: string | undefined): boolean {
  // No scopes = legacy auth (API key, service binding) — allow all
  if (!tokenScopes || tokenScopes.trim() === "") return true;

  const scopes = new Set(tokenScopes.split(" ").filter(Boolean));

  // mcp:tools is the superscope — grants access to all tools
  if (scopes.has("mcp:tools")) return true;

  const requiredScopes = TOOL_SCOPE_MAP[toolName];
  if (!requiredScopes) {
    // Unknown tool — default to requiring mcp:tools
    return scopes.has("mcp:tools");
  }

  // Token must have at least one of the required scopes
  return requiredScopes.some((s) => scopes.has(s));
}

/**
 * Filter a list of tool definitions down to those accessible with the given scopes.
 * Useful for tools/list responses scoped to the client's access.
 */
export function filterToolsByScope<T extends { name: string }>(
  tools: T[],
  tokenScopes: string | undefined
): T[] {
  if (!tokenScopes || tokenScopes.trim() === "") return tools;
  return tools.filter((t) => hasToolScope(t.name, tokenScopes));
}
