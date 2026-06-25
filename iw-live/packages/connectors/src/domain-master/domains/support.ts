import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId } from "../types";
import { getProvidersForDomain } from "../catalog-bridge";
import { ZendeskConnector } from "../../support/zendesk";

/**
 * Support Domain Master — catalog-driven (Zendesk, Intercom, Help Scout, Front, Freshdesk, Kustomer).
 */
export class SupportMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "support";
  readonly domainName = "Customer Support";

  readonly supportedProviders = getProvidersForDomain("support");

  // ----- Unified support operations -----

  async getTickets(limit = 100): Promise<any[]> {
    const primary = this.primaryProviderId;
    if (!primary) throw new Error("No support provider configured");
    const connector = this.getProvider(primary);
    if ("getTickets" in connector && typeof (connector as any).getTickets === "function") {
      return (connector as any).getTickets(limit);
    }
    if (primary === "zendesk") {
      const z = this.getProvider<ZendeskConnector>("zendesk");
      const result = await z.getTickets({ limit });
      return result.data;
    }
    throw new Error(`Provider ${primary} does not support getTickets`);
  }
}
