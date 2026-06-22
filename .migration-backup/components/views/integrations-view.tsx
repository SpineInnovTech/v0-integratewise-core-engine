"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Github,
  CheckSquare,
  FileText,
  Webhook,
  ExternalLink,
  RefreshCw,
  Activity,
  MessageSquare,
  Hash,
  Check,
  X,
  Loader2,
  Mail,
  Building2,
  Zap,
} from "lucide-react"
import useSWR from "swr"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"

const CONNECTORS = [
  {
    id: "slack",
    name: "Slack",
    description: "Connect workspace for messages and commands",
    icon: MessageSquare,
    color: "bg-[#4A154B]",
    hasOAuth: true,
    features: ["Messages", "Channels", "Commands", "Mentions"],
  },
  {
    id: "discord",
    name: "Discord",
    description: "Connect server for messages and interactions",
    icon: Hash,
    color: "bg-[#5865F2]",
    hasOAuth: true,
    features: ["Messages", "Guilds", "Interactions", "Members"],
  },
  {
    id: "github",
    name: "GitHub",
    description: "Connect repositories for issues and PRs",
    icon: Github,
    color: "bg-gray-700",
    hasOAuth: true,
    features: ["Repos", "Issues", "PRs", "Deployments"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "Connect workspace for pages and databases",
    icon: FileText,
    color: "bg-gray-900",
    hasOAuth: true,
    features: ["Pages", "Databases", "Comments", "Search"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Connect CRM for contacts and deals",
    icon: Building2,
    color: "bg-orange-500",
    hasOAuth: true,
    features: ["Contacts", "Deals", "Companies", "Tickets"],
  },
  {
    id: "google",
    name: "Google Workspace",
    description: "Connect Gmail, Calendar, and Drive",
    icon: Mail,
    color: "bg-red-500",
    hasOAuth: true,
    features: ["Gmail", "Calendar", "Drive", "Contacts"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Connect for payments and subscriptions",
    icon: CreditCard,
    color: "bg-purple-500",
    hasOAuth: false,
    features: ["Payments", "Subscriptions", "Invoices", "Customers"],
  },
  {
    id: "todoist",
    name: "Todoist",
    description: "Connect for task synchronization",
    icon: CheckSquare,
    color: "bg-red-500",
    hasOAuth: true,
    features: ["Tasks", "Projects", "Labels", "Comments"],
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Connect for deployment events",
    icon: Activity,
    color: "bg-black",
    hasOAuth: false,
    features: ["Deployments", "Projects", "Domains", "Logs"],
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect 5000+ apps via automations",
    icon: Zap,
    color: "bg-orange-600",
    hasOAuth: false,
    features: ["Triggers", "Actions", "Zaps", "Webhooks"],
  },
]

const connectorsFetcher = async () => {
  const res = await fetch("/api/connectors")
  if (!res.ok) throw new Error("Failed to fetch connectors")
  return res.json()
}

const webhooksFetcher = async () => {
  const { createClient } = await import("@/lib/supabase/client")
  const supabase = createClient()
  const { data, error } = await supabase
    .from("webhooks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

export function IntegrationsView() {
  const searchParams = useSearchParams()
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)
  const [disconnectingProvider, setDisconnectingProvider] = useState<string | null>(null)

  const {
    data: connectors,
    isLoading: connectorsLoading,
    mutate: mutateConnectors,
  } = useSWR("connectors", connectorsFetcher)
  const { data: webhooks, isLoading: webhooksLoading, mutate: mutateWebhooks } = useSWR("webhooks", webhooksFetcher)

  // Handle OAuth callback messages
  useEffect(() => {
    const connected = searchParams.get("connected")
    const error = searchParams.get("error")

    if (connected) {
      toast({
        title: "Connected",
        description: `Successfully connected to ${connected}`,
      })
      mutateConnectors()
      // Clean URL
      window.history.replaceState({}, "", "/integrations")
    }

    if (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect: ${error.replace(/_/g, " ")}`,
        variant: "destructive",
      })
      window.history.replaceState({}, "", "/integrations")
    }
  }, [searchParams, mutateConnectors])

  const getConnectorStatus = (providerId: string) => {
    if (!connectors) return null
    return connectors.find((c: any) => c.provider === providerId)
  }

  const handleConnect = (provider: string) => {
    setConnectingProvider(provider)
    // Redirect to OAuth flow
    window.location.href = `/api/connectors/${provider}/connect`
  }

  const handleDisconnect = async (provider: string) => {
    setDisconnectingProvider(provider)
    try {
      const res = await fetch(`/api/connectors/${provider}/disconnect`, {
        method: "POST",
      })
      if (res.ok) {
        toast({
          title: "Disconnected",
          description: `Successfully disconnected from ${provider}`,
        })
        mutateConnectors()
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to disconnect",
        variant: "destructive",
      })
    } finally {
      setDisconnectingProvider(null)
    }
  }

  const getWebhookStats = (providerId: string) => {
    if (!webhooks) return { total: 0, recent: 0 }
    const providerWebhooks = webhooks.filter((w: any) => w.provider === providerId)
    const last24h = providerWebhooks.filter(
      (w: any) => new Date(w.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
    )
    return { total: providerWebhooks.length, recent: last24h.length }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Connectors</h1>
          <p className="text-muted-foreground">Connect your tools and services</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            mutateConnectors()
            mutateWebhooks()
          }}
          disabled={connectorsLoading || webhooksLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${connectorsLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="connectors" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="connectors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CONNECTORS.map((connector) => {
              const status = getConnectorStatus(connector.id)
              const isConnected = status?.status === "connected"
              const stats = getWebhookStats(connector.id)
              const Icon = connector.icon
              const isConnecting = connectingProvider === connector.id
              const isDisconnecting = disconnectingProvider === connector.id

              return (
                <Card
                  key={connector.id}
                  className={`border-border/50 transition-all ${isConnected ? "ring-2 ring-primary/20" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`rounded-lg p-2 ${connector.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      {isConnected ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <Check className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not connected
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{connector.name}</CardTitle>
                    <CardDescription>{connector.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {connector.features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats if connected */}
                    {isConnected && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {status.provider_workspace_name || "Connected"}
                        </span>
                        {stats.total > 0 && (
                          <span className="ml-2">
                            {stats.total} events ({stats.recent} today)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {isConnected ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => handleDisconnect(connector.id)}
                            disabled={isDisconnecting}
                          >
                            {isDisconnecting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <X className="mr-2 h-4 w-4" />
                            )}
                            Disconnect
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </>
                      ) : connector.hasOAuth ? (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleConnect(connector.id)}
                          disabled={isConnecting}
                        >
                          {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Connect {connector.name}
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                          <a href={`https://${connector.id}.com`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Configure via Webhook
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Events received from connected services</CardDescription>
            </CardHeader>
            <CardContent>
              {webhooksLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/50" />
                  ))}
                </div>
              ) : webhooks && webhooks.length > 0 ? (
                <div className="space-y-2">
                  {webhooks.map((webhook: any) => {
                    const connector = CONNECTORS.find((c) => c.id === webhook.provider)
                    const Icon = connector?.icon || Webhook

                    return (
                      <div key={webhook.id} className="flex items-center gap-4 rounded-lg border border-border/50 p-3">
                        <div className={`rounded-lg p-2 ${connector?.color || "bg-gray-500"}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{webhook.provider}</span>
                            <Badge variant="outline" className="text-xs font-mono">
                              {webhook.event_type}
                            </Badge>
                            {!webhook.signature_valid && (
                              <Badge variant="destructive" className="text-xs">
                                Invalid Signature
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{webhook.event_id || "No event ID"}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {new Date(webhook.created_at).toLocaleString()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Webhook className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium">No activity yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect your services above to start receiving events
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
