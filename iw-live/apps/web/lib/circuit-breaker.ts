/**
 * Circuit breaker for downstream services (Neon, Supabase, external APIs).
 * @integratewise/os - Fault Tolerance
 */

import { log } from "@/lib/logger"

type BreakerState = "closed" | "open" | "half-open"

interface BreakerOptions {
  failureThreshold: number
  resetTimeoutMs: number
  halfOpenRequests: number
}

class CircuitBreaker {
  private state: BreakerState = "closed"
  private failures = 0
  private lastFailureTime = 0
  private halfOpenSuccesses = 0

  constructor(
    private name: string,
    private options: BreakerOptions,
  ) {}

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeoutMs) {
        this.state = "half-open"
        this.halfOpenSuccesses = 0
        await log("info", "circuit_half_open", { breaker: this.name })
      } else {
        throw new Error(`circuit_open:${this.name}`)
      }
    }

    try {
      const result = await fn()

      if (this.state === "half-open") {
        this.halfOpenSuccesses++
        if (this.halfOpenSuccesses >= this.options.halfOpenRequests) {
          this.state = "closed"
          this.failures = 0
          await log("info", "circuit_closed", { breaker: this.name })
        }
      } else {
        this.failures = 0
      }

      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      if (this.failures >= this.options.failureThreshold) {
        this.state = "open"
        await log("warn", "circuit_opened", {
          breaker: this.name,
          failures: this.failures,
        })
      }

      throw error
    }
  }

  getState(): BreakerState {
    return this.state
  }

  reset(): void {
    this.state = "closed"
    this.failures = 0
    this.halfOpenSuccesses = 0
  }
}

export function createBreaker(name: string, failureThreshold = 5, resetTimeoutMs = 30_000): CircuitBreaker {
  return new CircuitBreaker(name, {
    failureThreshold,
    resetTimeoutMs,
    halfOpenRequests: 3,
  })
}

// Singleton breakers for critical services
export const dbBreaker = createBreaker("neon_db", 5, 30_000)
export const supabaseBreaker = createBreaker("supabase", 5, 30_000)
