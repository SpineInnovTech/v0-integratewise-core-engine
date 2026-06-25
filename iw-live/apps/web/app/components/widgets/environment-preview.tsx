"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, RefreshCw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

type Item = {
  key: string
  value: string
  redact?: boolean
  required?: boolean
}

type HealthStatus = {
  ok: boolean
  supabaseUrl: string
  vector: {
    model: string
    dim: number
    metric: string
  }
  dbReachable: boolean
}

/**
 * Masks sensitive values for display
 */
function mask(v: string): string {
  if (!v) return "—"
  if (v.length <= 8) return "••••"
  return `${v.slice(0, 4)}••••${v.slice(-4)}`
}

/**
 * Environment Preview Widget
 * 
 * Displays public environment variables and health status.
 * Server-only values are fetched via API (never inline).
 */
export default function EnvironmentPreview() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Public environment variables (safe to display)
  const publicItems: Item[] = [
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      value: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      required: true,
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      redact: true,
      required: true,
    },
  ]

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/env/health")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setHealth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch health")
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Environment Preview</CardTitle>
            <CardDescription>Runtime configuration and health status</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Public Variables Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Public Variables</h4>
          <div className="rounded-md border p-3 space-y-2">
            {publicItems.map((item) => (
              <div key={item.key} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-mono text-xs">
                  {item.key}
                  {item.required && <span className="text-red-500 ml-1">*</span>}
                </span>
                <span className="font-mono text-xs">
                  {item.redact ? mask(item.value) : item.value || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Status Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Server Health</h4>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Checking health...</span>
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Health check failed</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          ) : health ? (
            <div className="rounded-md border p-3 space-y-3">
              {/* Database Status */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Database</span>
                <Badge variant={health.dbReachable ? "default" : "destructive"}>
                  {health.dbReachable ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Unreachable
                    </>
                  )}
                </Badge>
              </div>

              {/* Vector Config */}
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Vector Configuration</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted rounded px-2 py-1">
                    <span className="text-muted-foreground block">Model</span>
                    <span className="font-mono truncate">{health.vector.model}</span>
                  </div>
                  <div className="bg-muted rounded px-2 py-1">
                    <span className="text-muted-foreground block">Dimension</span>
                    <span className="font-mono">{health.vector.dim}</span>
                  </div>
                  <div className="bg-muted rounded px-2 py-1">
                    <span className="text-muted-foreground block">Metric</span>
                    <span className="font-mono">{health.vector.metric}</span>
                  </div>
                </div>
              </div>

              {/* Supabase URL */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Supabase URL</span>
                <a
                  href={health.supabaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline font-mono truncate max-w-[200px]"
                >
                  {new URL(health.supabaseUrl).hostname}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {/* Server Variables (via health endpoint) */}
        {health && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Server Configuration</h4>
            <div className="rounded-md border p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Service Role Key</span>
                <Badge variant={health.dbReachable ? "outline" : "secondary"}>
                  {health.dbReachable ? "Configured" : "Not configured"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">OpenAI API</span>
                <Badge variant="outline">Check /api/env/health</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Links */}
        <div className="pt-2 border-t">
          <div className="flex gap-2 text-xs">
            <a
              href="/api/env/health"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Health API <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-muted-foreground">•</span>
            <a
              href="/api/webhook-scheduler/trigger"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Webhook Status <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Also export individual components for flexibility
export { mask }
