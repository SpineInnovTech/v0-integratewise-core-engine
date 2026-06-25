"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { IntegrateWiseLogo } from "@/components/integratewise-logo"
import { Lock, Loader2, CheckCircle2 } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  // Check if user has a valid session from the reset link
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User clicked the reset link and is now in recovery mode
      }
    })
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    if (!supabase) {
      setError("Database connection not configured.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setIsSuccess(true)
      setTimeout(() => router.push("/auth/login"), 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to reset password")
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
            <h2 className="text-2xl font-bold">Password updated!</h2>
            <p className="text-muted-foreground">Redirecting you to sign in...</p>
          </div>
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
            <h2 className="text-2xl font-bold">Set new password</h2>
            <p className="text-muted-foreground">Enter your new password below</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-11 bg-muted/50 border-border focus:bg-background transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm new password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Updating...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
