import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Anthropic Connector — Anthropic Messages API (2023-06-01)
// ============================================================================

export interface AnthropicConnectorConfig extends ConnectorConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

export interface AnthropicContentBlock {
  type: "text" | "image" | "tool_use" | "tool_result";
  text?: string;
  source?: { type: "base64"; media_type: string; data: string };
  id?: string;
  name?: string;
  input?: Record<string, any>;
  tool_use_id?: string;
  content?: string | AnthropicContentBlock[];
  is_error?: boolean;
}

export interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AnthropicCreateMessageParams {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  system?: string | Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }>;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  tools?: AnthropicTool[];
  tool_choice?: { type: "auto" | "any" | "tool"; name?: string };
  metadata?: { user_id?: string };
  stream?: boolean;
}

export interface AnthropicMessageResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export interface AnthropicStreamEvent {
  type:
    | "message_start"
    | "content_block_start"
    | "content_block_delta"
    | "content_block_stop"
    | "message_delta"
    | "message_stop"
    | "ping"
    | "error";
  message?: AnthropicMessageResponse;
  index?: number;
  content_block?: AnthropicContentBlock;
  delta?: { type: string; text?: string; stop_reason?: string; [key: string]: any };
  usage?: { output_tokens: number };
  error?: { type: string; message: string };
}

export interface AnthropicModel {
  id: string;
  display_name: string;
  type: "model";
  created_at: string;
}

export interface AnthropicBatchRequest {
  custom_id: string;
  params: AnthropicCreateMessageParams;
}

export interface AnthropicBatch {
  id: string;
  type: "message_batch";
  processing_status: "in_progress" | "canceling" | "ended";
  request_counts: {
    processing: number;
    succeeded: number;
    errored: number;
    canceled: number;
    expired: number;
  };
  ended_at: string | null;
  created_at: string;
  expires_at: string;
  results_url: string | null;
}

