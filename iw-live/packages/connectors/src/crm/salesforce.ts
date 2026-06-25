import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface SalesforceConfig extends ConnectorConfig {
  instanceUrl?: string;
  accessToken?: string;
  apiVersion?: string;
  organizationId?: string;
  orgId?: string;
}

export class SalesforceConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: SalesforceConfig;

  constructor(config: SalesforceConfig) {
    super(config);
    this.config = config;
    const version = this.config.apiVersion || "v60.0";
    const instanceUrl = (this.config.instanceUrl || "https://example.my.salesforce.com").replace(
      /\/$/,
      ""
    );
    this.client = axios.create({
      baseURL: `${instanceUrl}/services/data/${version}`,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${this.config.accessToken || ""}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("Salesforce authentication failed", error);
        if (error.response?.status === 403)
          throw new ConnectorError("Salesforce permission denied", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Salesforce rate limit exceeded", error);
        throw new ConnectorError(
          `Salesforce API error: ${error.response?.data?.[0]?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "salesforce",
      name: "Salesforce",
      version: "1.0.0",
      apiVersion: this.config.apiVersion || "v60.0",
      capabilities: {
        sync: true,
        webhooks: true,
        dataVelocity: "high",
      },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/sobjects");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Backward compatible return type:
   * - remains iterable as array for legacy call sites (Domain Master)
   * - also exposes `records` for sync-adapter call sites.
   */
  async query(soql: string): Promise<any> {
    try {
      const safeSoql = this.normalizeSoql(soql);
      const response = await this.client.get("/query", { params: { q: safeSoql } });
      const records = Array.isArray(response.data?.records) ? response.data.records : [];
      return Object.assign(records, {
        records,
        totalSize: response.data?.totalSize ?? records.length,
        done: response.data?.done ?? true,
        nextRecordsUrl: response.data?.nextRecordsUrl,
      });
    } catch (error) {
      throw new ConnectorError("SFDC SOQL Query failed", error);
    }
  }

  async queryMore(nextRecordsUrl: string): Promise<{
    records: any[];
    totalSize?: number;
    done?: boolean;
    nextRecordsUrl?: string;
  }> {
    try {
      const response = await this.client.get(nextRecordsUrl);
      return {
        records: response.data?.records || [],
        totalSize: response.data?.totalSize,
        done: response.data?.done,
        nextRecordsUrl: response.data?.nextRecordsUrl,
      };
    } catch (error) {
      throw new ConnectorError("SFDC queryMore failed", error);
    }
  }

  async getAccounts(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ records: any[]; next_cursor?: string }> {
    return this.queryObjects(
      "Account",
      [
        "Id",
        "Name",
        "Industry",
        "BillingCountry",
        "NumberOfEmployees",
        "Website",
        "LastModifiedDate",
      ],
      params
    );
  }

  async getContacts(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ records: any[]; next_cursor?: string }> {
    return this.queryObjects(
      "Contact",
      ["Id", "FirstName", "LastName", "Email", "Phone", "Department", "LastModifiedDate"],
      params
    );
  }

  async getOpportunities(params?: {
    limit?: number;
    cursor?: string;
    since?: string;
  }): Promise<{ records: any[]; next_cursor?: string }> {
    return this.queryObjects(
      "Opportunity",
      ["Id", "Name", "Amount", "StageName", "CloseDate", "LastModifiedDate"],
      params
    );
  }

  async getObject(objectName: string, id: string): Promise<any> {
    try {
      const response = await this.client.get(`/sobjects/${objectName}/${id}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch ${objectName} ${id}`, error);
    }
  }

  async createObject(objectName: string, data: any): Promise<string> {
    try {
      const response = await this.client.post(`/sobjects/${objectName}`, data);
      return response.data.id;
    } catch (error) {
      throw new ConnectorError(`Failed to create ${objectName}`, error);
    }
  }

  async updateObject(objectName: string, id: string, data: any): Promise<void> {
    try {
      await this.client.patch(`/sobjects/${objectName}/${id}`, data);
    } catch (error) {
      throw new ConnectorError(`Failed to update ${objectName} ${id}`, error);
    }
  }

  private async queryObjects(
    objectName: string,
    fields: string[],
    params?: { limit?: number; cursor?: string; since?: string }
  ): Promise<{ records: any[]; next_cursor?: string }> {
    if (params?.cursor) {
      const page = await this.queryMore(params.cursor);
      return {
        records: page.records || [],
        next_cursor: page.nextRecordsUrl,
      };
    }

    const safeLimit = Math.max(1, Math.min(params?.limit || 100, 2000));
    const sinceClause = params?.since
      ? ` WHERE LastModifiedDate > ${this.formatDateTimeLiteral(params.since)}`
      : "";
    const soql = `SELECT ${fields.join(", ")} FROM ${objectName}${sinceClause} ORDER BY LastModifiedDate ASC LIMIT ${safeLimit}`;
    const result = await this.query(soql);
    return {
      records: result.records || [],
      next_cursor: result.nextRecordsUrl,
    };
  }

  private normalizeSoql(soql: string): string {
    return soql.replace(
      /LastModifiedDate\s*>\s*([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.+-Z]+)/g,
      (_all, dateLiteral: string) => `LastModifiedDate > ${this.formatDateTimeLiteral(dateLiteral)}`
    );
  }

  private formatDateTimeLiteral(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toISOString();
  }
}
