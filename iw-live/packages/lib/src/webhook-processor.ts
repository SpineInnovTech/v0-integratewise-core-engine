/**
 * Webhook Processing Utilities with Resilience Patterns
 *
 * This module provides utilities for processing webhooks with:
 * - Connection error retry until successful
 * - API rate limiting handling
 * - Governor limits handling
 * - Circuit breaker patterns
 * - Comprehensive error handling
 *
 * @integratewise/lib
 */

import {
  withConnectionRetry,
  withRateLimitHandling,
  withApiResilience,
  CircuitBreaker,
  TokenBucket,
  SlidingWindowLimiter,
  AdaptiveRateLimiter,
  createAppError,
  ERROR_CODES,
} from "./error-handling";
import { ResilientApiClient, ApiClientFactory } from "./api-client";

/**
 * Webhook processing configuration
 */
export interface WebhookProcessorConfig {
  /** Maximum retry attempts for connection errors */
  maxConnectionRetries: number;
  /** Base delay for connection retry backoff (ms) */
  connectionBaseDelay: number;
  /** Maximum delay for connection retry backoff (ms) */
  connectionMaxDelay: number;

  /** Maximum retry attempts for rate limits */
  maxRateLimitRetries: number;
  /** Base delay for rate limit backoff (ms) */
  rateLimitBaseDelay: number;
  /** Maximum delay for rate limit backoff (ms) */
  rateLimitMaxDelay: number;

  /** Maximum retry attempts for governor limits */
  maxGovernorRetries: number;
  /** Base delay for governor limit backoff (ms) */
  governorBaseDelay: number;
  /** Maximum delay for governor limit backoff (ms) */
  governorMaxDelay: number;

  /** Circuit breaker configuration */
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
  };

  /** Rate limiting configuration */
  rateLimit: {
    type: "token-bucket" | "sliding-window" | "adaptive";
    config: {
      capacity?: number;
      refillRate?: number;
      windowSize?: number;
      maxRequests?: number;
      baseRate?: number;
    };
  };

  /** Processing timeout (ms) */
  timeout: number;
}

/**
 * Default webhook processor configuration
 */
export const DEFAULT_WEBHOOK_CONFIG: WebhookProcessorConfig = {
  maxConnectionRetries: 10,
  connectionBaseDelay: 1000,
  connectionMaxDelay: 300000, // 5 minutes

  maxRateLimitRetries: 5,
  rateLimitBaseDelay: 1000,
  rateLimitMaxDelay: 3600000, // 1 hour

  maxGovernorRetries: 3,
  governorBaseDelay: 60000, // 1 minute
  governorMaxDelay: 86400000, // 24 hours

  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
  },

  rateLimit: {
    type: "adaptive",
    config: {
      baseRate: 10, // 10 requests per second
    },
  },

  timeout: 30000, // 30 seconds
};

/**
 * Webhook payload interface
 */
export interface WebhookPayload {
  id: string;
  eventType: string;
  provider: string;
  payload: Record<string, any>;
  headers?: Record<string, string>;
  signature?: string;
  correlationId?: string;
}

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
  success: boolean;
  eventId: string;
  correlationId: string;
  processingTime: number;
  attempts: number;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

/**
 * Webhook processor with comprehensive resilience patterns
 */
export class WebhookProcessor {
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: TokenBucket | SlidingWindowLimiter | AdaptiveRateLimiter;
  private config: WebhookProcessorConfig;

  constructor(config: Partial<WebhookProcessorConfig> = {}) {
    this.config = { ...DEFAULT_WEBHOOK_CONFIG, ...config };

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(
      this.config.circuitBreaker.failureThreshold,
      this.config.circuitBreaker.recoveryTimeout
    );

    // Initialize rate limiter
    const rlConfig = this.config.rateLimit;
    switch (rlConfig.type) {
      case "sliding-window":
        this.rateLimiter = new SlidingWindowLimiter(
          rlConfig.config.windowSize || 60000,
          rlConfig.config.maxRequests || 100
        );
        break;
      case "adaptive":
        this.rateLimiter = new AdaptiveRateLimiter(rlConfig.config.baseRate || 10);
        break;
      case "token-bucket":
      default:
        this.rateLimiter = new TokenBucket(
          rlConfig.config.capacity || 100,
          rlConfig.config.refillRate || 10
        );
        break;
    }
  }

