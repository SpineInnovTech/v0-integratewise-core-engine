import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface ChargebeeConfig extends ConnectorConfig {
  site?: string;
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
  provider_workspace_id?: string;
  provider_workspace_name?: string;
}

type ChargebeeListEnvelope<T> = {
  list?: Array<Record<string, T>>;
  next_offset?: string;
};

export class ChargebeeConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: ChargebeeConfig;

  constructor(config: ChargebeeConfig) {
    super(config);
    this.config = config;

    const key = config.apiKey || config.accessToken || "";

    const site =
      config.site ||
      config.provider_workspace_id ||
      config.provider_workspace_name ||
      (typeof config.metadata?.site === "string" ? config.metadata.site : undefined);
    const baseURL =
      config.baseUrl ||
      (site
        ? `https://${String(site).replace(/\.chargebee\.com$/, "")}.chargebee.com/api/v2`
        : "https://example.chargebee.com/api/v2");

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        ...(key ? { Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}` } : {}),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("Chargebee authentication failed", error);
        if (error.response?.status === 403)
          throw new ConnectorError("Chargebee permission denied", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Chargebee rate limit exceeded", error);
        throw new ConnectorError(
          `Chargebee API error: ${error.response?.data?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "chargebee",
      name: "Chargebee",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/customers", { params: { limit: 1 } });
      return response.status === 200 && Array.isArray(response.data?.list);
    } catch {
      return false;
    }
  }

  async getCustomers(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    const response = await this.client.get("/customers", {
      params: this.buildListParams(params),
    });
    return this.unwrapList("customer", response.data);
  }

  async getSubscriptions(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    const response = await this.client.get("/subscriptions", {
      params: this.buildListParams(params),
    });
    return this.unwrapList("subscription", response.data);
  }

  async getInvoices(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    const response = await this.client.get("/invoices", {
      params: this.buildListParams(params),
    });
    return this.unwrapList("invoice", response.data);
  }

  private buildListParams(params?: { limit?: number; cursor?: string; since?: string }) {
    const query: Record<string, string | number> = {
      limit: Math.max(1, Math.min(params?.limit || 100, 100)),
    };
    if (params?.cursor) {
      query.offset = params.cursor;
    }
    if (params?.since) {
      const parsed = new Date(params.since);
      if (!Number.isNaN(parsed.getTime())) {
        query["updated_at[after]"] = Math.floor(parsed.getTime() / 1000);
      }
    }
    return query;
  }

  private unwrapList(
    entityKey: string,
    payload: ChargebeeListEnvelope<any>
  ): {
    data: any[];
    next_cursor?: string;
  } {
    const list = payload?.list || [];
    return {
      data: list.map((entry) => entry?.[entityKey]).filter(Boolean),
      next_cursor: payload?.next_offset,
    };
  }
}
