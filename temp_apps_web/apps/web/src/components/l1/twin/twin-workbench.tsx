/**
 * Twin Workbench — L3 Surface (Cloudflare-native)
 *
 * The Twin runs entirely in Cloudflare (services/iw-agent-runtime — Cloudflare
 * Agents/AI SDK: TwinAgent + TenantBrainDO). This surface is a NATIVE chat UI
 * that streams from the runtime via the gateway:
 *   POST /api/v1/cognitive/twin/:userId/chat  (SSE)
 *
 * OWUI-free, Agent-Zero-free, VPS-free. (DECISION 22)
 *
 * Context (entity / insight) is passed via the `context` prop and seeded into
 * the composer. Voice + proposals-in-context are tracked enhancements.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useTwinChat } from "@/hooks/use-twin-chat";
import { readTwinHandoffContext, type TwinHandoffContext } from "@/lib/twin-handoff";
import { authManager } from "@/lib/auth-manager";

interface HandoffPackage {
  id: string;
  version: string;
  workflows: string[];
  tools: string[];
  executionInstructions: string;
  note: string;
  createdAt?: string;
}

interface TwinWorkbenchProps {
  /** Pre-fill context (from entity360, signal, or L2 insight) */
  context?: TwinHandoffContext;
  /** Reserved for full-page mode (kept for API compatibility) */
  fullPage?: boolean;
}

