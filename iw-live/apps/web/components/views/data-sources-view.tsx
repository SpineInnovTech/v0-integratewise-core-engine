"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Settings, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const dataSourcesConfig: Record<string, { name: string; icon: string; color: string; description: string }> = {
  slack: {
    name: "Slack",
    icon: "https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png",
    color: "bg-[#4A154B]",
    description: "Sync messages, channels, and users",
  },
  discord: {
    name: "Discord",
    icon: "https://discord.com/assets/favicon.ico",
    color: "bg-[#5865F2]",
    description: "Sync server messages and members",
  },
  hubspot: {
    name: "HubSpot CRM",
    icon: "https://www.hubspot.com/favicon.ico",
    color: "bg-orange-500",
    description: "Sync contacts, companies, and deals",
  },
  pipedrive: {
    name: "Pipedrive",
    icon: "https://www.pipedrive.com/favicon.ico",
    color: "bg-green-500",
    description: "Sync deals and pipeline data",
  },
  razorpay: {
    name: "Razorpay",
    icon: "https://razorpay.com/favicon.ico",
    color: "bg-blue-500",
    description: "Sync Indian payments data",
  },
  google_sheets: {
    name: "Google Sheets",
    icon: "https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico",
    color: "bg-green-600",
    description: "Import data from spreadsheets",
  },
  google_analytics: {
    name: "Google Analytics",
    icon: "https://www.google.com/analytics/favicon.ico",
    color: "bg-yellow-500",
    description: "Sync website analytics",
  },
  asana: {
    name: "Asana",
    icon: "https://asana.com/favicon.ico",
    color: "bg-red-500",
    description: "Sync tasks and projects",
  },
  linkedin: {
    name: "LinkedIn",
    icon: "https://www.linkedin.com/favicon.ico",
    color: "bg-sky-600",
    description: "Sync connections and messages",
  },
}

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("data_source_sync")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export function DataSourcesView() {
  const { data: syncLogs, isLoading, mutate } = useSWR("data_source_sync", fetcher)
  const [syncing, setSyncing] = useState<string | null>(null)

  // Get latest sync for each source
  const latestSyncs = Object.keys(dataSourcesConfig).reduce(
    (acc, source) => {
      const latest = syncLogs?.find((log: any) => log.source === source)
      acc[source] = latest
      return acc
    },
    {} as Record<string, any>,
  )

  const triggerSync = async (source: string) => {
    setSyncing(source)
    // Simulate sync - in production this would call your API
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setSyncing(null)
    mutate()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Sources</h1>
          <p className="text-muted-foreground">Connect and sync external data into IntegrateWise OS</p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>

      {/* Data Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(dataSourcesConfig).map(([key, config]) => {
          const latestSync = latestSyncs[key]
          const isConnected = !!latestSync
          const isSyncing = syncing === key

          return (
            <Card key={key} className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${config.color}/10 flex items-center justify-center`}>
                      <img
                        src={config.icon || "/placeholder.svg"}
                        alt={config.name}
                        className="h-5 w-5"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{config.name}</h3>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  {isConnected ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          {getStatusIcon(latestSync.status)}
                          <span className="text-muted-foreground">
                            {latestSync.status === "completed" ? "Synced" : latestSync.status}
                          </span>
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatTimeAgo(latestSync.completed_at || latestSync.started_at)}
                        </span>
                      </div>
                      {latestSync.status === "completed" && (
                        <p className="text-xs text-muted-foreground">
                          {latestSync.records_created} created, {latestSync.records_updated} updated
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 bg-transparent"
                        disabled={isSyncing}
                        onClick={() => triggerSync(key)}
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 mr-2" />
                            Sync Now
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Zap className="h-3.5 w-3.5 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sync History */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {syncLogs?.slice(0, 10).map((log: any) => {
                const config = dataSourcesConfig[log.source]
                return (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <p className="text-sm font-medium text-foreground">{config?.name || log.source}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.sync_type} sync • {log.records_fetched} records
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.started_at).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {log.status === "failed" && log.error_message && (
                        <p className="text-xs text-red-500 max-w-[200px] truncate">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
