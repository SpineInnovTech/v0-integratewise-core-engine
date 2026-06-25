import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// OpenAI Connector — OpenAI API v1
// ============================================================================

export interface OpenAIConfig extends ConnectorConfig {
  apiKey: string;
  organizationId?: string;
  baseUrl?: string;
}

export interface OpenAIModel {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
}

export interface OpenAIChatMessage {
  role: "system" | "user" | "assistant" | "tool" | "function";
  content: string | null;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export interface OpenAIChatCompletionParams {
  model: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  max_tokens?: number;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  tools?: Array<{
    type: "function";
    function: { name: string; description?: string; parameters?: Record<string, any> };
  }>;
  tool_choice?: "none" | "auto" | "required" | { type: "function"; function: { name: string } };
  response_format?: {
    type: "text" | "json_object" | "json_schema";
    json_schema?: Record<string, any>;
  };
  seed?: number;
  user?: string;
  stream?: boolean;
}

export interface OpenAIChatCompletion {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIChatMessage;
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter";
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  system_fingerprint?: string;
}

export interface OpenAIEmbeddingParams {
  model: string;
  input: string | string[];
  encoding_format?: "float" | "base64";
  dimensions?: number;
  user?: string;
}

export interface OpenAIEmbeddingResponse {
  object: "list";
  data: Array<{ object: "embedding"; index: number; embedding: number[] }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

export interface OpenAIImageGenerateParams {
  model?: "dall-e-2" | "dall-e-3";
  prompt: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  response_format?: "url" | "b64_json";
  style?: "vivid" | "natural";
  user?: string;
}

export interface OpenAIImageResponse {
  created: number;
  data: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>;
}

export interface OpenAIModerationResult {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: Record<string, boolean>;
    category_scores: Record<string, number>;
  }>;
}

export interface OpenAIFile {
  id: string;
  object: "file";
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
  status: string;
}

export interface OpenAIAssistant {
  id: string;
  object: "assistant";
  name: string | null;
  description: string | null;
  model: string;
  instructions: string | null;
  tools: Array<{ type: string; [key: string]: any }>;
  metadata: Record<string, string>;
  created_at: number;
}

export interface OpenAIThread {
  id: string;
  object: "thread";
  created_at: number;
  metadata: Record<string, string>;
}

export interface OpenAIThreadMessage {
  id: string;
  object: "thread.message";
  created_at: number;
  thread_id: string;
  role: "user" | "assistant";
  content: Array<{
    type: "text" | "image_file";
    text?: { value: string; annotations: any[] };
    image_file?: { file_id: string };
  }>;
  assistant_id: string | null;
  run_id: string | null;
  metadata: Record<string, string>;
}

export interface OpenAIRun {
  id: string;
  object: "thread.run";
  created_at: number;
  thread_id: string;
  assistant_id: string;
  status:
    | "queued"
    | "in_progress"
    | "requires_action"
    | "cancelling"
    | "cancelled"
    | "failed"
    | "completed"
    | "expired";
  model: string;
  instructions: string | null;
  tools: Array<{ type: string }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null;
}

export class OpenAIConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    super(config);
    this.config = config;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };
    if (config.organizationId) headers["OpenAI-Organization"] = config.organizationId;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.openai.com/v1",
      timeout: 120000,
      headers,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.error?.message || error.message;
        if (status === 401) throw new ConnectorError("Invalid OpenAI API key", error);
        if (status === 429) throw new ConnectorError(`OpenAI rate limit exceeded: ${msg}`, error);
        if (status === 400) throw new ConnectorError(`OpenAI bad request: ${msg}`, error);
        if (status === 404) throw new ConnectorError(`OpenAI resource not found: ${msg}`, error);
        if (status === 500 || status === 503)
          throw new ConnectorError(`OpenAI server error: ${msg}`, error);
        throw new ConnectorError(`OpenAI API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "openai",
      name: "OpenAI",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: false, webhooks: false },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/models");
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Models
  // ---------------------------------------------------------------------------
  async listModels(): Promise<OpenAIModel[]> {
    try {
      const response = await this.client.get("/models");
      return response.data.data;
    } catch (error) {
      throw new ConnectorError("Failed to list OpenAI models", error);
    }
  }

  async getModel(modelId: string): Promise<OpenAIModel> {
    try {
      const response = await this.client.get(`/models/${modelId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get model ${modelId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Chat Completions
  // ---------------------------------------------------------------------------
  async createChatCompletion(params: OpenAIChatCompletionParams): Promise<OpenAIChatCompletion> {
    try {
      const response = await this.client.post("/chat/completions", { ...params, stream: false });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create chat completion", error);
    }
  }

  async *streamChatCompletion(params: OpenAIChatCompletionParams): AsyncGenerator<
    {
      id: string;
      choices: Array<{
        delta: Partial<OpenAIChatMessage>;
        finish_reason: string | null;
        index: number;
      }>;
    },
    void,
    undefined
  > {
    try {
      const response = await this.client.post(
        "/chat/completions",
        { ...params, stream: true },
        { responseType: "stream" }
      );
      const stream = response.data;
      let buffer = "";

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") return;
          try {
            yield JSON.parse(data);
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (error) {
      throw new ConnectorError("Failed to stream chat completion", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Embeddings
  // ---------------------------------------------------------------------------
  async createEmbedding(params: OpenAIEmbeddingParams): Promise<OpenAIEmbeddingResponse> {
    try {
      const response = await this.client.post("/embeddings", params);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create embedding", error);
    }
  }

  async createBatchEmbeddings(
    texts: string[],
    model: string = "text-embedding-3-small",
    batchSize: number = 2048
  ): Promise<number[][]> {
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const result = await this.createEmbedding({ model, input: batch });
      allEmbeddings.push(...result.data.map((d) => d.embedding));
    }
    return allEmbeddings;
  }

  // ---------------------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------------------
  async generateImage(params: OpenAIImageGenerateParams): Promise<OpenAIImageResponse> {
    try {
      const response = await this.client.post("/images/generations", params);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to generate image", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Moderation
  // ---------------------------------------------------------------------------
  async moderate(input: string | string[], model?: string): Promise<OpenAIModerationResult> {
    try {
      const response = await this.client.post("/moderations", { input, model });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to moderate content", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Files
  // ---------------------------------------------------------------------------
  async listFiles(purpose?: string): Promise<OpenAIFile[]> {
    try {
      const response = await this.client.get("/files", {
        params: purpose ? { purpose } : undefined,
      });
      return response.data.data;
    } catch (error) {
      throw new ConnectorError("Failed to list OpenAI files", error);
    }
  }

  async getFile(fileId: string): Promise<OpenAIFile> {
    try {
      const response = await this.client.get(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get file ${fileId}`, error);
    }
  }

  async deleteFile(fileId: string): Promise<{ id: string; deleted: boolean }> {
    try {
      const response = await this.client.delete(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to delete file ${fileId}`, error);
    }
  }

  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await this.client.get(`/files/${fileId}/content`, { responseType: "text" });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get file content ${fileId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Assistants API
  // ---------------------------------------------------------------------------
  async listAssistants(params?: {
    limit?: number;
    order?: "asc" | "desc";
    after?: string;
    before?: string;
  }): Promise<{ data: OpenAIAssistant[] }> {
    try {
      const response = await this.client.get("/assistants", {
        params,
        headers: { "OpenAI-Beta": "assistants=v2" },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list assistants", error);
    }
  }

  async createAssistant(body: {
    model: string;
    name?: string;
    description?: string;
    instructions?: string;
    tools?: Array<{ type: string; [key: string]: any }>;
    metadata?: Record<string, string>;
  }): Promise<OpenAIAssistant> {
    try {
      const response = await this.client.post("/assistants", body, {
        headers: { "OpenAI-Beta": "assistants=v2" },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create assistant", error);
    }
  }

  async getAssistant(assistantId: string): Promise<OpenAIAssistant> {
    try {
      const response = await this.client.get(`/assistants/${assistantId}`, {
        headers: { "OpenAI-Beta": "assistants=v2" },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get assistant ${assistantId}`, error);
    }
  }

  async deleteAssistant(assistantId: string): Promise<{ id: string; deleted: boolean }> {
    try {
      const response = await this.client.delete(`/assistants/${assistantId}`, {
        headers: { "OpenAI-Beta": "assistants=v2" },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to delete assistant ${assistantId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Threads
  // ---------------------------------------------------------------------------
  async createThread(
    messages?: Array<{ role: "user"; content: string }>,
    metadata?: Record<string, string>
  ): Promise<OpenAIThread> {
    try {
      const response = await this.client.post(
        "/threads",
        { messages, metadata },
        {
          headers: { "OpenAI-Beta": "assistants=v2" },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create thread", error);
    }
  }

  async getThread(threadId: string): Promise<OpenAIThread> {
    try {
      const response = await this.client.get(`/threads/${threadId}`, {
        headers: { "OpenAI-Beta": "assistants=v2" },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get thread ${threadId}`, error);
    }
  }

  async deleteThread(threadId: string): Promise<{ id: string; deleted: boolean }> {
    try {
      const response = await this.client.delete(`/threads/${threadId}`, {
        headers: { "OpenAI-Beta": "assistants=v2" },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to delete thread ${threadId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Thread Messages
  // ---------------------------------------------------------------------------
  async listThreadMessages(
    threadId: string,
    params?: { limit?: number; order?: "asc" | "desc"; after?: string; before?: string }
  ): Promise<{ data: OpenAIThreadMessage[] }> {
    try {
      const response = await this.client.get(`/threads/${threadId}/messages`, {
        params,
        headers: { "OpenAI-Beta": "assistants=v2" },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list messages in thread ${threadId}`, error);
    }
  }

  async addThreadMessage(
    threadId: string,
    content: string,
    role: "user" = "user",
    metadata?: Record<string, string>
  ): Promise<OpenAIThreadMessage> {
    try {
      const response = await this.client.post(
        `/threads/${threadId}/messages`,
        { role, content, metadata },
        {
          headers: { "OpenAI-Beta": "assistants=v2" },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to add message to thread ${threadId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Runs
  // ---------------------------------------------------------------------------
  async createRun(
    threadId: string,
    assistantId: string,
    options?: { instructions?: string; model?: string; tools?: any[] }
  ): Promise<OpenAIRun> {
    try {
      const response = await this.client.post(
        `/threads/${threadId}/runs`,
        { assistant_id: assistantId, ...options },
        {
          headers: { "OpenAI-Beta": "assistants=v2" },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create run in thread ${threadId}`, error);
    }
  }

  async getRun(threadId: string, runId: string): Promise<OpenAIRun> {
    try {
      const response = await this.client.get(`/threads/${threadId}/runs/${runId}`, {
        headers: { "OpenAI-Beta": "assistants=v2" },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get run ${runId}`, error);
    }
  }

  async cancelRun(threadId: string, runId: string): Promise<OpenAIRun> {
    try {
      const response = await this.client.post(`/threads/${threadId}/runs/${runId}/cancel`, null, {
        headers: { "OpenAI-Beta": "assistants=v2" },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to cancel run ${runId}`, error);
    }
  }

  async submitToolOutputs(
    threadId: string,
    runId: string,
    toolOutputs: Array<{ tool_call_id: string; output: string }>
  ): Promise<OpenAIRun> {
    try {
      const response = await this.client.post(
        `/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
        { tool_outputs: toolOutputs },
        {
          headers: { "OpenAI-Beta": "assistants=v2" },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to submit tool outputs for run ${runId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Token counting helper
  // ---------------------------------------------------------------------------
  estimateTokens(text: string): number {
    // Rough estimate: ~4 chars per token for English text
    return Math.ceil(text.length / 4);
  }
}

export function createOpenAIConnector(config: OpenAIConfig): OpenAIConnector {
  return new OpenAIConnector(config);
}
