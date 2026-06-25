/**
 * Bridge from CONNECTOR_CATALOG to Domain Master ProviderDefinition.
 * Single source of truth: all 50 connectors registered by domain.
 */

import type { DomainId } from "./types";
import type { ProviderDefinition } from "./types";
import { CONNECTOR_CATALOG } from "../catalog";

export function getProvidersForDomain(domain: DomainId): ProviderDefinition[] {
  return CONNECTOR_CATALOG.filter((c) => c.domain === domain).map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    connectorClass: c.class as new (
      config: any
    ) => import("@integratewise/connector-contracts").BaseConnector,
    authType: c.authType === "oauth" ? "oauth2" : "api_key",
    description: `${c.name} — connector`,
  }));
}
