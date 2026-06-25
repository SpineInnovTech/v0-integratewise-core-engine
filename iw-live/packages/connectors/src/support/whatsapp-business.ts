import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface WhatsAppBusinessConfig extends ConnectorConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  apiVersion?: string; // e.g., v18.0
}

export class WhatsAppBusinessConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: WhatsAppBusinessConfig;

  constructor(config: WhatsAppBusinessConfig) {
    super(config);
    this.config = config;
    const apiVersion = config.apiVersion || "v18.0";
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "whatsapp-business",
      name: "WhatsApp Business",
      version: "1.0.0",
      apiVersion: this.config.apiVersion || "v18.0",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get(`/${this.config.phoneNumberId}`);
      return true;
    } catch {
      return false;
    }
  }

  async getMessages(params?: { limit?: number; cursor?: string }): Promise<{
    data: any[];
    next_cursor?: string;
  }> {
    try {
      const response = await this.client.get(`/${this.config.phoneNumberId}/messages`, {
        params: {
          limit: params?.limit || 50,
          ...(params?.cursor ? { after: params.cursor } : {}),
        },
      });
      const messages = response.data?.data || [];
      const nextCursor = response.data?.paging?.cursors?.after;
      return { data: messages, next_cursor: nextCursor };
    } catch (error) {
      throw new ConnectorError("Failed to fetch WhatsApp messages", error);
    }
  }

  async getConversationAnalytics(params?: { startDate?: string; endDate?: string }): Promise<any> {
    try {
      const response = await this.client.get(`/${this.config.phoneNumberId}/insights`, {
        params: {
          metric: "conversation_analytics",
          ...(params?.startDate ? { since: params.startDate } : {}),
          ...(params?.endDate ? { until: params.endDate } : {}),
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch WhatsApp analytics", error);
    }
  }

  async getPhoneNumbers(): Promise<any[]> {
    try {
      const response = await this.client.get(`/${this.config.businessAccountId}/phone_numbers`);
      return response.data?.data || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch WhatsApp phone numbers", error);
    }
  }

  async getTemplates(): Promise<any[]> {
    try {
      const response = await this.client.get(`/${this.config.businessAccountId}/message_templates`);
      return response.data?.data || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch WhatsApp templates", error);
    }
  }
}
