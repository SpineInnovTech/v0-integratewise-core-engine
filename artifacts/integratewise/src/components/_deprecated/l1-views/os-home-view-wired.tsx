"use client";

/**
 * @deprecated This component mixes L1 (Workplace) and L2 (Cognitive) concerns.
 *
 * MIGRATION:
 * - For L1 workspace pages, use: HomeSkeletonL1 from '@/components/l1/workspace/home-skeleton-l1'
 * - For L2 AI features, use: L2Redirect from '@/components/l2/cognitive/l2-redirect'
 *
 * The 4-Layer Architecture:
 * - L0: Onboarding
 * - L1: Workplace (pure data views, no AI clutter)
 * - L2: Cognitive Brain (AI, accessed via ⌘J)
 * - L3: Adaptive Spine (SSOT)
 *
 * Zero imports of this component should remain in the codebase.
 */

import { useState } from "react";
import { ActionBar } from "@/components/l2/approvals/action-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  Video,
  Phone,
  ArrowRight,
  Sparkles,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
  Bell,
  Inbox,
  Users,
  Building2,
  Briefcase,
  Brain,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Link2,
  History,
  Star,
  Zap,
  Database,
  Layers,
  RefreshCw,
  MessageCircle,
  Activity,
  Target,
} from "lucide-react";

