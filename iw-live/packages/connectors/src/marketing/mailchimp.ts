/**
 * Mailchimp Connector — Marketing Platform API v3
 * Real connection: OAuth or API key. Creamy → delayed full → delta.
 */

import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface MailchimpConfig extends ConnectorConfig {
  dataCenter?: string;
  apiKey?: string;
  accessToken?: string;
}

export interface MailchimpList {
  id: string;
  name: string;
  stats?: { member_count?: number; open_rate?: number; click_rate?: number };
  date_created?: string;
  [key: string]: any;
}

export interface MailchimpCampaign {
  id: string;
  type?: string;
  status?: string;
  create_time?: string;
  send_time?: string;
  [key: string]: any;
}

export class MailchimpConnector extends BaseConnector {
  constructor(protected override config: MailchimpConfig) {
    super(config);
  }

  private get client(): AxiosInstance {
    const meta = (this.config.metadata || {}) as Record<string, unknown>;
    const dc = (this.config.dataCenter || meta.dataCenter || "us1") as string;
    const auth = this.config.accessToken
      ? `Bearer ${this.config.accessToken}`
      : this.config.apiKey
        ? `apikey ${this.config.apiKey}`
        : "";
    if (!auth)
      throw new ConnectorError(
        "Mailchimp accessToken or apiKey is required",
        new Error("Missing credentials")
      );
    return axios.create({
      baseURL: `https://${dc}.api.mailchimp.com/3.0`,
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "mailchimp",
      name: "Mailchimp",
      version: "1.0.0",
      apiVersion: "v3",
      capabilities: { sync: true, webhooks: false, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/ping");
      return true;
    } catch {
      return false;
    }
  }

  async getLists(params?: { count?: number; offset?: number }): Promise<{
    lists: MailchimpList[];
    total_items?: number;
  }> {
    try {
      const res = await this.client.get("/lists", { params: params || {} });
      return { lists: res.data.lists || [], total_items: res.data.total_items };
    } catch (e) {
      throw new ConnectorError("Failed to fetch Mailchimp lists", e);
    }
  }

  async getCampaigns(params?: {
    count?: number;
    offset?: number;
    since_send_time?: string;
  }): Promise<{ campaigns: MailchimpCampaign[]; total_items?: number }> {
    try {
      const res = await this.client.get("/campaigns", { params: params || {} });
      return { campaigns: res.data.campaigns || [], total_items: res.data.total_items };
    } catch (e) {
      throw new ConnectorError("Failed to fetch Mailchimp campaigns", e);
    }
  }
}
