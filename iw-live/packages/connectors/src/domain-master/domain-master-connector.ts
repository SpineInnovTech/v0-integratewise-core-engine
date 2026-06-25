import { BaseConnector, ConnectorConfig, ConnectorError } from "@integratewise/connector-contracts";
import {
  ProviderDefinition,
  ProviderState,
  DomainId,
  DomainHealthSummary,
  ConfigChangeEvent,
} from "./types";

// ============================================================================
// DOMAIN MASTER CONNECTOR — BASE CLASS
// ============================================================================
// Each domain (CRM, Communication, etc.) has ONE master connector.
// The master:
//   1. Holds a credential vault (provider → config)
//   2. Lazy-instantiates child connectors — re-creates on config change
//   3. Routes unified operations to the primary provider
//   4. Provides domain-wide health checks
//
// Change an API key in the master → all operations automatically use it.
// ============================================================================

export abstract class DomainMasterConnector {
  /** Credential vault: providerId → ProviderState */
  protected providers: Map<string, ProviderState> = new Map();

  /** Live connector instances — invalidated on config change */
  protected instances: Map<string, BaseConnector> = new Map();

  /** Which provider is the default for unified operations */
  protected _primaryProviderId: string | null = null;

  /** Config change listeners */
  private changeListeners: Array<(event: ConfigChangeEvent) => void> = [];

  // ----- Abstract contract — subclasses define these -----

  /** The domain this master covers */
  abstract readonly domain: DomainId;

  /** Human-readable domain name */
  abstract readonly domainName: string;

  /** All providers this domain supports */
  abstract readonly supportedProviders: ProviderDefinition[];

  // -------------------------------------------------------

  /**
   * Configure (or re-configure) a provider's credentials/settings.
   * This is the ONLY place you set API keys, tokens, endpoints.
   * Changing config here automatically propagates to all operations.
   */
  configureProvider(providerId: string, config: ConnectorConfig): void {
    const definition = this.supportedProviders.find((p) => p.id === providerId);
    if (!definition) {
      throw new ConnectorError(
        `Provider "${providerId}" is not supported in the ${this.domainName} domain. ` +
          `Supported: ${this.supportedProviders.map((p) => p.id).join(", ")}`
      );
    }

    // Validate required fields if defined
    if (definition.requiredFields) {
      const missing = definition.requiredFields.filter((f) => !config[f]);
      if (missing.length > 0) {
        throw new ConnectorError(
          `Missing required config fields for ${definition.name}: ${missing.join(", ")}`
        );
      }
    }

    const existing = this.providers.get(providerId);
    const changeType = existing ? "updated" : "configured";

    this.providers.set(providerId, {
      definition,
      config,
      enabled: true,
      lastHealthCheck: undefined,
      healthy: undefined,
    });

    // Invalidate cached instance — next access creates fresh one with new config
    this.instances.delete(providerId);

    // Auto-set primary if this is the first provider configured
    if (!this._primaryProviderId) {
      this._primaryProviderId = providerId;
    }

    this.emitChange({ domain: this.domain, providerId, changeType, timestamp: new Date() });
  }

  /**
   * Update specific fields in a provider's config without replacing everything.
   * Useful for rotating just an API key without re-sending the full config.
   */
  updateProviderConfig(providerId: string, partial: Partial<ConnectorConfig>): void {
    const state = this.providers.get(providerId);
    if (!state) {
      throw new ConnectorError(
        `Provider "${providerId}" is not configured. Call configureProvider() first.`
      );
    }
    this.configureProvider(providerId, { ...state.config, ...partial });
  }

  /**
   * Remove a provider's configuration entirely.
   */
  removeProvider(providerId: string): void {
    this.providers.delete(providerId);
    this.instances.delete(providerId);
    if (this._primaryProviderId === providerId) {
      // Fall back to next configured provider
      const next = Array.from(this.providers.keys())[0] || null;
      this._primaryProviderId = next;
    }
    this.emitChange({
      domain: this.domain,
      providerId,
      changeType: "removed",
      timestamp: new Date(),
    });
  }

  /**
   * Enable/disable a provider without removing its config.
   */
  setProviderEnabled(providerId: string, enabled: boolean): void {
    const state = this.providers.get(providerId);
    if (!state) throw new ConnectorError(`Provider "${providerId}" not configured`);
    state.enabled = enabled;
    if (!enabled) this.instances.delete(providerId);
    this.emitChange({
      domain: this.domain,
      providerId,
      changeType: enabled ? "enabled" : "disabled",
      timestamp: new Date(),
    });
  }

