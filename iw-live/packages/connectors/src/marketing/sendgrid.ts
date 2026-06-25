/**
 * SendGrid Connector — Email API v3 + Marketing Campaigns
 * Real connection: API key. Creamy → delayed full → delta.
 */

import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface SendGridConfig extends ConnectorConfig {
  apiKey?: string;
  accessToken?: string;
}

export interface SendGridCampaign {
  id: number;
  title?: string;
  subject?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface SendGridStats {
  date?: string;
  requests?: number;
  delivered?: number;
  opens?: number;
  clicks?: number;
  [key: string]: any;
}

export class SendGridConnector extends BaseConnector {
  protected override config: SendGridConfig;

  constructor(config: SendGridConfig) {
    super(config);
    this.config = config;
  }

  private get client(): AxiosInstance {
    const key = this.config.apiKey || this.config.accessToken || "";
    if (!key)
      throw new ConnectorError(
        "SendGrid api_key or accessToken is required",
        new Error("Missing credentials")
      );
    return axios.create({
      baseURL: "https://api.sendgrid.com/v3",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "sendgrid",
      name: "SendGrid",
      version: "1.0.0",
      apiVersion: "v3",
      capabilities: { sync: true, webhooks: false, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 1);
      await this.client.get("/stats", {
        params: {
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
        },
      });
      return true;
    } catch (e: any) {
      if (e.response?.status === 401) return false;
      if (e.response?.status === 403) return false;
      throw new ConnectorError("SendGrid connection test failed", e);
    }
  }

  async getStats(startDate: string, endDate?: string): Promise<SendGridStats[]> {
    try {
      const params: Record<string, string> = { start_date: startDate };
      if (endDate) params.end_date = endDate;
      const res = await this.client.get("/stats", { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      throw new ConnectorError("Failed to fetch SendGrid stats", e);
    }
  }

  async getCampaigns(params?: { limit?: number; offset?: number }): Promise<{
    result?: SendGridCampaign[];
  }> {
    try {
      const res = await this.client.get("/marketing/campaigns", {
        params: params || { limit: 100 },
      });
      return { result: res.data?.result || [] };
    } catch (e: any) {
      if (e.response?.status === 404) return { result: [] };
      throw new ConnectorError("Failed to fetch SendGrid campaigns", e);
    }
  }
}
