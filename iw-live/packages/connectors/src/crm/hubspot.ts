import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface HubSpotConfig extends ConnectorConfig {
  accessToken: string;
  baseUrl?: string;
}

export class HubSpotConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: HubSpotConfig;

  constructor(config: HubSpotConfig) {
    super(config);
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.hubapi.com",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("HubSpot authentication failed", error);
        if (error.response?.status === 403)
          throw new ConnectorError("HubSpot permission denied", error);
        if (error.response?.status === 429)
          throw new ConnectorError("HubSpot rate limit exceeded", error);
        throw new ConnectorError(
          `HubSpot API error: ${error.response?.data?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "hubspot",
      name: "HubSpot",
      version: "1.0.0",
      apiVersion: "v3",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/crm/v3/objects/contacts?limit=1");
      return true;
    } catch {
      return false;
    }
  }

  async getContacts(limit = 100, after?: string, since?: string): Promise<any> {
    return this.getObjectCollection("contacts", limit, after, since, [
      "firstname",
      "lastname",
      "email",
      "phone",
      "company",
      "lifecyclestage",
      "hs_lastmodifieddate",
    ]);
  }

  async getCompanies(limit = 100, after?: string, since?: string): Promise<any> {
    return this.getObjectCollection("companies", limit, after, since, [
      "name",
      "domain",
      "industry",
      "city",
      "country",
      "numberofemployees",
      "hs_lastmodifieddate",
    ]);
  }

  async getDeals(limit = 100, after?: string, since?: string): Promise<any> {
    return this.getObjectCollection("deals", limit, after, since, [
      "dealname",
      "amount",
      "dealstage",
      "pipeline",
      "closedate",
      "hs_lastmodifieddate",
    ]);
  }

  private async getObjectCollection(
    objectType: "contacts" | "companies" | "deals",
    limit: number,
    after?: string,
    since?: string,
    properties: string[] = []
  ): Promise<any> {
    const safeLimit = Math.max(1, Math.min(limit, 200));
    try {
      if (since) {
        const response = await this.client.post(`/crm/v3/objects/${objectType}/search`, {
          limit: safeLimit,
          after: after ? Number(after) : undefined,
          sorts: [{ propertyName: "hs_lastmodifieddate", direction: "ASCENDING" }],
          properties,
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "hs_lastmodifieddate",
                  operator: "GT",
                  value: String(new Date(since).getTime()),
                },
              ],
            },
          ],
        });
        return response.data;
      }

      const response = await this.client.get(`/crm/v3/objects/${objectType}`, {
        params: {
          limit: safeLimit,
          after,
          properties: properties.join(","),
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch HubSpot ${objectType}`, error);
    }
  }
}
