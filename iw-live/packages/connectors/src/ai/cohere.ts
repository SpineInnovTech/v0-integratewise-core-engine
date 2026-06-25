import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Cohere Connector — Cohere API v2 (Capability Connector)
// Real connection → Live verification. NOT a Flow A workspace-hydration connector.
// ============================================================================

export interface CohereConfig extends ConnectorConfig {
  apiKey: string;
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------
export interface CohereModel {
  name: string;
  endpoints: string[];
  finetuned: boolean;
  context_length?: number;
  tokenizer_url?: string;
  default_endpoints?: string[];
}

export interface CohereChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
}

export interface CohereChatParams {
  model: string;
  messages: CohereChatMessage[];
  temperature?: number;
  max_tokens?: number;
  k?: number;
  p?: number;
  stop_sequences?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  tools?: Array<{
    type: "function";
    function: {
      name: string;
      description?: string;
      parameters?: Record<string, any>;
    };
  }>;
  response_format?: { type: "text" | "json_object" };
  seed?: number;
  stream?: boolean;
}

export interface CohereChatResponse {
  id: string;
  message: {
    role: "assistant";
    content: Array<{ type: "text"; text: string }>;
    tool_calls?: Array<{
      id: string;
      type: "function";
      function: { name: string; arguments: string };
    }>;
  };
  finish_reason: "COMPLETE" | "MAX_TOKENS" | "STOP_SEQUENCE" | "TOOL_CALL" | "ERROR";
  usage: {
    billed_units: { input_tokens: number; output_tokens: number };
    tokens: { input_tokens: number; output_tokens: number };
  };
}

export interface CohereEmbedParams {
  model: string;
  texts: string[];
  input_type: "search_document" | "search_query" | "classification" | "clustering" | "image";
  embedding_types?: Array<"float" | "int8" | "uint8" | "binary" | "ubinary">;
  truncate?: "NONE" | "START" | "END";
}

export interface CohereEmbedResponse {
  id: string;
  embeddings: {
    float?: number[][];
    int8?: number[][];
    uint8?: number[][];
    binary?: number[][];
    ubinary?: number[][];
  };
  texts: string[];
  meta: { api_version: { version: string } };
}

export interface CohereRerankParams {
  model: string;
  query: string;
  documents: Array<string | { text: string; [key: string]: any }>;
  top_n?: number;
  return_documents?: boolean;
  max_chunks_per_doc?: number;
}

export interface CohereRerankResponse {
  id: string;
  results: Array<{
    index: number;
    relevance_score: number;
    document?: { text: string; [key: string]: any };
  }>;
  meta: { api_version: { version: string }; billed_units: { search_units: number } };
}

export interface CohereClassifyParams {
  model?: string;
  inputs: string[];
  examples: Array<{ text: string; label: string }>;
  preset?: string;
  truncate?: string;
}

export interface CohereClassifyResponse {
  id: string;
  classifications: Array<{
    id: string;
    input: string;
    prediction: string;
    predictions: string[];
    confidence: number;
    confidences: number[];
    labels: Record<string, { confidence: number }>;
  }>;
  meta: { api_version: { version: string } };
}

export class CohereConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: CohereConfig;

  constructor(config: CohereConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.cohere.com/v2",
      timeout: 120000,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "X-Client-Name": "integratewise",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.message || error.message;
        if (status === 401) throw new ConnectorError("Invalid Cohere API key", error);
        if (status === 429) throw new ConnectorError(`Cohere rate limit exceeded: ${msg}`, error);
        if (status === 400) throw new ConnectorError(`Cohere bad request: ${msg}`, error);
        if (status === 404) throw new ConnectorError(`Cohere resource not found: ${msg}`, error);
        if (status === 500 || status === 503)
          throw new ConnectorError(`Cohere server error: ${msg}`, error);
        throw new ConnectorError(`Cohere API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "cohere",
      name: "Cohere",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: false, webhooks: false },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      // Use v1 models endpoint for a lightweight check
      const response = await axios.get("https://api.cohere.com/v1/models", {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
        timeout: 10000,
      });
      return response.status === 200 && Array.isArray(response.data.models);
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Models
  // ---------------------------------------------------------------------------
  async listModels(params?: {
    page_size?: number;
    page_token?: string;
    endpoint?: string;
    default_only?: boolean;
  }): Promise<{ models: CohereModel[]; next_page_token?: string }> {
    try {
      const response = await axios.get("https://api.cohere.com/v1/models", {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
        params,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Cohere models", error);
    }
  }

  async getModel(modelName: string): Promise<CohereModel> {
    try {
      const response = await axios.get(`https://api.cohere.com/v1/models/${modelName}`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get model ${modelName}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Chat (v2)
  // ---------------------------------------------------------------------------
  async chat(params: CohereChatParams): Promise<CohereChatResponse> {
    try {
      const response = await this.client.post("/chat", { ...params, stream: false });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Cohere chat completion", error);
    }
  }

  async *streamChat(params: CohereChatParams): AsyncGenerator<any, void, undefined> {
    try {
      const response = await this.client.post(
        "/chat",
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
            // skip malformed SSE lines
          }
        }
      }
    } catch (error) {
      throw new ConnectorError("Failed to stream Cohere chat", error);
    }
  }

  /**
   * Convenience: simple text message → text response
   */
  async simpleChat(
    userMessage: string,
    options?: {
      model?: string;
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<{ text: string; usage: CohereChatResponse["usage"]; finishReason: string }> {
    const messages: CohereChatMessage[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: userMessage });

    const response = await this.chat({
      model: options?.model || "command-r-plus",
      messages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature,
    });

    const textBlocks = response.message.content.filter((b) => b.type === "text");
    return {
      text: textBlocks.map((b) => b.text).join(""),
      usage: response.usage,
      finishReason: response.finish_reason,
    };
  }

  // ---------------------------------------------------------------------------
  // Embeddings (v2)
  // ---------------------------------------------------------------------------
  async embed(params: CohereEmbedParams): Promise<CohereEmbedResponse> {
    try {
      const response = await this.client.post("/embed", params);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Cohere embeddings", error);
    }
  }

  async createBatchEmbeddings(
    texts: string[],
    inputType: CohereEmbedParams["input_type"] = "search_document",
    model: string = "embed-english-v3.0",
    batchSize: number = 96
  ): Promise<number[][]> {
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const result = await this.embed({
        model,
        texts: batch,
        input_type: inputType,
        embedding_types: ["float"],
      });
      if (result.embeddings.float) {
        allEmbeddings.push(...result.embeddings.float);
      }
    }
    return allEmbeddings;
  }

  // ---------------------------------------------------------------------------
  // Rerank (v2)
  // ---------------------------------------------------------------------------
  async rerank(params: CohereRerankParams): Promise<CohereRerankResponse> {
    try {
      const response = await this.client.post("/rerank", params);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to rerank with Cohere", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Classify (v1 — no v2 equivalent yet)
  // ---------------------------------------------------------------------------
  async classify(params: CohereClassifyParams): Promise<CohereClassifyResponse> {
    try {
      const response = await axios.post("https://api.cohere.com/v1/classify", params, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to classify with Cohere", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Token counting helper
  // ---------------------------------------------------------------------------
  estimateTokens(text: string): number {
    // Rough estimate: ~4 chars per token for English
    return Math.ceil(text.length / 4);
  }
}

export function createCohereConnector(config: CohereConfig): CohereConnector {
  return new CohereConnector(config);
}
