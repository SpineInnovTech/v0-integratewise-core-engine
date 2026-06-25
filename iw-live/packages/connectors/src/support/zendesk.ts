import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface ZendeskConfig extends ConnectorConfig {
  subdomain: string;
  email: string;
  apiToken: string;
}

export class ZendeskConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: ZendeskConfig;

  constructor(config: ZendeskConfig) {
    super(config);
    this.config = config;
    const auth = Buffer.from(`${config.email}/token:${config.apiToken}`).toString("base64");
    this.client = axios.create({
      baseURL: `https://${config.subdomain}.zendesk.com/api/v2`,
      timeout: 30000,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "zendesk",
      name: "Zendesk",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/users/me");
      return true;
    } catch {
      return false;
    }
  }

  async getTickets(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    try {
      const queryParams: any = {
        per_page: params?.limit || 100,
      };

      if (params?.cursor) {
        queryParams.page = parseInt(params.cursor, 10);
      }

      if (params?.since) {
        queryParams.start_time = new Date(params.since).getTime() / 1000;
      }

      const response = await this.client.get("/tickets", { params: queryParams });
      const tickets = response.data?.tickets || [];

      // Check if there's a next page
      const nextPage = response.data?.next_page;
      const nextCursor = nextPage
        ? String((params?.cursor ? parseInt(params.cursor, 10) : 1) + 1)
        : undefined;

      return { data: tickets, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Zendesk tickets", error);
    }
  }

  async getUsers(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const queryParams: any = {
        per_page: params?.limit || 100,
      };

      if (params?.cursor) {
        queryParams.page = parseInt(params.cursor, 10);
      }

      const response = await this.client.get("/users", { params: queryParams });
      const users = response.data?.users || [];

      const nextPage = response.data?.next_page;
      const nextCursor = nextPage
        ? String((params?.cursor ? parseInt(params.cursor, 10) : 1) + 1)
        : undefined;

      return { data: users, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Zendesk users", error);
    }
  }

  async getOrganizations(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const queryParams: any = {
        per_page: params?.limit || 100,
      };

      if (params?.cursor) {
        queryParams.page = parseInt(params.cursor, 10);
      }

      const response = await this.client.get("/organizations", { params: queryParams });
      const organizations = response.data?.organizations || [];

      const nextPage = response.data?.next_page;
      const nextCursor = nextPage
        ? String((params?.cursor ? parseInt(params.cursor, 10) : 1) + 1)
        : undefined;

      return { data: organizations, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Zendesk organizations", error);
    }
  }
}
