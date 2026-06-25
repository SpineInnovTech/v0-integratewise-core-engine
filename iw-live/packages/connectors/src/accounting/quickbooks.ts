import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface QuickBooksConfig extends ConnectorConfig {
  realmId?: string;
  accessToken?: string;
  refreshToken?: string;
  environment?: "sandbox" | "production";
  provider_workspace_id?: string;
  provider_workspace_name?: string;
  companyId?: string;
}

export class QuickBooksConnector extends BaseConnector {
  private client: AxiosInstance;
  private realmId: string;
  protected override config: QuickBooksConfig;

  constructor(config: QuickBooksConfig) {
    super(config);
    this.config = config;
    this.realmId =
      config.realmId ||
      config.companyId ||
      config.provider_workspace_id ||
      config.metadata?.realmId ||
      "0";

    const baseUrl =
      config.environment === "production"
        ? "https://quickbooks.api.intuit.com/v3/company"
        : "https://sandbox-quickbooks.api.intuit.com/v3/company";

    this.client = axios.create({
      baseURL: `${baseUrl}/${this.realmId}`,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken || ""}`,
        Accept: "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("QuickBooks authentication failed", error);
        if (error.response?.status === 403)
          throw new ConnectorError("QuickBooks permission denied", error);
        if (error.response?.status === 429)
          throw new ConnectorError("QuickBooks rate limit exceeded", error);
        throw new ConnectorError(
          `QuickBooks API error: ${error.response?.data?.Fault?.Error?.[0]?.Detail || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "quickbooks",
      name: "QuickBooks",
      version: "1.0.0",
      apiVersion: "v3",
      capabilities: { sync: true, webhooks: false, dataVelocity: "low" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get(`/companyinfo/${this.realmId}`);
      return true;
    } catch {
      return false;
    }
  }

  async getCompanyInfo(): Promise<any> {
    try {
      const response = await this.client.get(`/companyinfo/${this.realmId}`);
      return response.data?.CompanyInfo;
    } catch (error) {
      throw new ConnectorError("Failed to fetch QuickBooks company info", error);
    }
  }

  async getInvoices(
    params?:
      | {
          limit?: number;
          cursor?: string;
          since?: string;
        }
      | number
  ): Promise<any> {
    const normalized = typeof params === "number" ? { limit: params } : params;
    const list = await this.queryEntity("Invoice", normalized);
    return list;
  }

  async getCustomers(
    params?:
      | {
          limit?: number;
          cursor?: string;
          since?: string;
        }
      | number
  ): Promise<any> {
    const normalized = typeof params === "number" ? { limit: params } : params;
    const list = await this.queryEntity("Customer", normalized);
    return list;
  }

  private async queryEntity(
    entity: "Invoice" | "Customer",
    params?: { limit?: number; cursor?: string; since?: string }
  ): Promise<any> {
    const maxResults = Math.max(1, Math.min(params?.limit || 100, 1000));
    const startPosition = Math.max(1, parseInt(params?.cursor || "1", 10) || 1);
    const sinceClause = this.getSinceClause(params?.since);
    const query = `select * from ${entity}${sinceClause} order by MetaData.LastUpdatedTime startposition ${startPosition} maxresults ${maxResults}`;
    try {
      const response = await this.client.get(`/query?query=${encodeURIComponent(query)}`);
      const rows = response.data?.QueryResponse?.[entity] || [];
      const nextCursor = rows.length >= maxResults ? String(startPosition + maxResults) : undefined;
      return Object.assign(rows, { data: rows, next_cursor: nextCursor });
    } catch (error) {
      throw new ConnectorError(`Failed to fetch QuickBooks ${entity.toLowerCase()}s`, error);
    }
  }

  async getProfitAndLoss(params?: { start_date: string; end_date: string }): Promise<any> {
    try {
      const response = await this.client.get("/reports/ProfitAndLoss", { params });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch P&L report", error);
    }
  }

  async getBalanceSheet(params?: { as_of_date: string }): Promise<any> {
    try {
      const response = await this.client.get("/reports/BalanceSheet", {
        params: { date_macro: "This Fiscal Year-to-date", ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Balance Sheet", error);
    }
  }

  private getSinceClause(since?: string): string {
    if (!since) return "";
    const parsed = new Date(since);
    if (Number.isNaN(parsed.getTime())) return "";
    return ` where MetaData.LastUpdatedTime > '${parsed.toISOString()}'`;
  }
}
