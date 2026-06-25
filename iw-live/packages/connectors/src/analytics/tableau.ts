import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface TableauConfig extends ConnectorConfig {
  accessToken: string;
  serverUrl?: string;
  siteId?: string;
}

export class TableauConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: TableauConfig;

  constructor(config: TableauConfig) {
    super(config);
    this.config = config;
    const serverBase = (config.serverUrl || "https://api.tableau.com").replace(/\/$/, "");
    const siteId = config.siteId || "default";
    this.client = axios.create({
      baseURL: `${serverBase}/api/3.19/sites/${siteId}`,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "tableau",
      name: "Tableau",
      version: "1.0.0",
      apiVersion: "v3.19",
      capabilities: { sync: true, webhooks: false, dataVelocity: "low" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/workbooks?pageSize=1");
      return true;
    } catch {
      return false;
    }
  }

  async getViews(params?: {
    pageSize?: number;
    pageNumber?: number;
  }): Promise<{ views: Array<Record<string, any>> }> {
    try {
      const response = await this.client.get("/views", {
        params: {
          pageSize: params?.pageSize || 50,
          pageNumber: params?.pageNumber || 1,
        },
      });
      return { views: response.data?.views?.view || response.data?.views || [] };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Tableau views", error);
    }
  }

  async getWorkbooks(params?: {
    pageSize?: number;
    pageNumber?: number;
  }): Promise<{ workbooks: Array<Record<string, any>> }> {
    try {
      const response = await this.client.get("/workbooks", {
        params: {
          pageSize: params?.pageSize || 50,
          pageNumber: params?.pageNumber || 1,
        },
      });
      return { workbooks: response.data?.workbooks?.workbook || response.data?.workbooks || [] };
    } catch (error) {
      throw new ConnectorError("Failed to fetch Tableau workbooks", error);
    }
  }
}
