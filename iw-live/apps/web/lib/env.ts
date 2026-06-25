/**
 * Environment Configuration (No External Dependencies)
 *
 * Fail-fast in dev, soft-warn in preview/prod.
 * Import ENV from this file for typed access to env vars.
 */

type EnvConfig = {
  // Public (available in browser)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string

  // Server-only (never expose to browser)
  CLERK_SECRET_KEY: string
  CLERK_WEBHOOK_SECRET?: string
  DATABASE_URL?: string
  NEON_DATABASE_URL?: string
  OPENAI_API_KEY?: string
  BRAINSTORMING_WEBHOOK_SECRET?: string

  // Slack/Discord webhooks
  SLACK_WEBHOOK_URL?: string
  DISCORD_WEBHOOK_URL?: string

  // Vector/Embedding configuration
  EMBEDDING_MODEL_ID: string
  EMBEDDING_DIMENSION: number
  VECTOR_DISTANCE_METRIC: "cosine" | "ip" | "l2"

  // Operations/Feature flags
  CRON_ENABLED: boolean
  AUTO_EXECUTE_LOW_RISK_ACTIONS: boolean
  CONTENT_MODERATION_ENABLED: boolean
}

function parseEnv(): EnvConfig | null {
  const isDev = process.env.NODE_ENV === "development"
  const isProd = process.env.NODE_ENV === "production"

  const errors: string[] = []

  // Required Clerk vars
  const NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ""
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || ""

  // Validate in dev mode
  if (isDev) {
    if (!NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      errors.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing")
    }
    if (!CLERK_SECRET_KEY) {
      errors.push("CLERK_SECRET_KEY is missing")
    }
  }

  if (errors.length > 0 && isDev) {
    console.error("❌ Environment validation failed:")
    errors.forEach((e) => console.error(`  - ${e}`))
    console.error("\n💡 Hint: Get your keys from https://dashboard.clerk.com")
  } else if (errors.length > 0 && !isDev) {
    console.warn("⚠️ Running with incomplete environment configuration")
  }

  return {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    BRAINSTORMING_WEBHOOK_SECRET: process.env.BRAINSTORMING_WEBHOOK_SECRET,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    EMBEDDING_MODEL_ID: process.env.EMBEDDING_MODEL_ID || "openai-text-embedding-3-small",
    EMBEDDING_DIMENSION: Number.parseInt(process.env.EMBEDDING_DIMENSION || "1536", 10),
    VECTOR_DISTANCE_METRIC: (process.env.VECTOR_DISTANCE_METRIC as "cosine" | "ip" | "l2") || "cosine",
    CRON_ENABLED: process.env.CRON_ENABLED !== "false",
    AUTO_EXECUTE_LOW_RISK_ACTIONS: process.env.AUTO_EXECUTE_LOW_RISK_ACTIONS === "true",
    CONTENT_MODERATION_ENABLED: process.env.CONTENT_MODERATION_ENABLED !== "false",
  }
}

// Export parsed environment
export const ENV = parseEnv()

// Type-safe accessors with fallbacks
export const getEnv = () => ENV

// Helper to check if specific features are configured
export const isClerkConfigured = () =>
  Boolean(
    ENV?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      ENV?.CLERK_SECRET_KEY &&
      !ENV.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder"),
  )

export const isDatabaseConfigured = () => Boolean(ENV?.DATABASE_URL || ENV?.NEON_DATABASE_URL)

export const isOpenAIConfigured = () => Boolean(ENV?.OPENAI_API_KEY)

export const isWebhookSecretsConfigured = () => Boolean(ENV?.BRAINSTORMING_WEBHOOK_SECRET)

export const isCronEnabled = () => ENV?.CRON_ENABLED === true

export const isAutoExecuteEnabled = () => ENV?.AUTO_EXECUTE_LOW_RISK_ACTIONS === true

export const isModerationEnabled = () => ENV?.CONTENT_MODERATION_ENABLED === true

// Export type for TypeScript consumers
export type { EnvConfig }
