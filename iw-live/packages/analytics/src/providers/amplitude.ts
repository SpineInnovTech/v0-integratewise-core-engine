/**
 * Amplitude Analytics Provider
 *
 * Amplitude is a product analytics platform.
 * https://amplitude.com
 */
import type {
  AnalyticsProvider,
  ProviderConfig,
  UserProperties,
  EventProperties,
  PageProperties,
} from "../types";

let amplitude: any = null;

export const AmplitudeProvider: AnalyticsProvider = {
  name: "amplitude",

  async init(config: ProviderConfig): Promise<void> {
    if (typeof window === "undefined") return;

    const Amplitude = await import("@amplitude/analytics-browser");

    Amplitude.init(config.apiKey!, {
      serverUrl: config.host,
      logLevel: config.debug ? Amplitude.Types.LogLevel.Debug : Amplitude.Types.LogLevel.Error,
      defaultTracking: {
        pageViews: false, // We handle page views manually
        sessions: true,
        formInteractions: config.autocapture ?? false,
        fileDownloads: config.autocapture ?? false,
      },
    });

    amplitude = Amplitude;
  },

  identify(userId: string, properties?: UserProperties): void {
    if (!amplitude) return;
    amplitude.setUserId(userId);
    if (properties) {
      const identifyEvent = new amplitude.Identify();
      Object.entries(properties).forEach(([key, value]) => {
        identifyEvent.set(key, value);
      });
      amplitude.identify(identifyEvent);
    }
  },

  track(event: string, properties?: EventProperties): void {
    if (!amplitude) return;
    amplitude.track(event, properties);
  },

  page(properties?: PageProperties): void {
    if (!amplitude) return;
    amplitude.track("Page View", {
      path: window.location.pathname,
      url: window.location.href,
      ...properties,
    });
  },

  reset(): void {
    if (!amplitude) return;
    amplitude.reset();
  },

  setSuperProperties(properties: EventProperties): void {
    if (!amplitude) return;
    // Amplitude doesn't have super properties, use identify instead
    const identifyEvent = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identifyEvent.set(key, value);
    });
    amplitude.identify(identifyEvent);
  },

  optOut(): void {
    if (!amplitude) return;
    amplitude.setOptOut(true);
  },

  optIn(): void {
    if (!amplitude) return;
    amplitude.setOptOut(false);
  },

  async flush(): Promise<void> {
    if (!amplitude) return;
    await amplitude.flush();
  },

  shutdown(): void {
    if (!amplitude) return;
    amplitude.reset();
    amplitude = null;
  },
};

export default AmplitudeProvider;
