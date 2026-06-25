import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface MetabaseConfig extends ConnectorConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  sessionToken?: string;
}

export interface MetabaseDatabase {
  id: number;
  name: string;
  engine: string;
  created_at: string;
  updated_at: string;
  is_sample: boolean;
  is_full_sync: boolean;
}

export interface MetabaseCard {
  id: number;
  name: string;
  description?: string;
  display: string;
  dataset_query: any;
  visualization_settings: any;
  collection_id?: number;
  created_at: string;
  updated_at: string;
  creator_id: number;
}

export interface MetabaseDashboard {
  id: number;
  name: string;
  description?: string;
  collection_id?: number;
  created_at: string;
  updated_at: string;
  creator_id: number;
  ordered_cards: any[];
}

export interface MetabaseCollection {
  id: number;
  name: string;
  description?: string;
  slug: string;
  color?: string;
  archived: boolean;
  location?: string;
}

export class MetabaseConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: MetabaseConfig;

  constructor(config: MetabaseConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (config.sessionToken) {
      this.client.defaults.headers["X-Metabase-Session"] = config.sessionToken;
    }

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && config.username && config.password) {
          await this.authenticate();
          error.config.headers["X-Metabase-Session"] = this.config.sessionToken;
          return this.client.request(error.config);
        }
        if (error.response?.status === 403)
          throw new ConnectorError("Metabase permission denied", error);
        if (error.response?.status === 404)
          throw new ConnectorError("Metabase resource not found", error);
        throw new ConnectorError(
          `Metabase API error: ${error.response?.data?.message || error.message}`,
          error
        );
      }
    );
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/api/session`, {
        username: this.config.username,
        password: this.config.password,
      });
      this.config.sessionToken = response.data.id;
      this.client.defaults.headers["X-Metabase-Session"] = response.data.id;
    } catch (error) {
      throw new ConnectorError("Failed to authenticate with Metabase", error);
    }
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "metabase",
      name: "Metabase",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: false, dataVelocity: "low" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.config.sessionToken && this.config.username && this.config.password) {
        await this.authenticate();
      }
      await this.client.get("/api/user/current");
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    try {
      const response = await this.client.get("/api/user/current");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch current Metabase user", error);
    }
  }

  async getDatabases(): Promise<MetabaseDatabase[]> {
    try {
      const response = await this.client.get("/api/database");
      return response.data.data || response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Metabase databases", error);
    }
  }

  async getDatabase(databaseId: number): Promise<MetabaseDatabase> {
    try {
      const response = await this.client.get(`/api/database/${databaseId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Metabase database ${databaseId}`, error);
    }
  }

  async getCards(params?: { f?: string }): Promise<MetabaseCard[]> {
    try {
      const response = await this.client.get("/api/card", { params });
      return response.data.data || response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Metabase cards", error);
    }
  }

  async getCard(cardId: number): Promise<MetabaseCard> {
    try {
      const response = await this.client.get(`/api/card/${cardId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Metabase card ${cardId}`, error);
    }
  }

  async getDashboards(): Promise<MetabaseDashboard[]> {
    try {
      const response = await this.client.get("/api/dashboard");
      return response.data.data || response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Metabase dashboards", error);
    }
  }

  async getDashboard(dashboardId: number): Promise<MetabaseDashboard> {
    try {
      const response = await this.client.get(`/api/dashboard/${dashboardId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Metabase dashboard ${dashboardId}`, error);
    }
  }

  async getCollections(): Promise<MetabaseCollection[]> {
    try {
      const response = await this.client.get("/api/collection");
      return response.data.data || response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Metabase collections", error);
    }
  }

  async getCollection(collectionId: number): Promise<MetabaseCollection> {
    try {
      const response = await this.client.get(`/api/collection/${collectionId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Metabase collection ${collectionId}`, error);
    }
  }

  async executeQuery(cardId: number, parameters?: Record<string, any>): Promise<any> {
    try {
      const response = await this.client.post(`/api/card/${cardId}/query`, { parameters });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to execute Metabase query for card ${cardId}`, error);
    }
  }

  async createCard(card: Partial<MetabaseCard>): Promise<MetabaseCard> {
    try {
      const response = await this.client.post("/api/card", card);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Metabase card", error);
    }
  }

  async updateCard(cardId: number, card: Partial<MetabaseCard>): Promise<MetabaseCard> {
    try {
      const response = await this.client.put(`/api/card/${cardId}`, card);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Metabase card ${cardId}`, error);
    }
  }
}

export function createMetabaseConnector(config: MetabaseConfig): MetabaseConnector {
  return new MetabaseConnector(config);
}
