/**
 * useTwinChat — native L3 Twin chat over the Cloudflare-native Twin Runtime.
 *
 * Streams from `services/iw-agent-runtime` via the gateway:
 *   POST /api/v1/cognitive/twin/:userId/chat  (Server-Sent Events)
 *
 * SSE event types emitted by the runtime (see iw-agent-runtime/src/index.ts):
 *   { type: "status", message }     — connecting / retrieving context
 *   { type: "context", entity }     — grounding entity resolved
 *   { type: "twin_chunk", content } — streamed reply text (append)
 *   { type: "twin_complete", entity }
 *   { type: "done" } | "[DONE]"
 *   { type: "error", message }
 *
 * NOTE: the runtime chat is POST+SSE, so EventSource (GET-only) can't be used.
 * We read the response body as a stream and parse `data:` frames manually.
 *
 * Replaces the old OWUI iframe surface (DECISION 22 — Twin runs in Cloudflare).
 */
import { useCallback, useRef, useState } from "react";
import { authManager } from "@/lib/auth-manager";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8786";

export interface TwinMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TwinContextChip {
  name: string;
  type: string;
}

export interface UseTwinChat {
  messages: TwinMessage[];
  status: string | null;
  contextChip: TwinContextChip | null;
  isStreaming: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

export function useTwinChat(): UseTwinChat {
  const [messages, setMessages] = useState<TwinMessage[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [contextChip, setContextChip] = useState<TwinContextChip | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);

  const reset = useCallback(() => {
    setMessages([]);
    setStatus(null);
    setContextChip(null);
    setError(null);
    sessionIdRef.current = undefined;
  }, []);

  const appendToAssistant = useCallback((chunk: string) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.role === "assistant") {
        next[next.length - 1] = { role: "assistant", content: last.content + chunk };
      }
      return next;
    });
  }, []);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || isStreaming) return;

      setError(null);
      setStatus("Connecting to Twin…");
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      try {
        const session = await authManager.getSession();
        if (!session) throw new Error("Not authenticated — sign in to use the Twin.");

        const userId = encodeURIComponent(session.user.id);
        const res = await fetch(`${API_BASE}/api/v1/cognitive/twin/${userId}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
            "x-tenant-id": session.user.tenant_id,
          },
          body: JSON.stringify({ message, session_id: sessionIdRef.current }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Twin runtime error (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // keep last partial line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            let evt: {
              type?: string;
              message?: string;
              content?: string;
              entity?: TwinContextChip;
            };
            try {
              evt = JSON.parse(payload);
            } catch {
              continue;
            }

            switch (evt.type) {
              case "status":
                setStatus(evt.message ?? null);
                break;
              case "context":
                if (evt.entity) setContextChip(evt.entity);
                break;
              case "twin_chunk":
                if (evt.content) appendToAssistant(evt.content);
                break;
              case "twin_complete":
                setStatus(null);
                break;
              case "error":
                setError(evt.message ?? "Twin processing error");
                break;
              case "done":
                setStatus(null);
                break;
              default:
                break;
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Twin request failed");
      } finally {
        setIsStreaming(false);
        setStatus(null);
      }
    },
    [isStreaming, appendToAssistant]
  );

  return { messages, status, contextChip, isStreaming, error, send, reset };
}
