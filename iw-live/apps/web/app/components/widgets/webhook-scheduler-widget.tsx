"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Send, Clock, CheckCircle, XCircle, RefreshCw, MessageSquare, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface WebhookNotification {
  id: string
  channel: string
  notification_type: string
  title: string
  status: string
  sent_at: string
  created_at: string
}

export function WebhookSchedulerWidget() {
  const [notifications, setNotifications] = useState<WebhookNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [configured, setConfigured] = useState(false)

  const fetchHistory = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

      const response = await fetch("/api/webhook-scheduler/trigger", {
        signal: controller.signal,
      }).catch(() => null) // Catch network errors

      clearTimeout(timeoutId)

      // If fetch failed completely, show not configured
      if (!response) {
        setConfigured(false)
        setNotifications([])
        setLoading(false)
        return
      }

      if (!response.ok) {
        setConfigured(false)
        setNotifications([])
        setLoading(false)
        return
      }

      const data = await response.json().catch(() => ({ configured: false }))

      if (data.configured === false) {
        setConfigured(false)
        setNotifications([])
        setLoading(false)
        return
      }

      setNotifications(data.notifications || [])

      if (data.notifications?.length > 0) {
        setLastSent(data.notifications[0].sent_at)
      }
      setConfigured(true)
    } catch {
      // Silently fail and show not configured state
      setConfigured(false)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const triggerManual = async () => {
    setSending(true)
    try {
      const response = await fetch("/api/webhook-scheduler/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "both" }),
      })

      const data = await response.json()
      if (data.success) {
        fetchHistory()
      }
    } catch (error) {
      console.error("Failed to trigger webhook:", error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "Never"
    return new Date(dateStr).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatRelative = (dateStr: string) => {
    if (!dateStr) return "Never"
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (!configured && !loading) {
    return (
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                AI Webhook Scheduler
                <Badge variant="outline" className="text-xs">
                  Optional
                </Badge>
              </CardTitle>
              <CardDescription>Send automated reports to Slack/Discord</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Settings className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium mb-1">Not Configured</p>
            <p className="text-xs">Add SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL to enable</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              AI Webhook Scheduler
            </CardTitle>
            <CardDescription>Hourly business intelligence to Slack/Discord</CardDescription>
          </div>
          <Button size="sm" onClick={triggerManual} disabled={sending} className="h-8">
            {sending ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
            {sending ? "Sending..." : "Send Now"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Last sent:</span>
          </div>
          <span className="text-sm font-medium">{lastSent ? formatRelative(lastSent) : "Never"}</span>
        </div>

        {/* Recent notifications */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Recent Webhooks</p>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No webhooks sent yet
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  {notification.status === "sent" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium truncate max-w-[180px]">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(notification.sent_at)}</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs capitalize",
                    notification.channel === "slack" && "bg-purple-500/10 text-purple-500",
                    notification.channel === "discord" && "bg-indigo-500/10 text-indigo-500",
                    notification.channel === "both" && "bg-primary/10 text-primary",
                  )}
                >
                  {notification.channel}
                </Badge>
              </div>
            ))
          )}
        </div>

        {/* Schedule info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Automated reports run every hour (0 * * * *)
        </div>
      </CardContent>
    </Card>
  )
}
