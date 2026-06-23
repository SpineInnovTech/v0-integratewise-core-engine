import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Zap,
  Building2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Clock,
  ChevronRight,
  FileText,
  Target,
  Database,
  BarChart3,
  CheckCircle2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Phone,
  Mail,
  Shield,
  Play,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSpine } from "@/components/l2/spine/spine-client";
import { type CTXEnum } from "@/components/l2/spine/types";
import { cognitive } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: { tool: string; entity: string }[];
  /** Entity context that was loaded for this response */
  entityContext?: { name: string; type: string } | null;
  /** Whether this message is still being streamed */
  streaming?: boolean;
}

/** An action the user can trigger from the Twin Chat. */
interface QuickAction {
  key: string;
  label: string;
  icon: typeof Phone;
  description: string;
  entity_type?: string;
}

/** Draft response from twin/act (draft_only=true). */
interface ActionDraft {
  action_key: string;
  status: string;
  suggested_summary?: string;
  suggested_next_steps?: string[];
}

// ─── Domain-contextual quick actions ────────────────────────────────────────
// These surface after every Twin response when entity context is present.
// They map to ACTION_TEMPLATES in the Think service (actions.ts).

const CS_ACTIONS: QuickAction[] = [
  {
    key: "schedule_health_call",
    label: "Schedule Health Call",
    icon: Phone,
    description: "Book a check-in call with the primary stakeholder",
    entity_type: "account",
  },
  {
    key: "draft_retention_email",
    label: "Draft Retention Email",
    icon: Mail,
    description: "AI-drafted email tailored to this account's risk signals",
    entity_type: "account",
  },
  {
    key: "escalate_to_leadership",
    label: "Escalate to Leadership",
    icon: Shield,
    description: "Flag for executive attention with evidence summary",
    entity_type: "account",
  },
];

const BIZOPS_ACTIONS: QuickAction[] = [
  {
    key: "create_task",
    label: "Create Task",
    icon: CheckCircle2,
    description: "Turn this insight into an actionable task",
  },
  {
    key: "trigger_workflow",
    label: "Trigger Workflow",
    icon: Play,
    description: "Start an automated workflow based on this analysis",
  },
  {
    key: "send_payment_reminder",
    label: "Send Payment Reminder",
    icon: Mail,
    description: "Draft and queue a payment follow-up",
    entity_type: "account",
  },
];

function getActionsForDomain(domain: CTXEnum): QuickAction[] {
  switch (domain) {
    case "CTX_CS":
      return CS_ACTIONS;
    case "CTX_BIZOPS":
      return BIZOPS_ACTIONS;
    default:
      return CS_ACTIONS; // Default to CS for demo
  }
}

// ─── Action Draft Card ──────────────────────────────────────────────────────

