import { useState } from "react";
import {
  Brain, Zap, Eye, Clock, CheckCircle2, Circle, ArrowRight,
  Database, Layers, Activity, RefreshCw, Shield, ChevronRight,
  Sparkles, TrendingUp, MessageSquare, FileCheck, AlertCircle,
  Bot, MemoryStick, Network, Cpu, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

type MemoryKind = "org" | "ai" | "personal";

interface WatchItem {
  id: string;
  label: string;
  detail: string;
  status: "active" | "idle" | "alert";
}

interface AgendaItem {
  id: string;
  task: string;
  progress: number;
  status: "running" | "pending" | "done" | "blocked";
  eta?: string;
}

interface MemoryAtom {
  id: string;
  kind: MemoryKind;
  label: string;
  count: number;
  lastUpdated: string;
}

const WATCH_ITEMS: WatchItem[] = [
  { id: "w1", label: "Pipeline schema drift", detail: "3 deals with stale entity context", status: "alert" },
  { id: "w2", label: "Spine entity freshness", detail: "Checking 47 entities — 45 fresh", status: "active" },
  { id: "w3", label: "Memory consolidation", detail: "8 atoms pending triage review", status: "active" },
  { id: "w4", label: "Tool connectivity", detail: "Gmail · Linear · Notion connected", status: "active" },
  { id: "w5", label: "Schema AI synthesis", detail: "No new connector payloads", status: "idle" },
];

const AGENDA: AgendaItem[] = [
  { id: "a1", task: "Memory triage — consolidate last 24h signals", progress: 65, status: "running", eta: "~4 min" },
  { id: "a2", task: "Pipeline review — flag stale deals", progress: 100, status: "done" },
  { id: "a3", task: "Draft outreach for Acme & Meridian (awaiting approval)", progress: 100, status: "blocked" },
  { id: "a4", task: "Schema drift check — CS entities", progress: 0, status: "pending", eta: "After triage" },
  { id: "a5", task: "Weekly pipeline health digest", progress: 20, status: "running", eta: "~12 min" },
  { id: "a6", task: "Review governance queue (3 items)", progress: 0, status: "pending" },
];

const MEMORY: MemoryAtom[] = [
  { id: "m1", kind: "org", label: "Org Memory", count: 342, lastUpdated: "2 min ago" },
  { id: "m2", kind: "ai", label: "AI Working Memory", count: 28, lastUpdated: "Now" },
  { id: "m3", kind: "personal", label: "Your Work Memory", count: 84, lastUpdated: "14 min ago" },
  { id: "m4", kind: "personal", label: "Your Personal Memory", count: 31, lastUpdated: "1 hr ago" },
];

function StatusDot({ status }: { status: "active" | "idle" | "alert" | "running" | "pending" | "done" | "blocked" }) {
  const styles: Record<string, string> = {
    active: "bg-green-500 animate-pulse",
    running: "bg-blue-500 animate-pulse",
    alert: "bg-amber-500 animate-pulse",
    idle: "bg-muted-foreground/40",
    pending: "bg-muted-foreground/40",
    done: "bg-green-500",
    blocked: "bg-amber-500",
  };
  return <span className={cn("h-2 w-2 rounded-full flex-shrink-0", styles[status])} />;
}

function AgendaStatusIcon({ status }: { status: AgendaItem["status"] }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "blocked") return <AlertCircle className="h-4 w-4 text-amber-500" />;
  if (status === "running") return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" style={{ animationDuration: "2s" }} />;
  return <Circle className="h-4 w-4 text-muted-foreground/40" />;
}