  /**
   * Set which provider handles unified domain operations by default.
   */
  setPrimaryProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new ConnectorError(
        `Provider "${providerId}" must be configured before setting as primary`
      );
    }
    this._primaryProviderId = providerId;
  }

  /**
   * Get the primary provider ID.
   */
  get primaryProviderId(): string | null {
    return this._primaryProviderId;
  }

  /**
   * Get a live connector instance for a specific provider.
   * Lazy-creates from the credential vault. If config changed since
   * last access, a fresh instance is created automatically.
   */
  getProvider<T extends BaseConnector>(providerId: string): T {
    const state = this.providers.get(providerId);
    if (!state) {
      throw new ConnectorError(
        `Provider "${providerId}" is not configured in ${this.domainName}. ` +
          `Configure it first with configureProvider("${providerId}", { ... })`
      );
    }
    if (!state.enabled) {
      throw new ConnectorError(`Provider "${providerId}" is disabled`);
    }

    let instance = this.instances.get(providerId);
    if (!instance) {
      // Create fresh instance from the vault config
      instance = new state.definition.connectorClass(state.config);
      this.instances.set(providerId, instance);
    }
    return instance as T;
  }

  /**
   * Get the primary provider's connector instance.
   */
  getPrimary<T extends BaseConnector>(): T {
    if (!this._primaryProviderId) {
      throw new ConnectorError(`No primary provider set for ${this.domainName}`);
    }
    return this.getProvider<T>(this._primaryProviderId);
  }

  /**
   * Check if a provider is configured and enabled.
   */
  isProviderReady(providerId: string): boolean {
    const state = this.providers.get(providerId);
    return !!state && state.enabled;
  }

  /**
   * Get IDs of all configured providers.
   */
  getConfiguredProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([, s]) => s.enabled)
      .map(([id]) => id);
  }

  /**
   * Test connections for all configured providers.
   */
  async testAllConnections(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [id, state] of this.providers) {
      if (!state.enabled) {
        results[id] = false;
        continue;
      }
      try {
        const connector = this.getProvider(id);
        const ok = await connector.testConnection();
        state.healthy = ok;
        state.lastHealthCheck = new Date();
        results[id] = ok;
      } catch (err: any) {
        state.healthy = false;
        state.lastHealthCheck = new Date();
        state.lastError = err.message;
        results[id] = false;
      }
    }
    return results;
  }

  /**
   * Get a full health summary for this domain — useful for dashboards.
   */
  getHealthSummary(): DomainHealthSummary {
    const providerDetails = this.supportedProviders.map((def) => {
      const state = this.providers.get(def.id);
      return {
        id: def.id,
        name: def.name,
        configured: !!state,
        enabled: state?.enabled ?? false,
        healthy: state?.healthy ?? null,
        lastCheck: state?.lastHealthCheck ?? null,
      };
    });

    return {
      domain: this.domain,
      totalProviders: this.supportedProviders.length,
      configuredProviders: this.providers.size,
      healthyProviders: providerDetails.filter((p) => p.healthy === true).length,
      primaryProvider: this._primaryProviderId,
      providers: providerDetails,
    };
  }

  /**
   * Export all provider configs (e.g., for backup/migration).
   * Sensitive fields should be masked by the caller.
   */
  exportConfigs(): Record<string, ConnectorConfig> {
    const out: Record<string, ConnectorConfig> = {};
    for (const [id, state] of this.providers) {
      out[id] = { ...state.config };
    }
    return out;
  }

  /**
   * Import configs from a backup — configures all providers at once.
   */
  importConfigs(configs: Record<string, ConnectorConfig>): void {
    for (const [providerId, config] of Object.entries(configs)) {
      try {
        this.configureProvider(providerId, config);
      } catch {
        console.warn(`[DomainMaster:${this.domain}] Skipping unknown provider: ${providerId}`);
      }
    }
  }

  // ----- Event system -----

  onConfigChange(listener: (event: ConfigChangeEvent) => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== listener);
    };
  }

  private emitChange(event: ConfigChangeEvent): void {
    for (const listener of this.changeListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error(`[DomainMaster:${this.domain}] Change listener error:`, err);
      }
    }
  }
}
