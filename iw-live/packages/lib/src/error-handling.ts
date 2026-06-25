// Enhanced error handling utilities for IntegrateWise
// Provides standardized error handling patterns across the application

export interface ErrorContext {
  operation: string;
  userId?: string;
  correlationId?: string;
  url?: string;
  method?: string;
  timeout?: number;
  attempt?: number;
  retryAfter?: number;
  eventId?: string;
  eventType?: string;
  webhookId?: string;
  destinationUrl?: string;
  metadata?: Record<string, any>;
}

export interface AppError extends Error {
  code: string;
  statusCode: number;
  context?: ErrorContext;
  isOperational: boolean;
}

// Error codes and their corresponding HTTP status codes
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: { code: "UNAUTHORIZED", statusCode: 401, message: "Authentication required" },
  FORBIDDEN: { code: "FORBIDDEN", statusCode: 403, message: "Access denied" },
  TOKEN_EXPIRED: {
    code: "TOKEN_EXPIRED",
    statusCode: 401,
    message: "Authentication token expired",
  },

  // Validation
  VALIDATION_ERROR: { code: "VALIDATION_ERROR", statusCode: 400, message: "Invalid input data" },
  MISSING_REQUIRED_FIELD: {
    code: "MISSING_REQUIRED_FIELD",
    statusCode: 400,
    message: "Required field is missing",
  },

  // Database
  DATABASE_ERROR: { code: "DATABASE_ERROR", statusCode: 500, message: "Database operation failed" },
  CONNECTION_ERROR: {
    code: "CONNECTION_ERROR",
    statusCode: 503,
    message: "Service temporarily unavailable",
  },
  DUPLICATE_ENTRY: { code: "DUPLICATE_ENTRY", statusCode: 409, message: "Resource already exists" },

  // External Services
  EXTERNAL_SERVICE_ERROR: {
    code: "EXTERNAL_SERVICE_ERROR",
    statusCode: 502,
    message: "External service error",
  },
  WEBHOOK_DELIVERY_FAILED: {
    code: "WEBHOOK_DELIVERY_FAILED",
    statusCode: 500,
    message: "Webhook delivery failed",
  },

  // Caching
  CACHE_ERROR: { code: "CACHE_ERROR", statusCode: 500, message: "Cache operation failed" },
  CACHE_CONNECTION_ERROR: {
    code: "CACHE_CONNECTION_ERROR",
    statusCode: 503,
    message: "Cache service unavailable",
  },

  // Business Logic
  BUSINESS_RULE_VIOLATION: {
    code: "BUSINESS_RULE_VIOLATION",
    statusCode: 422,
    message: "Business rule violation",
  },
  RESOURCE_NOT_FOUND: {
    code: "RESOURCE_NOT_FOUND",
    statusCode: 404,
    message: "Resource not found",
  },
  RESOURCE_CONFLICT: { code: "RESOURCE_CONFLICT", statusCode: 409, message: "Resource conflict" },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: {
    code: "RATE_LIMIT_EXCEEDED",
    statusCode: 429,
    message: "Rate limit exceeded",
  },
  GOVERNOR_LIMIT_EXCEEDED: {
    code: "GOVERNOR_LIMIT_EXCEEDED",
    statusCode: 429,
    message: "Governor limit exceeded",
  },

  // System
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", statusCode: 500, message: "Internal server error" },
  NOT_IMPLEMENTED: { code: "NOT_IMPLEMENTED", statusCode: 501, message: "Feature not implemented" },
} as const;

/**
 * Create a standardized application error
 */
export function createAppError(
  errorCode: keyof typeof ERROR_CODES,
  message?: string,
  context?: ErrorContext,
  cause?: Error
): AppError {
  const errorInfo = ERROR_CODES[errorCode];
  const error = new Error(message || errorInfo.message) as AppError;

  error.code = errorInfo.code;
  error.statusCode = errorInfo.statusCode;
  error.context = context;
  error.isOperational = true;

  if (cause) {
    error.cause = cause;
  }

  return error;
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = normalizeError(error, context);
    logError(appError);

    if (fallback !== undefined) {
      return fallback;
    }

    throw appError;
  }
}

