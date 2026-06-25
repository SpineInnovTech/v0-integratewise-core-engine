"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Github,
  CheckSquare,
  FileText,
  Bot,
  Webhook,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Activity,
  MessageSquare,
  Hash,
} from "lucide-react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const PROVIDERS = [
  {
    id: "slack",
    name: "Slack",
    description: "Channel messages, commands, and interactions",
    icon: MessageSquare,
    color: "bg-[#4A154B]",
    signature: "HMAC-SHA256",
    events: ["message", "app_mention", "slash_command", "interaction"],
  },
  {
    id: "discord",
    name: "Discord",
    description: "Server messages, commands, and webhooks",
    icon: Hash,
    color: "bg-[#5865F2]",
    signature: "Ed25519",
    events: ["MESSAGE_CREATE", "INTERACTION_CREATE", "GUILD_MEMBER_ADD", "READY"],
  },
  {
    id: "razorpay",
    name: "Razorpay",
    description: "Payment webhooks for orders, payments, refunds",
    icon: CreditCard,
    color: "bg-blue-500",
    signature: "HMAC-SHA256",
    events: ["payment.authorized", "payment.captured", "order.paid", "refund.created"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment and subscription events",
    icon: CreditCard,
    color: "bg-purple-500",
    signature: "HMAC-SHA256",
    events: ["checkout.session.completed", "invoice.paid", "customer.subscription.updated"],
  },
  {
    id: "github",
    name: "GitHub",
    description: "Repository events, PRs, issues, deployments",
    icon: Github,
    color: "bg-gray-700",
    signature: "HMAC-SHA256",
    events: ["push", "pull_request", "issues", "deployment"],
  },
  {
    id: "vercel",
    name: "Vercel",
    description: "Deployment and project events",
    icon: Activity,
    color: "bg-black",
    signature: "HMAC-SHA1",
    events: ["deployment.created", "deployment.succeeded", "deployment.error"],
  },
  {
    id: "todoist",
    name: "Todoist",
    description: "Task and project updates",
    icon: CheckSquare,
    color: "bg-red-500",
    signature: "None",
    events: ["item:added", "item:completed", "item:updated"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "Page and database changes",
    icon: FileText,
    color: "bg-gray-900",
    signature: "None",
    events: ["page.created", "page.updated", "database.updated"],
  },
  {
    id: "ai-relay",
    name: "AI Relay",
    description: "AI chat completions and interactions",
    icon: Bot,
    color: "bg-teal-500",
    signature: "HMAC-SHA256",
    events: ["chat.completion", "embedding.created", "function.called"],
  },
]

const fetcher = async () => {
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
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null)
  const { data: webhooks, isLoading, mutate } = useSWR("webhooks", fetcher)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  const copyEndpoint = (provider: string) => {
    navigator.clipboard.writeText(`${baseUrl}/api/webhooks/${provider}`)
    setCopiedEndpoint(provider)
    setTimeout(() => setCopiedEndpoint(null), 2000)
  }

  const getProviderStats = (providerId: string) => {
    if (!webhooks) return { total: 0, recent: 0 }
    const providerWebhooks = webhooks.filter((w) => w.provider === providerId)
    const last24h = providerWebhooks.filter((w) => new Date(w.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000))
    return { total: providerWebhooks.length, recent: last24h.length }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-muted-foreground">Connect external services via webhooks</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="recent">Recent Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PROVIDERS.map((provider) => {
              const stats = getProviderStats(provider.id)
              const Icon = provider.icon

              return (
                <Card key={provider.id} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`rounded-lg p-2 ${provider.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {provider.signature}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={`${baseUrl}/api/webhooks/${provider.id}`}
                        className="text-xs font-mono bg-muted/50"
                      />
                      <Button variant="outline" size="icon" onClick={() => copyEndpoint(provider.id)}>
                        {copiedEndpoint === provider.id ? (
                          <Check className="h-4 w-4 text-teal-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {stats.total} total • {stats.recent} last 24h
                      </span>
                      <Button variant="ghost" size="sm" className="h-8">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Docs
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {provider.events.slice(0, 3).map((event) => (
                        <Badge key={event} variant="secondary" className="text-xs font-mono">
                          {event}
                        </Badge>
                      ))}
                      {provider.events.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{provider.events.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-teal-500" />
                Recent Webhook Events
              </CardTitle>
              <CardDescription>Last 50 webhook events received</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/50" />
                  ))}
                </div>
              ) : webhooks && webhooks.length > 0 ? (
                <div className="space-y-2">
                  {webhooks.map((webhook) => {
                    const provider = PROVIDERS.find((p) => p.id === webhook.provider)
                    const Icon = provider?.icon || Webhook

                    return (
                      <div key={webhook.id} className="flex items-center gap-4 rounded-lg border border-border/50 p-3">
                        <div className={`rounded-lg p-2 ${provider?.color || "bg-gray-500"}`}>
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
                  <h3 className="font-medium">No webhooks received yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure your external services to send webhooks to the endpoints above
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
