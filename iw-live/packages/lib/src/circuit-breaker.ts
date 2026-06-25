/**
 * Circuit Breaker Pattern
 *
 * Prevents cascading failures by stopping calls to failing services.
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing)
 *
 * @integratewise/lib
 */

export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms to wait before attempting recovery */
  resetTimeoutMs: number;
  /** Number of successful calls needed to close circuit from half-open */
  successThreshold: number;
  /** Optional name for logging */
  name?: string;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  totalCalls: number;
  totalFailures: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  successThreshold: 3,
};

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private totalCalls = 0;
  private totalFailures = 0;
  private lastSuccess: Date | null = null;
  private lastFailure: Date | null = null;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions = DEFAULT_OPTIONS
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    // Check if circuit should transition from open to half-open
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs) {
        this.transitionTo("half-open");
      } else {
        throw new CircuitOpenError(this.name, this.getRemainingTimeout());
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Wrap a function to be protected by this circuit breaker
   */
  wrap<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return ((...args: Parameters<T>) => this.execute(() => fn(...args))) as T;
  }

  private onSuccess(): void {
    this.lastSuccess = new Date();
    this.failures = 0;

    if (this.state === "half-open") {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.transitionTo("closed");
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.lastFailure = new Date();

    if (this.state === "half-open") {
      // Any failure in half-open immediately opens the circuit
      this.transitionTo("open");
    } else if (this.failures >= this.options.failureThreshold) {
      this.transitionTo("open");
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    if (newState === "half-open") {
      this.successes = 0;
    } else if (newState === "closed") {
      this.failures = 0;
      this.successes = 0;
    }

    console.log(`[CircuitBreaker:${this.name}] ${oldState} → ${newState}`);
  }

  private getRemainingTimeout(): number {
    return Math.max(0, this.options.resetTimeoutMs - (Date.now() - this.lastFailureTime));
  }

  /** Get current state */
  getState(): CircuitState {
    return this.state;
  }

  /** Get statistics */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
    };
  }

  /** Force circuit to open state */
  forceOpen(): void {
    this.transitionTo("open");
    this.lastFailureTime = Date.now();
  }

  /** Force circuit to closed state */
  forceClose(): void {
    this.transitionTo("closed");
  }

  /** Check if circuit allows requests */
  isAllowed(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "half-open") return true;
    if (this.state === "open") {
      return Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs;
    }
    return false;
  }
}

export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly retryAfterMs: number
  ) {
    super(`Circuit breaker '${circuitName}' is open. Retry after ${retryAfterMs}ms`);
    this.name = "CircuitOpenError";
  }
}

// Pre-configured circuit breakers for common services
export const circuitBreakers = {
  neonDb: new CircuitBreaker("neon_db", {
    failureThreshold: 5,
    resetTimeoutMs: 30_000,
    successThreshold: 3,
  }),
  supabase: new CircuitBreaker("supabase", {
    failureThreshold: 5,
    resetTimeoutMs: 30_000,
    successThreshold: 3,
  }),
  openai: new CircuitBreaker("openai", {
    failureThreshold: 3,
    resetTimeoutMs: 60_000,
    successThreshold: 2,
  }),
  externalApi: new CircuitBreaker("external_api", {
    failureThreshold: 10,
    resetTimeoutMs: 15_000,
    successThreshold: 5,
  }),
};

/**
 * Factory function to create a new circuit breaker
 */
export function createCircuitBreaker(
  name: string,
  options?: Partial<CircuitBreakerOptions>
): CircuitBreaker {
  return new CircuitBreaker(name, { ...DEFAULT_OPTIONS, ...options });
}
