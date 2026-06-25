import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Segment Connector — Segment HTTP Tracking API v2 + Config API
// ============================================================================

export interface SegmentConfig extends ConnectorConfig {
  writeKey: string;
  apiToken?: string; // Public API token for Config API
  workspace?: string;
}

export interface SegmentIdentifyTraits {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: { id?: string; name?: string; plan?: string };
  createdAt?: string;
  [key: string]: any;
}

export interface SegmentTrackProperties {
  revenue?: number;
  currency?: string;
  value?: number;
  [key: string]: any;
}

export interface SegmentPageProperties {
  name?: string;
  path?: string;
  referrer?: string;
  search?: string;
  title?: string;
  url?: string;
  [key: string]: any;
}

export interface SegmentSource {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  writeKeys: string[];
  createdAt: string;
  metadata: { id: string; name: string; slug: string; categories: string[] };
}

export interface SegmentDestination {
  id: string;
  name: string;
  enabled: boolean;
  sourceId: string;
  createdAt: string;
  updatedAt: string;
  metadata: { id: string; name: string; slug: string };
  settings: Record<string, any>;
}

export class SegmentConnector extends BaseConnector {
  private trackingClient: AxiosInstance;
  private configClient: AxiosInstance;
  protected override config: SegmentConfig;

  constructor(config: SegmentConfig) {
    super(config);
    this.config = config;

    // Tracking API — uses writeKey as Basic auth username
    this.trackingClient = axios.create({
      baseURL: "https://api.segment.io/v1",
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
      auth: { username: config.writeKey, password: "" },
    });

    // Config / Public API
    this.configClient = axios.create({
      baseURL: "https://api.segmentapis.com",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.apiToken || ""}`,
        "Content-Type": "application/json",
      },
    });

    for (const client of [this.trackingClient, this.configClient]) {
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401)
            throw new ConnectorError("Invalid Segment credentials", error);
          if (error.response?.status === 429)
            throw new ConnectorError("Segment API rate limit exceeded", error);
          throw new ConnectorError(
            `Segment API error: ${error.response?.data?.error?.message || error.message}`,
            error
          );
        }
      );
    }
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "segment",
      name: "Segment",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: true, dataVelocity: "realtime" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      // Send a minimal identify to verify writeKey
      const response = await this.trackingClient.post("/identify", {
        userId: "__iw_health_check__",
        traits: { _healthCheck: true },
        timestamp: new Date().toISOString(),
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Tracking API — Core Methods
  // ---------------------------------------------------------------------------
  async identify(
    userId: string,
    traits?: SegmentIdentifyTraits,
    context?: Record<string, any>
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.trackingClient.post("/identify", {
        userId,
        traits: traits || {},
        context: context || {},
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to send Segment identify", error);
    }
  }

  async track(
    userId: string,
    event: string,
    properties?: SegmentTrackProperties,
    context?: Record<string, any>
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.trackingClient.post("/track", {
        userId,
        event,
        properties: properties || {},
        context: context || {},
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to send Segment track event "${event}"`, error);
    }
  }

  async page(
    userId: string,
    name: string,
    properties?: SegmentPageProperties,
    context?: Record<string, any>
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.trackingClient.post("/page", {
        userId,
        name,
        properties: properties || {},
        context: context || {},
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to send Segment page", error);
    }
  }

  async screen(
    userId: string,
    name: string,
    properties?: Record<string, any>
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.trackingClient.post("/screen", {
        userId,
        name,
        properties: properties || {},
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to send Segment screen", error);
    }
  }

  async group(
    userId: string,
    groupId: string,
    traits?: Record<string, any>
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.trackingClient.post("/group", {
        userId,
        groupId,
        traits: traits || {},
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to send Segment group", error);
    }
  }

  async alias(previousId: string, userId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.trackingClient.post("/alias", {
        previousId,
        userId,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to send Segment alias", error);
    }
  }

  async batch(
    messages: Array<{
      type: "identify" | "track" | "page" | "screen" | "group" | "alias";
      userId?: string;
      anonymousId?: string;
      event?: string;
      traits?: Record<string, any>;
      properties?: Record<string, any>;
      context?: Record<string, any>;
    }>
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.trackingClient.post("/batch", {
        batch: messages.map((m) => ({
          ...m,
          timestamp: new Date().toISOString(),
        })),
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to send Segment batch", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Config / Public API — Sources & Destinations
  // ---------------------------------------------------------------------------
  async listSources(params?: {
    pageSize?: number;
    pageToken?: string;
  }): Promise<{ data: { sources: SegmentSource[] }; pagination: { next?: string } }> {
    try {
      const response = await this.configClient.get("/sources", { params });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Segment sources", error);
    }
  }

  async getSource(sourceId: string): Promise<SegmentSource> {
    try {
      const response = await this.configClient.get(`/sources/${sourceId}`);
      return response.data.data.source;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Segment source ${sourceId}`, error);
    }
  }

  async listDestinations(sourceId: string): Promise<SegmentDestination[]> {
    try {
      const response = await this.configClient.get(`/sources/${sourceId}/destinations`);
      return response.data.data?.destinations || [];
    } catch (error) {
      throw new ConnectorError(`Failed to list destinations for source ${sourceId}`, error);
    }
  }

  async updateDestination(
    destinationId: string,
    settings: Record<string, any>,
    enabled?: boolean
  ): Promise<SegmentDestination> {
    try {
      const body: any = {};
      if (settings) body.settings = settings;
      if (enabled !== undefined) body.enabled = enabled;
      const response = await this.configClient.patch(`/destinations/${destinationId}`, body);
      return response.data.data.destination;
    } catch (error) {
      throw new ConnectorError(`Failed to update Segment destination ${destinationId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Profiles API (Optional — Engage/Personas)
  // ---------------------------------------------------------------------------
  async getProfile(
    userId: string,
    namespace = "user_id"
  ): Promise<{ traits: Record<string, any>; events: any[] } | null> {
    try {
      const response = await this.configClient.get(
        `/spaces/${this.config.workspace}/collections/users/profiles/${namespace}:${userId}/traits`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw new ConnectorError(`Failed to fetch Segment profile for ${userId}`, error);
    }
  }
}

export function createSegmentConnector(config: SegmentConfig): SegmentConnector {
  return new SegmentConnector(config);
}
