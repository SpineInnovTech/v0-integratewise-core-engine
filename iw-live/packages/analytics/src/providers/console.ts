/**
 * Console Analytics Provider
 *
 * Logs all analytics events to the console.
 * Useful for development and debugging.
 */
import type {
  AnalyticsProvider,
  ProviderConfig,
  UserProperties,
  EventProperties,
  PageProperties,
} from "../types";

let enabled = false;
let prefix = "[Analytics]";

export const ConsoleProvider: AnalyticsProvider = {
  name: "console",

  async init(config: ProviderConfig): Promise<void> {
    enabled = true;
    prefix = (config.prefix as string) || "[Analytics]";

    if (config.debug) {
      console.log(`${prefix} Console provider initialized`);
    }
  },

  identify(userId: string, properties?: UserProperties): void {
    if (!enabled) return;
    console.log(`${prefix} Identify:`, userId, properties);
  },

  track(event: string, properties?: EventProperties): void {
    if (!enabled) return;
    console.log(`${prefix} Track:`, event, properties);
  },

  page(properties?: PageProperties): void {
    if (!enabled) return;
    console.log(`${prefix} Page:`, properties);
  },

  reset(): void {
    if (!enabled) return;
    console.log(`${prefix} Reset`);
  },

  setSuperProperties(properties: EventProperties): void {
    if (!enabled) return;
    console.log(`${prefix} Super Properties:`, properties);
  },

  optOut(): void {
    enabled = false;
    console.log(`${prefix} Opted out`);
  },

  optIn(): void {
    enabled = true;
    console.log(`${prefix} Opted in`);
  },

  isOptedOut(): boolean {
    return !enabled;
  },

  shutdown(): void {
    enabled = false;
  },
};

export default ConsoleProvider;