/**
 * Wrap synchronous operations with error handling
 */
export function withSyncErrorHandling<T>(
  operation: () => T,
  context: ErrorContext,
  fallback?: T
): T {
  try {
    return operation();
  } catch (error) {
    const appError = normalizeError(error, context);
    logError(appError);

    if (fallback !== undefined) {
      return fallback;
    }

    throw appError;
  }
}

/**
 * Normalize any error into an AppError
 */
export function normalizeError(error: unknown, context?: ErrorContext): AppError {
  if (error instanceof Error && "code" in error) {
    // Already an AppError
    return error as AppError;
  }

  if (error instanceof Error) {
    // Standard Error - try to map to known error types
    const message = error.message.toLowerCase();

    if (message.includes("unauthorized") || message.includes("invalid token")) {
      return createAppError("UNAUTHORIZED", error.message, context, error);
    }

    if (message.includes("forbidden") || message.includes("access denied")) {
      return createAppError("FORBIDDEN", error.message, context, error);
    }

    if (message.includes("not found") || message.includes("does not exist")) {
      return createAppError("RESOURCE_NOT_FOUND", error.message, context, error);
    }

    if (message.includes("duplicate") || message.includes("already exists")) {
      return createAppError("DUPLICATE_ENTRY", error.message, context, error);
    }

    if (message.includes("connection") || message.includes("timeout")) {
      return createAppError("CONNECTION_ERROR", error.message, context, error);
    }

    // Default to internal error
    return createAppError("INTERNAL_ERROR", error.message, context, error);
  }

  // Unknown error type
  const message = typeof error === "string" ? error : "Unknown error occurred";
  return createAppError("INTERNAL_ERROR", message, context);
}

/**
 * Log error with structured format
 */
export function logError(error: AppError): void {
  const logData = {
    timestamp: new Date().toISOString(),
    level: "error",
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    context: error.context,
    stack: error.stack,
    cause:
      error.cause instanceof Error
        ? {
            message: error.cause.message,
            stack: error.cause.stack,
          }
        : error.cause,
  };

  // In production, send to logging service
  if (process.env.NODE_ENV === "production") {
    console.error(JSON.stringify(logData));
  } else {
    console.error("Error:", {
      code: error.code,
      message: error.message,
      context: error.context,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
    });
  }
}

/**
 * Handle API errors and return appropriate HTTP response
 */
export function handleApiError(error: unknown, context: ErrorContext) {
  const appError = normalizeError(error, context);

  // Log the error
  logError(appError);

  // Return appropriate response
  const response = {
    error: {
      code: appError.code,
      message: appError.message,
      ...(process.env.NODE_ENV === "development" && {
        stack: appError.stack,
        context: appError.context,
      }),
    },
  };

  return new Response(JSON.stringify(response), {
    status: appError.statusCode,
    headers: {
      "Content-Type": "application/json",
      ...(appError.context?.correlationId && {
        "X-Correlation-ID": appError.context.correlationId,
      }),
    },
  });
}

/**
 * Enhanced retry mechanism with connection error handling and rate limiting
 */
