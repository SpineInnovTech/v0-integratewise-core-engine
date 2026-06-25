/**
 * Marketo Connector — REST API
 * Real connection: OAuth (client credentials). Creamy → delayed full → delta.
 */

import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface MarketoConfig extends ConnectorConfig {
  accessToken?: string;
  restEndpoint?: string;
}

export interface MarketoCampaign {
  id: number;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export class MarketoConnector extends BaseConnector {
  protected override config: MarketoConfig;

  constructor(config: MarketoConfig) {
    super(config);
    this.config = config;
  }

  private get client(): AxiosInstance {
    const meta = (this.config.metadata || {}) as Record<string, unknown>;
    const raw = (this.config.restEndpoint || meta.restEndpoint || meta.instance_url) as
      | string
      | undefined;
    const base = raw?.replace(/\/$/, "") ?? "";
    if (!base)
      throw new ConnectorError(
        "Marketo restEndpoint is required",
        new Error("Missing restEndpoint or instance_url in metadata")
      );
    const token = this.config.accessToken || "";
    return axios.create({
      baseURL: base,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "marketo",
      name: "Marketo",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: false, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await this.client.get("/rest/asset/v1/campaigns.json", {
        params: { maxReturn: 1 },
      });
      return res.status === 200;
    } catch (e: any) {
      if (e.response?.status === 401) return false;
      if (e.response?.status === 403) return false;
      throw new ConnectorError("Marketo connection test failed", e);
    }
  }

  async getCampaigns(params?: {
    maxReturn?: number;
    offset?: string;
    filterType?: string;
    filterValues?: string;
  }): Promise<{ result: MarketoCampaign[]; nextPageToken?: string }> {
    try {
      const res = await this.client.get("/rest/asset/v1/campaigns.json", {
        params: params || { maxReturn: 200 },
      });
      const result = res.data?.result || [];
      return {
        result: Array.isArray(result) ? result : [],
        nextPageToken: res.data?.nextPageToken,
      };
    } catch (e) {
      throw new ConnectorError("Failed to fetch Marketo campaigns", e);
    }
  }
}
