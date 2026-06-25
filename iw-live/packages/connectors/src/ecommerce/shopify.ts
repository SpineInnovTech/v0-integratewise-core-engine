import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface ShopifyConfig extends ConnectorConfig {
  shopName: string;
  accessToken: string;
  apiVersion?: string;
}

export class ShopifyConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: ShopifyConfig;

  constructor(config: ShopifyConfig) {
    super(config);
    this.config = config;
    const version = config.apiVersion || "2024-01";
    this.client = axios.create({
      baseURL: `https://${config.shopName}.myshopify.com/admin/api/${version}`,
      headers: {
        "X-Shopify-Access-Token": config.accessToken,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "shopify",
      name: "Shopify",
      version: "1.0.0",
      apiVersion: this.config.apiVersion || "2024-01",
      capabilities: {
        sync: true,
        webhooks: true,
        dataVelocity: "high",
      },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/shop.json");
      return true;
    } catch (error) {
      return false;
    }
  }

  // Simplified methods
  async getOrders(params?: any): Promise<any[]> {
    try {
      const response = await this.client.get("/orders.json", { params });
      return response.data.orders;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Shopify orders", error);
    }
  }
}