export async function withConnectionRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    jitter?: boolean;
    retryCondition?: (error: Error) => boolean;
    onRetry?: (attempt: number, error: Error, delay: number) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 10, // Higher default for connection errors
    baseDelay = 1000,
    maxDelay = 300000, // 5 minutes max
    backoffFactor = 2,
    jitter = true,
    retryCondition = (error) => {
      const message = error.message.toLowerCase();
      return (
        message.includes("connection") ||
        message.includes("timeout") ||
        message.includes("network") ||
        message.includes("econnrefused") ||
        message.includes("enotfound") ||
        message.includes("etimedout")
      );
    },
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !retryCondition(lastError)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and optional jitter
      let delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);

      if (jitter) {
        // Add random jitter (±25% of delay)
        const jitterRange = delay * 0.25;
        delay += (Math.random() - 0.5) * 2 * jitterRange;
        delay = Math.max(100, delay); // Minimum 100ms
      }

      onRetry?.(attempt, lastError, delay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Rate limiting and governor limit handling with intelligent backoff
 */
export async function withRateLimitHandling<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    detectRateLimit?: (error: Error) => { isRateLimit: boolean; retryAfter?: number };
    detectGovernorLimit?: (error: Error) => { isGovernorLimit: boolean; retryAfter?: number };
    onRateLimit?: (retryAfter: number, attempt: number) => void;
    onGovernorLimit?: (retryAfter: number, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 5,
    baseDelay = 1000,
    maxDelay = 3600000, // 1 hour max
    detectRateLimit = (error) => {
      const message = error.message.toLowerCase();
      const statusCode = (error as any).statusCode || (error as any).status;

      // Check for rate limit indicators
      if (statusCode === 429) return { isRateLimit: true };
      if (message.includes("rate limit")) return { isRateLimit: true };
      if (message.includes("too many requests")) return { isRateLimit: true };

      // Check for retry-after header
      const retryAfter = (error as any).retryAfter || (error as any).headers?.["retry-after"];
      if (retryAfter) {
        return {
          isRateLimit: true,
          retryAfter:
            typeof retryAfter === "string" ? parseInt(retryAfter) * 1000 : retryAfter * 1000,
        };
      }

      return { isRateLimit: false };
    },
    detectGovernorLimit = (error) => {
      const message = error.message.toLowerCase();
      const statusCode = (error as any).statusCode || (error as any).status;

      // Check for governor limit indicators
      if (message.includes("governor limit")) return { isGovernorLimit: true };
      if (message.includes("quota exceeded")) return { isGovernorLimit: true };
      if (message.includes("daily limit")) return { isGovernorLimit: true };
      if (message.includes("monthly limit")) return { isGovernorLimit: true };

      return { isGovernorLimit: false };
    },
    onRateLimit,
    onGovernorLimit,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check for rate limiting
      const rateLimitInfo = detectRateLimit(lastError);
      if (rateLimitInfo.isRateLimit) {
        if (attempt === maxAttempts) {
          throw createAppError(
            "RATE_LIMIT_EXCEEDED",
            "Rate limit exceeded, max retries reached",
            {
              operation: "rate_limited_operation",
              attempt,
              retryAfter: rateLimitInfo.retryAfter,
            },
            lastError
          );
        }

        const retryAfter =
          rateLimitInfo.retryAfter || Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        onRateLimit?.(retryAfter, attempt);

        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        continue;
      }

      // Check for governor limiting
      const governorLimitInfo = detectGovernorLimit(lastError);
      if (governorLimitInfo.isGovernorLimit) {
        if (attempt === maxAttempts) {
          throw createAppError(
            "GOVERNOR_LIMIT_EXCEEDED",
            "Governor limit exceeded, max retries reached",
            {
              operation: "governor_limited_operation",
              attempt,
            },
            lastError
          );
        }

        // Governor limits often require longer backoff (hours/days)
        const retryAfter = Math.min(baseDelay * Math.pow(4, attempt), maxDelay); // More aggressive backoff
        onGovernorLimit?.(retryAfter, attempt);

        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        continue;
      }

      // Not a rate/governor limit error, rethrow
      throw lastError;
    }
  }

  throw lastError!;
}

/**
 * Combined retry strategy for API calls with connection, rate limit, and governor limit handling
 */
