import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface GoogleAnalyticsConfig extends ConnectorConfig {
  accessToken?: string;
  propertyId?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  provider_workspace_id?: string;
}

export interface GARunReportParams {
  propertyId?: string;
  startDate: string;
  endDate: string;
  dimensions: string[];
  metrics: string[];
  limit?: number;
  offset?: number;
}

type GARow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

export class GoogleAnalyticsConnector extends BaseConnector {
  private adminClient: AxiosInstance;
  private dataClient: AxiosInstance;
  protected override config: GoogleAnalyticsConfig;

  constructor(config: GoogleAnalyticsConfig) {
    super(config);
    this.config = config;
    const accessToken = this.resolveAccessToken(config);

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken || ""}`,
      "Content-Type": "application/json",
    };

    this.adminClient = axios.create({
      baseURL: "https://analyticsadmin.googleapis.com/v1beta",
      timeout: 30000,
      headers,
    });

    this.dataClient = axios.create({
      baseURL: "https://analyticsdata.googleapis.com/v1beta",
      timeout: 30000,
      headers,
    });

    const errorHandler = (error: any) => {
      if (error.response?.status === 401)
        throw new ConnectorError("Google Analytics authentication failed", error);
      if (error.response?.status === 403)
        throw new ConnectorError("Google Analytics permission denied", error);
      if (error.response?.status === 429)
        throw new ConnectorError("Google Analytics rate limit exceeded", error);
      throw new ConnectorError(
        `Google Analytics API error: ${error.response?.data?.error?.message || error.message}`,
        error
      );
    };

    this.adminClient.interceptors.response.use((response) => response, errorHandler);
    this.dataClient.interceptors.response.use((response) => response, errorHandler);
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "google-analytics",
      name: "Google Analytics",
      version: "1.0.0",
      apiVersion: "v1beta",
      capabilities: { sync: true, webhooks: false, dataVelocity: "low" },
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.accessToken) return false;
    try {
      const summaries = await this.getAccountSummaries(1);
      return summaries.length >= 0;
    } catch {
      return false;
    }
  }

  async getAccountSummaries(pageSize = 50, pageToken?: string): Promise<any[]> {
    try {
      const response = await this.adminClient.get("/accountSummaries", {
        params: {
          pageSize: Math.max(1, Math.min(pageSize, 200)),
          ...(pageToken ? { pageToken } : {}),
        },
      });
      return response.data?.accountSummaries || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Google Analytics account summaries", error);
    }
  }

  async getProperties(): Promise<
    Array<{ propertyId: string; displayName?: string; account?: string; property?: string }>
  > {
    const summaries = await this.getAccountSummaries(200);
    const properties: Array<{
      propertyId: string;
      displayName?: string;
      account?: string;
      property?: string;
    }> = [];

    for (const summary of summaries) {
      for (const propertySummary of summary.propertySummaries || []) {
        const propertyName = propertySummary.property || "";
        const propertyId = propertyName.split("/").pop() || "";
        if (!propertyId) continue;
        properties.push({
          propertyId,
          displayName: propertySummary.displayName,
          account: summary.account,
          property: propertySummary.property,
        });
      }
    }

    return properties;
  }

  async runReport(params: GARunReportParams): Promise<{
    propertyId: string;
    rows: GARow[];
    totals: Record<string, string>;
    rowCount: number;
  }> {
    const propertyId = params.propertyId || this.resolvePropertyId(this.config);
    if (!propertyId) {
      throw new ConnectorError("Google Analytics propertyId is required for report queries");
    }

    try {
      const response = await this.dataClient.post(`/properties/${propertyId}:runReport`, {
        dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
        dimensions: params.dimensions.map((name) => ({ name })),
        metrics: params.metrics.map((name) => ({ name })),
        limit: String(Math.max(1, Math.min(params.limit || 1000, 100000))),
        offset: String(Math.max(0, params.offset || 0)),
      });

      const rows: GARow[] = response.data?.rows || [];
      const totalsRow = response.data?.totals?.[0];
      const totals: Record<string, string> = {};
      if (totalsRow?.metricValues) {
        params.metrics.forEach((metricName, index) => {
          totals[metricName] = totalsRow.metricValues[index]?.value || "0";
        });
      }

      return {
        propertyId,
        rows,
        totals,
        rowCount: response.data?.rowCount || rows.length,
      };
    } catch (error) {
      throw new ConnectorError("Failed to run Google Analytics report", error);
    }
  }

  async getReport(params: {
    propertyId?: string;
    startDate?: string;
    endDate?: string;
    dimensions?: string[];
    metrics?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ rows: unknown[]; totals: Record<string, unknown> }> {
    const report = await this.runReport({
      propertyId: params.propertyId,
      startDate: params.startDate || "7daysAgo",
      endDate: params.endDate || "today",
      dimensions: params.dimensions || ["date"],
      metrics: params.metrics || ["activeUsers"],
      limit: params.limit,
      offset: params.offset,
    });

    return {
      rows: report.rows,
      totals: report.totals,
    };
  }

  async getEventsForSync(params?: {
    propertyId?: string;
    since?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    propertyId: string;
    rows: GARow[];
    next_cursor?: string;
  }> {
    const report = await this.runReport({
      propertyId: params?.propertyId,
      startDate: params?.since ? new Date(params.since).toISOString().slice(0, 10) : "7daysAgo",
      endDate: "today",
      dimensions: ["eventName", "dateHourMinute"],
      metrics: ["eventCount", "activeUsers"],
      limit: params?.limit || 500,
      offset: params?.offset || 0,
    });

    const nextOffset = (params?.offset || 0) + report.rows.length;
    const nextCursor =
      report.rows.length >= (params?.limit || 500) ? String(nextOffset) : undefined;

    return {
      propertyId: report.propertyId,
      rows: report.rows,
      next_cursor: nextCursor,
    };
  }

  private resolveAccessToken(config: GoogleAnalyticsConfig): string | undefined {
    if (config.accessToken) return config.accessToken;
    if (typeof config.apiKey === "string" && config.apiKey) return config.apiKey;
    if (typeof config.token === "string" && config.token) return config.token;
    return undefined;
  }

  private resolvePropertyId(config: GoogleAnalyticsConfig): string | undefined {
    if (config.propertyId) return config.propertyId;
    if (config.provider_workspace_id) return config.provider_workspace_id;
    const metadata =
      config.metadata && typeof config.metadata === "object" ? config.metadata : undefined;
    const propertyFromMetadata =
      metadata && typeof (metadata as Record<string, unknown>).property_id === "string"
        ? ((metadata as Record<string, unknown>).property_id as string)
        : undefined;
    return propertyFromMetadata;
  }
}
