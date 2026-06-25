/**
 * HubSpot Marketing Connector — Marketing Hub API v3
 * Real connection: OAuth (same as HubSpot CRM). Creamy → delayed full → delta.
 */

import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface HubSpotMarketingConfig extends ConnectorConfig {
  accessToken: string;
}

export interface HubSpotCampaign {
  campaignGuid: string;
  name?: string;
  hs_name?: string;
  hs_start_date?: string;
  hs_end_date?: string;
  hs_notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HubSpotCampaignSearchResult {
  results?: HubSpotCampaign[];
  paging?: { next?: { after?: string } };
}

export class HubSpotMarketingConnector extends BaseConnector {
  protected override config: HubSpotMarketingConfig;

  constructor(config: HubSpotMarketingConfig) {
    super(config);
    this.config = config;
  }

  private get client(): AxiosInstance {
    const token = this.config.accessToken || "";
    if (!token)
      throw new ConnectorError(
        "HubSpot Marketing accessToken is required",
        new Error("Missing credentials")
      );
    return axios.create({
      baseURL: "https://api.hubapi.com",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "hubspot-marketing",
      name: "HubSpot Marketing",
      version: "1.0.0",
      apiVersion: "v3",
      capabilities: { sync: true, webhooks: false, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await this.client.get("/marketing/v3/campaigns", {
        params: { limit: 1 },
      });
      return res.status === 200;
    } catch (e: any) {
      if (e.response?.status === 401) return false;
      if (e.response?.status === 403) return false;
      throw new ConnectorError("HubSpot Marketing connection test failed", e);
    }
  }

  async getCampaigns(limit = 100, after?: string): Promise<HubSpotCampaignSearchResult> {
    try {
      const params: Record<string, string | number> = { limit };
      if (after) params.after = after;
      const res = await this.client.get("/marketing/v3/campaigns", { params });
      return res.data;
    } catch (e) {
      throw new ConnectorError("Failed to fetch HubSpot Marketing campaigns", e);
    }
  }

  async getCampaignMetrics(
    campaignGuid: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await this.client.get(`/marketing/v3/campaigns/${campaignGuid}/reports/metrics`, {
        params,
      });
      return res.data;
    } catch (e) {
      throw new ConnectorError(`Failed to fetch campaign metrics for ${campaignGuid}`, e);
    }
  }
}