export async function withApiResilience<T>(
  operation: () => Promise<T>,
  options: {
    // Connection retry options
    connectionMaxAttempts?: number;
    connectionBaseDelay?: number;
    connectionMaxDelay?: number;

    // Rate limit options
    rateLimitMaxAttempts?: number;
    rateLimitBaseDelay?: number;
    rateLimitMaxDelay?: number;

    // Governor limit options
    governorMaxAttempts?: number;
    governorBaseDelay?: number;
    governorMaxDelay?: number;

    // Callbacks
    onConnectionRetry?: (attempt: number, error: Error, delay: number) => void;
    onRateLimit?: (retryAfter: number, attempt: number) => void;
    onGovernorLimit?: (retryAfter: number, attempt: number) => void;

    // Custom detectors
    detectRateLimit?: (error: Error) => { isRateLimit: boolean; retryAfter?: number };
    detectGovernorLimit?: (error: Error) => { isGovernorLimit: boolean; retryAfter?: number };
  } = {}
): Promise<T> {
  const {
    connectionMaxAttempts = 10,
    connectionBaseDelay = 1000,
    connectionMaxDelay = 300000,
    rateLimitMaxAttempts = 5,
    rateLimitBaseDelay = 1000,
    rateLimitMaxDelay = 3600000,
    governorMaxAttempts = 3,
    governorBaseDelay = 60000, // 1 minute base for governor limits
    governorMaxDelay = 86400000, // 24 hours max
    onConnectionRetry,
    onRateLimit,
    onGovernorLimit,
    detectRateLimit,
    detectGovernorLimit,
  } = options;

  // First try with connection retry
  try {
    return await withConnectionRetry(operation, {
      maxAttempts: connectionMaxAttempts,
      baseDelay: connectionBaseDelay,
      maxDelay: connectionMaxDelay,
      onRetry: onConnectionRetry,
    });
  } catch (error) {
    const appError = error instanceof Error ? error : new Error(String(error));

    // If it's a connection error that failed all retries, try rate limit handling
    const message = appError.message.toLowerCase();
    const isConnectionError =
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("etimedout");

    if (!isConnectionError) {
      throw appError;
    }

    // Try with rate limit handling
    try {
      return await withRateLimitHandling(operation, {
        maxAttempts: rateLimitMaxAttempts,
        baseDelay: rateLimitBaseDelay,
        maxDelay: rateLimitMaxDelay,
        detectRateLimit,
        detectGovernorLimit,
        onRateLimit,
        onGovernorLimit,
      });
    } catch (rateLimitError) {
      // If rate limit also fails, try governor limit handling as last resort
      return await withRateLimitHandling(operation, {
        maxAttempts: governorMaxAttempts,
        baseDelay: governorBaseDelay,
        maxDelay: governorMaxDelay,
        detectGovernorLimit,
        onGovernorLimit,
      });
    }
  }
}

/**
 * Token bucket rate limiter for client-side rate limiting
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private initialTokens: number = capacity
  ) {
    this.tokens = initialTokens;
    this.lastRefill = Date.now();
  }

  async acquire(tokens: number = 1): Promise<boolean> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  getTimeToNextToken(): number {
    if (this.tokens >= 1) return 0;

    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.refillRate) * 1000; // milliseconds
  }
}

/**
 * Sliding window rate limiter for more accurate rate limiting
 */
export class SlidingWindowLimiter {
  private requests: number[] = [];

  constructor(
    private windowSize: number, // milliseconds
    private maxRequests: number
  ) {}

  async acquire(): Promise<boolean> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowSize);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowSize);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getTimeToNextWindow(): number {
    if (this.requests.length === 0) return 0;

    const oldestRequest = Math.min(...this.requests);
    const windowEnd = oldestRequest + this.windowSize;
    return Math.max(0, windowEnd - Date.now());
  }
}

/**
 * Adaptive rate limiter that adjusts based on response codes
 */
export class AdaptiveRateLimiter {
  private currentRate: number;
  private lastAdjustment: number;
  private consecutiveErrors: number = 0;
  private consecutiveSuccesses: number = 0;

  constructor(
    private baseRate: number, // requests per second
    private minRate: number = baseRate * 0.1,
    private maxRate: number = baseRate * 10,
    private adjustmentFactor: number = 0.5,
    private stabilizationPeriod: number = 60000 // 1 minute
  ) {
    this.currentRate = baseRate;
    this.lastAdjustment = Date.now();
  }

  recordSuccess(): void {
    this.consecutiveSuccesses++;
    this.consecutiveErrors = 0;
    this.adjustRate(1 + this.adjustmentFactor);
  }

  recordError(): void {
    this.consecutiveErrors++;
    this.consecutiveSuccesses = 0;
    this.adjustRate(1 - this.adjustmentFactor);
  }

  recordRateLimit(): void {
    this.consecutiveErrors++;
    this.consecutiveSuccesses = 0;
    this.adjustRate(0.5); // Aggressive reduction on rate limits
  }

