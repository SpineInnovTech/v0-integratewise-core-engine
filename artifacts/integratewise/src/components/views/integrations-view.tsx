
import { useState } from "react"
import { cn } from "@/lib/utils"
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
import { useSearch } from "wouter"
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
  const searchString = useSearch()
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
    const urlParams = new URLSearchParams(searchString); const connected = urlParams.get("connected")
    const error = urlParams.get("error")

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
  }, [searchString, mutateConnectors])

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
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Ecosystem Connectors</h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Manage integrations and real-time event streams</p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            mutateConnectors()
            mutateWebhooks()
          }}
          disabled={connectorsLoading || webhooksLoading}
          className="rounded-full shadow-sm font-semibold tracking-wide uppercase text-xs"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${connectorsLoading ? "animate-spin" : ""}`} />
          Refresh Sync
        </Button>
      </div>

      <Tabs defaultValue="connectors" className="space-y-8">
        <TabsList className="bg-secondary/50 p-1.5 rounded-xl border border-border/50 w-full sm:w-auto flex flex-col sm:flex-row h-auto">
          <TabsTrigger value="connectors" className="rounded-lg text-sm font-semibold tracking-wide uppercase px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1">Active Connectors</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg text-sm font-semibold tracking-wide uppercase px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1">Event Streams</TabsTrigger>
        </TabsList>

        <TabsContent value="connectors" className="space-y-4 focus-visible:outline-none">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                  className={cn(
                    "border-border/50 transition-all rounded-2xl overflow-hidden hover:shadow-md",
                    isConnected ? "ring-2 ring-primary/20 bg-primary/[0.02]" : "hover:border-primary/30"
                  )}
                >
                  <CardHeader className="p-6 border-b border-border/30 bg-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`rounded-xl p-3 shadow-inner ${connector.color}`}>
                        <Icon className="h-6 w-6 text-white" strokeWidth={1.5} />
                      </div>
                      {isConnected ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-bold uppercase tracking-wider text-[10px] px-3 py-1">
                          <Check className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-secondary text-muted-foreground hover:bg-secondary border-none font-bold uppercase tracking-wider text-[10px] px-3 py-1">
                          Available
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">{connector.name}</CardTitle>
                    <CardDescription className="text-sm font-medium mt-1 text-muted-foreground/80 leading-relaxed">{connector.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 bg-card/50">
                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {connector.features.map((feature) => (
                        <span key={feature} className="text-xs font-semibold text-foreground/70 bg-secondary/80 px-2.5 py-1 rounded-md border border-border/50">
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Stats if connected */}
                    {isConnected && (
                      <div className="text-sm bg-background border border-border/50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="font-bold text-foreground">
                            {status.provider_workspace_name || "Active Connection"}
                          </span>
                        </div>
                        {stats.total > 0 ? (
                          <p className="text-muted-foreground font-medium text-xs">
                            Processed <span className="text-foreground font-bold">{stats.total}</span> events (<span className="text-foreground font-bold">{stats.recent}</span> today)
                          </p>
                        ) : (
                          <p className="text-muted-foreground font-medium text-xs">Listening for events...</p>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      {isConnected ? (
                        <>
                          <Button
                            variant="outline"
                            className="flex-1 bg-background border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground font-semibold rounded-xl"
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
                          <Button variant="outline" size="icon" className="w-10 rounded-xl bg-background">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </>
                      ) : connector.hasOAuth ? (
                        <Button
                          className="w-full font-bold uppercase tracking-wider text-xs rounded-xl shadow-md"
                          onClick={() => handleConnect(connector.id)}
                          disabled={isConnecting}
                        >
                          {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Connect Account
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full bg-background font-bold uppercase tracking-wider text-xs rounded-xl border-border/80 text-foreground/80 hover:text-foreground" asChild>
                          <a href={`https://${connector.id}.com`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Configure Manually
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

        <TabsContent value="activity" className="focus-visible:outline-none">
          <Card className="border-border/50 rounded-2xl shadow-sm overflow-hidden bg-card">
            <CardHeader className="p-6 border-b border-border/50 bg-secondary/10">
              <CardTitle className="text-lg font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Activity className="h-5 w-5" />
                </div>
                Event Stream Log
              </CardTitle>
              <CardDescription className="font-medium mt-1">Real-time webhook payloads across all active connectors</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {webhooksLoading ? (
                <div className="divide-y divide-border/30">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-6 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : webhooks && webhooks.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {webhooks.map((webhook: any) => {
                    const connector = CONNECTORS.find((c) => c.id === webhook.provider)
                    const Icon = connector?.icon || Webhook

                    return (
                      <div key={webhook.id} className="flex items-center gap-5 p-5 hover:bg-secondary/20 transition-colors">
                        <div className={`rounded-xl p-2.5 shadow-sm shrink-0 ${connector?.color || "bg-gray-500"}`}>
                          <Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-foreground text-sm tracking-wide capitalize">{webhook.provider}</span>
                            <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-mono font-bold border border-border/50">
                              {webhook.event_type}
                            </span>
                            {!webhook.signature_valid && (
                              <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                                Invalid Sig
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-lg">ID: {webhook.event_id || "unknown"}</p>
                        </div>
                        <div className="text-right flex flex-col items-end shrink-0">
                          <span className="text-sm font-semibold text-foreground">
                            {new Date(webhook.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground mt-0.5">
                            {new Date(webhook.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                  <div className="h-24 w-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
                    <Activity className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">No event data</h3>
                  <p className="text-muted-foreground font-medium max-w-md">
                    Connect services in the Active Connectors tab to start receiving webhooks and events automatically.
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
