import { CircuitStatus, ResilienceConfig } from "@integratewise/connector-contracts";

export class CircuitBreaker {
  private status: CircuitStatus = CircuitStatus.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0; // For half-open

  constructor(protected config: ResilienceConfig["circuitBreaker"]) {}

  isOpen(): boolean {
    if (this.status === CircuitStatus.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.config.resetTimeoutMs) {
        this.status = CircuitStatus.HALF_OPEN;
        return false; // Allow probe
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    if (this.status === CircuitStatus.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= (this.config.successThreshold ?? 3)) {
        this.status = CircuitStatus.CLOSED;
        this.failures = 0;
        this.successCount = 0;
      }
    } else {
      this.failures = 0; // Reset consecutive failures on success
    }
  }

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.status === CircuitStatus.HALF_OPEN) {
      this.status = CircuitStatus.OPEN; // Fail immediately if half-open
    } else if (this.failures >= this.config.failureThreshold) {
      this.status = CircuitStatus.OPEN;
    }
  }

  getStatus(): CircuitStatus {
    return this.status;
  }
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: ResilienceConfig["retryPolicy"],
  context: string
): Promise<T> {
  let attempt = 0;
  while (attempt < config.maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt >= config.maxRetries) throw error; // Re-throw last error

      // Check if error is retryable (5xx, Network)
      const isRetryable = isTransientError(error);
      if (!isRetryable) throw error;

      // Exponential Backoff with Jitter
      const delay = Math.min(
        config.maxDelayMs,
        config.baseDelayMs * Math.pow(2, attempt) + Math.random() * 100
      );

      console.warn(
        `[Resilience] ${context} failed (Attempt ${attempt}). Retrying in ${Math.round(delay)}ms... Error: ${error.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}

function isTransientError(error: any): boolean {
  if (error.response) {
    // HTTP 429 (Rate Limit) or 5xx (Server Error)
    const status = error.response.status;
    return status === 429 || (status >= 500 && status < 600);
  }
  // Network errors usually don't have response
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") return true;
  return false;
}