  private adjustRate(multiplier: number): void {
    const now = Date.now();
    if (now - this.lastAdjustment < this.stabilizationPeriod) {
      return; // Too soon to adjust
    }

    this.currentRate = Math.max(
      this.minRate,
      Math.min(this.maxRate, this.currentRate * multiplier)
    );
    this.lastAdjustment = now;
  }

  getCurrentRate(): number {
    return this.currentRate;
  }

  getTimeBetweenRequests(): number {
    return 1000 / this.currentRate; // milliseconds
  }

  async waitForNextRequest(): Promise<void> {
    const delay = this.getTimeBetweenRequests();
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Circuit breaker pattern for external service calls
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000,
    private monitoringPeriod: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = "half-open";
      } else {
        throw createAppError("EXTERNAL_SERVICE_ERROR", "Circuit breaker is open");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = "open";
    }
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Input validation with detailed error messages
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === "") {
    throw createAppError("MISSING_REQUIRED_FIELD", `${fieldName} is required`);
  }
}

export function validateString(
  value: any,
  fieldName: string,
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}
): void {
  if (typeof value !== "string") {
    throw createAppError("VALIDATION_ERROR", `${fieldName} must be a string`);
  }

  if (options.minLength && value.length < options.minLength) {
    throw createAppError(
      "VALIDATION_ERROR",
      `${fieldName} must be at least ${options.minLength} characters`
    );
  }

  if (options.maxLength && value.length > options.maxLength) {
    throw createAppError(
      "VALIDATION_ERROR",
      `${fieldName} must be at most ${options.maxLength} characters`
    );
  }

  if (options.pattern && !options.pattern.test(value)) {
    throw createAppError("VALIDATION_ERROR", `${fieldName} format is invalid`);
  }
}

export function validateNumber(
  value: any,
  fieldName: string,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): void {
  const num = Number(value);
  if (isNaN(num)) {
    throw createAppError("VALIDATION_ERROR", `${fieldName} must be a number`);
  }

  if (options.integer && !Number.isInteger(num)) {
    throw createAppError("VALIDATION_ERROR", `${fieldName} must be an integer`);
  }

  if (options.min !== undefined && num < options.min) {
    throw createAppError("VALIDATION_ERROR", `${fieldName} must be at least ${options.min}`);
  }

  if (options.max !== undefined && num > options.max) {
    throw createAppError("VALIDATION_ERROR", `${fieldName} must be at most ${options.max}`);
  }
}

export function validateEnum<T>(value: any, fieldName: string, allowedValues: T[]): void {
  if (!allowedValues.includes(value)) {
    throw createAppError(
      "VALIDATION_ERROR",
      `${fieldName} must be one of: ${allowedValues.join(", ")}`
    );
  }
}

/**
 * Health check utilities
 */
export interface HealthCheckResult {
  service: string;
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  checks: Record<
    string,
    {
      status: "pass" | "fail" | "warn";
      message?: string;
      responseTime?: number;
    }
  >;
}

export async function performHealthCheck(serviceName: string): Promise<HealthCheckResult> {
  const checks: HealthCheckResult["checks"] = {};

  // Database health check
  try {
    const dbStart = Date.now();
    // Add database connectivity check here
    checks.database = {
      status: "pass",
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: "fail",
      message: error instanceof Error ? error.message : "Database check failed",
    };
  }

  // Cache health check
  try {
    const cacheStart = Date.now();
    const { cache } = await import("./cache");
    const isConnected = cache.isConnected();
    checks.cache = {
      status: isConnected ? "pass" : "fail",
      responseTime: Date.now() - cacheStart,
      message: isConnected ? undefined : "Cache not connected",
    };
  } catch (error) {
    checks.cache = {
      status: "fail",
      message: "Cache check failed",
    };
  }

  // Determine overall status
  const hasFailures = Object.values(checks).some((check) => check.status === "fail");
  const hasWarnings = Object.values(checks).some((check) => check.status === "warn");

  const status = hasFailures ? "unhealthy" : hasWarnings ? "degraded" : "healthy";

  return {
    service: serviceName,
    status,
    timestamp: new Date().toISOString(),
    checks,
  };
}
