"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { IntegrateWiseLogo } from "@/components/integratewise-logo"
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    if (!supabase) {
      setError("Database connection not configured.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setIsSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="text-muted-foreground">
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full h-12 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <IntegrateWiseLogo className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">IntegrateWise</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">Forgot your password?</h2>
            <p className="text-muted-foreground">Enter your email and we&apos;ll send you a reset link</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-11 bg-muted/50 border-border focus:bg-background transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
