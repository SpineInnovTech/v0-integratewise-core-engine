/**
 * Braze Connector — REST API
 * Real connection: API key. Creamy → delayed full → delta.
 */

import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface BrazeConfig extends ConnectorConfig {
  apiKey?: string;
  accessToken?: string;
  restEndpoint?: string;
}

export interface BrazeCampaign {
  id: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export class BrazeConnector extends BaseConnector {
  protected override config: BrazeConfig;

  constructor(config: BrazeConfig) {
    super(config);
    this.config = config;
  }

  private get client(): AxiosInstance {
    const base = (this.config.restEndpoint || "https://rest.iad-01.braze.com").replace(/\/$/, "");
    const key = this.config.apiKey || this.config.accessToken || "";
    if (!key)
      throw new ConnectorError(
        "Braze api_key or accessToken is required",
        new Error("Missing credentials")
      );
    return axios.create({
      baseURL: base,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "braze",
      name: "Braze",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: false, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await this.client.get("/campaigns/list", { params: { page: 0 } });
      return res.status === 200;
    } catch (e: any) {
      if (e.response?.status === 401) return false;
      if (e.response?.status === 403) return false;
      throw new ConnectorError("Braze connection test failed", e);
    }
  }

  async getCampaigns(page = 0, perPage = 100): Promise<{ campaigns: BrazeCampaign[] }> {
    try {
      const res = await this.client.get("/campaigns/list", {
        params: { page, include_archived: false, sort_direction: "desc" },
      });
      const list = res.data?.campaigns || [];
      return { campaigns: Array.isArray(list) ? list.slice(0, perPage) : [] };
    } catch (e) {
      throw new ConnectorError("Failed to fetch Braze campaigns", e);
    }
  }

  async getCanvasList(page = 0): Promise<{ canvas: any[] }> {
    try {
      const res = await this.client.get("/canvas/list", { params: { page } });
      const list = res.data?.canvas || [];
      return { canvas: Array.isArray(list) ? list : [] };
    } catch (e) {
      throw new ConnectorError("Failed to fetch Braze canvas", e);
    }
  }
}
