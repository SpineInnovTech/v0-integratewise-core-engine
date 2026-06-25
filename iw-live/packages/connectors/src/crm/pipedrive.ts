import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface PipedriveConfig extends ConnectorConfig {
  accessToken?: string;
  apiToken?: string;
  baseUrl?: string;
  companyDomain?: string;
}

type PipedriveListResponse<T> = {
  data?: T[];
  additional_data?: {
    pagination?: {
      start?: number;
      limit?: number;
      more_items_in_collection?: boolean;
      next_start?: number;
    };
  };
};

export class PipedriveConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: PipedriveConfig;

  constructor(config: PipedriveConfig) {
    super(config);
    this.config = config;

    const baseURL =
      config.baseUrl ||
      (config.companyDomain
        ? `https://${config.companyDomain}.pipedrive.com/api/v1`
        : "https://api.pipedrive.com/v1");

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (config.accessToken) {
      headers.Authorization = `Bearer ${config.accessToken}`;
    }

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers,
    });

    this.client.interceptors.request.use((requestConfig) => {
      if (!this.config.accessToken && this.config.apiToken) {
        requestConfig.params = { ...(requestConfig.params || {}), api_token: this.config.apiToken };
      }
      return requestConfig;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("Pipedrive authentication failed", error);
        if (error.response?.status === 403)
          throw new ConnectorError("Pipedrive permission denied", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Pipedrive rate limit exceeded", error);
        throw new ConnectorError(
          `Pipedrive API error: ${error.response?.data?.error || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "pipedrive",
      name: "Pipedrive",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/users/me");
      return response.status === 200 && !!response.data?.data?.id;
    } catch {
      return false;
    }
  }

  async getPersons(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    return this.listEntity("/persons", params);
  }

  async getOrganizations(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    return this.listEntity("/organizations", params);
  }

  async getDeals(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    return this.listEntity("/deals", params);
  }

  async getContacts(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    return this.getPersons(params);
  }

  async getAccounts(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    return this.getOrganizations(params);
  }

  private async listEntity(
    path: "/persons" | "/organizations" | "/deals",
    params?: { limit?: number; cursor?: string; since?: string }
  ): Promise<{ data: any[]; next_cursor?: string }> {
    const limit = Math.max(1, Math.min(params?.limit || 100, 500));
    const start = Math.max(0, parseInt(params?.cursor || "0", 10) || 0);

    const query: Record<string, string | number> = {
      limit,
      start,
    };
    if (params?.since) {
      query.updated_since = params.since;
    }

    try {
      const response = await this.client.get(path, { params: query });
      const payload: PipedriveListResponse<any> = response.data || {};
      const list = payload.data || [];
      const pagination = payload.additional_data?.pagination;
      const nextCursor = pagination?.more_items_in_collection
        ? String(pagination.next_start ?? start + limit)
        : undefined;
      return {
        data: list,
        next_cursor: nextCursor,
      };
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Pipedrive ${path.replace("/", "")}`, error);
    }
  }
}
