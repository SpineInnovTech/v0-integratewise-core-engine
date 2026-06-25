import { useState } from "react";
import {
  Brain, Zap, Target, CheckCircle2, FileText, Lightbulb,
  Calendar, Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MOCK_SESSIONS = [
  { id: "s1", title: "Product-Market Fit Strategy", description: "Evaluating ICP and vertical expansion", session_date: "2025-06-10", session_type: "strategy", status: "active", participants: ["Nirmal", "Priya"], key_insights: ["Focus on SaaS/Software vertical", "Mid-market sweet spot"], action_items: ["Update ICP doc", "Revise pitch deck"] },
  { id: "s2", title: "MuleSoft Delivery Review", description: "Phase 2 milestone planning", session_date: "2025-06-08", session_type: "delivery", status: "completed", participants: ["Nirmal", "Team"], key_insights: ["Phase 1 delivered on time", "Phase 2 needs 2 more weeks"], action_items: ["Send status update to client"] },
  { id: "s3", title: "Revenue Growth Levers", description: "Identifying Q3 growth opportunities", session_date: "2025-06-05", session_type: "analysis", status: "active", participants: ["Nirmal"], key_insights: ["Upsell to existing clients is fastest path", "Referral program underutilized"], action_items: ["Draft referral program proposal"] },
];

const MOCK_INSIGHTS = [
  { id: "i1", title: "Blog post: The Rise of iPaaS for SMBs", content: "Comprehensive guide on how mid-market companies are adopting integration platforms to compete with enterprise.", insight_type: "blog_post", status: "pending", confidence_score: 0.87, priority: "high" },
  { id: "i2", title: "Pipeline update: HealthPlus opportunity", content: "HealthPlus deal should move to Proposal stage — they've requested a formal SOW.", insight_type: "pipeline_update", status: "completed", confidence_score: 0.94, priority: "urgent" },
  { id: "i3", title: "LinkedIn post: Customer success story", content: "Share TechCorp's 40% efficiency gain from MuleSoft implementation — strong social proof.", insight_type: "linkedin_post", status: "pending", confidence_score: 0.79, priority: "medium" },
];

const DAILY_INSIGHTS = {
  insight_date: new Date().toISOString().split("T")[0],
  summary: "Strong week: 3 IQ sessions run, 2 deals advanced, 1 new client onboarded. Revenue trend up 12% MoM.",
  brainstorm_count: 3, tasks_created: 7, content_generated: 2, pipeline_updates: 2,
  key_actions: ["Follow up with HealthPlus on SOW", "Publish iPaaS blog post draft", "Schedule EduTech kickoff call"],
};

const insightIcon: Record<string, any> = {
  blog_post: FileText, linkedin_post: FileText, email_campaign: FileText,
  pipeline_update: Target, task: CheckCircle2, knowledge_article: FileText,
};

export function IQHubView() {
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary flex-shrink-0" />
          <h1 className="text-3xl font-bold tracking-tight">IQ Hub</h1>
        </div>
        <p className="text-base text-muted-foreground max-w-3xl">
          Your working memory — captured knowledge becomes reusable assets: templates, playbooks, decisions, and research.
        </p>
      </div>

      {/* Daily insights banner */}
      <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <CardTitle>Today's AI Insights</CardTitle>
            </div>
            <Badge variant="outline">{DAILY_INSIGHTS.insight_date}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{DAILY_INSIGHTS.summary}</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              [DAILY_INSIGHTS.brainstorm_count, "IQ Sessions"],
              [DAILY_INSIGHTS.tasks_created, "Tasks Created"],
              [DAILY_INSIGHTS.content_generated, "Content Generated"],
              [DAILY_INSIGHTS.pipeline_updates, "Pipeline Updates"],
            ].map(([val, label]) => (
              <div key={label as string} className="space-y-1">
                <div className="text-2xl font-bold">{val}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Priority Actions:</div>
            <ul className="space-y-1">
              {DAILY_INSIGHTS.key_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="goals">Goals &amp; Metrics</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Hub</TabsTrigger>
          <TabsTrigger value="sessions">IQ Sessions</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Goals &amp; Metrics</CardTitle>
              <CardDescription>Track goals, define metrics, and visualize progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Goals &amp; Metrics coming soon</p>
                <p className="text-xs mt-2">Track goals, define metrics, progress visualization, AI suggestions</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Tasks inside IQ Hub — List, Board, Calendar, Timeline views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tasks view coming soon</p>
                <p className="text-xs mt-2">Tasks integrated into IQ Hub with multiple view options</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Hub</CardTitle>
              <CardDescription>AI conversations, uploaded docs, tool data, semantic search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Knowledge Hub coming soon</p>
                <p className="text-xs mt-2">AI conversations, uploaded docs, tool data, semantic search</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_SESSIONS.map((session) => (
              <Card key={session.id} className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedSession(session)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{session.title}</CardTitle>
                      <CardDescription className="mt-1">{session.description}</CardDescription>
                    </div>
                    <Brain className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(session.session_date).toLocaleDateString()}
                  </div>
                  {session.participants.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {session.participants.join(", ")}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{session.session_type}</Badge>
                    <Badge variant={session.status === "active" ? "default" : "secondary"} className="text-xs">{session.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.key_insights.length} insights · {session.action_items.length} actions
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid gap-4">
            {MOCK_INSIGHTS.map((insight) => {
              const Icon = insightIcon[insight.insight_type] || Lightbulb;
              return (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={insight.status === "completed" ? "default" : "secondary"}>{insight.status}</Badge>
                        <Badge variant="outline" className="text-xs">{Math.round(insight.confidence_score * 100)}% confidence</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{insight.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{insight.insight_type.replace("_", " ")}</Badge>
                        <Badge variant={insight.priority === "urgent" ? "destructive" : "outline"} className="text-xs">{insight.priority}</Badge>
                      </div>
                      {insight.status === "pending" && (
                        <Button size="sm" variant="outline"><Zap className="mr-1 h-3 w-3" />Execute</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedSession?.title}</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Description:</div>
                <div className="rounded-md bg-muted p-3 text-sm">{selectedSession.description}</div>
              </div>
              {selectedSession.key_insights?.length > 0 && (
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
              {selectedSession.action_items?.length > 0 && (
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
  );
}
