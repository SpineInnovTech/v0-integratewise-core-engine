/**
 * Centralized resource configuration with dynamic budgets.
 * Values come from env (Doppler → Vercel). Keep safe defaults.
 * @integratewise/os - HA and Resource Management
 */

export type ResourceConfig = {
  env: "production" | "preview" | "development"
  // Worker pool for CPU-bound tasks
  workers: {
    max: number
    queueLimit: number
    taskTimeoutMs: number
  }
  // DB concurrency guard
  db: {
    maxConcurrent: number
    queueLimit: number
  }
  // Adaptive tuning thresholds
  adaptive: {
    highLatencyMs: number
    errorRatePct: number
    coolDownMs: number
  }
  // DR configuration
  dr: {
    enabled: boolean
    primaryUrl: string
    secondaryUrl: string
  }
}

const env = (process.env.VERCEL_ENV as ResourceConfig["env"]) || "development"

export const resourceConfig: ResourceConfig = {
  env,
  workers: {
    max: Number(process.env.WORKERS_MAX ?? (env === "production" ? 4 : 2)),
    queueLimit: Number(process.env.WORKERS_QUEUE_LIMIT ?? 100),
    taskTimeoutMs: Number(process.env.WORKERS_TASK_TIMEOUT_MS ?? 15_000),
  },
  db: {
    maxConcurrent: Number(process.env.DB_MAX_CONCURRENT ?? (env === "production" ? 20 : 8)),
    queueLimit: Number(process.env.DB_QUEUE_LIMIT ?? 200),
  },
  adaptive: {
    highLatencyMs: Number(process.env.ADAPT_HIGH_LATENCY_MS ?? 800),
    errorRatePct: Number(process.env.ADAPT_ERROR_RATE_PCT ?? 5),
    coolDownMs: Number(process.env.ADAPT_COOLDOWN_MS ?? 30_000),
  },
  dr: {
    enabled: process.env.DR_ENABLED === "true",
    primaryUrl: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || "",
    secondaryUrl: process.env.DR_DATABASE_URL || "",
  },
}
