import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId } from "../types";
import { getProvidersForDomain } from "../catalog-bridge";
import { StripeConnector } from "../../accounting/stripe";

/**
 * Finance Domain Master — catalog-driven (QuickBooks, Xero, Freshbooks, Chargebee, Stripe, Paddle).
 */
export class FinanceMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "finance";
  readonly domainName = "Finance & Accounting";

  readonly supportedProviders = getProvidersForDomain("finance");

  // ----- Unified finance operations -----

  async getInvoices(limit = 100): Promise<any[]> {
    const primary = this.primaryProviderId;
    if (primary === "stripe") {
      const stripe = this.getProvider<StripeConnector>("stripe");
      const result = await stripe.listInvoices({ limit });
      return result.data || [];
    }
    // QuickBooks and Zoho Books both have invoice fetching
    if (primary) {
      const connector = this.getProvider(primary);
      if ("getInvoices" in connector && typeof (connector as any).getInvoices === "function") {
        return (connector as any).getInvoices(limit);
      }
    }
    throw new Error("No finance provider configured");
  }

  async getCustomers(limit = 100): Promise<any[]> {
    const primary = this.primaryProviderId;
    if (primary === "stripe") {
      const stripe = this.getProvider<StripeConnector>("stripe");
      const result = await stripe.listCustomers({ limit });
      return result.data || [];
    }
    if (primary) {
      const connector = this.getProvider(primary);
      if ("getCustomers" in connector && typeof (connector as any).getCustomers === "function") {
        return (connector as any).getCustomers(limit);
      }
    }
    throw new Error("No finance provider configured");
  }
}
