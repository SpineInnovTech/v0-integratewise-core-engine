/**
 * L2 Error Boundary
 *
 * Catches errors in L2 components and provides graceful fallbacks.
 * This ensures the happy path components don't crash the entire app
 * when L2 services are unavailable or return unexpected errors.
 */

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class L2ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[L2ErrorBoundary] Caught error:", error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to external monitoring if available
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "l2_error", {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI for L2 errors
      return (
        this.props.fallback || (
          <div className="p-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h.019M12 19v-6"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Insights Temporarily Unavailable
              </h3>

              <p className="text-gray-600 mb-4">
                {this.state.error?.message ||
                  "The AI insights service is currently experiencing issues."}
              </p>

              <div className="space-y-2 text-sm text-gray-500">
                <p>• Your other workspace features continue to work normally</p>
                <p>• We'll automatically retry when the service is available</p>
                <p>• You can refresh the page to try again</p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-4 py-2 bg-[var(--iw-forest-mid)] text-white rounded-lg hover:bg-[var(--iw-forest)] transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
