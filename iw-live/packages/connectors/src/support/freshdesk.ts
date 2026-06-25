import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface FreshdeskConfig extends ConnectorConfig {
  apiKey: string;
  domain: string; // e.g., company.freshdesk.com
}

export class FreshdeskConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: FreshdeskConfig;

  constructor(config: FreshdeskConfig) {
    super(config);
    this.config = config;
    const domain = (config.domain || "example.freshdesk.com")
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    const auth = Buffer.from(`${config.apiKey || ""}:X`).toString("base64");
    this.client = axios.create({
      baseURL: `https://${domain}/api/v2`,
      timeout: 30000,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "freshdesk",
      name: "Freshdesk",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/agents/me");
      return true;
    } catch {
      return false;
    }
  }

  async getTickets(params?: { limit?: number; cursor?: string; since?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/tickets", {
        params: {
          per_page: params?.limit || 100,
          page: params?.cursor ? parseInt(params.cursor) : 1,
          ...(params?.since ? { updated_since: params.since } : {}),
        },
      });
      const tickets = response.data || [];
      // Freshdesk uses page numbers for pagination
      const hasMore = tickets.length === (params?.limit || 100);
      const nextCursor = hasMore
        ? String((params?.cursor ? parseInt(params.cursor) : 1) + 1)
        : undefined;
      return { data: tickets, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Freshdesk tickets", error);
    }
  }

  async getContacts(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/contacts", {
        params: {
          per_page: params?.limit || 100,
          page: params?.cursor ? parseInt(params.cursor) : 1,
        },
      });
      const contacts = response.data || [];
      const hasMore = contacts.length === (params?.limit || 100);
      const nextCursor = hasMore
        ? String((params?.cursor ? parseInt(params.cursor) : 1) + 1)
        : undefined;
      return { data: contacts, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Freshdesk contacts", error);
    }
  }

  async getCompanies(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get("/companies", {
        params: {
          per_page: params?.limit || 100,
          page: params?.cursor ? parseInt(params.cursor) : 1,
        },
      });
      const companies = response.data || [];
      const hasMore = companies.length === (params?.limit || 100);
      const nextCursor = hasMore
        ? String((params?.cursor ? parseInt(params.cursor) : 1) + 1)
        : undefined;
      return { data: companies, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Freshdesk companies", error);
    }
  }

  async getAgents(): Promise<any[]> {
    try {
      const response = await this.client.get("/agents");
      return response.data || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Freshdesk agents", error);
    }
  }
}
