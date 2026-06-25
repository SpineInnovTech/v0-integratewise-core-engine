import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface IntercomConfig extends ConnectorConfig {
  accessToken: string;
}

export class IntercomConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: IntercomConfig;

  constructor(config: IntercomConfig) {
    super(config);
    this.config = config;
    this.client = axios.create({
      baseURL: "https://api.intercom.io",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
        "Intercom-Version": "2.10",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "intercom",
      name: "Intercom",
      version: "1.0.0",
      apiVersion: "v2.10",
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

  async getContacts(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/contacts", {
        params: {
          per_page: params?.limit || 50,
          ...(params?.cursor ? { starting_after: params.cursor } : {}),
        },
      });
      const contacts = response.data?.data || [];
      const nextCursor = response.data?.pages?.next?.starting_after;
      return { data: contacts, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Intercom contacts", error);
    }
  }

  async getCompanies(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/companies", {
        params: {
          per_page: params?.limit || 50,
          ...(params?.cursor ? { starting_after: params.cursor } : {}),
        },
      });
      const companies = response.data?.data || [];
      const nextCursor = response.data?.pages?.next?.starting_after;
      return { data: companies, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Intercom companies", error);
    }
  }

  async getConversations(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/conversations", {
        params: {
          per_page: params?.limit || 20,
          ...(params?.cursor ? { starting_after: params.cursor } : {}),
        },
      });
      const conversations = response.data?.conversations || [];
      const nextCursor = response.data?.pages?.next?.starting_after;
      return { data: conversations, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Intercom conversations", error);
    }
  }

  async getAdmins(): Promise<any[]> {
    try {
      const response = await this.client.get("/admins");
      return response.data?.admins || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Intercom admins", error);
    }
  }

  async getTags(): Promise<any[]> {
    try {
      const response = await this.client.get("/tags");
      return response.data?.data || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Intercom tags", error);
    }
  }
}
