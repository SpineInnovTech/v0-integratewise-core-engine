import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface XeroConfig extends ConnectorConfig {
  accessToken: string;
  refreshToken?: string;
  tenantId: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface XeroInvoice {
  InvoiceID: string;
  InvoiceNumber: string;
  Type: "ACCREC" | "ACCPAY";
  Contact: { ContactID: string; Name: string };
  Date: string;
  DueDate: string;
  Status: string;
  LineAmountTypes: string;
  SubTotal: number;
  TotalTax: number;
  Total: number;
  AmountDue: number;
  AmountPaid: number;
  CurrencyCode: string;
  UpdatedDateUTC: string;
}

export interface XeroContact {
  ContactID: string;
  ContactNumber?: string;
  Name: string;
  EmailAddress?: string;
  FirstName?: string;
  LastName?: string;
  ContactStatus?: string;
  IsSupplier?: boolean;
  IsCustomer?: boolean;
  UpdatedDateUTC: string;
}

export interface XeroBankTransaction {
  BankTransactionID: string;
  Type: "SPEND" | "RECEIVE";
  Contact: { ContactID: string; Name: string };
  Date: string;
  Status: string;
  Total: number;
  UpdatedDateUTC: string;
}

export interface XeroAccount {
  AccountID: string;
  Code: string;
  Name: string;
  Type: string;
  Status: string;
  Class?: string;
  UpdatedDateUTC: string;
}

export class XeroConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: XeroConfig;

  constructor(config: XeroConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.xero.com/api.xro/2.0",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "xero-tenant-id": config.tenantId,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (
          error.response?.status === 401 &&
          config.refreshToken &&
          config.clientId &&
          config.clientSecret
        ) {
          const newToken = await this.refreshAccessToken();
          this.client.defaults.headers.Authorization = `Bearer ${newToken}`;
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return this.client.request(error.config);
        }
        if (error.response?.status === 403)
          throw new ConnectorError("Xero permission denied", error);
        if (error.response?.status === 404)
          throw new ConnectorError("Xero resource not found", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Xero rate limit exceeded", error);
        throw new ConnectorError(
          `Xero API error: ${error.response?.data?.Message || error.message}`,
          error
        );
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await axios.post(
      "https://identity.xero.com/connect/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.config.refreshToken!,
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    this.config.accessToken = response.data.access_token;
    if (response.data.refresh_token) {
      this.config.refreshToken = response.data.refresh_token;
    }
    return response.data.access_token;
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "xero",
      name: "Xero",
      version: "1.0.0",
      apiVersion: "2.0",
      capabilities: { sync: true, webhooks: true, dataVelocity: "low" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/Organisation");
      return true;
    } catch {
      return false;
    }
  }

  async getOrganisation(): Promise<any> {
    try {
      const response = await this.client.get("/Organisation");
      return response.data.Organisations?.[0];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Xero organisation", error);
    }
  }

  async getInvoices(params?: {
    page?: number;
    modifiedSince?: string;
    where?: string;
  }): Promise<{ Invoices: XeroInvoice[] }> {
    try {
      const headers: any = {};
      if (params?.modifiedSince) {
        headers["If-Modified-Since"] = params.modifiedSince;
      }

      const queryParams: any = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.where) queryParams.where = params.where;

      const response = await this.client.get("/Invoices", {
        params: queryParams,
        headers,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Xero invoices", error);
    }
  }

  async getInvoice(invoiceId: string): Promise<XeroInvoice> {
    try {
      const response = await this.client.get(`/Invoices/${invoiceId}`);
      return response.data.Invoices?.[0];
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Xero invoice ${invoiceId}`, error);
    }
  }

  async getContacts(params?: {
    page?: number;
    modifiedSince?: string;
    where?: string;
  }): Promise<{ Contacts: XeroContact[] }> {
    try {
      const headers: any = {};
      if (params?.modifiedSince) {
        headers["If-Modified-Since"] = params.modifiedSince;
      }

      const queryParams: any = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.where) queryParams.where = params.where;

      const response = await this.client.get("/Contacts", {
        params: queryParams,
        headers,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Xero contacts", error);
    }
  }

  async getContact(contactId: string): Promise<XeroContact> {
    try {
      const response = await this.client.get(`/Contacts/${contactId}`);
      return response.data.Contacts?.[0];
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Xero contact ${contactId}`, error);
    }
  }

  async getBankTransactions(params?: {
    page?: number;
    modifiedSince?: string;
    where?: string;
  }): Promise<{ BankTransactions: XeroBankTransaction[] }> {
    try {
      const headers: any = {};
      if (params?.modifiedSince) {
        headers["If-Modified-Since"] = params.modifiedSince;
      }

      const queryParams: any = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.where) queryParams.where = params.where;

      const response = await this.client.get("/BankTransactions", {
        params: queryParams,
        headers,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Xero bank transactions", error);
    }
  }

  async getAccounts(params?: {
    modifiedSince?: string;
    where?: string;
  }): Promise<{ Accounts: XeroAccount[] }> {
    try {
      const headers: any = {};
      if (params?.modifiedSince) {
        headers["If-Modified-Since"] = params.modifiedSince;
      }

      const queryParams: any = {};
      if (params?.where) queryParams.where = params.where;

      const response = await this.client.get("/Accounts", {
        params: queryParams,
        headers,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Xero accounts", error);
    }
  }

  async getBalanceSheet(params?: { date?: string }): Promise<any> {
    try {
      const response = await this.client.get("/Reports/BalanceSheet", {
        params: { date: params?.date },
      });
      return response.data.Reports?.[0];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Xero balance sheet", error);
    }
  }

  async getProfitAndLoss(params?: { fromDate?: string; toDate?: string }): Promise<any> {
    try {
      const response = await this.client.get("/Reports/ProfitAndLoss", {
        params: { fromDate: params?.fromDate, toDate: params?.toDate },
      });
      return response.data.Reports?.[0];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Xero profit and loss", error);
    }
  }

  async createInvoice(invoice: Partial<XeroInvoice>): Promise<XeroInvoice> {
    try {
      const response = await this.client.post("/Invoices", { Invoices: [invoice] });
      return response.data.Invoices?.[0];
    } catch (error) {
      throw new ConnectorError("Failed to create Xero invoice", error);
    }
  }

  async updateInvoice(invoiceId: string, invoice: Partial<XeroInvoice>): Promise<XeroInvoice> {
    try {
      const response = await this.client.post(`/Invoices/${invoiceId}`, {
        Invoices: [invoice],
      });
      return response.data.Invoices?.[0];
    } catch (error) {
      throw new ConnectorError(`Failed to update Xero invoice ${invoiceId}`, error);
    }
  }
}

export function createXeroConnector(config: XeroConfig): XeroConnector {
  return new XeroConnector(config);
}
