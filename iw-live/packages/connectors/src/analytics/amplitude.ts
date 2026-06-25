/**
 * Amplitude Connector — Export API + Analytics API
 * Real connection: API key + secret. Creamy → delayed full → delta.
 */

import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface AmplitudeConfig extends ConnectorConfig {
  apiKey?: string;
  secretKey?: string;
  accessToken?: string;
  serverRegion?: "US" | "EU";
}

export class AmplitudeConnector extends BaseConnector {
  protected override config: AmplitudeConfig;

  constructor(config: AmplitudeConfig) {
    super(config);
    this.config = config;
  }

  private get baseUrl(): string {
    const region = this.config.serverRegion || "US";
    return region === "EU" ? "https://analytics.eu.amplitude.com" : "https://amplitude.com";
  }

  private get exportClient(): AxiosInstance {
    const meta = (this.config.metadata || {}) as Record<string, unknown>;
    const apiKey = (this.config.apiKey || this.config.accessToken || meta.apiKey || "") as string;
    const secretKey = (this.config.secretKey || meta.secretKey || meta.secret_key || "") as string;
    if (!apiKey || !secretKey)
      throw new ConnectorError(
        "Amplitude api_key and secret_key are required",
        new Error("Missing credentials")
      );
    const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
    return axios.create({
      baseURL: `${this.baseUrl}/api/2`,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "amplitude",
      name: "Amplitude",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: false, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const end = new Date();
      const start = new Date(end);
      start.setHours(start.getHours() - 3);
      const startStr = start.toISOString().slice(0, 13).replace(/[-:]/g, "").replace("T", "T");
      const endStr = end.toISOString().slice(0, 13).replace(/[-:]/g, "").replace("T", "T");
      const res = await this.exportClient.get("/export", {
        params: { start: startStr, end: endStr },
        maxContentLength: 1000,
      });
      return res.status === 200;
    } catch (e: any) {
      if (e.response?.status === 401) return false;
      if (e.response?.status === 403) return false;
      throw new ConnectorError("Amplitude connection test failed", e);
    }
  }

  async getEventExport(start: string, end: string): Promise<any[]> {
    try {
      const res = await this.exportClient.get("/export", {
        params: { start, end },
        responseType: "text",
      });
      const data = res.data as string;
      if (!data || typeof data !== "string") return [];
      return data
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line) as Record<string, unknown>;
          } catch {
            return null;
          }
        })
        .filter((x): x is Record<string, unknown> => x !== null);
    } catch (e) {
      throw new ConnectorError("Failed to export Amplitude events", e);
    }
  }
}
