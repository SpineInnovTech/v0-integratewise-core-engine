import { type NextRequest, NextResponse } from "next/server"

// OAuth configuration for each provider
const OAUTH_CONFIG: Record<
  string,
  {
    authUrl: string
    scopes: string[]
    clientIdEnv: string
    clientSecretEnv: string
  }
> = {
  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    scopes: ["channels:read", "channels:history", "chat:write", "users:read", "team:read"],
    clientIdEnv: "SLACK_CLIENT_ID",
    clientSecretEnv: "SLACK_CLIENT_SECRET",
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    scopes: ["repo", "read:user", "read:org"],
    clientIdEnv: "GITHUB_CLIENT_ID",
    clientSecretEnv: "GITHUB_CLIENT_SECRET",
  },
  notion: {
    authUrl: "https://api.notion.com/v1/oauth/authorize",
    scopes: [],
    clientIdEnv: "NOTION_CLIENT_ID",
    clientSecretEnv: "NOTION_CLIENT_SECRET",
  },
  hubspot: {
    authUrl: "https://app.hubspot.com/oauth/authorize",
    scopes: ["crm.objects.contacts.read", "crm.objects.deals.read", "crm.objects.companies.read"],
    clientIdEnv: "HUBSPOT_CLIENT_ID",
    clientSecretEnv: "HUBSPOT_CLIENT_SECRET",
  },
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const config = OAUTH_CONFIG[provider]

  if (!config) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
  }

  const clientId = process.env[config.clientIdEnv]
  if (!clientId) {
    return NextResponse.json(
      {
        error: `${provider} integration not configured. Please set ${config.clientIdEnv} environment variable.`,
      },
      { status: 500 },
    )
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID()

  // Store state in cookie for verification
  const redirectUri = `${request.nextUrl.origin}/api/connectors/${provider}/callback`

  // Build OAuth URL
  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("state", state)

  if (provider === "slack") {
    authUrl.searchParams.set("scope", config.scopes.join(","))
  } else if (provider === "google") {
    authUrl.searchParams.set("scope", config.scopes.join(" "))
    authUrl.searchParams.set("access_type", "offline")
    authUrl.searchParams.set("prompt", "consent")
    authUrl.searchParams.set("response_type", "code")
  } else if (provider === "notion") {
    authUrl.searchParams.set("owner", "user")
    authUrl.searchParams.set("response_type", "code")
  } else {
    authUrl.searchParams.set("scope", config.scopes.join(" "))
  }

  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  })

  return response
}
