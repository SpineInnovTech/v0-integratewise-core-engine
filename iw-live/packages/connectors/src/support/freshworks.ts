import axios from "axios";
import { BaseConnector, ConnectorConfig, ConnectorError } from "@integratewise/connector-contracts";

export interface FreshworksConfig extends ConnectorConfig {
  domain: string; // e.g., company.freshdesk.com
  apiKey: string;
  product: "freshdesk" | "freshsales" | "freshservice";
}

export class FreshworksConnector extends BaseConnector {
  protected override config: FreshworksConfig;

  constructor(config: FreshworksConfig) {
    super(config);
    this.config = config;
  }

  private get client() {
    const auth = Buffer.from(`${this.config.apiKey}:X`).toString("base64");
    return axios.create({
      baseURL: `https://${this.config.domain}/api/v2`,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      // Endpoint depends on product, assuming Freshdesk/Freshservice mostly
      if (this.config.product === "freshsales") {
        await this.client.get("/users/me"); // Freshsales specific
      } else {
        await this.client.get("/tickets?per_page=1");
      }
      return true;
    } catch {
      return false;
    }
  }

  // Implementation tailored to unified connector logic
  async getTickets(): Promise<any[]> {
    if (this.config.product === "freshsales") throw new Error("Not supported for Freshsales");
    try {
      const response = await this.client.get("/tickets");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch tickets", error);
    }
  }
}
