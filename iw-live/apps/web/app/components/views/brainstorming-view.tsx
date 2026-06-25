"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Calendar, CheckCircle2, FileText, Lightbulb, Linkedin, Mail, TrendingUp, Users, Zap } from "lucide-react"
import { useEffect, useState } from "react"

export function BrainstormingView() {
  const [sessions, setSessions] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [dailyInsights, setDailyInsights] = useState<any | null>(null)
  const [selectedSession, setSelectedSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    if (!supabase) {
      setLoading(false)
      return
    }

    const [sessionsRes, insightsRes, dailyRes] = await Promise.all([
      supabase.from("brainstorm_sessions").select("*").order("session_date", { ascending: false }).limit(50),
      supabase
        .from("brainstorm_insights")
        .select("*, brainstorm_sessions(title)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("daily_insights").select("*").order("insight_date", { ascending: false }).limit(1).single(),
    ])

    setSessions(sessionsRes.data || [])
    setInsights(insightsRes.data || [])
    setDailyInsights(dailyRes.data)
    setLoading(false)
  }

  const getInsightIcon = (type: string) => {
    const icons = {
      task: CheckCircle2,
      blog_post: FileText,
      linkedin_post: Linkedin,
      email_campaign: Mail,
      pipeline_update: TrendingUp,
      knowledge_article: FileText,
    }
    return icons[type as keyof typeof icons] || Lightbulb
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "gray",
      scheduled: "blue",
      published: "green",
      completed: "green",
      cancelled: "red",
    }
    return colors[status as keyof typeof colors] || "gray"
  }

  return (
    <div className="space-y-6">
      {/* Daily Insights Summary */}
      {dailyInsights && (
        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <CardTitle>Today's AI Insights</CardTitle>
              </div>
              <Badge variant="outline">{dailyInsights.insight_date}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{dailyInsights.summary}</p>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold">{dailyInsights.brainstorm_count}</div>
                <div className="text-xs text-muted-foreground">Brainstorm Sessions</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{dailyInsights.tasks_created}</div>
                <div className="text-xs text-muted-foreground">Tasks Created</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{dailyInsights.content_generated}</div>
                <div className="text-xs text-muted-foreground">Content Generated</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{dailyInsights.pipeline_updates}</div>
                <div className="text-xs text-muted-foreground">Pipeline Updates</div>
              </div>
            </div>

            {dailyInsights.key_actions && dailyInsights.key_actions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Priority Actions:</div>
                <ul className="space-y-1">
                  {dailyInsights.key_actions.map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Brainstorm Sessions</TabsTrigger>
          <TabsTrigger value="insights">AI-Generated Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="cursor-pointer hover:border-primary/50"
                onClick={() => setSelectedSession(session)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{session.title}</CardTitle>
                      <CardDescription className="mt-1">{session.description}</CardDescription>
                    </div>
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(session.session_date).toLocaleDateString()}
                  </div>

                  {session.participants && session.participants.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {session.participants.join(", ")}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {session.session_type}
                    </Badge>
                    <Badge variant={session.status === "active" ? "default" : "secondary"} className="text-xs">
                      {session.status}
                    </Badge>
                  </div>

                  {session.key_insights && session.key_insights.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {session.key_insights.length} insights • {session.action_items?.length || 0} actions
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.insight_type)

              return (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                          From: {insight.brainstorm_sessions?.title}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getStatusColor(insight.status) as any}>{insight.status}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(insight.confidence_score * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{insight.content}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {insight.insight_type.replace("_", " ")}
                        </Badge>
                        <Badge variant={insight.priority === "urgent" ? "destructive" : "outline"} className="text-xs">
                          {insight.priority}
                        </Badge>
                      </div>

                      {insight.status === "pending" && (
                        <Button size="sm" variant="outline">
                          <Zap className="mr-1 h-3 w-3" />
                          Execute
                        </Button>
                      )}

                      {insight.status === "completed" && insight.result_type && (
                        <div className="text-xs text-muted-foreground">Created: {insight.result_type}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedSession?.title}</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Context:</div>
                <div className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{selectedSession.context}</div>
              </div>

              {selectedSession.key_insights && selectedSession.key_insights.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Key Insights:</div>
                  <ul className="space-y-1">
                    {selectedSession.key_insights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSession.action_items && selectedSession.action_items.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Action Items:</div>
                  <ul className="space-y-1">
                    {selectedSession.action_items.map((action: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
