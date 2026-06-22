/**
 * Twin Bench — Human-AI Task Collaboration Layer
 *
 * This is NOT a chat interface.
 * This is a Kanban board where:
 *   - Humans assign tasks to Twin
 *   - Twin works on the task and posts structured updates to the card
 *   - Twin raises doubts on the card — human responds on the card
 *   - After completion: task is updated, memory committed, outcome logged
 *
 * The task card IS the collaboration surface.
 * Twin posts TO the card. Human acts ON the card.
 *
 * Columns:
 *   Backlog → In Progress → With Twin → Needs Input → Done
 *
 * CSS: uses var(--iw-*) tokens from globals.css
 */

import { useState } from "react";
import {
  Plus, Sparkles, User, Clock, CheckCircle2, MessageSquare,
  AlertTriangle, ArrowRight, Brain, ChevronRight, X,
  ThumbsUp, RefreshCw, Zap, Tag, Calendar, MoreHorizontal,
  Play, Pause, Check
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Column = "backlog" | "inprogress" | "withtwin" | "needsinput" | "done";
type Priority = "critical" | "high" | "medium" | "low";
type Assignee = "human" | "twin" | "both";

interface ThreadEntry {
  id: string;
  from: "human" | "twin";
  type: "update" | "doubt" | "response" | "completion" | "memory";
  content: string;
  timestamp: string;
  action?: { label: string; type: "approve" | "reject" | "respond" | "assign" };
}

interface Task {
  id: string;
  title: string;
  description: string;
  column: Column;
  priority: Priority;
  assignee: Assignee;
  context: string;          // e.g. "FinanceFlow · Renewal"
  tags: string[];
  due?: string;
  thread: ThreadEntry[];
  memoryCommitted?: boolean;
  outcome?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    title: "FinanceFlow recovery sequence",
    description: "Draft and execute the 48h recovery plan for FinanceFlow. Champion silent, P1 open, renewal in 29 days.",
    column: "withtwin",
    priority: "critical",
    assignee: "twin",
    context: "FinanceFlow · Renewal · CS",
    tags: ["renewal", "cs", "critical"],
    due: "Today",
    thread: [
      { id: "e1", from: "human", type: "update", content: "Twin — take this. FinanceFlow is at risk. 29 days to renewal, champion silent 12 days, 3 P1s open. Draft the full recovery sequence and propose each step for my approval.", timestamp: "10:42 AM" },
      { id: "e2", from: "twin", type: "update", content: "Understood. Reading FinanceFlow's Spine record now — engagement log, ticket history, payment signals.\n\nI've identified 4 actions for the next 48h. Drafting the sequence now. ETA: 2 minutes.", timestamp: "10:42 AM" },
      { id: "e3", from: "twin", type: "doubt", content: "Before I draft the EBR invite — should I frame it around Q3 roadmap alignment or specifically around the P1 resolution? The account history suggests Ajay responds better to product framing.", timestamp: "10:43 AM", action: { label: "Answer Twin's doubt", type: "respond" } },
    ],
  },
  {
    id: "t2",
    title: "Q3 pipeline coverage gap analysis",
    description: "Coverage is at 3.1x vs 4x target. Identify which deals to accelerate and draft outreach.",
    column: "inprogress",
    priority: "high",
    assignee: "both",
    context: "Sales Pipeline · Q3",
    tags: ["pipeline", "q3", "sales"],
    due: "Tomorrow",
    thread: [
      { id: "e1", from: "human", type: "update", content: "Need this before the 3pm review. Identify the 3 deals most worth saving and draft talking points for each.", timestamp: "09:00 AM" },
      { id: "e2", from: "twin", type: "update", content: "Analysing pipeline now. Pulling stage data, last activity, champion engagement from Spine.", timestamp: "09:01 AM" },
      { id: "e3", from: "twin", type: "completion", content: "Done. Identified 3 deals:\n1. NovaTech APAC — $180K ACV, champion active, needs legal sign-off\n2. RetailNest — $95K, stalled at procurement, needs exec touch\n3. Acme Corp — $120K, demo scheduled, needs follow-up\n\nTalking points drafted for each. Ready for your review.", timestamp: "09:04 AM", action: { label: "Review & approve", type: "approve" } },
    ],
  },
  {
    id: "t3",
    title: "HubSpot schema drift — Jira v1.1.0 review",
    description: "Schema AI proposed Jira connector v1.1.0 with 2 new fields. Review and approve or reject.",
    column: "needsinput",
    priority: "medium",
    assignee: "human",
    context: "Schema AI · Ingress",
    tags: ["schema", "jira", "governance"],
    thread: [
      { id: "e1", from: "twin", type: "update", content: "Schema AI detected 2 new fields in the Jira connector upstream: `issue_priority_v2` and `reporter_team`. I've proposed schema v1.1.0 with these additions.\n\nConfidence: 88%. No PII fields detected. Impact: low.\n\nReady for your approval before activation.", timestamp: "08:15 AM", action: { label: "Approve schema", type: "approve" } },
    ],
  },
  {
    id: "t4",
    title: "Meeting debrief — TechServe Asia QBR",
    description: "Extract action items from yesterday's QBR, create Jira tasks, log key decisions to memory.",
    column: "done",
    priority: "medium",
    assignee: "twin",
    context: "TechServe Asia · QBR · CS",
    tags: ["qbr", "meeting", "cs"],
    memoryCommitted: true,
    outcome: "4 action items created in Jira. 2 decisions logged to org memory. Next QBR scheduled for Aug 15.",
    thread: [
      { id: "e1", from: "human", type: "update", content: "Twin — debrief yesterday's QBR. Meeting notes in Notion.", timestamp: "Yesterday 9:00 AM" },
      { id: "e2", from: "twin", type: "completion", content: "Completed.\n- 4 action items created in Jira (assigned to 3 team members)\n- 2 key decisions promoted to org memory\n- Next QBR scheduled Aug 15\n- Health score updated: 78 → 82 (feature adoption improving)", timestamp: "Yesterday 9:08 AM" },
      { id: "e3", from: "twin", type: "memory", content: "Memory committed: TechServe Asia QBR outcome — adoption improving, roadmap alignment strong, no renewal risk.", timestamp: "Yesterday 9:08 AM" },
    ],
  },
  {
    id: "t5",
    title: "Draft renewal risk report — APAC Q3",
    description: "Compile the Q3 renewal risk report for all APAC accounts for the board presentation.",
    column: "backlog",
    priority: "high",
    assignee: "twin",
    context: "APAC · Renewal · Analytics",
    tags: ["renewal", "apac", "report"],
    due: "Friday",
    thread: [],
  },
  {
    id: "t6",
    title: "Review Stripe payment failure — FinanceFlow",
    description: "Two failed Stripe payments. Determine if billing bug or customer issue. Draft resolution.",
    column: "backlog",
    priority: "critical",
    assignee: "both",
    context: "FinanceFlow · Finance",
    tags: ["billing", "stripe", "critical"],
    due: "Today",
    thread: [],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const COLUMNS: { id: Column; label: string; description: string; color: string }[] = [
  { id: "backlog",     label: "Backlog",      description: "Assigned, not started",         color: "var(--muted-foreground)" },
  { id: "inprogress",  label: "In Progress",  description: "Human working",                  color: "var(--iw-blue)" },
  { id: "withtwin",    label: "With Twin",    description: "Twin is working",                color: "var(--iw-purple)" },
  { id: "needsinput",  label: "Needs Input",  description: "Twin waiting for you",           color: "var(--iw-warning)" },
  { id: "done",        label: "Done",         description: "Completed · memory committed",   color: "var(--iw-success)" },
];

const PRIORITY_CONFIG: Record<Priority, { color: string; dot: string; label: string }> = {
  critical: { color: "var(--iw-danger)",      dot: "var(--iw-danger)",      label: "Critical" },
  high:     { color: "var(--iw-warning)",     dot: "var(--iw-warning)",     label: "High" },
  medium:   { color: "var(--iw-blue)",        dot: "var(--iw-blue)",        label: "Medium" },
  low:      { color: "var(--muted-foreground)", dot: "var(--muted-foreground)", label: "Low" },
};

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onClick, onAssignToTwin }: {
  task: Task;
  onClick: () => void;
  onAssignToTwin: (id: string) => void;
}) {
  const pc = PRIORITY_CONFIG[task.priority];
  const hasPendingDoubt = task.thread.some(e => e.from === "twin" && e.type === "doubt" && e.action);
  const latestEntry = task.thread[task.thread.length - 1];

  return (
    <div
      onClick={onClick}
      className="rounded-xl border cursor-pointer transition-all group"
      style={{
        background: "var(--card)",
        borderColor: hasPendingDoubt ? "var(--iw-warning)" : task.column === "withtwin" ? "rgba(123,94,167,0.25)" : "var(--border)",
        boxShadow: hasPendingDoubt ? "0 0 0 2px rgba(212,136,62,0.15)" : "none",
      }}>
      <div className="p-3">
        {/* Priority + column badge */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pc.dot }} />
          <span className="text-[9px] font-bold uppercase" style={{ color: pc.color }}>{pc.label}</span>
          {task.assignee === "twin" && (
            <div className="flex items-center gap-0.5 ml-auto">
              <Sparkles className="w-3 h-3" style={{ color: "var(--iw-purple)" }} />
              <span className="text-[9px] font-bold" style={{ color: "var(--iw-purple)" }}>Twin</span>
            </div>
          )}
          {task.assignee === "both" && (
            <div className="flex items-center gap-0.5 ml-auto">
              <Users2 className="w-3 h-3" style={{ color: "var(--iw-blue)" }} />
              <span className="text-[9px] font-bold" style={{ color: "var(--iw-blue)" }}>Collab</span>
            </div>
          )}
        </div>

        <p className="text-xs mb-1" style={{ fontWeight: 600, color: "var(--foreground)" }}>{task.title}</p>
        <p className="text-[10px] line-clamp-2 mb-2" style={{ color: "var(--muted-foreground)" }}>{task.description}</p>

        {/* Context + tags */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          <span className="text-[8px] px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
            {task.context}
          </span>
        </div>

        {/* Latest thread entry */}
        {latestEntry && (
          <div className="px-2.5 py-2 rounded-lg" style={{ background: hasPendingDoubt ? "rgba(212,136,62,0.06)" : "var(--secondary)" }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              {latestEntry.from === "twin"
                ? <Sparkles className="w-2.5 h-2.5 shrink-0" style={{ color: "var(--iw-purple)" }} />
                : <User className="w-2.5 h-2.5 shrink-0" style={{ color: "var(--iw-blue)" }} />}
              <span className="text-[9px] font-bold" style={{ color: latestEntry.from === "twin" ? "var(--iw-purple)" : "var(--iw-blue)" }}>
                {latestEntry.from === "twin" ? "Twin" : "You"}
              </span>
              {latestEntry.type === "doubt" && (
                <span className="text-[8px] px-1 py-0.5 rounded font-bold ml-auto" style={{ background: "rgba(212,136,62,0.12)", color: "var(--iw-warning)" }}>
                  Doubt raised
                </span>
              )}
            </div>
            <p className="text-[9px] line-clamp-2" style={{ color: "var(--foreground)" }}>
              {latestEntry.content.split("\n")[0]}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {task.due && (
              <span className="flex items-center gap-1 text-[9px]" style={{ color: task.due === "Today" ? "var(--iw-danger)" : "var(--muted-foreground)", fontWeight: task.due === "Today" ? 700 : 400 }}>
                <Clock className="w-2.5 h-2.5" /> {task.due}
              </span>
            )}
            {task.memoryCommitted && (
              <span className="flex items-center gap-1 text-[9px]" style={{ color: "var(--iw-success)", fontWeight: 600 }}>
                <Brain className="w-2.5 h-2.5" /> Memory
              </span>
            )}
          </div>
          <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>
            {task.thread.length} {task.thread.length === 1 ? "update" : "updates"}
          </span>
        </div>

        {/* Assign to Twin CTA — only for backlog without Twin */}
        {task.column === "backlog" && task.assignee !== "twin" && (
          <button onClick={e => { e.stopPropagation(); onAssignToTwin(task.id); }}
            className="w-full mt-2 py-1.5 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1.5"
            style={{ background: "rgba(123,94,167,0.08)", border: "1px solid rgba(123,94,167,0.2)", color: "var(--iw-purple)", fontWeight: 600 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(123,94,167,0.14)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(123,94,167,0.08)"; }}>
            <Sparkles className="w-3 h-3" /> Assign to Twin
          </button>
        )}
      </div>
    </div>
  );
}

// Missing import
import { Users as Users2 } from "lucide-react";

// ─── Task Detail Panel ────────────────────────────────────────────────────────

function TaskDetail({ task, onClose, onAction, onReply }: {
  task: Task;
  onClose: () => void;
  onAction: (taskId: string, action: string) => void;
  onReply: (taskId: string, content: string) => void;
}) {
  const [reply, setReply] = useState("");
  const pc = PRIORITY_CONFIG[task.priority];

  const threadColors = {
    human: { bg: "rgba(66,86,171,0.06)", border: "rgba(66,86,171,0.2)", icon: "var(--iw-blue)", name: "You" },
    twin:  { bg: "rgba(123,94,167,0.06)", border: "rgba(123,94,167,0.2)", icon: "var(--iw-purple)", name: "Twin" },
  };

  const entryIcons = {
    update: ArrowRight, doubt: AlertTriangle, response: MessageSquare,
    completion: CheckCircle2, memory: Brain,
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--card)", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pc.dot }} />
              <span className="text-[9px] font-bold uppercase" style={{ color: pc.color }}>{pc.label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>{task.context}</span>
            </div>
            <p className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>{task.title}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{task.description}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg shrink-0" style={{ color: "var(--muted-foreground)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Outcome if done */}
        {task.outcome && (
          <div className="mt-2 px-3 py-2 rounded-xl flex items-start gap-2" style={{ background: "rgba(61,139,110,0.08)", border: "1px solid rgba(61,139,110,0.2)" }}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--iw-success)" }} />
            <p className="text-[10px] leading-relaxed" style={{ color: "var(--iw-success)" }}>{task.outcome}</p>
          </div>
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {task.thread.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <Sparkles className="w-8 h-8 mb-2 opacity-20" style={{ color: "var(--iw-purple)" }} />
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>No updates yet</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>Write a message below to start collaborating with Twin</p>
          </div>
        )}
        {task.thread.map(entry => {
          const tc = threadColors[entry.from];
          const EntryIcon = entryIcons[entry.type];
          return (
            <div key={entry.id} className="rounded-xl p-3" style={{ background: tc.bg, border: `1px solid ${tc.border}` }}>
              <div className="flex items-center gap-2 mb-1.5">
                {entry.from === "twin"
                  ? <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: tc.icon }} />
                  : <User className="w-3.5 h-3.5 shrink-0" style={{ color: tc.icon }} />}
                <span className="text-[10px] font-bold" style={{ color: tc.icon }}>{tc.name}</span>
                <EntryIcon className="w-3 h-3 shrink-0" style={{ color: tc.icon, opacity: 0.6 }} />
                <span className="text-[9px] capitalize" style={{ color: "var(--muted-foreground)" }}>{entry.type}</span>
                <span className="text-[9px] ml-auto" style={{ color: "var(--muted-foreground)" }}>{entry.timestamp}</span>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground)" }}>{entry.content}</p>

              {/* Action button for Twin's doubts / completion proposals */}
              {entry.action && (
                <div className="flex gap-2 mt-2.5">
                  {entry.action.type === "approve" && (
                    <>
                      <button onClick={() => onAction(task.id, "approve")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-white transition-all"
                        style={{ background: "var(--iw-success)", fontWeight: 700 }}>
                        <ThumbsUp className="w-3 h-3" /> Approve
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] transition-all"
                        style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                        Request changes
                      </button>
                    </>
                  )}
                  {entry.action.type === "respond" && (
                    <div className="flex-1">
                      <p className="text-[9px] mb-1" style={{ color: "var(--iw-warning)", fontWeight: 700 }}>
                        ↓ Twin is waiting for your answer before continuing
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reply input */}
      <div className="px-4 pb-4 pt-2 shrink-0 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--secondary)" }}>
          <textarea value={reply} onChange={e => setReply(e.target.value)}
            placeholder="Reply to Twin, add context, or give instructions…"
            rows={2}
            className="w-full bg-transparent px-3 pt-2.5 pb-1 text-xs outline-none resize-none"
            style={{ color: "var(--foreground)" }} />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                Posting to task · Twin will see this
              </span>
            </div>
            <button
              onClick={() => { if (reply.trim()) { onReply(task.id, reply); setReply(""); } }}
              disabled={!reply.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-white transition-all"
              style={{ background: reply.trim() ? "var(--iw-blue)" : "var(--muted)", fontWeight: 700, cursor: !reply.trim() ? "not-allowed" : "pointer" }}>
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Task Form ────────────────────────────────────────────────────────────

function NewTaskForm({ onAdd, onCancel }: { onAdd: (task: Partial<Task>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<Assignee>("twin");
  const [priority, setPriority] = useState<Priority>("medium");
  const [context, setContext] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ title, description, assignee, priority, context: context || "General", thread: [], column: "backlog", tags: [] });
  };

  return (
    <div className="p-4 rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--iw-blue)", boxShadow: "0 0 0 3px rgba(66,86,171,0.08)" }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title…"
        autoFocus
        className="w-full text-sm bg-transparent outline-none border-b pb-2 mb-3"
        style={{ borderColor: "var(--border)", color: "var(--foreground)", fontWeight: 600 }} />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What needs to happen? (Twin will read this)"
        rows={2} className="w-full text-xs bg-transparent outline-none resize-none mb-3"
        style={{ color: "var(--muted-foreground)" }} />
      <input value={context} onChange={e => setContext(e.target.value)} placeholder="Context (e.g. FinanceFlow · Renewal)"
        className="w-full text-xs bg-transparent outline-none border-b pb-2 mb-3"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }} />

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[9px] font-bold uppercase" style={{ color: "var(--muted-foreground)" }}>Assign to:</span>
        {(["human", "twin", "both"] as Assignee[]).map(a => (
          <button key={a} onClick={() => setAssignee(a)}
            className="text-[10px] px-2 py-1 rounded-lg capitalize transition-all"
            style={{ background: assignee === a ? "var(--iw-blue)" : "var(--secondary)", color: assignee === a ? "white" : "var(--muted-foreground)", fontWeight: 600 }}>
            {a === "twin" ? "✦ Twin" : a === "both" ? "⇌ Both" : "👤 Me"}
          </button>
        ))}
        <span className="text-[9px] font-bold uppercase ml-2" style={{ color: "var(--muted-foreground)" }}>Priority:</span>
        {(["critical", "high", "medium", "low"] as Priority[]).map(p => (
          <button key={p} onClick={() => setPriority(p)}
            className="text-[10px] px-2 py-1 rounded-lg capitalize transition-all"
            style={{ background: priority === p ? PRIORITY_CONFIG[p].color : "var(--secondary)", color: priority === p ? "white" : "var(--muted-foreground)", fontWeight: 600 }}>
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={!title.trim()}
          className="flex-1 py-2 rounded-xl text-xs text-white transition-all"
          style={{ background: title.trim() ? "var(--iw-blue)" : "var(--muted)", fontWeight: 700 }}>
          Create Task {assignee === "twin" ? "→ Assign to Twin" : ""}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-xs transition-all"
          style={{ background: "var(--secondary)", color: "var(--muted-foreground)", fontWeight: 600 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TwinBench() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState<Column>("backlog");

  const tasksByColumn = (col: Column) => tasks.filter(t => t.column === col);

  const assignToTwin = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId
      ? {
          ...t,
          assignee: "twin" as Assignee,
          column: "withtwin" as Column,
          thread: [...t.thread, {
            id: `e${Date.now()}`,
            from: "twin" as const,
            type: "update" as const,
            content: "On it. Reading context and planning approach. Will update you shortly.",
            timestamp: "Just now",
          }],
        }
      : t
    ));
  };

  const handleAction = (taskId: string, action: string) => {
    if (action === "approve") {
      setTasks(prev => prev.map(t => t.id === taskId
        ? {
            ...t,
            column: "done" as Column,
            memoryCommitted: true,
            outcome: "Approved by you. Outcome logged to memory.",
            thread: [...t.thread, {
              id: `e${Date.now()}`,
              from: "human" as const,
              type: "response" as const,
              content: "Approved.",
              timestamp: "Just now",
            }, {
              id: `e${Date.now() + 1}`,
              from: "twin" as const,
              type: "memory" as const,
              content: "Outcome committed to org memory. Task closed.",
              timestamp: "Just now",
            }],
          }
        : t
      ));
    }
  };

  const handleReply = (taskId: string, content: string) => {
    setTasks(prev => prev.map(t => t.id === taskId
      ? {
          ...t,
          thread: [...t.thread, {
            id: `e${Date.now()}`,
            from: "human" as const,
            type: "response" as const,
            content,
            timestamp: "Just now",
          }, {
            id: `e${Date.now() + 1}`,
            from: "twin" as const,
            type: "update" as const,
            content: "Got it. Continuing with that context.",
            timestamp: "Just now",
          }],
        }
      : t
    ));
  };

  const handleAddTask = (partial: Partial<Task>) => {
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: partial.title!,
      description: partial.description || "",
      column: partial.assignee === "twin" ? "withtwin" : "backlog",
      priority: partial.priority || "medium",
      assignee: partial.assignee || "human",
      context: partial.context || "General",
      tags: [],
      thread: partial.assignee === "twin" ? [{
        id: `e${Date.now()}`,
        from: "twin",
        type: "update",
        content: "Task received. Reading context and starting work.",
        timestamp: "Just now",
      }] : [],
    };
    setTasks(prev => [...prev, newTask]);
    setShowNewTask(false);
    if (newTask.assignee === "twin") setSelectedTask(newTask);
  };

  const pendingInputCount = tasks.filter(t => t.column === "needsinput").length;
  const withTwinCount = tasks.filter(t => t.column === "withtwin").length;

  // Sync selected task with updates
  const currentSelected = selectedTask ? tasks.find(t => t.id === selectedTask.id) || null : null;

  return (
    <div className="flex h-full" style={{ background: "var(--background)" }}>

      {/* Kanban board */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b shrink-0 flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="flex-1">
            <h1 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>Task Bench</h1>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Human ↔ Twin collaboration · {withTwinCount} with Twin · {pendingInputCount} need your input
            </p>
          </div>
          {pendingInputCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl animate-pulse" style={{ background: "rgba(212,136,62,0.1)", border: "1px solid rgba(212,136,62,0.25)" }}>
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "var(--iw-warning)" }} />
              <span className="text-[10px] font-bold" style={{ color: "var(--iw-warning)" }}>
                {pendingInputCount} task{pendingInputCount > 1 ? "s" : ""} need your input
              </span>
            </div>
          )}
          <button onClick={() => setShowNewTask(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white transition-all"
            style={{ background: "var(--iw-blue)", fontWeight: 700 }}>
            <Plus className="w-3.5 h-3.5" /> New Task
          </button>
        </div>

        {/* Kanban columns */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full gap-3 p-4" style={{ minWidth: "900px" }}>
            {COLUMNS.map(col => {
              const colTasks = tasksByColumn(col.id);
              return (
                <div key={col.id} className="flex flex-col" style={{ width: "220px", minWidth: "220px" }}>
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-2.5 px-0.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                    <span className="text-[10px] uppercase tracking-widest flex-1" style={{ fontWeight: 800, color: col.color }}>{col.label}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${col.color}18`, color: col.color }}>
                      {colTasks.length}
                    </span>
                  </div>
                  <p className="text-[9px] mb-3 px-0.5" style={{ color: "var(--muted-foreground)" }}>{col.description}</p>

                  {/* Tasks */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar-none pr-1">
                    {/* New task form */}
                    {showNewTask && newTaskColumn === col.id && (
                      <NewTaskForm onAdd={handleAddTask} onCancel={() => setShowNewTask(false)} />
                    )}

                    {colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTask(task)}
                        onAssignToTwin={assignToTwin}
                      />
                    ))}

                    {colTasks.length === 0 && !showNewTask && (
                      <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed"
                        style={{ borderColor: "var(--border)" }}>
                        <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>No tasks</p>
                      </div>
                    )}
                  </div>

                  {/* Add to this column */}
                  {col.id === "backlog" && (
                    <button onClick={() => { setNewTaskColumn("backlog"); setShowNewTask(true); }}
                      className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] transition-all"
                      style={{ color: "var(--muted-foreground)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
                      <Plus className="w-3 h-3" /> Add task
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task detail panel */}
      {currentSelected && (
        <div className="w-96 shrink-0 flex flex-col overflow-hidden" style={{ borderLeft: "1px solid var(--border)" }}>
          <TaskDetail
            task={currentSelected}
            onClose={() => setSelectedTask(null)}
            onAction={handleAction}
            onReply={handleReply}
          />
        </div>
      )}
    </div>
  );
}
