import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface CloseConfig extends ConnectorConfig {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
}

export class CloseConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: CloseConfig;

  constructor(config: CloseConfig) {
    super(config);
    this.config = config;
    const apiKey = config.apiKey || config.accessToken || "";
    const encoded = Buffer.from(`${apiKey}:`).toString("base64");

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.close.com/api/v1",
      timeout: 30000,
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("Close authentication failed", error);
        if (error.response?.status === 403)
          throw new ConnectorError("Close permission denied", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Close rate limit exceeded", error);
        throw new ConnectorError(
          `Close API error: ${error.response?.data?.error || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "close",
      name: "Close",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/me/");
      return response.status === 200 && !!response.data?.id;
    } catch {
      return false;
    }
  }

  async getContacts(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    const limit = Math.max(1, Math.min(params?.limit || 100, 200));
    const skip = Math.max(0, parseInt(params?.cursor || "0", 10) || 0);
    const response = await this.client.get("/contact/", {
      params: {
        _limit: limit,
        _skip: skip,
        ...(params?.since ? { date_updated__gt: params.since } : {}),
      },
    });
    const rows = response.data?.data || [];
    const hasMore = Boolean(response.data?.has_more) || rows.length >= limit;
    return {
      data: rows,
      next_cursor: hasMore ? String(skip + rows.length) : undefined,
    };
  }

  async getAccounts(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    const limit = Math.max(1, Math.min(params?.limit || 100, 200));
    const skip = Math.max(0, parseInt(params?.cursor || "0", 10) || 0);
    const response = await this.client.get("/lead/", {
      params: {
        _limit: limit,
        _skip: skip,
        ...(params?.since ? { date_updated__gt: params.since } : {}),
      },
    });
    const rows = response.data?.data || [];
    const hasMore = Boolean(response.data?.has_more) || rows.length >= limit;
    return {
      data: rows,
      next_cursor: hasMore ? String(skip + rows.length) : undefined,
    };
  }

  async getDeals(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    const limit = Math.max(1, Math.min(params?.limit || 100, 200));
    const skip = Math.max(0, parseInt(params?.cursor || "0", 10) || 0);
    const response = await this.client.get("/opportunity/", {
      params: {
        _limit: limit,
        _skip: skip,
        ...(params?.since ? { date_updated__gt: params.since } : {}),
      },
    });
    const rows = response.data?.data || [];
    const hasMore = Boolean(response.data?.has_more) || rows.length >= limit;
    return {
      data: rows,
      next_cursor: hasMore ? String(skip + rows.length) : undefined,
    };
  }
}
