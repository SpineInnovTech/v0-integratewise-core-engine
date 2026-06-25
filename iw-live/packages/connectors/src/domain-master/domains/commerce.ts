import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId } from "../types";
import { getProvidersForDomain } from "../catalog-bridge";
import { ShopifyConnector } from "../../ecommerce/shopify";

/**
 * Commerce Domain Master — catalog-driven (Shopify, WooCommerce, BigCommerce).
 */
export class CommerceMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "commerce";
  readonly domainName = "E-Commerce";

  readonly supportedProviders = getProvidersForDomain("commerce");

  // ----- Unified commerce operations -----

  async getOrders(params?: any): Promise<any[]> {
    if (this.isProviderReady("shopify")) {
      const shopify = this.getProvider<ShopifyConnector>("shopify");
      return shopify.getOrders(params);
    }
    throw new Error("No commerce provider configured");
  }
}
