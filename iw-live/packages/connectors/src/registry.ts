/**
 * Unified Connector, Accelerator, and MCP Registry — single place for catalog,
 * domain mapping, accelerators, and MCP tools. Used by frontend, catalog API,
 * Loader, and domain intelligence.
 */

import { CONNECTOR_CATALOG, getSerializableCatalog } from "./catalog";
import type { ConnectorCatalogEntry } from "./catalog-types";

// Re-export for consumers that want "single place" import
export { CONNECTOR_CATALOG, getSerializableCatalog };

/** Domain → list of connector ids (derived from catalog). */
export const DOMAIN_CONNECTOR_MAP: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const c of CONNECTOR_CATALOG) {
    if (!map[c.domain]) map[c.domain] = [];
    map[c.domain].push(c.id);
  }
  return map;
})();

/** Resolve connector by id; returns undefined if not in catalog. */
export function getConnectorById(id: string): ConnectorCatalogEntry | undefined {
  return CONNECTOR_CATALOG.find((c) => c.id === id);
}

export interface AcceleratorCatalogEntry {
  id: string;
  name: string;
  /** Connector ids this accelerator requires (must exist in CONNECTOR_CATALOG). */
  required_connector_ids: string[];
}

/** Accelerators from connector-package (required_connector_ids must exist in CONNECTOR_CATALOG). */
export const ACCELERATOR_CATALOG: AcceleratorCatalogEntry[] = [
  { id: "subscription-metrics", name: "Subscription Metrics", required_connector_ids: ["stripe"] },
  { id: "finance", name: "Finance Accelerator", required_connector_ids: ["quickbooks", "stripe"] },
  {
    id: "support-marketing",
    name: "Support & Marketing",
    required_connector_ids: ["zendesk", "mailchimp"],
  },
  {
    id: "engineering",
    name: "Engineering Accelerator",
    required_connector_ids: ["github", "jira"],
  },
  { id: "hr", name: "HR Accelerator", required_connector_ids: [] },
];

export interface McpServerEntry {
  id: string;
  name: string;
  /** Service or endpoint reference (e.g. service binding name). */
  endpoint?: string;
}

export interface McpToolEntry {
  id: string;
  name: string;
  description?: string;
  /** Connector ids required for this tool; use "all" for tools that work with any connector. */
  required_connector_ids: string[];
}

/** Known MCP servers (mcp-connector, loader MCP, dev-portal MCP, integratewise-mcp-tool-connector). */
export const MCP_SERVERS: McpServerEntry[] = [
  { id: "mcp-connector", name: "MCP Connector Service" },
  { id: "loader-mcp", name: "Loader MCP" },
  { id: "dev-portal-mcp", name: "Dev Portal MCP" },
  { id: "integratewise-mcp-tool-connector", name: "IntegrateWise MCP Tool Connector" },
];

/** MCP tools with required_connector_ids (must exist in CONNECTOR_CATALOG). */
export const MCP_TOOLS: McpToolEntry[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment and subscription webhooks",
    required_connector_ids: ["stripe"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "CRM webhooks",
    required_connector_ids: ["hubspot"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Slack workspace events",
    required_connector_ids: ["slack"],
  },
  {
    id: "discord",
    name: "Discord",
    description: "Discord bot interactions",
    required_connector_ids: ["discord"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "Notion workspace webhooks",
    required_connector_ids: ["notion"],
  },
  { id: "github", name: "GitHub", required_connector_ids: ["github"] },
];

const CATALOG_IDS = new Set(CONNECTOR_CATALOG.map((c) => c.id));

/**
 * Validates that every required_connector_id in accelerators and MCP tools
 * exists in CONNECTOR_CATALOG or is the special value "all".
 * Throws if invalid; use in tests or build step.
 */
export function validateRegistry(): void {
  for (const acc of ACCELERATOR_CATALOG) {
    for (const id of acc.required_connector_ids) {
      if (id !== "all" && !CATALOG_IDS.has(id)) {
        throw new Error(
          `Accelerator ${acc.id}: required_connector_id "${id}" not in CONNECTOR_CATALOG`
        );
      }
    }
  }
  for (const tool of MCP_TOOLS) {
    for (const id of tool.required_connector_ids) {
      if (id !== "all" && !CATALOG_IDS.has(id)) {
        throw new Error(
          `MCP tool ${tool.id}: required_connector_id "${id}" not in CONNECTOR_CATALOG`
        );
      }
    }
  }
}