  /**
   * Process a webhook with full resilience patterns
   */
  async processWebhook(
    webhook: WebhookPayload,
    processor: (webhook: WebhookPayload) => Promise<void>
  ): Promise<WebhookProcessingResult> {
    const startTime = Date.now();
    const correlationId = webhook.correlationId || `webhook-${webhook.id}-${Date.now()}`;

    let attempts = 0;

    try {
      // Check rate limit before processing
      const canProceed = await this.checkRateLimit();
      if (!canProceed) {
        throw createAppError("RATE_LIMIT_EXCEEDED", "Webhook processing rate limit exceeded", {
          operation: "webhook_processing",
          webhookId: webhook.id,
          correlationId,
        });
      }

      // Use circuit breaker
      const result = await this.circuitBreaker.execute(async () => {
        attempts++;

        // Process webhook with comprehensive retry logic
        return await withApiResilience(
          async () => {
            // Validate webhook signature if present
            if (webhook.signature) {
              await this.validateWebhookSignature(webhook);
            }

            // Process the webhook
            await processor(webhook);
          },
          {
            connectionMaxAttempts: this.config.maxConnectionRetries,
            connectionBaseDelay: this.config.connectionBaseDelay,
            connectionMaxDelay: this.config.connectionMaxDelay,
            rateLimitMaxAttempts: this.config.maxRateLimitRetries,
            rateLimitBaseDelay: this.config.rateLimitBaseDelay,
            rateLimitMaxDelay: this.config.rateLimitMaxDelay,
            governorMaxAttempts: this.config.maxGovernorRetries,
            governorBaseDelay: this.config.governorBaseDelay,
            governorMaxDelay: this.config.governorMaxDelay,
            onConnectionRetry: (attempt, error, delay) => {
              console.warn(
                `Webhook ${webhook.id} connection retry ${attempt}: ${error.message}, delay: ${delay}ms`,
                {
                  correlationId,
                  eventType: webhook.eventType,
                  provider: webhook.provider,
                }
              );
            },
            onRateLimit: (retryAfter, attempt) => {
              console.warn(
                `Webhook ${webhook.id} rate limit hit, retry after ${retryAfter}ms (attempt ${attempt})`,
                {
                  correlationId,
                  eventType: webhook.eventType,
                  provider: webhook.provider,
                }
              );
            },
            onGovernorLimit: (retryAfter, attempt) => {
              console.warn(
                `Webhook ${webhook.id} governor limit hit, retry after ${retryAfter}ms (attempt ${attempt})`,
                {
                  correlationId,
                  eventType: webhook.eventType,
                  provider: webhook.provider,
                }
              );
            },
          }
        );
      });

      // Record success for adaptive rate limiter
      if (this.rateLimiter instanceof AdaptiveRateLimiter) {
        this.rateLimiter.recordSuccess();
      }

      return {
        success: true,
        eventId: webhook.id,
        correlationId,
        processingTime: Date.now() - startTime,
        attempts,
      };
    } catch (error) {
      // Record error for adaptive rate limiter
      if (this.rateLimiter instanceof AdaptiveRateLimiter) {
        this.rateLimiter.recordError();
      }

      const appError =
        error instanceof Error && "code" in error
          ? (error as any)
          : createAppError(
              "INTERNAL_ERROR",
              error instanceof Error ? error.message : "Unknown error",
              {
                operation: "webhook_processing",
                webhookId: webhook.id,
                correlationId,
              },
              error instanceof Error ? error : undefined
            );

      return {
        success: false,
        eventId: webhook.id,
        correlationId,
        processingTime: Date.now() - startTime,
        attempts,
        error: {
          code: appError.code,
          message: appError.message,
          retryable: this.isRetryableError(appError),
        },
      };
    }
  }