function MemoryKindBadge({ kind }: { kind: MemoryKind }) {
  const map: Record<MemoryKind, { label: string; style: string }> = {
    org: { label: "ORG", style: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
    ai: { label: "AI", style: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    personal: { label: "MINE", style: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  };
  const m = map[kind];
  return (
    <span className={cn("text-[9px] font-black uppercase tracking-widest rounded px-1.5 py-0.5", m.style)}>
      {m.label}
    </span>
  );
}

export function AIHome() {
  const [section, setSection] = useState<"agenda" | "watch" | "memory">("agenda");

  const runningCount = AGENDA.filter((a) => a.status === "running").length;
  const blockedCount = AGENDA.filter((a) => a.status === "blocked").length;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* AI Status Header */}
      <div className="flex-shrink-0 border-b border-border/40 bg-gradient-to-r from-blue-50/60 to-background dark:from-blue-950/20 dark:to-background px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-md" style={{ background: "var(--iw-blue)" }}>
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">AI at Work</h2>
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white" style={{ background: "var(--iw-blue)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                {runningCount} Running
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              AI is running {runningCount} background task{runningCount !== 1 ? "s" : ""} and monitoring your workspace.
              {blockedCount > 0 && (
                <span className="ml-1 font-semibold text-amber-600 dark:text-amber-400">
                  {blockedCount} item{blockedCount !== 1 ? "s" : ""} awaiting your approval.
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Active since</p>
              <p className="text-sm font-semibold text-foreground">8:02 AM</p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { icon: Activity, label: "Running", value: runningCount.toString(), color: "text-blue-600" },
            { icon: CheckCircle2, label: "Done today", value: AGENDA.filter(a => a.status === "done").length.toString(), color: "text-green-600" },
            { icon: AlertCircle, label: "Need you", value: blockedCount.toString(), color: "text-amber-600" },
            { icon: Eye, label: "Watching", value: WATCH_ITEMS.filter(w => w.status === "active").length.toString(), color: "text-purple-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-center">
              <Icon className={cn("h-4 w-4 mx-auto mb-1", color)} />
              <p className="text-lg font-bold text-foreground leading-none">{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex-shrink-0 flex border-b border-border/40 px-6 gap-6">
        {([
          ["agenda", Calendar, "Daily Agenda"],
          ["watch", Eye, "Active Watch"],
          ["memory", Brain, "Memory"],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={cn(
              "flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors",
              section === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="flex-1 overflow-y-auto">
        {section === "agenda" && (
          <div className="px-6 py-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
              AI's tasks for today — {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </p>
            {AGENDA.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group rounded-xl border px-4 py-3.5 transition-colors",
                  item.status === "blocked"
                    ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                    : "border-border/60 bg-secondary/20 hover:bg-secondary/40",
                )}
              >
                <div className="flex items-center gap-3">
                  <AgendaStatusIcon status={item.status} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium leading-snug", item.status === "done" ? "text-muted-foreground line-through" : "text-foreground")}>
                      {item.task}
                    </p>
                    {item.status === "running" && item.progress < 100 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">{item.progress}%</span>
                      </div>
                    )}
                    {item.eta && item.status !== "done" && (
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.eta}
                      </p>
                    )}
                    {item.status === "blocked" && (
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 uppercase tracking-wider">
                        Awaiting your approval — no action taken
                      </p>
                    )}
                  </div>
                  {item.status === "blocked" && (
                    <button className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90" style={{ background: "var(--iw-blue)" }}>
                      Review <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {section === "watch" && (
          <div className="px-6 py-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
              What AI is monitoring right now
            </p>
            {WATCH_ITEMS.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3.5",
                  item.status === "alert"
                    ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                    : "border-border/60 bg-secondary/20",
                )}
              >
                <StatusDot status={item.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
                {item.status === "alert" && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex-shrink-0">
                    Alert
                  </span>
                )}
              </div>
            ))}

            {/* Spine status */}
            <div className="mt-6 rounded-xl border border-border/60 bg-secondary/10 px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Network className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Spine / Continuity</p>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Healthy
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  ["Entities", "47"],
                  ["Schemas", "8"],
                  ["Tools", "3"],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-background border border-border/40 py-2">
                    <p className="text-base font-bold text-foreground">{v}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === "memory" && (
          <div className="px-6 py-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Memory boundaries — each zone is independently governed
            </p>

            {MEMORY.map((m) => (
              <div key={m.id} className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background flex-shrink-0">
                  {m.kind === "org" ? <Shield className="h-5 w-5 text-purple-600" /> :
                   m.kind === "ai" ? <Brain className="h-5 w-5 text-blue-600" /> :
                   <MemoryStick className="h-5 w-5 text-emerald-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                    <MemoryKindBadge kind={m.kind} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{m.count}</span> atoms · Updated {m.lastUpdated}
                  </p>
                </div>
                {m.kind === "ai" && (
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex-shrink-0">Working</span>
                )}
                {m.kind === "org" && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex-shrink-0">
                    <Shield className="h-3 w-3" /> Governed
                  </div>
                )}
              </div>
            ))}

            {/* Boundary doctrine */}
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-secondary/30 to-background p-4 mt-4">
              <p className="text-xs font-bold text-foreground mb-2">Memory Boundaries</p>
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <p><span className="font-bold text-foreground">Org Memory</span> — shared, governed. Every write goes through Triage Bot. No direct mutations.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Brain className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p><span className="font-bold text-foreground">AI Memory</span> — AI's working context. Resets each session unless promoted to Org Memory.</p>
                </div>
                <div className="flex items-start gap-2">
                  <MemoryStick className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p><span className="font-bold text-foreground">Your Memory</span> — your work and personal context. Never shared with AI without your explicit grant.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