function ActionDraftCard({
  draft,
  action,
  onConfirm,
  onCancel,
  isExecuting,
}: {
  draft: ActionDraft;
  action: QuickAction;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting: boolean;
}) {
  const Icon = action.icon;
  return (
    <div className="mt-2 p-3 bg-gradient-to-r from-[#2d5a3d]/5 to-[#2d5a3d]/10 rounded-xl border border-[#2d5a3d]/20">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[#2d5a3d]" />
        <span className="text-xs font-semibold text-[#2d5a3d] uppercase tracking-wide">
          Proposed Action
        </span>
      </div>
      {draft.suggested_summary && (
        <p className="text-sm text-gray-800 mb-2">{draft.suggested_summary}</p>
      )}
      {draft.suggested_next_steps && draft.suggested_next_steps.length > 0 && (
        <ul className="text-xs text-gray-600 mb-3 space-y-1">
          {draft.suggested_next_steps.map((step, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <ChevronRight className="w-3 h-3 mt-0.5 text-[#2d5a3d] shrink-0" />
              {step}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          className="px-3 py-1.5 bg-[#2d5a3d] text-white rounded-lg text-xs font-medium hover:bg-[#1a3a2a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
        >
          {isExecuting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          Approve & Execute
        </button>
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Suggested Prompts ──────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  {
    icon: Building2,
    text: "Which accounts are at risk of churning this quarter?",
    category: "Accounts",
  },
  { icon: TrendingUp, text: "Show me our expansion pipeline and signals", category: "Growth" },
  {
    icon: AlertTriangle,
    text: "What critical incidents need attention today?",
    category: "Alerts",
  },
  { icon: BarChart3, text: "How are we tracking against our quarterly goals?", category: "Goals" },
  { icon: Target, text: "Which team members are overloaded right now?", category: "Team" },
  { icon: Database, text: "Summarize the data health across all integrations", category: "Data" },
];

// ─── AI Chat Component ──────────────────────────────────────────────────────

interface AIChatProps {
  activeCtx: CTXEnum;
  /** When scoped to a specific entity (e.g., viewing an account), pass its ID. */
  entityId?: string;
  /** Entity name for display in the header. */
  entityName?: string;
}

export function AIChat({ activeCtx, entityId, entityName }: AIChatProps) {
  const spine = useSpine();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Flow C write-back: track when we last synced to Knowledge Base
  const lastWritebackCountRef = useRef(0);

  // Action draft state — one draft at a time
  const [activeDraft, setActiveDraft] = useState<{
    draft: ActionDraft;
    action: QuickAction;
  } | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const domainActions = getActionsForDomain(activeCtx);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeDraft]);

  // Build conversation history for the Twin (excludes the current message)
  const getHistory = useCallback((): Array<{ role: "user" | "assistant"; content: string }> => {
    return messages.filter((m) => !m.streaming).map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  /**
   * Flow C write-back: push AI session insights to Knowledge Base.
   * Fires after every 2nd completed exchange (4+ messages) when entity-scoped.
   * Non-blocking — fire and forget. Failures are silently logged.
   */
  const maybeWriteBack = useCallback(
    (currentMessages: ChatMessage[]) => {
      if (!entityId) return; // Only write back when entity-scoped
      const completedMessages = currentMessages.filter((m) => !m.streaming);
      const msgCount = completedMessages.length;
      // Trigger every 4 messages (2 exchanges) since last write-back
      if (msgCount - lastWritebackCountRef.current < 4) return;
      lastWritebackCountRef.current = msgCount;

      // Summarize the recent conversation as entities for the Knowledge Base
      const sessionId = `twin-chat-${entityId}-${Date.now()}`;
      const recentMsgs = completedMessages.slice(-6); // Last 3 exchanges
      const summary = recentMsgs
        .map((m) => `${m.role === "user" ? "User" : "Twin"}: ${m.content.slice(0, 200)}`)
        .join("\n");

      cognitive
        .contextToTruth({
          sessionId,
          entities: [
            {
              type: "ai_session_summary",
              data: {
                entity_id: entityId,
                entity_name: entityName,
                domain: activeCtx,
                summary,
                message_count: msgCount,
                timestamp: new Date().toISOString(),
              },
            },
          ],
          confidence: 0.8,
        })
        .catch((err) => {
          // Non-blocking — log but don't disrupt the chat
          console.warn("[Flow C] context-to-truth write-back failed:", err);
        });
    },
    [entityId, entityName, activeCtx]
  );

  // Trigger a quick action — first as draft, then confirm to execute
  const handleQuickAction = useCallback(
    async (action: QuickAction) => {
      setIsDrafting(true);
      setActiveDraft(null);
      try {
        const result = await cognitive.twinAct({
          action_key: action.key,
          entity_type: action.entity_type,
          entity_id: entityId,
          draft_only: true,
        });
        setActiveDraft({ draft: result, action });
      } catch (err) {
        // Show error as a chat message
        const errId = `err${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: errId,
            role: "assistant",
            content: `Could not draft "${action.label}": ${err instanceof Error ? err.message : "Unknown error"}. The action service may not be configured yet.`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsDrafting(false);
      }
    },
    [entityId]
  );

  // Execute the confirmed action (draft_only=false)
  const handleConfirmAction = useCallback(async () => {
    if (!activeDraft) return;
    setIsExecuting(true);
    try {
      const result = await cognitive.twinAct({
        action_key: activeDraft.action.key,
        entity_type: activeDraft.action.entity_type,
        entity_id: entityId,
        draft_only: false,
      });
      // Show success as a chat message
      const successId = `act${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: successId,
          role: "assistant",
          content: `Action "${activeDraft.action.label}" ${result.status === "executed" || result.status === "queued" ? "has been submitted for execution" : `status: ${result.status}`}. ${result.reason || "It will be processed through the governance and execution pipeline."}`,
          timestamp: new Date(),
        },
      ]);
      setActiveDraft(null);
    } catch (err) {
      const errId = `err${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errId,
          role: "assistant",
          content: `Execution failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  }, [activeDraft, entityId]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isTyping) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Clear any active draft when sending a new message
      setActiveDraft(null);

      const userMsg: ChatMessage = {
        id: `u${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      // Create a placeholder assistant message for streaming
      const assistantId = `a${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          streaming: true,
        },
      ]);
      setInput("");
      setIsTyping(true);
      setStatusMessage("Connecting to Twin...");

      const history = getHistory();

      cognitive.twinChat(
        {
          message: text,
          history,
          entity_id: entityId,
        },
        {
          onChunk: (data) => {
            if (data.type === "status") {
              setStatusMessage(data.message || "");
            } else if (data.type === "context") {
              // Entity context loaded — could display in UI
              if (data.entity) {
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, entityContext: data.entity } : m))
                );
              }
            } else if (data.type === "twin_chunk") {
              // Append streamed content to the assistant message
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + (data.content || "") } : m
                )
              );
              setStatusMessage("");
            } else if (data.type === "twin_complete") {
              // Mark message as complete, attach entity context
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        streaming: false,
                        entityContext: data.entity || m.entityContext,
                      }
                    : m
                )
              );
            } else if (data.type === "done") {
              setIsTyping(false);
              setStatusMessage("");
              // Ensure streaming flag is cleared
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
              );
            } else if (data.type === "error") {
              setIsTyping(false);
              setStatusMessage("");
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content:
                          m.content || `Something went wrong: ${data.message || "Unknown error"}`,
                        streaming: false,
                      }
                    : m
                )
              );
            }
          },
          onDone: () => {
            setIsTyping(false);
            setStatusMessage("");
            setMessages((prev) => {
              const updated = prev.map((m) =>
                m.id === assistantId ? { ...m, streaming: false } : m
              );
              // Flow C: write back insights to Knowledge Base
              maybeWriteBack(updated);
              return updated;
            });
          },
          onError: (err) => {
            setIsTyping(false);
            setStatusMessage("");
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content:
                        m.content ||
                        `Twin unavailable: ${err.message}. Check your API configuration.`,
                      streaming: false,
                    }
                  : m
              )
            );
          },
        },
        controller.signal
      );
    },
    [isTyping, getHistory, entityId, maybeWriteBack]
  );

  // Check if any assistant message has finished streaming (show actions after latest)
  const lastAssistantDone =
    [...messages]
      .reverse()
      .find((m: ChatMessage) => m.role === "assistant" && !m.streaming && m.content) ?? null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2d5a3d] to-[#b8943f] flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Digital Twin</h2>
            <p className="text-[10px] text-muted-foreground">
              {entityName
                ? `Scoped to ${entityName} — Entity 360 context`
                : "AI that thinks in context — powered by Entity 360"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {entityId && messages.length >= 2 && (
              <button
                onClick={() => {
                  lastWritebackCountRef.current = 0; // Force write-back
                  maybeWriteBack(messages);
                  lastWritebackCountRef.current = messages.filter((m) => !m.streaming).length;
                }}
                className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground"
                title="Save session insights to Knowledge Base"
              >
                <Database className="w-2.5 h-2.5" />
                Save to KB
              </button>
            )}
            {entityId && (
              <Badge variant="secondary" className="text-[9px] font-bold gap-1">
                <Building2 className="w-2.5 h-2.5" />
                {entityName || entityId.slice(0, 8)}
              </Badge>
            )}
            <Badge variant="outline" className="text-[9px] font-bold gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {spine.connectedApps?.length || 0} sources
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2d5a3d]/10 to-[#b8943f]/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-[#2d5a3d]" />
            </div>
            <h3 className="text-lg font-bold mb-1">Your Digital Twin</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {entityName
                ? `I have full context on ${entityName}. Ask me anything, or take action directly.`
                : "Ask me anything about your accounts, signals, goals, or team. I reason over your Entity 360 data — truth, context, and memory — to give you grounded answers."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt.text)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-left transition-all group border border-transparent hover:border-border"
                >
                  <prompt.icon className="w-4 h-4 text-muted-foreground group-hover:text-[#2d5a3d] shrink-0" />
                  <div>
                    <div className="text-xs font-medium line-clamp-2">{prompt.text}</div>
                    <div className="text-[9px] text-muted-foreground">{prompt.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2d5a3d] to-[#b8943f] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] ${msg.role === "user" ? "bg-[#2d5a3d] text-white rounded-2xl rounded-br-md px-4 py-2.5" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="space-y-3">
                  {msg.content ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : msg.streaming ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {statusMessage || "Thinking..."}
                    </div>
                  ) : null}
                  {/* Entity context badge */}
                  {msg.entityContext && !msg.streaming && (
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[8px] font-mono gap-1">
                        <Database className="w-2.5 h-2.5" />
                        Entity 360: {msg.entityContext.name} ({msg.entityContext.type})
                      </Badge>
                    </div>
                  )}

                  {/* Quick Action Buttons — shown after the latest completed assistant response */}
                  {msg === lastAssistantDone && !isTyping && (
                    <div className="pt-2 space-y-2">
                      {/* Action draft preview (if active) */}
                      {activeDraft && (
                        <ActionDraftCard
                          draft={activeDraft.draft}
                          action={activeDraft.action}
                          onConfirm={handleConfirmAction}
                          onCancel={() => setActiveDraft(null)}
                          isExecuting={isExecuting}
                        />
                      )}

                      {/* Quick action buttons (hidden when draft is open) */}
                      {!activeDraft && (
                        <div className="flex flex-wrap gap-1.5">
                          {domainActions.map((action) => {
                            const Icon = action.icon;
                            return (
                              <button
                                key={action.key}
                                onClick={() => handleQuickAction(action)}
                                disabled={isDrafting || isExecuting}
                                title={action.description}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary/60 hover:bg-secondary border border-transparent hover:border-[#2d5a3d]/30 rounded-lg text-xs font-medium text-gray-700 hover:text-[#2d5a3d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDrafting ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Icon className="w-3 h-3" />
                                )}
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Copy / Feedback buttons (only when done streaming) */}
                  {!msg.streaming && msg.content && msg !== lastAssistantDone && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => navigator.clipboard?.writeText(msg.content)}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {!msg.streaming && msg.content && msg === lastAssistantDone && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => navigator.clipboard?.writeText(msg.content)}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button className="p-1 rounded hover:bg-secondary text-muted-foreground">
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button className="p-1 rounded hover:bg-secondary text-muted-foreground">
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {msg.role === "user" && <p className="text-sm">{msg.content}</p>}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-[#142E20] flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 py-3 border-t border-border shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              entityName
                ? `Ask about ${entityName}, or type a question...`
                : "Ask the Twin about accounts, goals, data health, or anything..."
            }
            className="flex-1 bg-secondary/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2d5a3d]/20 border border-border"
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
            className="bg-[#2d5a3d] hover:bg-[#2d5a3d] rounded-xl w-10 h-10 shrink-0"
          >
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