export class AnthropicConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: AnthropicConnectorConfig;

  constructor(config: AnthropicConnectorConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.anthropic.com/v1",
      timeout: 120000,
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.error?.message || error.message;
        if (status === 401) throw new ConnectorError("Invalid Anthropic API key", error);
        if (status === 403) throw new ConnectorError(`Anthropic permission denied: ${msg}`, error);
        if (status === 429)
          throw new ConnectorError(`Anthropic rate limit exceeded: ${msg}`, error);
        if (status === 400) throw new ConnectorError(`Anthropic bad request: ${msg}`, error);
        if (status === 404) throw new ConnectorError(`Anthropic resource not found: ${msg}`, error);
        if (status === 529)
          throw new ConnectorError("Anthropic API overloaded, retry later", error);
        throw new ConnectorError(`Anthropic API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "anthropic",
      name: "Anthropic",
      version: "1.0.0",
      apiVersion: "2023-06-01",
      capabilities: { sync: false, webhooks: false },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.post("/messages", {
        model: this.config.defaultModel || "claude-sonnet-4-20250514",
        max_tokens: 1,
        messages: [{ role: "user", content: "test" }],
      });
      return true;
    } catch (err: any) {
      if (err.response?.status === 401) return false;
      return true; // Other errors mean the API is reachable
    }
  }

  // ---------------------------------------------------------------------------
  // Messages API
  // ---------------------------------------------------------------------------
  async createMessage(params: AnthropicCreateMessageParams): Promise<AnthropicMessageResponse>;
  async createMessage(
    messages: AnthropicMessage[],
    model?: string,
    options?: Partial<Omit<AnthropicCreateMessageParams, "model" | "messages">>
  ): Promise<AnthropicMessageResponse>;
  async createMessage(
    paramsOrMessages: AnthropicCreateMessageParams | AnthropicMessage[],
    model?: string,
    options?: Partial<Omit<AnthropicCreateMessageParams, "model" | "messages">>
  ): Promise<AnthropicMessageResponse> {
    try {
      const body = Array.isArray(paramsOrMessages)
        ? {
            model: model || this.config.defaultModel || "claude-sonnet-4-20250514",
            max_tokens: options?.max_tokens || 4096,
            messages: paramsOrMessages,
            ...options,
            stream: false,
          }
        : { ...paramsOrMessages, stream: false };

      const response = await this.client.post("/messages", body);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Anthropic message", error);
    }
  }

  async *streamMessage(
    params: AnthropicCreateMessageParams
  ): AsyncGenerator<AnthropicStreamEvent, void, undefined> {
    try {
      const response = await this.client.post(
        "/messages",
        { ...params, stream: true },
        { responseType: "stream" }
      );
      const stream = response.data;
      let buffer = "";

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.slice(7);
          } else if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            try {
              const parsed: AnthropicStreamEvent = JSON.parse(data);
              if (!parsed.type) parsed.type = currentEvent as any;
              yield parsed;
            } catch {
              // Skip malformed SSE data
            }
          }
        }
      }
    } catch (error) {
      throw new ConnectorError("Failed to stream Anthropic message", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Convenience: simple text message
  // ---------------------------------------------------------------------------
  async chat(
    userMessage: string,
    options?: {
      model?: string;
      system?: string;
      maxTokens?: number;
      temperature?: number;
      tools?: AnthropicTool[];
    }
  ): Promise<{ text: string; usage: AnthropicMessageResponse["usage"]; stopReason: string }> {
    const response = await this.createMessage({
      model: options?.model || this.config.defaultModel || "claude-sonnet-4-20250514",
      max_tokens: options?.maxTokens || 4096,
      messages: [{ role: "user", content: userMessage }],
      system: options?.system,
      temperature: options?.temperature,
      tools: options?.tools,
    });

    const textBlocks = response.content.filter((b) => b.type === "text");
    return {
      text: textBlocks.map((b) => b.text).join(""),
      usage: response.usage,
      stopReason: response.stop_reason,
    };
  }

  async multiTurnChat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    options?: {
      model?: string;
      system?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<AnthropicMessageResponse> {
    return this.createMessage({
      model: options?.model || this.config.defaultModel || "claude-sonnet-4-20250514",
      max_tokens: options?.maxTokens || 4096,
      messages,
      system: options?.system,
      temperature: options?.temperature,
    });
  }

  // ---------------------------------------------------------------------------
  // Vision
  // ---------------------------------------------------------------------------
  async analyzeImage(
    imageBase64: string,
    mediaType: string,
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
    }
  ): Promise<AnthropicMessageResponse> {
    return this.createMessage({
      model: options?.model || this.config.defaultModel || "claude-sonnet-4-20250514",
      max_tokens: options?.maxTokens || 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // Tool Use
  // ---------------------------------------------------------------------------
  async createMessageWithTools(
    messages: AnthropicMessage[],
    tools: AnthropicTool[],
    options?: {
      model?: string;
      maxTokens?: number;
      system?: string;
      toolChoice?: AnthropicCreateMessageParams["tool_choice"];
    }
  ): Promise<AnthropicMessageResponse> {
    return this.createMessage({
      model: options?.model || this.config.defaultModel || "claude-sonnet-4-20250514",
      max_tokens: options?.maxTokens || 4096,
      messages,
      tools,
      tool_choice: options?.toolChoice,
      system: options?.system,
    });
  }

  extractToolCalls(
    response: AnthropicMessageResponse
  ): Array<{ id: string; name: string; input: Record<string, any> }> {
    return response.content
      .filter((b) => b.type === "tool_use")
      .map((b) => ({ id: b.id!, name: b.name!, input: b.input! }));
  }

  buildToolResult(toolUseId: string, result: string, isError = false): AnthropicMessage {
    return {
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: toolUseId, content: result, is_error: isError },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // Models
  // ---------------------------------------------------------------------------
  async listModels(params?: { limit?: number; before_id?: string; after_id?: string }): Promise<{
    data: AnthropicModel[];
    has_more: boolean;
    first_id: string | null;
    last_id: string | null;
  }> {
    try {
      const response = await this.client.get("/models", {
        params: { limit: params?.limit || 20, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Anthropic models", error);
    }
  }

  async getModel(modelId: string): Promise<AnthropicModel> {
    try {
      const response = await this.client.get(`/models/${modelId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get model ${modelId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Message Batches API
  // ---------------------------------------------------------------------------
  async createBatch(requests: AnthropicBatchRequest[]): Promise<AnthropicBatch> {
    try {
      const response = await this.client.post("/messages/batches", { requests });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Anthropic batch", error);
    }
  }

  async getBatch(batchId: string): Promise<AnthropicBatch> {
    try {
      const response = await this.client.get(`/messages/batches/${batchId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get batch ${batchId}`, error);
    }
  }

  async listBatches(params?: {
    limit?: number;
    before_id?: string;
    after_id?: string;
  }): Promise<{ data: AnthropicBatch[]; has_more: boolean }> {
    try {
      const response = await this.client.get("/messages/batches", { params });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Anthropic batches", error);
    }
  }

  async cancelBatch(batchId: string): Promise<AnthropicBatch> {
    try {
      const response = await this.client.post(`/messages/batches/${batchId}/cancel`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to cancel batch ${batchId}`, error);
    }
  }

  async getBatchResults(batchId: string): Promise<string> {
    try {
      const batch = await this.getBatch(batchId);
      if (!batch.results_url) throw new ConnectorError(`Batch ${batchId} results not ready`);
      const response = await this.client.get(batch.results_url, { responseType: "text" });
      return response.data;
    } catch (error) {
      if (error instanceof ConnectorError) throw error;
      throw new ConnectorError(`Failed to get batch results for ${batchId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Token counting
  // ---------------------------------------------------------------------------
  async countTokens(params: {
    model: string;
    messages: AnthropicMessage[];
    system?: string;
    tools?: AnthropicTool[];
  }): Promise<{ input_tokens: number }> {
    try {
      const response = await this.client.post("/messages/count_tokens", params);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to count tokens", error);
    }
  }

  estimateTokens(text: string): number {
    // Rough estimate: ~4 chars per token for English text
    return Math.ceil(text.length / 4);
  }
}

export function createAnthropicConnector(config: AnthropicConnectorConfig): AnthropicConnector {
  return new AnthropicConnector(config);
}
