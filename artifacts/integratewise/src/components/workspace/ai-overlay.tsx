import { useState, useRef, useEffect } from "react";
import {
  X, Send, Bot, Lightbulb, FileCheck, MessageSquare,
  ChevronRight, Clock, CheckCircle2, Circle, AlertCircle,
  Sparkles, Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  from: "human" | "ai";
  text: string;
  ts: Date;
  type?: "clarification" | "submission" | "report" | "discussion";
}

const SAMPLE_MESSAGES: Message[] = [
  {
    id: "1",
    from: "ai",
    text: "I've finished reviewing the Q2 pipeline. There are 3 deals with stale context — last touch >14 days. Want me to draft outreach for each?",
    ts: new Date(Date.now() - 18 * 60000),
    type: "report",
  },
  {
    id: "2",
    from: "human",
    text: "Yes — but only for deals above $50k ACV.",
    ts: new Date(Date.now() - 15 * 60000),
  },
  {
    id: "3",
    from: "ai",
    text: "Understood. Filtering to 2 deals (Acme Corp $120k, Meridian $75k). Drafts ready for your review — awaiting approval before I send anything.",
    ts: new Date(Date.now() - 14 * 60000),
    type: "submission",
  },
];

const PENDING: { id: string; label: string; kind: "clarification" | "approval" | "report" }[] = [
  { id: "p1", label: "Schema update — new field in Deals", kind: "clarification" },
  { id: "p2", label: "Outreach drafts for Acme & Meridian", kind: "approval" },
  { id: "p3", label: "Weekly pipeline health digest", kind: "report" },
];

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function PendingBadge({ kind }: { kind: string }) {
  if (kind === "clarification") return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5" style={{ background: "var(--iw-warning-10,#fef3c7)", color: "var(--iw-warning,#d97706)" }}>
      <AlertCircle className="h-2.5 w-2.5" /> Clarify
    </span>
  );
  if (kind === "approval") return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5" style={{ background: "var(--iw-blue-50,#eff6ff)", color: "var(--iw-blue,#3b5bdb)" }}>
      <FileCheck className="h-2.5 w-2.5" /> Approve
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5" style={{ background: "var(--iw-success-10,#ecfdf5)", color: "var(--iw-success,#059669)" }}>
      <Lightbulb className="h-2.5 w-2.5" /> Report
    </span>
  );
}

export function AIOverlay({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<"thread" | "pending">("thread");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), from: "human", text: input.trim(), ts: new Date() },
    ]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          from: "ai",
          text: "Noted. I'll work on this and surface it for your review before taking any action.",
          ts: new Date(),
          type: "submission",
        },
      ]);
    }, 800);
  };

  return (
    <div
      className="flex h-full flex-col border-l border-border/60 bg-background/95 backdrop-blur-xl"
      style={{ width: 320, flexShrink: 0 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--iw-blue)" }}>
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">AI Workspace</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Overlay — non-disruptive</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 px-4 gap-4">
        {(["thread", "pending"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "thread" ? "Discussion" : `Pending (${PENDING.length})`}
          </button>
        ))}
      </div>

      {tab === "thread" ? (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-2.5", m.from === "human" ? "flex-row-reverse" : "flex-row")}>
                {m.from === "ai" && (
                  <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mt-1" style={{ background: "var(--iw-blue)" }}>
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={cn("max-w-[85%] space-y-1")}>
                  {m.type && (
                    <div className={cn("flex", m.from === "human" ? "justify-end" : "justify-start")}>
                      <PendingBadge kind={m.type} />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm leading-relaxed",
                      m.from === "human"
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-secondary text-foreground",
                    )}
                  >
                    {m.text}
                  </div>
                  <p className={cn("text-[10px] text-muted-foreground", m.from === "human" ? "text-right" : "text-left")}>
                    {formatTime(m.ts)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border/40 p-3">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Discuss, clarify, submit a direction..."
                rows={2}
                className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-30 hover:opacity-90 flex-shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
              AI does not act without your approval
            </p>
          </div>
        </>
      ) : (
        /* Pending items */
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-3">
            Awaiting your response
          </p>
          {PENDING.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-secondary/20 px-3 py-3 hover:bg-secondary/40 transition-colors cursor-pointer group"
            >
              <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.label}</p>
                <div className="mt-1">
                  <PendingBadge kind={p.kind} />
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </div>
          ))}
          <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              All AI actions require explicit approval.<br />Nothing executes without you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
