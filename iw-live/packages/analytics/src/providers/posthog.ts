/**
 * PostHog Analytics Provider
 *
 * PostHog is an open-source product analytics platform.
 * https://posthog.com
 */
import type {
  AnalyticsProvider,
  ProviderConfig,
  UserProperties,
  EventProperties,
  PageProperties,
} from "../types";

let posthog: any = null;

export const PostHogProvider: AnalyticsProvider = {
  name: "posthog",

  async init(config: ProviderConfig): Promise<void> {
    if (typeof window === "undefined") return;

    const PostHog = (await import("posthog-js")).default;

    PostHog.init(config.apiKey!, {
      api_host: config.host || "https://app.posthog.com",
      autocapture: config.autocapture ?? true,
      capture_pageview: false, // We handle page views manually
      persistence: config.persistence === "cookie" ? "cookie" : "localStorage",
      loaded: (ph: any) => {
        posthog = ph;
        if (config.debug) {
          ph.debug();
        }
      },
    });

    posthog = PostHog;
  },

  identify(userId: string, properties?: UserProperties): void {
    if (!posthog) return;
    posthog.identify(userId, properties);
  },

  track(event: string, properties?: EventProperties): void {
    if (!posthog) return;
    posthog.capture(event, properties);
  },

  page(properties?: PageProperties): void {
    if (!posthog) return;
    posthog.capture("$pageview", {
      $current_url: window.location.href,
      ...properties,
    });
  },

  reset(): void {
    if (!posthog) return;
    posthog.reset();
  },

  setSuperProperties(properties: EventProperties): void {
    if (!posthog) return;
    posthog.register(properties);
  },

  optOut(): void {
    if (!posthog) return;
    posthog.opt_out_capturing();
  },

  optIn(): void {
    if (!posthog) return;
    posthog.opt_in_capturing();
  },

  isOptedOut(): boolean {
    if (!posthog) return false;
    return posthog.has_opted_out_capturing();
  },

  shutdown(): void {
    if (!posthog) return;
    posthog.reset();
    posthog = null;
  },
};

export default PostHogProvider;
