import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId, ProviderDefinition } from "../types";
import { IndiaFilingsConnector } from "../../compliance/indiafilings";
import { GSTPortalConnector } from "../../compliance/gst-portal";

/**
 * Compliance Domain Master — manages IndiaFilings, GST Portal.
 */
export class ComplianceMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "compliance";
  readonly domainName = "Compliance & Regulatory";

  readonly supportedProviders: ProviderDefinition[] = [
    {
      id: "indiafilings",
      name: "IndiaFilings",
      category: "filing",
      connectorClass: IndiaFilingsConnector,
      authType: "api_key",
      requiredFields: ["apiKey"],
      description: "IndiaFilings — company registration, compliance tracking, filings",
    },
    {
      id: "gst-portal",
      name: "GST Portal",
      category: "tax",
      connectorClass: GSTPortalConnector,
      authType: "api_key",
      requiredFields: ["apiKey", "gstin"],
      description: "GST Portal — GSTR filings, returns, invoices, compliance",
    },
  ];
}