  /**
   * Process multiple webhooks concurrently with rate limiting
   */
  async processWebhooksBatch(
    webhooks: WebhookPayload[],
    processor: (webhook: WebhookPayload) => Promise<void>,
    options: {
      concurrency?: number;
      continueOnError?: boolean;
    } = {}
  ): Promise<WebhookProcessingResult[]> {
    const { concurrency = 5, continueOnError = true } = options;
    const results: WebhookProcessingResult[] = [];

    // Process in batches to respect concurrency limits
    for (let i = 0; i < webhooks.length; i += concurrency) {
      const batch = webhooks.slice(i, i + concurrency);

      const batchPromises = batch.map(async (webhook) => {
        try {
          return await this.processWebhook(webhook, processor);
        } catch (error) {
          if (!continueOnError) {
            throw error;
          }

          // Return failed result for error handling
          return {
            success: false,
            eventId: webhook.id,
            correlationId: webhook.correlationId || `webhook-${webhook.id}-${Date.now()}`,
            processingTime: 0,
            attempts: 1,
            error: {
              code: "BATCH_PROCESSING_ERROR",
              message: error instanceof Error ? error.message : "Batch processing failed",
              retryable: false,
            },
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Validate webhook signature (implement based on provider requirements)
   */
  private async validateWebhookSignature(webhook: WebhookPayload): Promise<void> {
    // Per-provider signature validation (e.g. HMAC) — implement per webhook provider.
    if (!webhook.signature) {
      throw createAppError("VALIDATION_ERROR", "Missing webhook signature");
    }

    // Example: HMAC validation for GitHub webhooks
    if (webhook.provider === "github") {
      // Implement GitHub webhook signature validation
      // const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(webhook.payload)).digest('hex');
      // if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      //   throw createAppError('VALIDATION_ERROR', 'Invalid webhook signature');
      // }
    }

    // Add validation for other providers as needed
  }

  /**
   * Check rate limit before processing
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

    return true;
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      ERROR_CODES.CONNECTION_ERROR.code,
      ERROR_CODES.RATE_LIMIT_EXCEEDED.code,
      ERROR_CODES.GOVERNOR_LIMIT_EXCEEDED.code,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR.code,
    ];

    return retryableCodes.includes(error.code);
  }

  /**
   * Get current rate limiter status
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
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): string {
    return this.circuitBreaker.getState();
  }
}

/**
 * Factory functions for common webhook processors
 */
export class WebhookProcessorFactory {
  /**
   * Create a processor optimized for high-volume webhooks (e.g., Stripe, GitHub)
   */
  static createHighVolumeProcessor(): WebhookProcessor {
    return new WebhookProcessor({
      maxConnectionRetries: 15,
      connectionBaseDelay: 500,
      connectionMaxDelay: 600000, // 10 minutes

      maxRateLimitRetries: 10,
      rateLimitBaseDelay: 2000,
      rateLimitMaxDelay: 7200000, // 2 hours

      maxGovernorRetries: 5,
      governorBaseDelay: 300000, // 5 minutes
      governorMaxDelay: 172800000, // 48 hours

      circuitBreaker: {
        failureThreshold: 10,
        recoveryTimeout: 300000, // 5 minutes
      },

      rateLimit: {
        type: "adaptive",
        config: {
          baseRate: 50, // 50 requests per second
        },
      },

      timeout: 60000, // 1 minute
    });
  }

  /**
   * Create a processor optimized for low-frequency, high-importance webhooks
   */
  static createCriticalProcessor(): WebhookProcessor {
    return new WebhookProcessor({
      maxConnectionRetries: 20,
      connectionBaseDelay: 1000,
      connectionMaxDelay: 1800000, // 30 minutes

      maxRateLimitRetries: 15,
      rateLimitBaseDelay: 5000,
      rateLimitMaxDelay: 14400000, // 4 hours

      maxGovernorRetries: 10,
      governorBaseDelay: 600000, // 10 minutes
      governorMaxDelay: 604800000, // 1 week

      circuitBreaker: {
        failureThreshold: 3, // Lower threshold for critical webhooks
        recoveryTimeout: 600000, // 10 minutes
      },

      rateLimit: {
        type: "token-bucket",
        config: {
          capacity: 10,
          refillRate: 1, // 1 request per second, very conservative
        },
      },

      timeout: 120000, // 2 minutes
    });
  }

  /**
   * Create a processor for third-party integrations with strict rate limits
   */
  static createThirdPartyProcessor(): WebhookProcessor {
    return new WebhookProcessor({
      maxConnectionRetries: 8,
      connectionBaseDelay: 2000,
      connectionMaxDelay: 300000,

      maxRateLimitRetries: 8,
      rateLimitBaseDelay: 10000, // 10 seconds
      rateLimitMaxDelay: 3600000,

      maxGovernorRetries: 5,
      governorBaseDelay: 300000, // 5 minutes
      governorMaxDelay: 86400000,

      circuitBreaker: {
        failureThreshold: 8,
        recoveryTimeout: 900000, // 15 minutes
      },

      rateLimit: {
        type: "sliding-window",
        config: {
          windowSize: 60000, // 1 minute
          maxRequests: 30, // 30 requests per minute
        },
      },

      timeout: 45000, // 45 seconds
    });
  }
}
