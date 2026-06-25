/**
 * Customer.io Connector — Track API + App API
 * Real connection: API key (site_id + api_key). Creamy → delayed full → delta.
 */

import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface CustomerIOConfig extends ConnectorConfig {
  siteId?: string;
  apiKey?: string;
  accessToken?: string;
}

export interface CustomerIOCampaign {
  id: number;
  name?: string;
  created_at?: number;
  updated_at?: number;
  [key: string]: any;
}

export class CustomerIOConnector extends BaseConnector {
  protected override config: CustomerIOConfig;

  constructor(config: CustomerIOConfig) {
    super(config);
    this.config = config;
  }

  private get appClient(): AxiosInstance {
    const meta = (this.config.metadata || {}) as Record<string, unknown>;
    const siteId = (this.config.siteId || meta.siteId || meta.site_id || "") as string;
    const apiKey = (this.config.apiKey || this.config.accessToken || meta.apiKey || "") as string;
    if (!apiKey)
      throw new ConnectorError(
        "Customer.io api_key or accessToken is required",
        new Error("Missing credentials")
      );
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey && !siteId) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    return axios.create({
      baseURL: "https://api.customer.io/v1/api",
      headers,
      auth: siteId && apiKey ? { username: siteId, password: apiKey } : undefined,
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "customer-io",
      name: "Customer.io",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: false, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await this.appClient.get("/campaigns", { params: { limit: 1 } });
      return res.status === 200;
    } catch (e: any) {
      if (e.response?.status === 401) return false;
      if (e.response?.status === 403) return false;
      throw new ConnectorError("Customer.io connection test failed", e);
    }
  }

  async getCampaigns(params?: { limit?: number; offset?: number }): Promise<{
    campaigns: CustomerIOCampaign[];
  }> {
    try {
      const res = await this.appClient.get("/campaigns", {
        params: params || { limit: 100 },
      });
      const list = res.data?.campaigns || res.data?.results || [];
      return { campaigns: Array.isArray(list) ? list : [] };
    } catch (e) {
      throw new ConnectorError("Failed to fetch Customer.io campaigns", e);
    }
  }

  async getNewsletters(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ newsletters: any[] }> {
    try {
      const res = await this.appClient.get("/newsletters", {
        params: params || { limit: 100 },
      });
      const list = res.data?.newsletters || res.data?.results || [];
      return { newsletters: Array.isArray(list) ? list : [] };
    } catch (e) {
      throw new ConnectorError("Failed to fetch Customer.io newsletters", e);
    }
  }
}
