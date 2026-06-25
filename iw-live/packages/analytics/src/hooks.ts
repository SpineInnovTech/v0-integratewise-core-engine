/**
 * React Analytics Hooks
 *
 * React hooks for integrating analytics into components.
 */
"use client";

import { useEffect, useCallback, useRef } from "react";
import { analytics } from "./manager";
import type { EventProperties, PageProperties, UserProperties } from "./types";

/**
 * Track page views automatically on route changes
 */
export function usePageTracking(properties?: PageProperties): void {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per mount
    if (tracked.current) return;
    tracked.current = true;

    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const title = typeof document !== "undefined" ? document.title : "";

    analytics.page({
      path,
      title,
      ...properties,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Get analytics tracking functions
 */
export function useAnalytics() {
  const track = useCallback((event: string, properties?: EventProperties) => {
    analytics.track(event, properties);
  }, []);

  const page = useCallback((properties?: PageProperties) => {
    analytics.page(properties);
  }, []);

  const identify = useCallback((userId: string, properties?: UserProperties) => {
    analytics.identify(userId, properties);
  }, []);

  const reset = useCallback(() => {
    analytics.reset();
  }, []);

  return {
    track,
    page,
    identify,
    reset,
    isEnabled: analytics.isEnabled(),
    userId: analytics.getUserId(),
  };
}

/**
 * Track an event when a component mounts
 */
export function useTrackOnMount(event: string, properties?: EventProperties): void {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    analytics.track(event, properties);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Track time spent on a page/component
 */
export function useTimeTracking(event: string, properties?: EventProperties): void {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const duration = Date.now() - startTime.current;
      analytics.track(event, {
        ...properties,
        duration_ms: duration,
        duration_seconds: Math.round(duration / 1000),
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Create a tracked click handler
 */
export function useTrackedClick(
  event: string,
  properties?: EventProperties
): (e?: React.MouseEvent) => void {
  return useCallback(
    (e?: React.MouseEvent) => {
      analytics.track(event, properties);
    },
    [event, properties]
  );
}

/**
 * Create a tracked form submission handler
 */
export function useTrackedSubmit(
  event: string,
  getProperties?: () => EventProperties
): (e?: React.FormEvent) => void {
  return useCallback(
    (e?: React.FormEvent) => {
      const properties = getProperties?.() ?? {};
      analytics.track(event, properties);
    },
    [event, getProperties]
  );
}
