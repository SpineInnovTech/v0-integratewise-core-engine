import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface FreshsalesConfig extends ConnectorConfig {
  apiKey?: string;
  accessToken?: string;
  domain?: string;
  baseUrl?: string;
}

export class FreshsalesConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: FreshsalesConfig;

  constructor(config: FreshsalesConfig) {
    super(config);
    this.config = config;

    const apiKey = config.apiKey || config.accessToken || "";

    const baseURL =
      config.baseUrl ||
      (config.domain
        ? `https://${config.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/api`
        : "https://api.freshsales.io/api");

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Token token=${apiKey}` } : {}),
        ...(apiKey ? { "api-token": apiKey } : {}),
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("Freshsales authentication failed", error);
        if (error.response?.status === 403)
          throw new ConnectorError("Freshsales permission denied", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Freshsales rate limit exceeded", error);
        throw new ConnectorError(
          `Freshsales API error: ${error.response?.data?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "freshsales",
      name: "Freshsales",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.getWithFallback(["/users/me", "/v2/users/me"], {});
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async getContacts(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    const page = Math.max(1, parseInt(params?.cursor || "1", 10) || 1);
    const perPage = Math.max(1, Math.min(params?.limit || 100, 100));
    const response = await this.getWithFallback(
      ["/contacts", "/v2/contacts", "/crm/sales/api/contacts"],
      {
        page,
        per_page: perPage,
        ...(params?.since ? { updated_since: params.since } : {}),
      }
    );
    const rows = response.data?.contacts || response.data?.data || [];
    const hasMore =
      Boolean(response.data?.meta?.has_more) ||
      (Array.isArray(rows) && rows.length >= perPage && !response.data?.meta?.total_pages);
    return {
      data: rows,
      next_cursor: hasMore ? String(page + 1) : undefined,
    };
  }

  async getAccounts(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    const page = Math.max(1, parseInt(params?.cursor || "1", 10) || 1);
    const perPage = Math.max(1, Math.min(params?.limit || 100, 100));
    const response = await this.getWithFallback(
      ["/accounts", "/v2/accounts", "/sales_accounts", "/v2/sales_accounts"],
      {
        page,
        per_page: perPage,
        ...(params?.since ? { updated_since: params.since } : {}),
      }
    );
    const rows =
      response.data?.accounts || response.data?.sales_accounts || response.data?.data || [];
    const hasMore =
      Boolean(response.data?.meta?.has_more) ||
      (Array.isArray(rows) && rows.length >= perPage && !response.data?.meta?.total_pages);
    return {
      data: rows,
      next_cursor: hasMore ? String(page + 1) : undefined,
    };
  }

  async getDeals(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    const page = Math.max(1, parseInt(params?.cursor || "1", 10) || 1);
    const perPage = Math.max(1, Math.min(params?.limit || 100, 100));
    const response = await this.getWithFallback(["/deals", "/v2/deals", "/crm/sales/api/deals"], {
      page,
      per_page: perPage,
      ...(params?.since ? { updated_since: params.since } : {}),
    });
    const rows = response.data?.deals || response.data?.data || [];
    const hasMore =
      Boolean(response.data?.meta?.has_more) ||
      (Array.isArray(rows) && rows.length >= perPage && !response.data?.meta?.total_pages);
    return {
      data: rows,
      next_cursor: hasMore ? String(page + 1) : undefined,
    };
  }

  private async getWithFallback(paths: string[], params: Record<string, unknown>) {
    let lastError: unknown = null;
    for (const path of paths) {
      try {
        return await this.client.get(path, { params });
      } catch (error: any) {
        const status = error?.response?.status;
        if (status !== 404) throw error;
        lastError = error;
      }
    }
    throw lastError || new ConnectorError("Freshsales endpoint not found");
  }
}
