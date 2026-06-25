"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { IntegrateWiseLogo } from "@/components/integratewise-logo"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  const supabase = createClient()

  // Default redirect after login - goes through onboarding check
  const defaultRedirect = "/onboarding"

  async function handleOAuthLogin(provider: "google" | "azure") {
    setOauthLoading(provider)
    setError("")

    if (!supabase) {
      setError("Authentication is not configured.")
      setOauthLoading(null)
      return
    }

    try {
      const redirectTo = searchParams.get("redirect")
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo || "/onboarding")}`,
        },
      })

      if (error) {
        setError(error.message)
        setOauthLoading(null)
      }
    } catch (err) {
      setError("OAuth sign-in failed. Please try again.")
      setOauthLoading(null)
    }
  }

  async function handleDemoLogin() {
    setLoading(true)
    setError("")

    try {
      // Set demo session cookie
      document.cookie = "demo_session=true; path=/; max-age=86400" // 24 hours
      document.cookie = "demo_mode=true; path=/; max-age=86400" // 24 hours

      // Demo mode should go through onboarding flow first
      router.push("/onboarding")
      router.refresh()
    } catch (err) {
      setError("Failed to enable demo mode. Please try again.")
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!supabase) {
      setError("Supabase is not configured. Please check environment variables.")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // After successful login, computeNextTarget will check onboarding state
      // For now, redirect to onboarding (computeNextTarget is server-side)
      const redirectTo = searchParams.get("redirect") || "/onboarding"
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* OAuth Buttons */}
      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthLogin("google")}
          disabled={!!oauthLoading || loading}
        >
          {oauthLoading === "google" ? (
            "Connecting..."
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleOAuthLogin("azure")}
          disabled={!!oauthLoading || loading}
        >
          {oauthLoading === "azure" ? (
            "Connecting..."
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Continue with Microsoft
            </>
          )}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</div>}

        <Button type="submit" className="w-full" disabled={loading || !!oauthLoading}>
          {loading ? "Signing in..." : "Sign In with Email"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-primary hover:underline">
            Sign up
          </a>
        </div>
      </form>

      {/* Demo Login Button */}
      <div className="mt-6 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full mb-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={handleDemoLogin}
          disabled={loading || !!oauthLoading}
        >
          {loading ? "Loading..." : "🚀 Try Demo Mode"}
        </Button>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">OR USE DEMO CREDENTIALS</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Email: demo@integratewise.online</p>
          <p>Password: demo123</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <IntegrateWiseLogo variant="horizontal" className="h-8" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your IntegrateWise workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-80 animate-pulse bg-muted rounded" />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
