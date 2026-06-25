/**
 * Airtable Connector — REST API
 * Real connection: OAuth. Creamy → delayed full → delta.
 */

import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface AirtableConfig extends ConnectorConfig {
  accessToken?: string;
}

export interface AirtableBase {
  id: string;
  name?: string;
  permissionLevel?: string;
  [key: string]: any;
}

export interface AirtableTable {
  id: string;
  name?: string;
  primaryFieldId?: string;
  fields?: { id: string; name: string; type: string }[];
  [key: string]: any;
}

export class AirtableConnector extends BaseConnector {
  protected override config: AirtableConfig;

  constructor(config: AirtableConfig) {
    super(config);
    this.config = config;
  }

  private get client(): AxiosInstance {
    const token = this.config.accessToken || "";
    if (!token)
      throw new ConnectorError(
        "Airtable accessToken is required",
        new Error("Missing credentials")
      );
    return axios.create({
      baseURL: "https://api.airtable.com/v0/meta",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "airtable",
      name: "Airtable",
      version: "1.0.0",
      apiVersion: "v0",
      capabilities: { sync: true, webhooks: false, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await this.client.get("/bases");
      return res.status === 200;
    } catch (e: any) {
      if (e.response?.status === 401) return false;
      if (e.response?.status === 403) return false;
      throw new ConnectorError("Airtable connection test failed", e);
    }
  }

  async getBases(): Promise<{ bases: AirtableBase[] }> {
    try {
      const res = await this.client.get("/bases");
      const list = res.data?.bases || [];
      return { bases: Array.isArray(list) ? list : [] };
    } catch (e) {
      throw new ConnectorError("Failed to fetch Airtable bases", e);
    }
  }

  async getBaseSchema(baseId: string): Promise<{ tables: AirtableTable[] }> {
    try {
      const res = await this.client.get(`/bases/${baseId}/tables`);
      const list = res.data?.tables || [];
      return { tables: Array.isArray(list) ? list : [] };
    } catch (e) {
      throw new ConnectorError(`Failed to fetch Airtable base schema ${baseId}`, e);
    }
  }
}
