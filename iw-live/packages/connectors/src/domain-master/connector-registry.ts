import { ConnectorConfig, ConnectorError } from "@integratewise/connector-contracts";
import { DomainMasterConnector } from "./domain-master-connector";
import { ConfigChangeEvent, DomainHealthSummary, DomainId } from "./types";

// ============================================================================
// CONNECTOR REGISTRY — SINGLE ENTRY POINT FOR ALL DOMAINS
// ============================================================================
// Usage:
//   const registry = ConnectorRegistry.getInstance();
//
//   // Configure a provider (API key set ONCE here):
//   registry.configure("crm", "salesforce", {
//       instanceUrl: "https://myorg.salesforce.com",
//       accessToken: "sk-..."
//   });
//
//   // Get the domain master:
//   const crm = registry.getDomain<CRMMasterConnector>("crm");
//   const contacts = await crm.getContacts(50);
//
//   // Later, rotate API key — all operations auto-update:
//   registry.updateConfig("crm", "salesforce", { accessToken: "sk-new-..." });
// ============================================================================

export class ConnectorRegistry {
  private static _instance: ConnectorRegistry | null = null;
  private domains: Map<DomainId, DomainMasterConnector> = new Map();
  private globalListeners: Array<(event: ConfigChangeEvent) => void> = [];

  private constructor() {}

  /**
   * Singleton access. The registry is shared across the application.
   */
  static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry._instance) {
      ConnectorRegistry._instance = new ConnectorRegistry();
    }
    return ConnectorRegistry._instance;
  }

  /**
   * Reset the singleton (for testing).
   */
  static reset(): void {
    ConnectorRegistry._instance = null;
  }

  /**
   * Register a domain master connector.
   */
  registerDomain(master: DomainMasterConnector): void {
    if (this.domains.has(master.domain)) {
      console.warn(`[Registry] Overwriting domain master for "${master.domain}"`);
    }
    this.domains.set(master.domain, master);

    // Forward config change events
    master.onConfigChange((event) => {
      for (const listener of this.globalListeners) {
        try {
          listener(event);
        } catch (err) {
          console.error("[Registry] Global listener error:", err);
        }
      }
    });
  }

  /**
   * Get a domain master, typed to the specific domain class.
   */
  getDomain<T extends DomainMasterConnector>(domain: DomainId | string): T {
    const master = this.domains.get(domain as DomainId);
    if (!master) {
      throw new ConnectorError(
        `Domain "${domain}" is not registered. ` +
          `Available domains: ${Array.from(this.domains.keys()).join(", ")}`
      );
    }
    return master as T;
  }

  /**
   * List all registered domains.
   */
  getRegisteredDomains(): DomainId[] {
    return Array.from(this.domains.keys());
  }

  // ----- Convenience shortcuts -----

  /**
   * Configure a provider in one call:
   *   registry.configure("crm", "salesforce", { accessToken: "..." })
   */
  configure(domain: DomainId | string, providerId: string, config: ConnectorConfig): void {
    this.getDomain(domain).configureProvider(providerId, config);
  }

  /**
   * Update specific config fields for a provider:
   *   registry.updateConfig("crm", "salesforce", { accessToken: "new-token" })
   */
  updateConfig(
    domain: DomainId | string,
    providerId: string,
    partial: Partial<ConnectorConfig>
  ): void {
    this.getDomain(domain).updateProviderConfig(providerId, partial);
  }

  /**
   * Remove a provider from a domain.
   */
  removeProvider(domain: DomainId | string, providerId: string): void {
    this.getDomain(domain).removeProvider(providerId);
  }

  // ----- Health & Status -----

  /**
   * Run health checks across ALL domains and providers.
   */
  async healthCheckAll(): Promise<Record<string, Record<string, boolean>>> {
    const results: Record<string, Record<string, boolean>> = {};
    for (const [domain, master] of this.domains) {
      results[domain] = await master.testAllConnections();
    }
    return results;
  }

  /**
   * Get health summaries for all domains.
   */
  getHealthReport(): DomainHealthSummary[] {
    return Array.from(this.domains.values()).map((m) => m.getHealthSummary());
  }

  /**
   * Export all configs across all domains (for backup).
   */
  exportAllConfigs(): Record<string, Record<string, ConnectorConfig>> {
    const out: Record<string, Record<string, ConnectorConfig>> = {};
    for (const [domain, master] of this.domains) {
      out[domain] = master.exportConfigs();
    }
    return out;
  }

  /**
   * Import configs across all domains.
   */
  importAllConfigs(configs: Record<string, Record<string, ConnectorConfig>>): void {
    for (const [domain, providerConfigs] of Object.entries(configs)) {
      try {
        this.getDomain(domain).importConfigs(providerConfigs);
      } catch {
        console.warn(`[Registry] Skipping unknown domain: ${domain}`);
      }
    }
  }

  // ----- Event system -----

  /**
   * Subscribe to config changes across all domains.
   */
  onConfigChange(listener: (event: ConfigChangeEvent) => void): () => void {
    this.globalListeners.push(listener);
    return () => {
      this.globalListeners = this.globalListeners.filter((l) => l !== listener);
    };
  }
}
