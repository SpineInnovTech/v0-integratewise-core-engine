import type { Env } from "../types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function gatewayChat(
  env: Env,
  messages: ChatMessage[],
  model?: string
): Promise<{ reply: string; model: string }> {
  const targetModel = model || env.DEFAULT_CHAT_MODEL;

  if (!env.INTELLIGENCE) {
    throw new Error("INTELLIGENCE service binding is not configured");
  }

  try {
    // Call the live intelligence service completions endpoint
    const response = await env.INTELLIGENCE.fetch("http://internal/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": env.DEFAULT_TENANT_ID,
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Intelligence service error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };

    return {
      reply: data.choices?.[0]?.message?.content || "",
      model: data.model || targetModel,
    };
  } catch (error: any) {
    console.error("[AI Gateway] Chat completion failed:", error.message);

    // Cloudflare Workers AI Fallback (using Workers AI edge model directly)
    if (env.AI) {
      try {
        console.warn("[AI Gateway] Attempting direct Workers AI edge model fallback...");
        // Use llama-3-8b-instruct or similar available on CF
        const runRes = (await env.AI.run("@cf/meta/llama-3.1-8b-instruct", { messages })) as {
          response?: string;
          text?: string;
        };

        return {
          reply: runRes.response || runRes.text || "",
          model: "@cf/meta/llama-3.1-8b-instruct (fallback)",
        };
      } catch (fallbackError: any) {
        console.error("[AI Gateway] Workers AI fallback also failed:", fallbackError.message);
      }
    }

    throw new Error(`AI_COMPLETION_ERROR: Reasoning gateway failed: ${error.message}`);
  }
}
