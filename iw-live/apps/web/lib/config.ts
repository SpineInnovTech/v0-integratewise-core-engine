export interface Tool {
  id: string
  name: string
  description: string
  icon: string
  status: "stable" | "beta"
  envKeys: string[]
}

export interface ToolSelection {
  ai: string[]
  messaging: string[]
  payments: string[]
  data: string[]
  platform: string[]
}

export interface ToolConfig {
  version: string
  selected: ToolSelection
  createdAt: string
}

export const TOOL_CATALOG = {
  ai: [
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT-4, GPT-3.5, and embeddings",
      icon: "🤖",
      status: "stable" as const,
      envKeys: ["OPENAI_API_KEY"],
    },
    {
      id: "claude",
      name: "Claude",
      description: "Anthropic's Claude models",
      icon: "🧠",
      status: "stable" as const,
      envKeys: ["CLAUDE_API_KEY"],
    },
    {
      id: "gemini",
      name: "Gemini",
      description: "Google's Gemini AI",
      icon: "✨",
      status: "stable" as const,
      envKeys: ["GEMINI_API_KEY"],
    },
    {
      id: "groq",
      name: "Groq",
      description: "Fast inference with Groq",
      icon: "⚡",
      status: "stable" as const,
      envKeys: ["GROQ_API_KEY"],
    },
    {
      id: "vercel-ai",
      name: "Vercel AI Gateway",
      description: "Unified AI routing and caching",
      icon: "🔀",
      status: "stable" as const,
      envKeys: [],
    },
  ],
  messaging: [
    {
      id: "slack",
      name: "Slack",
      description: "Team communication and notifications",
      icon: "💬",
      status: "stable" as const,
      envKeys: ["SLACK_WEBHOOK_URL", "SLACK_SIGNING_SECRET"],
    },
    {
      id: "discord",
      name: "Discord",
      description: "Community chat and webhooks",
      icon: "🎮",
      status: "stable" as const,
      envKeys: ["DISCORD_WEBHOOK_URL", "DISCORD_PUBLIC_KEY"],
    },
  ],
  payments: [
    {
      id: "stripe",
      name: "Stripe",
      description: "Payment processing and billing",
      icon: "💳",
      status: "stable" as const,
      envKeys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    },
    {
      id: "razorpay",
      name: "Razorpay",
      description: "India payment gateway",
      icon: "💰",
      status: "stable" as const,
      envKeys: ["RAZORPAY_KEY_ID", "RAZORPAY_WEBHOOK_SECRET"],
    },
    {
      id: "cashfree",
      name: "Cashfree",
      description: "Payment gateway for India",
      icon: "🏦",
      status: "beta" as const,
      envKeys: ["CASHFREE_CLIENT_ID", "CASHFREE_WEBHOOK_SECRET"],
    },
    {
      id: "phonepe",
      name: "PhonePe",
      description: "UPI and wallet payments",
      icon: "📱",
      status: "beta" as const,
      envKeys: ["PHONEPE_MERCHANT_ID", "PHONEPE_WEBHOOK_SECRET"],
    },
  ],
  data: [
    {
      id: "neon",
      name: "Neon Postgres",
      description: "Serverless Postgres database",
      icon: "🐘",
      status: "stable" as const,
      envKeys: ["POSTGRES_URL", "POSTGRES_PRISMA_URL"],
    },
    {
      id: "upstash-redis",
      name: "Upstash Redis",
      description: "Serverless Redis for caching",
      icon: "🔴",
      status: "stable" as const,
      envKeys: ["UPSTASH_REDIS_URL", "UPSTASH_REDIS_TOKEN"],
    },
    {
      id: "upstash-search",
      name: "Upstash Search",
      description: "Vector search and embeddings",
      icon: "🔍",
      status: "stable" as const,
      envKeys: ["UPSTASH_VECTOR_URL", "UPSTASH_VECTOR_TOKEN"],
    },
  ],
  platform: [
    {
      id: "cloudflare",
      name: "Cloudflare Workers",
      description: "Edge compute and CDN",
      icon: "☁️",
      status: "stable" as const,
      envKeys: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
    },
    {
      id: "doppler",
      name: "Doppler",
      description: "Secret management",
      icon: "🔐",
      status: "stable" as const,
      envKeys: ["DOPPLER_TOKEN"],
    },
    {
      id: "github",
      name: "GitHub Actions",
      description: "CI/CD automation",
      icon: "🐙",
      status: "stable" as const,
      envKeys: ["GITHUB_TOKEN", "GIT_REPO", "GIT_BRANCH"],
    },
  ],
} as const

const STORAGE_KEY = "integratewise:tools"

export function getSelectedTools(): ToolConfig | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function persistSelectedTools(selected: ToolSelection): void {
  if (typeof window === "undefined") return

  const config: ToolConfig = {
    version: "1.0",
    selected,
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export const REQUIRED_ENV_BY_TOOL: Record<string, string[]> = {
  openai: ["OPENAI_API_KEY"],
  claude: ["CLAUDE_API_KEY"],
  gemini: ["GEMINI_API_KEY"],
  groq: ["GROQ_API_KEY"],
  slack: ["SLACK_WEBHOOK_URL", "SLACK_SIGNING_SECRET"],
  discord: ["DISCORD_WEBHOOK_URL", "DISCORD_PUBLIC_KEY"],
  stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  razorpay: ["RAZORPAY_KEY_ID", "RAZORPAY_WEBHOOK_SECRET"],
  cashfree: ["CASHFREE_CLIENT_ID", "CASHFREE_WEBHOOK_SECRET"],
  phonepe: ["PHONEPE_MERCHANT_ID", "PHONEPE_WEBHOOK_SECRET"],
  neon: ["POSTGRES_URL", "POSTGRES_PRISMA_URL"],
  "upstash-redis": ["UPSTASH_REDIS_URL", "UPSTASH_REDIS_TOKEN"],
  "upstash-search": ["UPSTASH_VECTOR_URL", "UPSTASH_VECTOR_TOKEN"],
  cloudflare: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
  doppler: ["DOPPLER_TOKEN"],
  github: ["GITHUB_TOKEN", "GIT_REPO", "GIT_BRANCH"],
}
