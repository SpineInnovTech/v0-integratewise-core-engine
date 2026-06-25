import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface FreshbooksConfig extends ConnectorConfig {
  accessToken: string;
  refreshToken?: string;
  accountId: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface FreshbooksInvoice {
  id: number;
  invoiceid: number;
  invoice_number: string;
  customerid: number;
  create_date: string;
  due_date: string;
  status: number;
  amount: { amount: string; code: string };
  outstanding: { amount: string; code: string };
  paid: { amount: string; code: string };
  updated: string;
}

export interface FreshbooksClient {
  id: number;
  userid: number;
  organization: string;
  fname: string;
  lname: string;
  email: string;
  phone_business?: string;
  updated: string;
}

export interface FreshbooksExpense {
  id: number;
  expenseid: number;
  amount: { amount: string; code: string };
  vendor: string;
  category: { category: string; categoryid: number };
  date: string;
  updated: string;
}

export interface FreshbooksPayment {
  id: number;
  logid: number;
  invoiceid: number;
  amount: { amount: string; code: string };
  date: string;
  type: string;
  updated: string;
}

export class FreshbooksConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: FreshbooksConfig;

  constructor(config: FreshbooksConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL:
        config.baseUrl || `https://api.freshbooks.com/accounting/account/${config.accountId}`,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
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
          throw new ConnectorError("Freshbooks permission denied", error);
        if (error.response?.status === 404)
          throw new ConnectorError("Freshbooks resource not found", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Freshbooks rate limit exceeded", error);
        throw new ConnectorError(
          `Freshbooks API error: ${error.response?.data?.message || error.message}`,
          error
        );
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await axios.post(
      "https://api.freshbooks.com/auth/oauth/token",
      {
        grant_type: "refresh_token",
        refresh_token: this.config.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      },
      {
        headers: { "Content-Type": "application/json" },
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
      id: "freshbooks",
      name: "Freshbooks",
      version: "1.0.0",
      apiVersion: "3.0",
      capabilities: { sync: true, webhooks: true, dataVelocity: "low" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/users/me");
      return true;
    } catch {
      return false;
    }
  }

  async getInvoices(params?: {
    page?: number;
    per_page?: number;
    updated_since?: string;
  }): Promise<{ invoices: FreshbooksInvoice[]; total: number; per_page: number; page: number }> {
    try {
      const response = await this.client.get("/invoices/invoices", {
        params: {
          page: params?.page || 1,
          per_page: params?.per_page || 100,
          updated_since: params?.updated_since,
        },
      });
      return response.data.response.result;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Freshbooks invoices", error);
    }
  }

  async getInvoice(invoiceId: number): Promise<FreshbooksInvoice> {
    try {
      const response = await this.client.get(`/invoices/invoices/${invoiceId}`);
      return response.data.response.result.invoice;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Freshbooks invoice ${invoiceId}`, error);
    }
  }

  async getClients(params?: {
    page?: number;
    per_page?: number;
    updated_since?: string;
  }): Promise<{ clients: FreshbooksClient[]; total: number; per_page: number; page: number }> {
    try {
      const response = await this.client.get("/users/clients", {
        params: {
          page: params?.page || 1,
          per_page: params?.per_page || 100,
          updated_since: params?.updated_since,
        },
      });
      return response.data.response.result;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Freshbooks clients", error);
    }
  }

  async getClient(clientId: number): Promise<FreshbooksClient> {
    try {
      const response = await this.client.get(`/users/clients/${clientId}`);
      return response.data.response.result.client;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Freshbooks client ${clientId}`, error);
    }
  }

  async getExpenses(params?: {
    page?: number;
    per_page?: number;
    updated_since?: string;
  }): Promise<{ expenses: FreshbooksExpense[]; total: number; per_page: number; page: number }> {
    try {
      const response = await this.client.get("/expenses/expenses", {
        params: {
          page: params?.page || 1,
          per_page: params?.per_page || 100,
          updated_since: params?.updated_since,
        },
      });
      return response.data.response.result;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Freshbooks expenses", error);
    }
  }

  async getPayments(params?: {
    page?: number;
    per_page?: number;
    updated_since?: string;
  }): Promise<{ payments: FreshbooksPayment[]; total: number; per_page: number; page: number }> {
    try {
      const response = await this.client.get("/payments/payments", {
        params: {
          page: params?.page || 1,
          per_page: params?.per_page || 100,
          updated_since: params?.updated_since,
        },
      });
      return response.data.response.result;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Freshbooks payments", error);
    }
  }

  async createInvoice(invoice: Partial<FreshbooksInvoice>): Promise<FreshbooksInvoice> {
    try {
      const response = await this.client.post("/invoices/invoices", { invoice });
      return response.data.response.result.invoice;
    } catch (error) {
      throw new ConnectorError("Failed to create Freshbooks invoice", error);
    }
  }

  async updateInvoice(
    invoiceId: number,
    invoice: Partial<FreshbooksInvoice>
  ): Promise<FreshbooksInvoice> {
    try {
      const response = await this.client.put(`/invoices/invoices/${invoiceId}`, { invoice });
      return response.data.response.result.invoice;
    } catch (error) {
      throw new ConnectorError(`Failed to update Freshbooks invoice ${invoiceId}`, error);
    }
  }
}

export function createFreshbooksConnector(config: FreshbooksConfig): FreshbooksConnector {
  return new FreshbooksConnector(config);
}
