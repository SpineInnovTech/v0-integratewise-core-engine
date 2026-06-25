import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface ZohoCRMConfig extends ConnectorConfig {
  accessToken: string;
  refreshToken?: string;
  apiDomain?: string; // e.g., https://www.zohoapis.com
  clientId?: string;
  clientSecret?: string;
}

export class ZohoCRMConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: ZohoCRMConfig;

  constructor(config: ZohoCRMConfig) {
    super(config);
    this.config = config;
    const baseURL = (config.apiDomain || "https://www.zohoapis.com").replace(/\/$/, "");
    this.client = axios.create({
      baseURL: `${baseURL}/crm/v2`,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "zoho-crm",
      name: "Zoho CRM",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/users?type=CurrentUser");
      return true;
    } catch {
      return false;
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.config.refreshToken || !this.config.clientId || !this.config.clientSecret) {
      throw new ConnectorError("Missing required credentials for token refresh");
    }
    try {
      const response = await axios.post("https://accounts.zoho.com/oauth/v2/token", null, {
        params: {
          refresh_token: this.config.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: "refresh_token",
        },
      });
      this.config.accessToken = response.data.access_token;
      // Update client with new token
      this.client.defaults.headers.Authorization = `Bearer ${this.config.accessToken}`;
      return this.config.accessToken;
    } catch (error) {
      throw new ConnectorError("Failed to refresh Zoho CRM access token", error);
    }
  }

  async getContacts(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    try {
      const response = await this.client.get("/Contacts", {
        params: {
          per_page: params?.limit || 200,
          page_token: params?.cursor,
        },
      });
      const contacts = response.data?.data || [];
      const nextCursor = response.data?.info?.next_page_token;
      return { data: contacts, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Zoho CRM contacts", error);
    }
  }

  async getAccounts(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    try {
      const response = await this.client.get("/Accounts", {
        params: {
          per_page: params?.limit || 200,
          page_token: params?.cursor,
        },
      });
      const accounts = response.data?.data || [];
      const nextCursor = response.data?.info?.next_page_token;
      return { data: accounts, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Zoho CRM accounts", error);
    }
  }

  async getDeals(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    try {
      const response = await this.client.get("/Deals", {
        params: {
          per_page: params?.limit || 200,
          page_token: params?.cursor,
        },
      });
      const deals = response.data?.data || [];
      const nextCursor = response.data?.info?.next_page_token;
      return { data: deals, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Zoho CRM deals", error);
    }
  }

  async getLeads(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ data: any[]; next_cursor?: string }> {
    try {
      const response = await this.client.get("/Leads", {
        params: {
          per_page: params?.limit || 200,
          page_token: params?.cursor,
        },
      });
      const leads = response.data?.data || [];
      const nextCursor = response.data?.info?.next_page_token;
      return { data: leads, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Zoho CRM leads", error);
    }
  }
}
