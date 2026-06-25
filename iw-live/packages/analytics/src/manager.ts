/**
 * Analytics Manager
 *
 * Orchestrates multiple analytics providers with a unified API.
 */
import type {
  AnalyticsProvider,
  ProviderConfig,
  UserProperties,
  EventProperties,
  PageProperties,
} from "./types";

class AnalyticsManager {
  private providers: AnalyticsProvider[] = [];
  private initialized = false;
  private enabled = true;
  private debug = false;
  private defaultProperties: EventProperties = {};
  private userId: string | null = null;
  private userProperties: UserProperties = {};

  /**
   * Register an analytics provider
   */
  register(provider: AnalyticsProvider): void {
    this.providers.push(provider);
    if (this.debug) {
      console.log(`[Analytics] Registered provider: ${provider.name}`);
    }
  }

  /**
   * Initialize all registered providers
   */
  async init(
    configs: Map<string, ProviderConfig>,
    options?: { debug?: boolean; enabled?: boolean }
  ): Promise<void> {
    this.debug = options?.debug ?? false;
    this.enabled = options?.enabled ?? true;

    if (!this.enabled) {
      if (this.debug) console.log("[Analytics] Disabled");
      return;
    }

    const initPromises = this.providers.map(async (provider) => {
      const config = configs.get(provider.name);
      if (config) {
        try {
          await provider.init(config);
          if (this.debug) {
            console.log(`[Analytics] Initialized: ${provider.name}`);
          }
        } catch (error) {
          console.error(`[Analytics] Failed to init ${provider.name}:`, error);
        }
      }
    });

    await Promise.all(initPromises);
    this.initialized = true;
  }

  /**
   * Identify a user across all providers
   */
  identify(userId: string, properties?: UserProperties): void {
    if (!this.enabled) return;

    this.userId = userId;
    this.userProperties = { ...this.userProperties, ...properties };

    if (this.debug) {
      console.log("[Analytics] Identify:", userId, properties);
    }

    this.providers.forEach((provider) => {
      try {
        provider.identify(userId, properties);
      } catch (error) {
        console.error(`[Analytics] ${provider.name} identify error:`, error);
      }
    });
  }

  /**
   * Track an event across all providers
   */
  track(event: string, properties?: EventProperties): void {
    if (!this.enabled) return;

    const allProperties = {
      ...this.defaultProperties,
      ...properties,
      timestamp: new Date().toISOString(),
    };

    if (this.debug) {
      console.log("[Analytics] Track:", event, allProperties);
    }

    this.providers.forEach((provider) => {
      try {
        provider.track(event, allProperties);
      } catch (error) {
        console.error(`[Analytics] ${provider.name} track error:`, error);
      }
    });
  }

  /**
   * Track a page view across all providers
   */
  page(properties?: PageProperties): void {
    if (!this.enabled) return;

    const allProperties = {
      ...this.defaultProperties,
      ...properties,
      timestamp: new Date().toISOString(),
    };

    if (this.debug) {
      console.log("[Analytics] Page:", allProperties);
    }

    this.providers.forEach((provider) => {
      try {
        provider.page(allProperties);
      } catch (error) {
        console.error(`[Analytics] ${provider.name} page error:`, error);
      }
    });
  }

  /**
   * Reset user identity (logout)
   */
  reset(): void {
    if (!this.enabled) return;

    this.userId = null;
    this.userProperties = {};

    if (this.debug) {
      console.log("[Analytics] Reset");
    }

    this.providers.forEach((provider) => {
      try {
        provider.reset();
      } catch (error) {
        console.error(`[Analytics] ${provider.name} reset error:`, error);
      }
    });
  }

  /**
   * Set default properties sent with every event
   */
  setDefaultProperties(properties: EventProperties): void {
    this.defaultProperties = { ...this.defaultProperties, ...properties };
  }

  /**
   * Set super properties on providers that support it
   */
  setSuperProperties(properties: EventProperties): void {
    this.defaultProperties = { ...this.defaultProperties, ...properties };

    this.providers.forEach((provider) => {
      if (provider.setSuperProperties) {
        try {
          provider.setSuperProperties(properties);
        } catch (error) {
          console.error(`[Analytics] ${provider.name} setSuperProperties error:`, error);
        }
      }
    });
  }

  /**
   * Opt user out of tracking
   */
  optOut(): void {
    this.enabled = false;

    this.providers.forEach((provider) => {
      if (provider.optOut) {
        provider.optOut();
      }
    });

    if (this.debug) {
      console.log("[Analytics] Opted out");
    }
  }

  /**
   * Opt user back in to tracking
   */
  optIn(): void {
    this.enabled = true;

    this.providers.forEach((provider) => {
      if (provider.optIn) {
        provider.optIn();
      }
    });

    if (this.debug) {
      console.log("[Analytics] Opted in");
    }
  }

  /**
   * Flush any pending events
   */
  async flush(): Promise<void> {
    const flushPromises = this.providers.filter((p) => p.flush).map((p) => p.flush!());

    await Promise.all(flushPromises);
  }

  /**
   * Shutdown all providers
   */
  shutdown(): void {
    this.providers.forEach((provider) => {
      if (provider.shutdown) {
        provider.shutdown();
      }
    });
    this.providers = [];
    this.initialized = false;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const analytics = new AnalyticsManager();

// Export class for custom instances
export { AnalyticsManager };
