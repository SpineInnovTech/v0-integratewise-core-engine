import {
  withApiResilience,
  withRateLimitHandling,
  withConnectionRetry,
  TokenBucket,
  SlidingWindowLimiter,
  AdaptiveRateLimiter,
  createAppError,
} from "./error-handling";

/**
 * API client with built-in resilience patterns for external service calls
 */
export class ResilientApiClient {
  private rateLimiter: TokenBucket | SlidingWindowLimiter | AdaptiveRateLimiter;
  private circuitBreaker: any; // We'll import this from error-handling

  constructor(options: {
    baseURL: string;
    timeout?: number;
    rateLimitType?: "token-bucket" | "sliding-window" | "adaptive";
    rateLimitConfig?: {
      capacity?: number;
      refillRate?: number;
      windowSize?: number;
      maxRequests?: number;
      baseRate?: number;
    };
    retryConfig?: {
      connectionMaxAttempts?: number;
      rateLimitMaxAttempts?: number;
      governorMaxAttempts?: number;
    };
    headers?: Record<string, string>;
  }) {
    const {
      baseURL,
      timeout = 30000,
      rateLimitType = "token-bucket",
      rateLimitConfig = {},
      retryConfig = {},
      headers = {},
    } = options;

    this.baseURL = baseURL;
    this.timeout = timeout;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "User-Agent": "IntegrateWise-ResilientClient/1.0",
      ...headers,
    };

    this.retryConfig = {
      connectionMaxAttempts: 10,
      rateLimitMaxAttempts: 5,
      governorMaxAttempts: 3,
      ...retryConfig,
    };

