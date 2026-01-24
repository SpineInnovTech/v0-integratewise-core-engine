import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const TOKEN_ENDPOINTS: Record<string, string> = {
  slack: "https://slack.com/api/oauth.v2.access",
  github: "https://github.com/login/oauth/access_token",
  notion: "https://api.notion.com/v1/oauth/token",
  hubspot: "https://api.hubapi.com/oauth/v1/token",
  google: "https://oauth2.googleapis.com/token",
}

const CLIENT_CONFIG: Record<string, { clientIdEnv: string; clientSecretEnv: string }> = {
  slack: { clientIdEnv: "SLACK_CLIENT_ID", clientSecretEnv: "SLACK_CLIENT_SECRET" },
  github: { clientIdEnv: "GITHUB_CLIENT_ID", clientSecretEnv: "GITHUB_CLIENT_SECRET" },
  notion: { clientIdEnv: "NOTION_CLIENT_ID", clientSecretEnv: "NOTION_CLIENT_SECRET" },
  hubspot: { clientIdEnv: "HUBSPOT_CLIENT_ID", clientSecretEnv: "HUBSPOT_CLIENT_SECRET" },
  google: { clientIdEnv: "GOOGLE_CLIENT_ID", clientSecretEnv: "GOOGLE_CLIENT_SECRET" },
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // Check for OAuth errors
  if (error) {
    return NextResponse.redirect(`${request.nextUrl.origin}/integrations?error=${encodeURIComponent(error)}`)
  }

  // Verify state
  const storedState = request.cookies.get(`oauth_state_${provider}`)?.value
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${request.nextUrl.origin}/integrations?error=invalid_state`)
  }

  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}/integrations?error=no_code`)
  }

  const config = CLIENT_CONFIG[provider]
  const clientId = process.env[config.clientIdEnv]
  const clientSecret = process.env[config.clientSecretEnv]

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${request.nextUrl.origin}/integrations?error=not_configured`)
  }

  const redirectUri = `${request.nextUrl.origin}/api/connectors/${provider}/callback`

  try {
    // Exchange code for tokens
    let tokenResponse: Response

    if (provider === "notion") {
      // Notion uses Basic auth
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
      tokenResponse = await fetch(TOKEN_ENDPOINTS[provider], {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      })
    } else if (provider === "github") {
      tokenResponse = await fetch(TOKEN_ENDPOINTS[provider], {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      })
    } else {
      // Standard OAuth2 token exchange
      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      })

      tokenResponse = await fetch(TOKEN_ENDPOINTS[provider], {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      })
    }

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      console.error(`OAuth token error for ${provider}:`, tokenData)
      return NextResponse.redirect(`${request.nextUrl.origin}/integrations?error=token_exchange_failed`)
    }

    // Extract provider-specific data
    let providerUserId: string | null = null
    let workspaceId: string | null = null
    let workspaceName: string | null = null
    let accessToken: string
    let refreshToken: string | null = null
    let expiresAt: Date | null = null

    if (provider === "slack") {
      accessToken = tokenData.access_token
      providerUserId = tokenData.authed_user?.id
      workspaceId = tokenData.team?.id
      workspaceName = tokenData.team?.name
    } else if (provider === "notion") {
      accessToken = tokenData.access_token
      providerUserId = tokenData.owner?.user?.id
      workspaceId = tokenData.workspace_id
      workspaceName = tokenData.workspace_name
    } else if (provider === "github") {
      accessToken = tokenData.access_token
      // Fetch user info
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const userData = await userRes.json()
      providerUserId = userData.id?.toString()
      workspaceName = userData.login
    } else if (provider === "google") {
      accessToken = tokenData.access_token
      refreshToken = tokenData.refresh_token
      if (tokenData.expires_in) {
        expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
      }
      // Fetch user info
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const userData = await userRes.json()
      providerUserId = userData.id
      workspaceName = userData.email
    } else {
      accessToken = tokenData.access_token
      refreshToken = tokenData.refresh_token
    }

    // Store in database
    const supabase = await createClient()

    // Get current user (demo mode fallback)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id || "00000000-0000-0000-0000-000000000000" // Demo user fallback

    const { error: dbError } = await supabase.from("connectors").upsert(
      {
        user_id: userId,
        provider,
        status: "connected",
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt?.toISOString(),
        provider_user_id: providerUserId,
        provider_workspace_id: workspaceId,
        provider_workspace_name: workspaceName,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,provider",
      },
    )

    if (dbError) {
      console.error("Database error storing connector:", dbError)
    }

    // Clear state cookie and redirect
    const response = NextResponse.redirect(`${request.nextUrl.origin}/integrations?connected=${provider}`)
    response.cookies.delete(`oauth_state_${provider}`)

    return response
  } catch (err) {
    console.error(`OAuth callback error for ${provider}:`, err)
    return NextResponse.redirect(`${request.nextUrl.origin}/integrations?error=callback_failed`)
  }
}
