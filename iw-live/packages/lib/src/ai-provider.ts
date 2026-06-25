/**
 * Universal AI Provider Abstraction Layer
 *
 * Supports multiple providers dynamically based on available environment keys:
 * - GitHub Models
 * - OpenAI
 * - Google (Gemini)
 * - Vercel (Custom endpoints)
 * - XAI (Grok)
 * - OpenRouter
 * - OpenCode
 * - Anthropic
 * - Xiaomi MiMo
 *
 * Routes to the best available provider based on config.
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AICompletionResult {
  content: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export interface AIProviderConfig {
  githubToken?: string;
  openaiApiKey?: string;
  googleApiKey?: string;
  vercelToken?: string;
  xaiApiKey?: string;
  openrouterApiKey?: string;
  opencodeApiKey?: string;
  anthropicApiKey?: string;
  xiaomiApiKey?: string;

  xiaomiEndpoint?: string;
  vercelEndpoint?: string;
  opencodeEndpoint?: string;

  defaultModel?: string;
  defaultProvider?: string;
}

// ─── Provider URLs ──────────────────────────────────────────────────────────

const PROVIDER_URLS = {
  github: "https://models.inference.ai.azure.com/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  google: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  xai: "https://api.x.ai/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  xiaomi: "https://api.xiaomi.com/v1/chat/completions",
  // Defaults for custom endpoints
  opencode: "https://api.opencode.com/v1/chat/completions",
  vercel: "https://api.vercel.com/v1/chat/completions",
};

// ─── Default Models ─────────────────────────────────────────────────────────

const DEFAULT_MODELS: Record<string, string> = {
  github: "gpt-4o",
  openai: "gpt-4o",
  google: "gemini-1.5-pro-latest",
  xai: "grok-2",
  openrouter: "anthropic/claude-3.5-sonnet",
  anthropic: "claude-3-5-sonnet-20241022",
  xiaomi: "mimo-v2.5-pro",
  opencode: "opencode-default",
  vercel: "vercel-default",
};

// ─── AI Provider ────────────────────────────────────────────────────────────

export class AIProvider {
  private config: AIProviderConfig;
  private activeProvider: string;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.activeProvider = config.defaultProvider || this.detectProvider();
  }

  /**
   * Detect which provider is available based on keys present.
   * Priority order defines fallback if multiple keys are present.
   */
  private detectProvider(): string {
    if (this.config.githubToken) return "github";
    if (this.config.openaiApiKey) return "openai";
    if (this.config.googleApiKey) return "google";
    if (this.config.xaiApiKey) return "xai";
    if (this.config.openrouterApiKey) return "openrouter";
    if (this.config.anthropicApiKey) return "anthropic";
    if (this.config.vercelToken) return "vercel";
    if (this.config.opencodeApiKey) return "opencode";
    if (this.config.xiaomiApiKey) return "xiaomi";
    throw new Error("No AI provider keys configured");
  }

  get isConfigured(): boolean {
    return !!(
      this.config.githubToken ||
      this.config.openaiApiKey ||
      this.config.googleApiKey ||
      this.config.xaiApiKey ||
      this.config.openrouterApiKey ||
      this.config.anthropicApiKey ||
      this.config.vercelToken ||
      this.config.opencodeApiKey ||
      this.config.xiaomiApiKey
    );
  }

  get provider(): string {
    return this.activeProvider;
  }

  switchProvider(provider: string): void {
    if (!DEFAULT_MODELS[provider]) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    this.activeProvider = provider;
  }

  async complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResult> {
    const model = options?.model || this.config.defaultModel || DEFAULT_MODELS[this.activeProvider];

    if (this.activeProvider === "anthropic") {
      return this.completeViaAnthropic(messages, model, options);
    }
    return this.completeOpenAICompatible(messages, model, options);
  }

  async *stream(messages: AIMessage[], options?: AICompletionOptions): AsyncGenerator<string> {
    const model = options?.model || this.config.defaultModel || DEFAULT_MODELS[this.activeProvider];

    if (this.activeProvider === "anthropic") {
      yield* this.streamViaAnthropic(messages, model, options);
      return;
    }
    yield* this.streamOpenAICompatible(messages, model, options);
  }

  // ─── OpenAI Compatible Provider Logic ─────────────────────────────────
  // Handles GitHub, OpenAI, Google, xAI, OpenRouter, OpenCode, Vercel, Xiaomi

  private getProviderConfig() {
    switch (this.activeProvider) {
      case "github":
        return { url: PROVIDER_URLS.github, token: this.config.githubToken };
      case "openai":
        return { url: PROVIDER_URLS.openai, token: this.config.openaiApiKey };
      case "google":
        return { url: PROVIDER_URLS.google, token: this.config.googleApiKey };
      case "xai":
        return { url: PROVIDER_URLS.xai, token: this.config.xaiApiKey };
      case "openrouter":
        return { url: PROVIDER_URLS.openrouter, token: this.config.openrouterApiKey };
      case "opencode":
        return {
          url: this.config.opencodeEndpoint || PROVIDER_URLS.opencode,
          token: this.config.opencodeApiKey,
        };
      case "vercel":
        return {
          url: this.config.vercelEndpoint || PROVIDER_URLS.vercel,
          token: this.config.vercelToken,
        };
      case "xiaomi":
        return {
          url: this.config.xiaomiEndpoint || PROVIDER_URLS.xiaomi,
          token: this.config.xiaomiApiKey,
        };
      default:
        throw new Error(`Provider config not found for ${this.activeProvider}`);
    }
  }

  private async completeOpenAICompatible(
    messages: AIMessage[],
    model: string,
    options?: AICompletionOptions
  ): Promise<AICompletionResult> {
    const { url, token } = this.getProviderConfig();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    if (this.activeProvider === "openrouter") {
      headers["HTTP-Referer"] = "https://integratewise.ai";
      headers["X-Title"] = "IntegrateWise";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: options?.max_tokens || 4096,
        temperature: options?.temperature,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `${this.activeProvider} API error: ${response.status} ${response.statusText} - ${errText}`
      );
    }

    const result = (await response.json()) as any;
    return {
      content: result.choices[0].message.content,
      model: result.model || model,
      usage: result.usage,
    };
  }

  private async *streamOpenAICompatible(
    messages: AIMessage[],
    model: string,
    options?: AICompletionOptions
  ): AsyncGenerator<string> {
    const { url, token } = this.getProviderConfig();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    if (this.activeProvider === "openrouter") {
      headers["HTTP-Referer"] = "https://integratewise.ai";
      headers["X-Title"] = "IntegrateWise";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: options?.max_tokens || 4096,
        temperature: options?.temperature,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `${this.activeProvider} API error: ${response.status} ${response.statusText}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content;
            if (content) yield content;
          } catch {
            /* ignore malformed SSE line */
          }
        }
      }
    }
  }

  // ─── Anthropic Provider ───────────────────────────────────────────────

  private async completeViaAnthropic(
    messages: AIMessage[],
    model: string,
    options?: AICompletionOptions
  ): Promise<AICompletionResult> {
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    const response = await fetch(PROVIDER_URLS.anthropic, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.anthropicApiKey || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.max_tokens || 4096,
        temperature: options?.temperature,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as any;
    return {
      content: result.content[0].text,
      model: result.model || model,
      usage: result.usage,
    };
  }

  private async *streamViaAnthropic(
    messages: AIMessage[],
    model: string,
    options?: AICompletionOptions
  ): AsyncGenerator<string> {
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    const response = await fetch(PROVIDER_URLS.anthropic, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.anthropicApiKey || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.max_tokens || 4096,
        temperature: options?.temperature,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.content_block?.text || data.delta?.text;
            if (content) yield content;
          } catch {
            /* ignore malformed SSE line */
          }
        }
      }
    }
  }
}
