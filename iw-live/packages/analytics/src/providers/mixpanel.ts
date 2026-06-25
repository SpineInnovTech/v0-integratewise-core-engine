/**
 * Mixpanel Analytics Provider
 *
 * Mixpanel is a product analytics platform.
 * https://mixpanel.com
 */
import type {
  AnalyticsProvider,
  ProviderConfig,
  UserProperties,
  EventProperties,
  PageProperties,
} from "../types";

let mixpanel: any = null;

export const MixpanelProvider: AnalyticsProvider = {
  name: "mixpanel",

  async init(config: ProviderConfig): Promise<void> {
    if (typeof window === "undefined") return;

    const Mixpanel = (await import("mixpanel-browser")).default;

    Mixpanel.init(config.apiKey!, {
      debug: config.debug ?? false,
      track_pageview: false, // We handle page views manually
      persistence: config.persistence === "cookie" ? "cookie" : "localStorage",
      api_host: config.host || "https://api.mixpanel.com",
    });

    mixpanel = Mixpanel;
  },

  identify(userId: string, properties?: UserProperties): void {
    if (!mixpanel) return;
    mixpanel.identify(userId);
    if (properties) {
      mixpanel.people.set(properties);
    }
  },

  track(event: string, properties?: EventProperties): void {
    if (!mixpanel) return;
    mixpanel.track(event, properties);
  },

  page(properties?: PageProperties): void {
    if (!mixpanel) return;
    mixpanel.track("Page View", {
      path: window.location.pathname,
      url: window.location.href,
      ...properties,
    });
  },

  reset(): void {
    if (!mixpanel) return;
    mixpanel.reset();
  },

  setSuperProperties(properties: EventProperties): void {
    if (!mixpanel) return;
    mixpanel.register(properties);
  },

  optOut(): void {
    if (!mixpanel) return;
    mixpanel.opt_out_tracking();
  },

  optIn(): void {
    if (!mixpanel) return;
    mixpanel.opt_in_tracking();
  },

  isOptedOut(): boolean {
    if (!mixpanel) return false;
    return mixpanel.has_opted_out_tracking();
  },

  shutdown(): void {
    if (!mixpanel) return;
    mixpanel.reset();
    mixpanel = null;
  },
};

export default MixpanelProvider;