export function OsHomeViewWired() {
  const [selectedAction, setSelectedAction] = useState<any>(null);

  // === COGNITIVE TWIN powered by IQ Hub + Think Layer ===
  // All data converges from: Structured (CRM, PM tools) + Knowledge (emails, docs, drives) + Context (AI chats, meeting summaries)
  // Think layer processes this for predictions and suggestions
  // Act layer executes workflows

  // IQ Hub: Converged Intelligence - Working Memory from all sources
  const iqHubContext = {
    lastSync: "2 min ago",
    sourcesConnected: 12,
    contextWindow: "30 days",
    activeThreads: 8,
  };

  // Working Memory - synthesized from IQ Hub (structured + scattered knowledge + AI conversations)
  const workingMemory = [
    {
      id: 1,
      context: "Acme Corp Deal",
      lastTouched: "Yesterday",
      status: "You're waiting on legal review since Monday",
      relatedItems: ["Contract v3.pdf", "Email thread with Sarah", "Pricing spreadsheet"],
      sources: ["Salesforce", "Gmail", "Drive"],
      aiMemory: "You discussed pricing strategy with me on Jan 28",
      nextStep: "Follow up with legal if no response by EOD",
      canAct: true,
      workflow: "send-followup-email",
    },
    {
      id: 2,
      context: "Q1 Product Launch",
      lastTouched: "2 days ago",
      status: "Marketing assets 80% complete",
      relatedItems: ["Launch timeline", "Press release draft", "Demo video"],
      sources: ["Asana", "Notion", "Slack"],
      aiMemory: "We brainstormed taglines together last week",
      nextStep: "Review final copy from Maria",
      canAct: true,
      workflow: "request-review",
    },
    {
      id: 3,
      context: "TechStart Renewal",
      lastTouched: "3 days ago",
      status: "Champion engaged, need exec buy-in",
      relatedItems: ["Meeting notes Jan 25", "ROI calculator", "Case study draft"],
      sources: ["HubSpot", "Calendar", "Notion"],
      aiMemory: "You asked me to draft talking points for the exec meeting",
      nextStep: "Send exec briefing before 3:30 call",
      canAct: true,
      workflow: "send-briefing",
    },
  ];

  // Think Layer Predictions - surfaced from pattern analysis across all context
  const thinkLayerInsights = [
    {
      id: 1,
      type: "prediction",
      thought: "Acme Corp contract expires in 14 days",
      because:
        "Based on: Salesforce renewal date + 2yr relationship history + expansion signals in meeting notes",
      confidence: 92,
      suggestion: "Schedule renewal call?",
      workflow: "schedule-meeting",
      priority: "high",
    },
    {
      id: 2,
      type: "pattern",
      thought: "You have 3 items that often slip to tomorrow",
      because:
        "Analyzed your task completion patterns over 30 days - budget reviews take 2.3x scheduled time",
      confidence: 87,
      suggestion: "Block focused time?",
      workflow: "block-calendar",
      priority: "medium",
    },
    {
      id: 3,
      type: "relationship",
      thought: "Sarah's been waiting 2 days on your feedback",
      because: "Detected from: 2 Slack pings + email follow-up + her blocked Asana task",
      confidence: 95,
      suggestion: "Quick reply now?",
      workflow: "draft-response",
      priority: "high",
    },
    {
      id: 4,
      type: "opportunity",
      thought: "TechStart mentioned 'expanding to Europe' in yesterday's call",
      because: "Extracted from meeting transcript - matches your growth playbook",
      confidence: 78,
      suggestion: "Add to expansion pipeline?",
      workflow: "update-opportunity",
      priority: "medium",
    },
  ];

  // Unified inbox - items from all connected tools with IQ Hub enrichment
  const unifiedInbox = [
    {
      id: 1,
      type: "email",
      source: "Gmail",
      title: "Re: Q1 Budget Approval",
      from: "Sarah Chen",
      time: "10 min ago",
      priority: "high",
      unread: true,
      context: "Part of budget planning thread you started last week",
      iqContext: "Connected to 4 other docs and your Jan 15 AI chat about forecasting",
    },
    {
      id: 2,
      type: "slack",
      source: "Slack",
      title: "Product team needs your input",
      from: "#product-launch",
      time: "25 min ago",
      priority: "medium",
      unread: true,
      context: "Related to the feature you demoed on Friday",
      iqContext: "Links to your product roadmap discussion from Jan 22",
    },
    {
      id: 3,
      type: "task",
      source: "Asana",
      title: "Review marketing assets",
      from: "Marketing Project",
      time: "1h ago",
      priority: "high",
      unread: false,
      context: "Maria shared 3 new designs",
      iqContext: "Part of Q1 launch - we discussed positioning last Tuesday",
    },
    {
      id: 4,
      type: "doc",
      source: "Notion",
      title: "Sprint planning doc updated",
      from: "Engineering",
      time: "2h ago",
      priority: "low",
      unread: false,
      context: "James added backend estimates",
      iqContext: "References the architecture we brainstormed Jan 20",
    },
    {
      id: 5,
      type: "crm",
      source: "Salesforce",
      title: "Acme Corp - Contract ready for review",
      from: "Deals",
      time: "3h ago",
      priority: "high",
      unread: true,
      context: "Legal approved, awaiting your sign-off",
      iqContext: "Full deal context: 8 emails, 3 meetings, 2 AI strategy sessions",
    },
  ];

  // My work - consolidated with Think layer intelligence
  const myWork = [
    {
      id: 1,
      title: "Finalize Q1 budget proposal",
      source: "Notion",
      dueDate: "Today, 2 PM",
      status: "in-progress",
      context: "Finance team waiting",
      thinkInsight:
        "You usually complete budget tasks in the morning - 40min remaining based on your pace",
      canAct: true,
    },
    {
      id: 2,
      title: "Customer call - TechStart Inc",
      source: "Calendar",
      dueDate: "Today, 3:30 PM",
      status: "upcoming",
      context: "Renewal discussion",
      thinkInsight: "Last call was positive - they mentioned expansion. I prepared talking points",
      canAct: true,
    },
    {
      id: 3,
      title: "Review pull request #142e20",
      source: "GitHub",
      dueDate: "Today, EOD",
      status: "pending",
      context: "Blocking release",
      thinkInsight: "Alex's work on the auth feature you spec'd - 15 min estimated review",
      canAct: false,
    },
    {
      id: 4,
      title: "Approve marketing spend",
      source: "Expensify",
      dueDate: "Tomorrow",
      status: "pending",
      context: "$12,500 campaign",
      thinkInsight: "Similar to Q4 campaign that returned 3.2x - CFO approved similar last month",
      canAct: true,
    },
  ];

  // Team activity with relationship context from IQ Hub
  const teamActivity = [
    {
      id: 1,
      user: "Alex Kim",
      avatar: "AK",
      action: "completed",
      item: "Product demo deck",
      time: "Just now",
      iqContext: "You assigned this Monday • Deck references your competitive analysis",
    },
    {
      id: 2,
      user: "Maria Garcia",
      avatar: "MG",
      action: "shared",
      item: "Customer feedback analysis",
      time: "15 min ago",
      iqContext: "For the launch you're leading • Builds on survey we discussed",
    },
    {
      id: 3,
      user: "James Wilson",
      avatar: "JW",
      action: "requested review on",
      item: "Pricing proposal",
      time: "1h ago",
      iqContext: "You discussed in standup • Uses the framework from your Jan 18 AI session",
    },
  ];

  // Business pulse - key metrics with Think layer trend analysis
  const businessPulse = [
    {
      label: "Pipeline",
      value: "$2.4M",
      change: "+12%",
      positive: true,
      source: "Salesforce",
      thinkInsight: "Best January in 3 years • 3 deals showing strong close signals",
    },
    {
      label: "Active Deals",
      value: "47",
      change: "+5",
      positive: true,
      source: "HubSpot",
      thinkInsight: "Acme, TechStart, GlobalCo likely to close this week",
    },
    {
      label: "Support Tickets",
      value: "23",
      change: "-8",
      positive: true,
      source: "Zendesk",
      thinkInsight: "Response time improved 20% since new workflow deployed",
    },
    {
      label: "Team Velocity",
      value: "94pts",
      change: "+12",
      positive: true,
      source: "Jira",
      thinkInsight: "Above sprint average • Room for 2 more stories",
    },
  ];

  // Recent AI Conversations - 30 day memory
  const recentAIContext = [
    {
      id: 1,
      date: "Jan 28",
      topic: "Acme pricing strategy",
      summary: "Discussed tiered pricing approach, decided on 15% uplift",
      actionsTaken: 2,
    },
    {
      id: 2,
      date: "Jan 25",
      topic: "Q1 launch messaging",
      summary: "Brainstormed 5 taglines, shortlisted 'Clarity in Motion'",
      actionsTaken: 1,
    },
    {
      id: 3,
      date: "Jan 22",
      topic: "Product roadmap prioritization",
      summary: "Ranked 12 features by impact/effort, auth moved to P0",
      actionsTaken: 3,
    },
    {
      id: 4,
      date: "Jan 18",
      topic: "Competitive analysis framework",
      summary: "Created scoring matrix, identified 3 key differentiators",
      actionsTaken: 1,
    },
  ];

  const handleEvidenceClick = (item: any) => {
    window.dispatchEvent(
      new CustomEvent("iw:evidence:open", {
        detail: { itemId: item?.id ?? null },
      })
    );
  };

  const handleActWorkflow = (workflow: string, context: any) => {
    // Trigger Act layer workflow
    window.dispatchEvent(
      new CustomEvent("iw:act:execute", {
        detail: { workflow, context },
      })
    );
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case "gmail":
        return <Mail className="w-3.5 h-3.5" />;
      case "slack":
        return <MessageSquare className="w-3.5 h-3.5" />;
      case "asana":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "notion":
        return <FileText className="w-3.5 h-3.5" />;
      case "salesforce":
      case "hubspot":
        return <Briefcase className="w-3.5 h-3.5" />;
      case "calendar":
        return <Calendar className="w-3.5 h-3.5" />;
      case "github":
        return <FileText className="w-3.5 h-3.5" />;
      default:
        return <Circle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Cognitive Twin Header - IQ Hub Status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Good afternoon, Nirmal</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            <span className="font-medium text-slate-900">3 items</span> need attention •
            <span className="text-slate-500"> Your focus time is usually after lunch</span>
          </p>
        </div>
        {/* IQ Hub Connection Status */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3 h-3 text-emerald-600" />
            <span className="text-emerald-700">{iqHubContext.sourcesConnected} sources</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100">
            <Brain className="w-3 h-3 text-slate-600" />
            <span className="text-slate-600">{iqHubContext.contextWindow} memory</span>
          </div>
          <span className="text-slate-400">Synced {iqHubContext.lastSync}</span>
        </div>
      </div>

      {/* Think Layer Insights - Predictions & Patterns from all context */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {thinkLayerInsights.map((insight) => (
          <button
            key={insight.id}
            onClick={() => handleEvidenceClick(insight)}
            className={`flex-shrink-0 flex items-start gap-2 px-3 py-2 rounded-lg text-left transition-all hover:shadow-sm group ${
              insight.priority === "high"
                ? "bg-amber-50 border border-amber-200 hover:bg-amber-100"
                : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="mt-0.5">
              {insight.type === "prediction" && (
                <TrendingUp
                  className={`w-3.5 h-3.5 ${insight.priority === "high" ? "text-amber-600" : "text-slate-500"}`}
                />
              )}
              {insight.type === "pattern" && (
                <Activity
                  className={`w-3.5 h-3.5 ${insight.priority === "high" ? "text-amber-600" : "text-slate-500"}`}
                />
              )}
              {insight.type === "relationship" && (
                <Users
                  className={`w-3.5 h-3.5 ${insight.priority === "high" ? "text-amber-600" : "text-slate-500"}`}
                />
              )}
              {insight.type === "opportunity" && (
                <Target
                  className={`w-3.5 h-3.5 ${insight.priority === "high" ? "text-amber-600" : "text-slate-500"}`}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-900">{insight.thought}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{insight.because}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-slate-400">{insight.confidence}% confidence</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActWorkflow(insight.workflow, insight);
                  }}
                  className="flex items-center gap-1 text-xs text-blue-600 font-medium px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Zap className="w-3 h-3" />
                  {insight.suggestion}
                </button>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Workspace */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Column 1 & 2: Your Work Stream */}
        <div className="lg:col-span-2 space-y-4">
          {/* Working Memory - Synthesized from IQ Hub */}
          <Card className="bg-gradient-to-r from-indigo-50/50 to-white border-indigo-200/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Where You Left Off
                  </CardTitle>
                  <Badge className="bg-indigo-100 text-indigo-700 text-xs border-0">IQ Hub</Badge>
                </div>
                <span className="text-xs text-slate-400">
                  {workingMemory.length} active contexts
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {workingMemory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-white border border-slate-200/60 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{item.context}</p>
                        <div className="flex items-center gap-1">
                          {item.sources.map((src, i) => (
                            <span
                              key={i}
                              className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
                            >
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{item.status}</p>
                    </div>
                    <span className="text-xs text-slate-400">{item.lastTouched}</span>
                  </div>

                  {/* Related items */}
                  <div className="flex items-center gap-2 mt-2">
                    <Link2 className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">{item.relatedItems.join(" • ")}</span>
                  </div>

                  {/* AI Memory - what we discussed */}
                  <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded bg-indigo-50/50 border border-indigo-100">
                    <MessageCircle className="w-3 h-3 text-indigo-500" />
                    <span className="text-xs text-indigo-700">{item.aiMemory}</span>
                  </div>

                  {/* Next step with Act workflow */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600">
                      <ArrowRight className="w-3 h-3" />
                      <span>{item.nextStep}</span>
                    </div>
                    {item.canAct && (
                      <button
                        onClick={() => handleActWorkflow(item.workflow, item)}
                        className="flex items-center gap-1 text-xs text-white font-medium px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Zap className="w-3 h-3" />
                        Execute
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Inbox with IQ Hub context */}
          <Card className="bg-white border-slate-200/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-slate-600" />
                  <CardTitle className="text-sm font-semibold text-slate-900">Inbox</CardTitle>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">3 new</Badge>
                </div>
                <button className="text-xs text-slate-500 hover:text-slate-700">View all</button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {unifiedInbox.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleEvidenceClick(item)}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors group ${
                    item.unread ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded ${
                      item.type === "email"
                        ? "bg-red-100 text-red-600"
                        : item.type === "slack"
                          ? "bg-purple-100 text-purple-600"
                          : item.type === "task"
                            ? "bg-green-100 text-green-600"
                            : item.type === "crm"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {getSourceIcon(item.source)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm truncate ${item.unread ? "font-medium text-slate-900" : "text-slate-700"}`}
                      >
                        {item.title}
                      </p>
                      {item.priority === "high" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{item.from}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                    {/* IQ Hub enriched context */}
                    <p className="text-xs text-slate-500 mt-1">↳ {item.context}</p>
                    <p className="text-xs text-indigo-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Brain className="w-3 h-3 inline mr-1" />
                      {item.iqContext}
                    </p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* My Work with Think Layer intelligence */}
          <Card className="bg-white border-slate-200/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-600" />
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Today's Work
                  </CardTitle>
                </div>
                <button className="text-xs text-slate-500 hover:text-slate-700">+ Add</button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {myWork.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <button className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors">
                    {item.status === "in-progress" ? (
                      <Clock className="w-4 h-4 text-amber-500" />
                    ) : item.status === "upcoming" ? (
                      <Calendar className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{item.dueDate}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{item.context}</span>
                    </div>
                    {/* Think layer insight */}
                    <p className="text-xs text-indigo-500 mt-1">
                      <Lightbulb className="w-3 h-3 inline mr-1" />
                      {item.thinkInsight}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs text-slate-500 border-slate-200 flex-shrink-0"
                    >
                      {item.source}
                    </Badge>
                    {item.canAct && (
                      <button
                        title="Execute workflow"
                        className="p-1 rounded hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Context, People & AI Memory */}
        <div className="space-y-4">
          {/* Business Pulse with Think Analysis */}
          <Card className="bg-white border-slate-200/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Business Pulse
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {businessPulse.map((metric, i) => (
                  <button
                    key={i}
                    onClick={() => handleEvidenceClick(metric)}
                    className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{metric.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-lg font-semibold text-slate-900">{metric.value}</span>
                      {metric.change && (
                        <span
                          className={`text-xs ${metric.positive ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {metric.change}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {metric.thinkInsight}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Activity with IQ Hub relationship context */}
          <Card className="bg-white border-slate-200/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <CardTitle className="text-sm font-semibold text-slate-900">Your Team</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {teamActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2.5 group">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-slate-200 text-slate-600">
                      {activity.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700">
                      <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                      <span className="font-medium">{activity.item}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                    {/* IQ Hub relationship context */}
                    <p className="text-xs text-indigo-500 mt-1">{activity.iqContext}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent AI Conversations - 30 day memory */}
          <Card className="bg-gradient-to-b from-indigo-50/50 to-white border-indigo-200/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-indigo-600" />
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Our Conversations
                  </CardTitle>
                </div>
                <span className="text-xs text-slate-400">30 day memory</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {recentAIContext.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleEvidenceClick(chat)}
                  className="w-full text-left p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-900">{chat.topic}</span>
                    <span className="text-xs text-slate-400">{chat.date}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{chat.summary}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">
                      {chat.actionsTaken} actions taken
                    </span>
                  </div>
                </button>
              ))}
              <button className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 py-2">
                View all conversations →
              </button>
            </CardContent>
          </Card>

          {/* Coming Up */}
          <Card className="bg-white border-slate-200/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                <CardTitle className="text-sm font-semibold text-slate-900">Coming Up</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 border border-blue-100">
                <Video className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-900">Sales Review</p>
                  <p className="text-xs text-slate-500">In 30 min • With your usual team</p>
                </div>
                <button className="text-xs text-blue-600 font-medium px-2 py-1 rounded hover:bg-blue-100">
                  Join
                </button>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 group">
                <Phone className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-900">TechStart Inc Call</p>
                  <p className="text-xs text-slate-500">3:30 PM • Renewal discussion</p>
                </div>
                <button
                  onClick={() => handleActWorkflow("prep-meeting", { meeting: "TechStart" })}
                  className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Zap className="w-3 h-3" />
                  Prep
                </button>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                <Users className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-900">Product Planning</p>
                  <p className="text-xs text-slate-500">4:30 PM • You lead this one</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Bar */}
      {selectedAction && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <ActionBar
            action={selectedAction}
            onApprove={() => setSelectedAction(null)}
            onReject={() => setSelectedAction(null)}
            onRun={() => {}}
          />
        </div>
      )}
    </div>
  );
}
