import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId } from "../types";
import { getProvidersForDomain } from "../catalog-bridge";

/**
 * Marketing Domain Master — catalog-driven (HubSpot Marketing, Braze, SendGrid, Mailchimp, Marketo, Customer.io).
 */
export class MarketingMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "marketing";
  readonly domainName = "Marketing";

  readonly supportedProviders = getProvidersForDomain("marketing");
}
