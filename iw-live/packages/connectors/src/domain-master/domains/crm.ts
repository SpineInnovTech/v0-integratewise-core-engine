import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId } from "../types";
import { getProvidersForDomain } from "../catalog-bridge";
import { SalesforceConnector } from "../../crm/salesforce";
import { HubSpotConnector } from "../../crm/hubspot";

/**
 * CRM Domain Master — catalog-driven (Salesforce, HubSpot, Pipedrive, Zoho CRM, Freshsales, Close).
 */
export class CRMMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "crm";
  readonly domainName = "CRM";

  readonly supportedProviders = getProvidersForDomain("crm");

  // ----- Unified CRM operations (route to primary) -----

  async getContacts(limit = 100): Promise<any[]> {
    const primary = this.primaryProviderId;
    const numLimit = Number(limit);
    const safeLimit = Number.isFinite(numLimit) ? Math.max(1, Math.min(numLimit, 2000)) : 100;
    if (primary === "salesforce") {
      const sf = this.getProvider<SalesforceConnector>("salesforce");
      return sf.query(`SELECT Id, FirstName, LastName, Email FROM Contact LIMIT ${safeLimit}`);
    }
    if (primary === "hubspot") {
      const hs = this.getProvider<HubSpotConnector>("hubspot");
      const result = await hs.getContacts(safeLimit);
      return result.results || [];
    }
    throw new Error(`No CRM provider configured`);
  }

  async getDeals(limit = 100): Promise<any[]> {
    const primary = this.primaryProviderId;
    const numLimit = Number(limit);
    const safeLimit = Number.isFinite(numLimit) ? Math.max(1, Math.min(numLimit, 2000)) : 100;
    if (primary === "salesforce") {
      const sf = this.getProvider<SalesforceConnector>("salesforce");
      return sf.query(`SELECT Id, Name, Amount, StageName FROM Opportunity LIMIT ${safeLimit}`);
    }
    if (primary === "hubspot") {
      const hs = this.getProvider<HubSpotConnector>("hubspot");
      const result = await hs.getDeals(limit);
      return result.results || [];
    }
    throw new Error(`No CRM provider configured`);
  }
}