    // Initialize rate limiter
    switch (rateLimitType) {
      case "sliding-window":
        this.rateLimiter = new SlidingWindowLimiter(
          rateLimitConfig.windowSize || 60000, // 1 minute
          rateLimitConfig.maxRequests || 100
        );
        break;
      case "adaptive":
        this.rateLimiter = new AdaptiveRateLimiter(
          rateLimitConfig.baseRate || 10 // 10 requests per second
        );
        break;
      case "token-bucket":
      default:
        this.rateLimiter = new TokenBucket(
          rateLimitConfig.capacity || 100,
          rateLimitConfig.refillRate || 10 // 10 tokens per second
        );
        break;
    }
  }

  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private retryConfig: {
    connectionMaxAttempts: number;
    rateLimitMaxAttempts: number;
    governorMaxAttempts: number;
  };

  /**
   * Make a resilient API request with automatic retries and rate limiting
   */
  async request<T = any>(config: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    path: string;
    data?: any;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    correlationId?: string;
  }): Promise<T> {
    const { method, path, data, headers = {}, params, correlationId } = config;

    // Build URL
    let url = `${this.baseURL}${path}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    // Merge headers
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
      ...(correlationId && { "X-Correlation-ID": correlationId }),
    };

    // Rate limiting check
    const canProceed = await this.checkRateLimit();
    if (!canProceed) {
      throw createAppError("RATE_LIMIT_EXCEEDED", "Client-side rate limit exceeded", {
        operation: "api_request",
        url,
        method,
      });
    }

    // Execute request with resilience patterns
    return withApiResilience(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: data ? JSON.stringify(data) : undefined,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Handle rate limiting from server
          if (response.status === 429) {
            const retryAfter = response.headers.get("retry-after");
            const error = new Error("Rate limit exceeded");
            (error as any).statusCode = 429;
            (error as any).retryAfter = retryAfter;
            throw error;
          }

          // Handle governor limits (often 429 with specific messages)
          if (response.status === 429) {
            const responseText = await response.text();
            if (
              responseText.toLowerCase().includes("governor") ||
              responseText.toLowerCase().includes("quota") ||
              responseText.toLowerCase().includes("daily limit")
            ) {
              const error = new Error("Governor limit exceeded");
              (error as any).statusCode = 429;
              (error as any).isGovernorLimit = true;
              throw error;
            }
          }

          if (!response.ok) {
            const errorText = await response.text();
            const error = new Error(`HTTP ${response.status}: ${errorText}`);
            (error as any).statusCode = response.status;
            throw error;
          }

          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await response.json();
          } else {
            return (await response.text()) as T;
          }
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            throw createAppError(
              "CONNECTION_ERROR",
              "Request timeout",
              {
                operation: "api_request",
                url,
                method,
                timeout: this.timeout,
              },
              error
            );
          }
          throw error;
        }
      },
      {
        connectionMaxAttempts: this.retryConfig.connectionMaxAttempts,
        rateLimitMaxAttempts: this.retryConfig.rateLimitMaxAttempts,
        governorMaxAttempts: this.retryConfig.governorMaxAttempts,
        onConnectionRetry: (attempt, error, delay) => {
          console.warn(
            `API request retry ${attempt} for ${method} ${url}: ${error.message}, delay: ${delay}ms`
          );
        },
        onRateLimit: (retryAfter, attempt) => {
          console.warn(
            `API rate limit hit for ${method} ${url}, retry after ${retryAfter}ms (attempt ${attempt})`
          );

          // Update adaptive rate limiter if applicable
          if (this.rateLimiter instanceof AdaptiveRateLimiter) {
            this.rateLimiter.recordRateLimit();
          }
        },
        onGovernorLimit: (retryAfter, attempt) => {
          console.warn(
            `API governor limit hit for ${method} ${url}, retry after ${retryAfter}ms (attempt ${attempt})`
          );

          // Update adaptive rate limiter if applicable
          if (this.rateLimiter instanceof AdaptiveRateLimiter) {
            this.rateLimiter.recordRateLimit();
          }
        },
      }
    );
  }

  /**
   * GET request
   */
  async get<T = any>(
    path: string,
    options: {
      headers?: Record<string, string>;
      params?: Record<string, string>;
      correlationId?: string;
    } = {}
  ): Promise<T> {
    return this.request({
      method: "GET",
      path,
      ...options,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    path: string,
    data: any,
    options: {
      headers?: Record<string, string>;
      params?: Record<string, string>;
      correlationId?: string;
    } = {}
  ): Promise<T> {
    return this.request({
      method: "POST",
      path,
      data,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    path: string,
    data: any,
    options: {
      headers?: Record<string, string>;
      params?: Record<string, string>;
      correlationId?: string;
    } = {}
  ): Promise<T> {
    return this.request({
      method: "PUT",
      path,
      data,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    path: string,
    options: {
      headers?: Record<string, string>;
      params?: Record<string, string>;
      correlationId?: string;
    } = {}
  ): Promise<T> {
    return this.request({
      method: "DELETE",
      path,
      ...options,
    });
  }

  /**
   * Check rate limit before making request
   */
  private async checkRateLimit(): Promise<boolean> {
    if (this.rateLimiter instanceof AdaptiveRateLimiter) {
      await this.rateLimiter.waitForNextRequest();
      return true;
    } else if (this.rateLimiter instanceof TokenBucket) {
      return this.rateLimiter.acquire();
    } else if (this.rateLimiter instanceof SlidingWindowLimiter) {
      return this.rateLimiter.acquire();
    }

    return true; // No rate limiting
  }

  /**
   * Get rate limiter status
   */
  getRateLimitStatus(): {
    type: string;
    availableTokens?: number;
    timeToNextToken?: number;
    remainingRequests?: number;
    timeToNextWindow?: number;
    currentRate?: number;
  } {
    if (this.rateLimiter instanceof TokenBucket) {
      return {
        type: "token-bucket",
        availableTokens: this.rateLimiter.getAvailableTokens(),
        timeToNextToken: this.rateLimiter.getTimeToNextToken(),
      };
    } else if (this.rateLimiter instanceof SlidingWindowLimiter) {
      return {
        type: "sliding-window",
        remainingRequests: this.rateLimiter.getRemainingRequests(),
        timeToNextWindow: this.rateLimiter.getTimeToNextWindow(),
      };
    } else if (this.rateLimiter instanceof AdaptiveRateLimiter) {
      return {
        type: "adaptive",
        currentRate: this.rateLimiter.getCurrentRate(),
      };
    }

    return { type: "none" };
  }

  /**
   * Record successful request for adaptive rate limiter
   */
  recordSuccess(): void {
    if (this.rateLimiter instanceof AdaptiveRateLimiter) {
      this.rateLimiter.recordSuccess();
    }
  }

  /**
   * Record failed request for adaptive rate limiter
   */
  recordError(): void {
    if (this.rateLimiter instanceof AdaptiveRateLimiter) {
      this.rateLimiter.recordError();
    }
  }
}

/**
 * Factory function to create API clients for common external services
 */
export class ApiClientFactory {
  /**
   * Create a client for Stripe API
   */
  static createStripeClient(apiKey: string): ResilientApiClient {
    return new ResilientApiClient({
      baseURL: "https://api.stripe.com/v1",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      rateLimitType: "token-bucket",
      rateLimitConfig: {
        capacity: 100, // Stripe allows 100 requests per second
        refillRate: 100,
      },
      retryConfig: {
        connectionMaxAttempts: 5,
        rateLimitMaxAttempts: 3,
        governorMaxAttempts: 1,
      },
    });
  }

  /**
   * Create a client for GitHub API
   */
  static createGitHubClient(token: string): ResilientApiClient {
    return new ResilientApiClient({
      baseURL: "https://api.github.com",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
      rateLimitType: "token-bucket",
      rateLimitConfig: {
        capacity: 5000, // GitHub allows 5000 requests per hour
        refillRate: 5000 / 3600, // ~1.39 requests per second
      },
      retryConfig: {
        connectionMaxAttempts: 5,
        rateLimitMaxAttempts: 3,
        governorMaxAttempts: 1,
      },
    });
  }

  /**
   * Create a client for Slack API
   */
  static createSlackClient(token: string): ResilientApiClient {
    return new ResilientApiClient({
      baseURL: "https://slack.com/api",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      rateLimitType: "sliding-window",
      rateLimitConfig: {
        windowSize: 60000, // 1 minute
        maxRequests: 100, // Slack tier 1 limit
      },
      retryConfig: {
        connectionMaxAttempts: 5,
        rateLimitMaxAttempts: 3,
        governorMaxAttempts: 1,
      },
    });
  }

  /**
   * Create a generic API client with adaptive rate limiting
   */
  static createAdaptiveClient(
    baseURL: string,
    options: {
      headers?: Record<string, string>;
      baseRate?: number;
      timeout?: number;
    } = {}
  ): ResilientApiClient {
    return new ResilientApiClient({
      baseURL,
      headers: options.headers,
      timeout: options.timeout,
      rateLimitType: "adaptive",
      rateLimitConfig: {
        baseRate: options.baseRate || 10,
      },
      retryConfig: {
        connectionMaxAttempts: 10,
        rateLimitMaxAttempts: 5,
        governorMaxAttempts: 3,
      },
    });
  }
}
