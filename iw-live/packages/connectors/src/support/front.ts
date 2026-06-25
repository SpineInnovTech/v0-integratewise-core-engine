import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface FrontConfig extends ConnectorConfig {
  accessToken: string;
}

export class FrontConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: FrontConfig;

  constructor(config: FrontConfig) {
    super(config);
    this.config = config;
    this.client = axios.create({
      baseURL: "https://api2.frontapp.com",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "front",
      name: "Front",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/me");
      return true;
    } catch {
      return false;
    }
  }

  async getConversations(params?: { limit?: number; cursor?: string; status?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/conversations", {
        params: {
          limit: params?.limit || 50,
          ...(params?.cursor ? { page_token: params.cursor } : {}),
          ...(params?.status ? { status: params.status } : {}),
        },
      });
      const conversations = response.data?._results || [];
      const nextCursor = response.data?._pagination?.next?.url
        ? new URL(response.data._pagination.next.url).searchParams.get("page_token")
        : undefined;
      return { data: conversations, next_cursor: nextCursor || undefined };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Front conversations", error);
    }
  }

  async getContacts(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/contacts", {
        params: {
          limit: params?.limit || 50,
          ...(params?.cursor ? { page_token: params.cursor } : {}),
        },
      });
      const contacts = response.data?._results || [];
      const nextCursor = response.data?._pagination?.next?.url
        ? new URL(response.data._pagination.next.url).searchParams.get("page_token")
        : undefined;
      return { data: contacts, next_cursor: nextCursor || undefined };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Front contacts", error);
    }
  }

  async getTeammates(): Promise<any[]> {
    try {
      const response = await this.client.get("/teammates");
      return response.data?._results || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Front teammates", error);
    }
  }

  async getTags(): Promise<any[]> {
    try {
      const response = await this.client.get("/tags");
      return response.data?._results || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Front tags", error);
    }
  }

  async getInboxes(): Promise<any[]> {
    try {
      const response = await this.client.get("/inboxes");
      return response.data?._results || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Front inboxes", error);
    }
  }
}
