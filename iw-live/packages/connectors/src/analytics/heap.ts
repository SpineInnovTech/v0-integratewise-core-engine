/**
 * Heap Connector — Heap Analytics Tracking API
 * Real connection: app_id (verified via POST /track). Creamy → delayed full → delta.
 * Heap has no REST API for reading event data; Heap Connect exports to warehouse.
 * This connector verifies app_id and syncs project-level metadata only.
 */

import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface HeapConfig extends ConnectorConfig {
  appId?: string;
  apiKey?: string;
  accessToken?: string;
}

export class HeapConnector extends BaseConnector {
  protected override config: HeapConfig;

  constructor(config: HeapConfig) {
    super(config);
    this.config = config;
  }

  private get client(): AxiosInstance {
    return axios.create({
      baseURL: "https://heapanalytics.com/api",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "heap",
      name: "Heap",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: false, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    const meta = (this.config.metadata || {}) as Record<string, unknown>;
    const appId = (this.config.appId ||
      meta.appId ||
      meta.app_id ||
      this.config.provider_workspace_id ||
      "") as string;
    if (!appId) throw new ConnectorError("Heap app_id is required", new Error("Missing app_id"));
    try {
      const res = await this.client.post("/track", {
        app_id: appId,
        identity: "__iw_health_check__",
        event: "_health_check",
        timestamp: new Date().toISOString(),
      });
      return res.status === 200;
    } catch (e: any) {
      if (e.response?.status === 401) return false;
      if (e.response?.status === 403) return false;
      throw new ConnectorError("Heap connection test failed", e);
    }
  }

  async getProjectInfo(): Promise<{ app_id: string; name?: string }> {
    const meta = (this.config.metadata || {}) as Record<string, unknown>;
    const appId = (this.config.appId ||
      meta.appId ||
      meta.app_id ||
      this.config.provider_workspace_id ||
      "") as string;
    if (!appId) throw new ConnectorError("Heap app_id is required", new Error("Missing app_id"));
    return { app_id: appId, name: `Heap (${appId})` };
  }
}
