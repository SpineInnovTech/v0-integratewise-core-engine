import { useState } from "react";
import { Link } from "react-router";
import {
  CheckCircle2,
  Clock3,
  Calendar,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
  Edit2,
  Sparkles,
  BookOpen,
  Bookmark,
  Radio,
  Mic,
} from "lucide-react";
import { PageHeader } from "@/components/l2/spine/page-header";
import { Card } from "@/components/common/layouts/page-layouts";
import { cn } from "@/lib/utils";

interface WorkPriority {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface CalendarItem {
  id: string;
  time: string;
  title: string;
  duration: string;
  platform: string;
}

interface TaskItem {
  id: string;
  title: string;
  status: string;
  category: string;
}

interface ApprovalItem {
  id: string;
  title: string;
  source: string;
  confidence: number;
  evidence: string[];
}

interface ActiveEntity {
  id: string;
  name: string;
  type: string;
  metric: string;
  status: "at-risk" | "healthy" | "warning";
}

interface LearningItem {
  id: string;
  title: string;
  source: string;
  relevance: string;
}

export function WorkPage() {
  const [priorities, setPriorities] = useState<WorkPriority[]>([
    {
      id: "p1",
      title: "Review GlobalRetail renewal readiness packet",
      dueDate: "Today",
      completed: false,
    },
    {
      id: "p2",
      title: "Address MuleSoft capability gap escalation",
      dueDate: "Today",
      completed: false,
    },
    {
      id: "p3",
      title: "Approve HubSpot outbound sequence task update",
      dueDate: "Today",
      completed: false,
    },
    {
      id: "p4",
      title: "Prepare OKR Q2 board review document",
      dueDate: "Tomorrow",
      completed: false,
    },
  ]);

  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    {
      id: "app1",
      title: "Create Executive Sponsor Intervention Task for GlobalRetail",
      source: "HubSpot",
      confidence: 0.87,
      evidence: [
        "Champion engagement down 23% in last 14 days",
        "Renewal in 43 days ($2.4M ARR at risk)",
        "Unresolved level-2 escalation open for 3 days",
      ],
    },
    {
      id: "app2",
      title: "Publish Promoted Learning: 'MuleSoft integration pattern for Salesforce Core'",
      source: "Slack Sync",
      confidence: 0.92,
      evidence: [
        "Successfully resolved 3 similar tickets in past week",
        "Marked as 'doctrine-candidate' by account lead",
        "Zero schema conflicts detected in memory registry",
      ],
    },
  ]);

  const meetings: CalendarItem[] = [
    {
      id: "m1",
      time: "10:00 AM",
      title: "GlobalRetail Alignment & QBR Prep",
      duration: "45 min",
      platform: "Zoom",
    },
    {
      id: "m2",
      time: "1:30 PM",
      title: "Product Sync: Spine normalizer v3.1",
      duration: "30 min",
      platform: "Teams",
    },
    {
      id: "m3",
      time: "3:00 PM",
      title: "Weekly Forecast & Pipeline Review",
      duration: "60 min",
      platform: "Slack Huddle",
    },
  ];

  const tasks: TaskItem[] = [
    {
      id: "t1",
      title: "Follow up with Sarah K on GlobalRetail CSAT survey",
      status: "Overdue",
      category: "Account Success",
    },
    {
      id: "t2",
      title: "Review Stripe billing webhook payload mismatch",
      status: "Pending",
      category: "IT Admin",
    },
    {
      id: "t3",
      title: "Approve Q2 sales quota adjustments",
      status: "In Progress",
      category: "RevOps",
    },
  ];

  const activeEntities: ActiveEntity[] = [
    {
      id: "e1",
      name: "GlobalRetail",
      type: "Account",
      metric: "$2.4M ARR · Health: 61% ↓",
      status: "at-risk",
    },
    {
      id: "e2",
      name: "TechFlow Systems",
      type: "Account",
      metric: "$450K ARR · Health: 89% ↑",
      status: "healthy",
    },
    {
      id: "e3",
      name: "Acme Corp Renewal",
      type: "Deal",
      metric: "$1.2M value · Stage: Negotiate",
      status: "warning",
    },
  ];

  const learnings: LearningItem[] = [
    {
      id: "l1",
      title: "Executive Champion turnover is a leading churn indicator",
      source: "Account Success Doctrine",
      relevance: "High",
    },
    {
      id: "l2",
      title: "Nango webhook payload rotation patterns",
      source: "Ops Sync Notes",
      relevance: "Medium",
    },
  ];

  const [twinReasoning, setTwinReasoning] = useState<string[]>([]);
  const [isTwinThinking, setIsTwinThinking] = useState(false);
  const [twinInput, setTwinInput] = useState("");
  const [voiceActive, setVoiceActive] = useState(false);

  const togglePriority = (id: string) => {
    setPriorities(priorities.map((p) => (p.id === id ? { ...p, completed: !p.completed } : p)));
  };

  const handleAction = (id: string, action: "approve" | "reject") => {
    setApprovals(approvals.filter((a) => a.id !== id));
  };

  const triggerTwinReason = () => {
    if (!twinInput.trim()) return;
    setIsTwinThinking(true);
    setTwinReasoning([]);
    const steps = [
      "Continuity Bridge: Loading context for Nirmal's query...",
      "Spine Search: Querying active accounts, signals, and governance logs...",
      "Reasoning: Found GlobalRetail renewal at risk ($2.4M ARR). Analyzing champion sentiment...",
      "Proposing: Generate personalized outreach email template & trigger executive sponsor checklist.",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setTwinReasoning((prev) => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsTwinThinking(false);
      }
    }, 900);
    setTwinInput("");
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Greeting Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Unified Daily Operating View
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Good Morning, Nirmal
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Today:{" "}
            <span className="font-semibold text-foreground">
              {priorities.filter((p) => !p.completed).length} priorities
            </span>{" "}
            ·{" "}
            <span className="font-semibold text-foreground">
              {approvals.length} approvals pending
            </span>{" "}
            · <span className="font-semibold text-foreground">{meetings.length} meetings</span> ·{" "}
            <span className="font-semibold text-iw-gold dark:text-iw-gold-light">
              1 critical risk
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-iw-forest/10 px-2.5 py-1 text-xs font-semibold text-iw-forest-bright dark:text-iw-forest-bright">
            <Radio className="size-3.5 animate-pulse" />
            Spine Hydrated
          </span>
          <span className="text-xs text-muted-foreground">Updated 2m ago</span>
        </div>
      </div>

      {/* Main Grid: MY DAY, MY WORK, GOVERNANCE */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: MY DAY */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-foreground mb-4 text-sm">My Day</h3>
            <div className="space-y-5">
              {/* Priorities Sub-section */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Priorities
                </p>
                <div className="space-y-2">
                  {priorities.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => togglePriority(p.id)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-md border border-border bg-background/50 p-2.5 transition-all hover:border-primary cursor-pointer",
                        p.completed && "opacity-60 bg-muted/10"
                      )}
                    >
                      <button
                        className={cn(
                          "mt-0.5 flex size-4 items-center justify-center rounded-xs border transition-colors",
                          p.completed
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary"
                        )}
                      >
                        {p.completed && <Check className="size-3 stroke-[3]" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-[12.5px] font-medium leading-tight text-foreground",
                            p.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {p.title}
                        </p>
                        <span className="mt-1 inline-block text-[10px] text-muted-foreground font-medium">
                          {p.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meetings Sub-section */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Meetings
                </p>
                <div className="space-y-2">
                  {meetings.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-border bg-background/30 p-2.5 hover:border-primary/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-semibold text-foreground leading-snug truncate">
                          {m.title}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Clock3 className="size-3" />
                          {m.time} ({m.duration})
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9.5px] font-bold text-muted-foreground uppercase tracking-wide">
                        {m.platform}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Column 2: MY WORK */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-foreground mb-4 text-sm">My Work</h3>
            <div className="space-y-5">
              {/* Active Accounts & Deals */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Active Projections
                </p>
                <div className="space-y-2">
                  {activeEntities.map((e) => (
                    <Link
                      key={e.id}
                      to={
                        e.type === "Account" && e.name === "GlobalRetail"
                          ? "/app/work/accounts"
                          : "/app/work"
                      }
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/50 p-2.5 transition-all hover:border-primary hover:shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12.5px] font-semibold text-foreground truncate">
                            {e.name}
                          </span>
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground/80">
                            {e.type}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                          {e.metric}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            e.status === "healthy" && "bg-iw-forest-bright",
                            e.status === "warning" && "bg-iw-gold",
                            e.status === "at-risk" && "bg-iw-red"
                          )}
                        />
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Backlog Tasks */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                  Assigned Tasks
                </p>
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-md border border-border bg-background/30 p-2.5 flex items-center justify-between gap-3 hover:border-primary/30 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-medium text-foreground truncate">
                          {t.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          {t.category}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
                          t.status === "Overdue"
                            ? "bg-iw-red/10 text-iw-red dark:text-iw-red"
                            : t.status === "In Progress"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Column 3: GOVERNANCE & APPROVALS */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-foreground mb-4 text-sm">Governance Center</h3>
            <div className="space-y-4">
              <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                Review and approve system-generated operations before they are dispatched to
                external APIs.
              </p>
              <div className="space-y-3">
                {approvals.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-md border border-border bg-background p-3.5 shadow-xs space-y-3.5 hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {a.source} Target
                        </span>
                        <span className="text-[11px] font-semibold text-iw-forest-bright dark:text-iw-forest-bright">
                          {(a.confidence * 100).toFixed(0)}% Conf
                        </span>
                      </div>
                      <h4 className="mt-2 text-[13px] font-semibold text-foreground leading-tight">
                        {a.title}
                      </h4>
                    </div>

                    <div className="rounded bg-muted/40 p-2.5 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Evidence Base
                      </p>
                      <ul className="space-y-1">
                        {a.evidence.map((ev, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-muted-foreground flex items-start gap-1"
                          >
                            <span className="text-primary font-semibold select-none">•</span>
                            <span className="truncate">{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleAction(a.id, "approve")}
                        className="flex-1 rounded-sm bg-iw-forest-bright px-3 py-1.5 text-center text-xs font-semibold text-iw-paper hover:bg-iw-forest-mid transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="size-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(a.id, "reject")}
                        className="rounded-sm border border-border bg-background px-3 py-1.5 text-center text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                        aria-label="Reject proposal"
                      >
                        <X className="size-3.5" />
                      </button>
                      <button
                        className="rounded-sm border border-border bg-background px-3 py-1.5 text-center text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                        aria-label="Edit proposal details"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {approvals.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-border rounded-md bg-muted/5">
                    <CheckCircle2 className="size-6 text-iw-forest-bright mx-auto" />
                    <p className="mt-2 text-xs font-semibold text-foreground">
                      All pending approvals resolved
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Spine loop is clear</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Section: MEMORY + CONTEXT */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <BookOpen className="size-4 text-primary" />
          <h3 className="text-[13.5px] font-bold uppercase tracking-wider text-foreground">
            Memory & Context Layer
          </h3>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {learnings.map((l) => (
            <div
              key={l.id}
              className="rounded-md border border-border bg-background/50 p-3.5 flex items-start gap-3 hover:border-primary/40 transition-colors"
            >
              <Bookmark className="size-4.5 text-muted-foreground/60 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="text-[12.5px] font-semibold text-foreground leading-snug">
                  {l.title}
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10.5px]">
                  <span className="font-semibold text-muted-foreground">Source: {l.source}</span>
                  <span className="h-2.5 w-px bg-border" />
                  <span className="rounded bg-primary/10 px-1 py-0.5 font-bold text-primary uppercase tracking-wider">
                    Relevance: {l.relevance}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* L3 Twin Surface (Inline Reasoning Stream) */}
      <div className="rounded-md border border-primary/35 bg-gradient-to-br from-background via-primary/[0.02] to-background p-6 shadow-xs relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -right-24 -top-24 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4.5 text-primary animate-pulse" />
            <h3 className="text-[14px] font-bold uppercase tracking-wider text-foreground">
              L3 Twin Orchestrator
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Voice toggle */}
            <button
              onClick={() => setVoiceActive(!voiceActive)}
              className={cn(
                "rounded-full p-2 transition-all flex items-center justify-center",
                voiceActive
                  ? "bg-iw-red/20 text-iw-red animate-pulse"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
              title="Toggle Voice Input"
            >
              <Mic className="size-4" />
            </button>
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary uppercase tracking-wider">
              Grok 4.3 Active
            </span>
          </div>
        </div>

        {/* Input box */}
        <div className="flex items-center gap-2 border border-border rounded-sm bg-background p-2 focus-within:border-primary">
          <input
            type="text"
            placeholder="Instruct Twin (e.g. 'Review GlobalRetail dunning sequence' or 'Propose update...')"
            value={twinInput}
            onChange={(e) => setTwinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && triggerTwinReason()}
            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground outline-none"
          />
          <button
            onClick={triggerTwinReason}
            className="rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Send Instruction
          </button>
        </div>

        {/* Streaming reasoning boxes */}
        {(isTwinThinking || twinReasoning.length > 0) && (
          <div className="mt-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Inline Reasoning Stream
            </p>
            <div className="rounded border border-border bg-muted/45 p-4 space-y-2.5 font-mono text-[11.5px] leading-relaxed">
              {twinReasoning.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-foreground/95 animate-in fade-in duration-300"
                >
                  <span className="text-primary select-none">&gt;</span>
                  <span>{step}</span>
                </div>
              ))}
              {isTwinThinking && (
                <div className="flex items-center gap-1.5 text-primary animate-pulse">
                  <span>&gt; Thinking...</span>
                  <span className="size-1 bg-primary rounded-full animate-bounce" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkPage;
