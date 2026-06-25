/**
 * @integratewise/analytics
 *
 * Cross-platform analytics for IntegrateWise.
 * Supports multiple providers with a unified API.
 *
 * @example Basic usage
 * ```ts
 * import { analytics, PostHogProvider, StandardEvents } from '@integratewise/analytics'
 *
 * // Register providers
 * analytics.register(PostHogProvider)
 *
 * // Initialize
 * await analytics.init(new Map([
 *   ['posthog', { apiKey: 'phc_xxx' }]
 * ]))
 *
 * // Track events
 * analytics.identify('user_123', { email: 'user@example.com' })
 * analytics.track(StandardEvents.FEATURE_USED, { feature: 'ai-chat' })
 * ```
 *
 * @example React usage
 * ```tsx
 * import { useAnalytics, usePageTracking } from '@integratewise/analytics'
 *
 * function MyPage() {
 *   usePageTracking({ surface: 'dashboard' })
 *   const { track } = useAnalytics()
 *
 *   return <button onClick={() => track('button_clicked')}>Click</button>
 * }
 * ```
 */

// Core
export { analytics, AnalyticsManager } from "./manager";
export * from "./types";

// React Hooks
export {
  useAnalytics,
  usePageTracking,
  useTrackOnMount,
  useTimeTracking,
  useTrackedClick,
  useTrackedSubmit,
} from "./hooks";

// Providers (lazy loaded)
export { PostHogProvider } from "./providers/posthog";
export { MixpanelProvider } from "./providers/mixpanel";
export { AmplitudeProvider } from "./providers/amplitude";
export { ConsoleProvider } from "./providers/console";
