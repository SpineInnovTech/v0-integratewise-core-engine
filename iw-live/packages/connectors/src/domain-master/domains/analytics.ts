import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId } from "../types";
import { getProvidersForDomain } from "../catalog-bridge";

/**
 * Analytics Domain Master — catalog-driven (Google Analytics, Amplitude, Heap, Mixpanel, Metabase).
 */
export class AnalyticsMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "analytics";
  readonly domainName = "Analytics";

  readonly supportedProviders = getProvidersForDomain("analytics");
}
