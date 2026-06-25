/**
 * AI Router - Multi-tier AI integration
 *
 * Tier 1: Cloudflare Workers AI (free, edge-native)
 * Tier 2: OpenRouter free models (fallback)
 * Tier 3: OpenRouter fusion (critical decisions)
 *
 * All requests go through Cloudflare AI Gateway for:
 * - Caching (reduce costs)
 * - Rate limiting
 * - Logging and analytics
 */

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  tier?: "fast" | "balanced" | "critical";
  useRAG?: boolean; // Enable AI Search RAG
}

export interface AIResponse {
  content: string;
  model: string;
  cached: boolean;
  provider: "workers-ai" | "openrouter";
  cost: number;
  sources?: Array<{ title: string; url?: string; score?: number }>; // RAG sources
}

interface Env {
  AI: Ai;
  OPENROUTER_API_KEY: string;
  AI_GATEWAY_ID?: string;
  AI_SEARCH?: any; // AI Search namespace binding
}

/**
 * Route AI requests through the optimal tier
 */
export async function routeAI(request: AIRequest, env: Env): Promise<AIResponse> {
  const tier = request.tier || "fast";

  // If RAG is enabled and AI_SEARCH is available, retrieve context first
  let ragContext = "";
  let sources: Array<{ title: string; url?: string; score?: number }> = [];

  if (request.useRAG && env.AI_SEARCH) {
    try {
      const searchResult = await env.AI_SEARCH.search(request.prompt, {
        limit: 5,
        includeVectors: false,
      });

      if (searchResult?.results) {
        sources = searchResult.results.map((r: any) => ({
          title: r.metadata?.title || "Untitled",
          url: r.metadata?.url,
          score: r.score,
        }));

        ragContext = searchResult.results.map((r: any) => r.text).join("\n\n");

        // Augment prompt with RAG context
        request.prompt = `Context from knowledge base:\n${ragContext}\n\nQuestion: ${request.prompt}`;
      }
    } catch (ragError) {
      console.error("[AI Router] RAG search failed:", ragError);
      // Continue without RAG context
    }
  }

  try {
    switch (tier) {
      case "fast":
        // Tier 1: Workers AI (free, instant)
        const fastResponse = await callWorkersAI(request, env);
        return { ...fastResponse, sources: sources.length > 0 ? sources : undefined };

      case "balanced":
        // Tier 2: OpenRouter free models
        const balancedResponse = await callOpenRouter(request, env, "openai/gpt-oss-120b:free");
        return { ...balancedResponse, sources: sources.length > 0 ? sources : undefined };

      case "critical":
        // Tier 3: OpenRouter free models (larger context)
        const criticalResponse = await callOpenRouter(request, env, "openai/gpt-oss-120b:free");
        return { ...criticalResponse, sources: sources.length > 0 ? sources : undefined };

      default:
        const defaultResponse = await callWorkersAI(request, env);
        return { ...defaultResponse, sources: sources.length > 0 ? sources : undefined };
    }
  } catch (error) {
    console.error(`[AI Router] ${tier} tier failed:`, error);

    // Fallback chain: Workers AI → OpenRouter free → Error
    if (tier === "critical" || tier === "balanced") {
      try {
        const fallbackResponse = await callOpenRouter(request, env, "openai/gpt-oss-120b:free");
        return { ...fallbackResponse, sources: sources.length > 0 ? sources : undefined };
      } catch (fallbackError) {
        try {
          const finalResponse = await callWorkersAI(request, env);
          return { ...finalResponse, sources: sources.length > 0 ? sources : undefined };
        } catch (finalError) {
          throw new Error(`All AI tiers failed: ${finalError}`);
        }
      }
    }

    throw error;
  }
}

/**
 * Tier 1: Cloudflare Workers AI via AI Gateway
 * Free, edge-native, instant
 */
async function callWorkersAI(request: AIRequest, env: Env): Promise<AIResponse> {
  const messages = [
    ...(request.systemPrompt ? [{ role: "system" as const, content: request.systemPrompt }] : []),
    { role: "user" as const, content: request.prompt },
  ];

  // Direct Workers AI call (no gateway for now, avoiding auth issues)
  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct" as keyof AiModels, {
    messages,
    max_tokens: request.maxTokens || 500,
    temperature: request.temperature || 0.7,
  });

  return {
    content: (response as { response?: string }).response || String(response),
    model: "@cf/meta/llama-3.1-8b-instruct",
    cached: false,
    provider: "workers-ai",
    cost: 0, // Free tier
  };
}

/**
 * Tier 2/3: OpenRouter via AI Gateway
 * Fallback and premium models
 */
async function callOpenRouter(request: AIRequest, env: Env, model: string): Promise<AIResponse> {
  const messages = [
    ...(request.systemPrompt ? [{ role: "system" as const, content: request.systemPrompt }] : []),
    { role: "user" as const, content: request.prompt },
  ];

  // Use AI Gateway for caching and logging
  const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${env.AI_GATEWAY_ID}/openrouter`;

  const response = await fetch(`${gatewayUrl}/api/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: request.maxTokens || 500,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage?: { total_tokens: number };
    cached?: boolean;
  };

  return {
    content: data.choices[0].message.content,
    model: data.model,
    cached: data.cached || false,
    provider: "openrouter",
    cost: 0, // Free tier (or calculate from usage)
  };
}

/**
 * Preset prompts for common tasks
 */
export const AIPrompts = {
  morningBrief: (signals: number, tasks: number) => ({
    systemPrompt: "You are a system status monitor. Generate concise, actionable summaries.",
    prompt: `Generate a morning brief (3 sentences):
- System health status
- ${signals} pending signals requiring attention
- ${tasks} tasks in the queue
Focus on what needs immediate action.`,
    maxTokens: 300,
    tier: "fast" as const,
  }),

  signalAnalysis: (signal: unknown) => ({
    systemPrompt: "You are a signal analyzer. Evaluate urgency, impact, and recommended actions.",
    prompt: `Analyze this signal and provide: severity (low/medium/high/critical), impact assessment, recommended action, and confidence level.\n\nSignal: ${JSON.stringify(signal)}`,
    maxTokens: 500,
    tier: "balanced" as const,
  }),

  criticalDecision: (context: unknown) => ({
    systemPrompt:
      "You are a decision support system. Use multi-model deliberation to evaluate options.",
    prompt: `Critical decision required. Context: ${JSON.stringify(context)}\n\nProvide: recommended action, risks, alternatives, and confidence level. Use deliberation.`,
    maxTokens: 1000,
    tier: "critical" as const,
  }),
};
