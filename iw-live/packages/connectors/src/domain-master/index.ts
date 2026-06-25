// ============================================================================
// DOMAIN MASTER CONNECTOR — PUBLIC API
// ============================================================================
// Entry point for the Domain Master Connector pattern.
//
// Usage:
//   import { createConnectorRegistry, ConnectorRegistry } from "@integratewise/connectors";
//
//   const registry = createConnectorRegistry();
//   registry.configure("crm", "salesforce", { instanceUrl: "...", accessToken: "..." });
//   registry.configure("finance", "stripe", { secretKey: "sk_..." });
//
//   const crm = registry.getDomain<CRMMasterConnector>("crm");
//   const contacts = await crm.getContacts();
//
//   // Rotate a key — all operations auto-update:
//   registry.updateConfig("crm", "salesforce", { accessToken: "new-token" });
// ============================================================================

export * from "./types";
export * from "./domain-master-connector";
export * from "./connector-registry";
export * from "./domains";

// ----- Factory: Pre-registers all 11 domain masters -----

import { ConnectorRegistry } from "./connector-registry";
import {
  CRMMasterConnector,
  CommunicationMasterConnector,
  SupportMasterConnector,
  FinanceMasterConnector,
  MarketingMasterConnector,
  AnalyticsMasterConnector,
  ProductivityMasterConnector,
  EngineeringMasterConnector,
  ComplianceMasterConnector,
  CommerceMasterConnector,
  AIMasterConnector,
} from "./domains";

/**
 * Create a fully-initialized ConnectorRegistry with all 11 domain masters.
 * Call this once at app startup — then use `ConnectorRegistry.getInstance()`
 * anywhere else to access the same registry.
 */
export function createConnectorRegistry(): ConnectorRegistry {
  const registry = ConnectorRegistry.getInstance();

  registry.registerDomain(new CRMMasterConnector());
  registry.registerDomain(new CommunicationMasterConnector());
  registry.registerDomain(new SupportMasterConnector());
  registry.registerDomain(new FinanceMasterConnector());
  registry.registerDomain(new MarketingMasterConnector());
  registry.registerDomain(new AnalyticsMasterConnector());
  registry.registerDomain(new ProductivityMasterConnector());
  registry.registerDomain(new EngineeringMasterConnector());
  registry.registerDomain(new ComplianceMasterConnector());
  registry.registerDomain(new CommerceMasterConnector());
  registry.registerDomain(new AIMasterConnector());

  return registry;
}