export function TwinWorkbench({ context }: TwinWorkbenchProps) {
  const { messages, status, contextChip, isStreaming, error, send } = useTwinChat();
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "handoffs">("chat");
  const [handoffs, setHandoffs] = useState<HandoffPackage[]>([]);
  const [loadingHandoffs, setLoadingHandoffs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Seed the composer from incoming context (entity / insight) — do not auto-send.
  useEffect(() => {
    const ctx = context ?? readTwinHandoffContext();
    if (!ctx) return;
    if (ctx.prompt) {
      setInput(ctx.prompt);
    } else if (ctx.entityName) {
      setInput(`Assemble context on ${ctx.entityName} and tell me what I should know.`);
    } else if (ctx.insightTitle) {
      setInput(`Help me investigate: "${ctx.insightTitle}"`);
    }
  }, [context]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = () => {
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput("");
    void send(text);
  };

  // Load handoffs (from Twin DO via gateway)
  const loadHandoffs = async () => {
    setLoadingHandoffs(true);
    try {
      const session = await authManager.getSession();
      if (!session) return;
      const userId = session.user.id;
      const res = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8786"}/api/v1/cognitive/twin/${userId}/handoffs`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "x-tenant-id": session.user.tenant_id,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setHandoffs(data.handoffs || []);
      }
    } catch (e) {
      console.warn("Failed to load handoffs", e);
    } finally {
      setLoadingHandoffs(false);
    }
  };

  const generateHandoff = async () => {
    try {
      const session = await authManager.getSession();
      if (!session) throw new Error("Not authenticated");
      const userId = session.user.id;
      const res = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8786"}/api/v1/cognitive/twin/${userId}/handoff/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
            "x-tenant-id": session.user.tenant_id,
          },
          body: JSON.stringify({
            workflows: ["renewal_risk_recovery", "escalation_alignment"],
            tools: ["email", "calendar", "crm_update"],
            instructions: "Use customer context from Spine. Prioritize human approval steps.",
          }),
        }
      );
      if (res.ok) {
        const pkg = await res.json();
        setHandoffs((prev) => [pkg, ...prev]);
        alert("Execution Package generated. Available for export / Customer Zero pickup.");
      }
    } catch (e: any) {
      alert("Generate failed: " + e.message);
    }
  };

  const exportHandoff = (pkg: HandoffPackage) => {
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pkg.id || "handoff"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (activeTab === "handoffs") loadHandoffs();
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col">
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          background: "var(--iw-forest-deep, #0E2016)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: "var(--iw-paper)" }}>
            🧠 Twin Workbench
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--iw-gold, #B8943F)", color: "var(--iw-forest-deep)" }}
          >
            Cloudflare AI SDK
          </span>
          {contextChip && (
            <span className="text-xs" style={{ color: "var(--iw-paper-dark, #E0D9C8)" }}>
              ◆ {contextChip.name} · {contextChip.type}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1 text-xs rounded ${activeTab === "chat" ? "bg-[var(--iw-paper-deep)]" : ""}`}
            style={{ color: "var(--iw-paper)" }}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab("handoffs")}
            className={`px-3 py-1 text-xs rounded ${activeTab === "handoffs" ? "bg-[var(--iw-paper-deep)]" : ""}`}
            style={{ color: "var(--iw-paper)" }}
          >
            Handoff Packages
          </button>
        </div>
        <span className="text-xs" style={{ color: "var(--iw-paper-dark, #E0D9C8)" }}>
          {isStreaming ? (status ?? "Thinking…") : "Reasoning stream · Spine-grounded"}
        </span>
      </div>

      {activeTab === "chat" && (
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            style={{ background: "var(--iw-paper)" }}
          >
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <p className="text-lg font-semibold" style={{ color: "var(--iw-forest)" }}>
                    Your Twin is ready
                  </p>
                  <p className="text-sm mt-2" style={{ color: "var(--iw-ink-muted)" }}>
                    Ask anything about your work. The Twin reasons over your Spine — shared,
                    normalized, governed context across every tool. It proposes; you approve.
                  </p>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap"
                  style={
                    m.role === "user"
                      ? { background: "var(--iw-forest)", color: "var(--iw-paper)" }
                      : {
                          background: "var(--iw-bg-secondary, #F4F0E8)",
                          color: "var(--iw-ink, #1C1A17)",
                        }
                  }
                >
                  {m.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-4 py-2 text-xs"
              style={{ background: "rgba(220,38,38,0.08)", color: "#8B2020" }}
            >
              {error}
            </div>
          )}

          {/* Composer */}
          <div
            className="border-t px-3 py-3 flex items-end gap-2"
            style={{ borderColor: "rgba(0,0,0,0.06)", background: "var(--iw-paper)" }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder="Message your Twin…  (Enter to send, Shift+Enter for newline)"
              className="flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                border: "1px solid rgba(0,0,0,0.12)",
                color: "var(--iw-ink)",
                maxHeight: 160,
              }}
              disabled={isStreaming}
            />
            <button
              onClick={submit}
              disabled={isStreaming || !input.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: isStreaming || !input.trim() ? "rgba(0,0,0,0.12)" : "var(--iw-forest)",
                color: "var(--iw-paper)",
              }}
            >
              {isStreaming ? "…" : "Send"}
            </button>
          </div>
        </>
      )}

      {activeTab === "handoffs" && (
        <div className="flex-1 overflow-auto p-4" style={{ background: "var(--iw-paper)" }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Execution Packages (Handoffs)</h3>
            <button
              onClick={generateHandoff}
              className="px-3 py-1 text-xs rounded bg-iw-forest text-white"
            >
              + Generate Handoff
            </button>
          </div>

          {loadingHandoffs && <div className="text-xs">Loading…</div>}

          {handoffs.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No handoff packages yet. Generate one from chat or button above. These are the
              artifacts the Twin produces for your (or Customer Zero's) execution environment.
            </div>
          ) : (
            <div className="space-y-3">
              {handoffs.map((pkg, idx) => (
                <div key={idx} className="border rounded-lg p-3 text-sm">
                  <div className="font-mono text-xs text-iw-forest">{pkg.id}</div>
                  <div className="mt-1">Workflows: {pkg.workflows?.join(", ") || "—"}</div>
                  <div>Tools: {pkg.tools?.join(", ") || "—"}</div>
                  <div className="mt-2 text-xs bg-[var(--iw-paper-deep)] p-2 rounded">
                    {pkg.executionInstructions?.slice(0, 200)}...
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => exportHandoff(pkg)} className="text-xs underline">
                      Export JSON (for customer agent)
                    </button>
                    <span className="text-[10px] text-muted">
                      For Customer Zero: L5/L6 will pick this up
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TwinWorkbench;
