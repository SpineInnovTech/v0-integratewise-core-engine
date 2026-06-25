import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface KustomerConfig extends ConnectorConfig {
  accessToken: string;
}

export class KustomerConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: KustomerConfig;

  constructor(config: KustomerConfig) {
    super(config);
    this.config = config;
    this.client = axios.create({
      baseURL: "https://api.kustomerapp.com/v1",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "kustomer",
      name: "Kustomer",
      version: "1.0.0",
      apiVersion: "v1",
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

  async getCustomers(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/customers", {
        params: {
          pageSize: params?.limit || 100,
          ...(params?.cursor ? { cursor: params.cursor } : {}),
        },
      });
      const customers = response.data?.data || [];
      const nextCursor = response.data?.links?.next
        ? new URL(response.data.links.next).searchParams.get("cursor")
        : undefined;
      return { data: customers, next_cursor: nextCursor || undefined };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Kustomer customers", error);
    }
  }

  async getConversations(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/conversations", {
        params: {
          pageSize: params?.limit || 100,
          ...(params?.cursor ? { cursor: params.cursor } : {}),
        },
      });
      const conversations = response.data?.data || [];
      const nextCursor = response.data?.links?.next
        ? new URL(response.data.links.next).searchParams.get("cursor")
        : undefined;
      return { data: conversations, next_cursor: nextCursor || undefined };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Kustomer conversations", error);
    }
  }

  async getUsers(): Promise<any[]> {
    try {
      const response = await this.client.get("/users");
      return response.data?.data || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Kustomer users", error);
    }
  }

  async getTeams(): Promise<any[]> {
    try {
      const response = await this.client.get("/teams");
      return response.data?.data || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Kustomer teams", error);
    }
  }
}
