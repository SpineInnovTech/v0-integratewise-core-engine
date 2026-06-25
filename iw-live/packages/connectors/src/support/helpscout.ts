import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface HelpScoutConfig extends ConnectorConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

export class HelpScoutConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: HelpScoutConfig;

  constructor(config: HelpScoutConfig) {
    super(config);
    this.config = config;
    this.client = axios.create({
      baseURL: "https://api.helpscout.net/v2",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "helpscout",
      name: "Help Scout",
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

  async refreshAccessToken(): Promise<string> {
    try {
      const response = await axios.post("https://api.helpscout.net/v2/oauth2/token", {
        grant_type: "client_credentials",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });
      const token = response.data.access_token as string;
      this.config.accessToken = token;
      this.client.defaults.headers.Authorization = `Bearer ${token}`;
      return token;
    } catch (error) {
      throw new ConnectorError("Failed to refresh Help Scout access token", error);
    }
  }

  async getConversations(params?: { limit?: number; cursor?: string; status?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/conversations", {
        params: {
          status: params?.status || "all",
          pageSize: params?.limit || 25,
          ...(params?.cursor ? { page: params.cursor } : {}),
        },
      });
      const conversations = response.data?._embedded?.conversations || [];
      const nextCursor =
        response.data?.page?.number < response.data?.page?.totalPages
          ? String(response.data.page.number + 1)
          : undefined;
      return { data: conversations, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Help Scout conversations", error);
    }
  }

  async getCustomers(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/customers", {
        params: {
          pageSize: params?.limit || 50,
          ...(params?.cursor ? { page: params.cursor } : {}),
        },
      });
      const customers = response.data?._embedded?.customers || [];
      const nextCursor =
        response.data?.page?.number < response.data?.page?.totalPages
          ? String(response.data.page.number + 1)
          : undefined;
      return { data: customers, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Help Scout customers", error);
    }
  }

  async getMailboxes(): Promise<any[]> {
    try {
      const response = await this.client.get("/mailboxes");
      return response.data?._embedded?.mailboxes || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Help Scout mailboxes", error);
    }
  }

  async getUsers(): Promise<any[]> {
    try {
      const response = await this.client.get("/users");
      return response.data?._embedded?.users || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Help Scout users", error);
    }
  }
}
