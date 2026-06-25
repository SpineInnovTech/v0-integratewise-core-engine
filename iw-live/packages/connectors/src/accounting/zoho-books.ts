import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface ZohoBooksConfig extends ConnectorConfig {
  clientId?: string;
  clientSecret?: string;
  organizationId: string;
  region?: "IN" | "US" | "EU";
  /** OAuth access token (required for API calls and testConnection). */
  accessToken?: string;
}

// Invoice interface for GST reporting
export interface ZohoInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  date: string;
  due_date: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  total: number;
  balance: number;
  currency_code: string;
  line_items: Array<{
    item_id: string;
    name: string;
    quantity: number;
    rate: number;
    tax_percentage: number;
    amount: number;
  }>;
}

// Customer interface
export interface ZohoCustomer {
  contact_id: string;
  contact_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  billing_address?: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  gstin?: string;
}

export class ZohoBooksConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: ZohoBooksConfig;

  constructor(config: ZohoBooksConfig) {
    super(config);
    this.config = config;
    const region = config.region ?? "IN";
    const baseURL =
      region === "US"
        ? "https://www.zohoapis.com/books/v3"
        : region === "EU"
          ? "https://www.zohoapis.eu/books/v3"
          : "https://www.zohoapis.in/books/v3";
    const headers: Record<string, string> = { Accept: "application/json" };
    if (config.accessToken) {
      headers["Authorization"] = `Zoho-oauthtoken ${config.accessToken}`;
    }
    this.client = axios.create({ baseURL, headers });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "zoho-books",
      name: "Zoho Books",
      version: "1.0.0",
      apiVersion: "v3",
      capabilities: {
        sync: true,
        webhooks: true,
        dataVelocity: "high",
      },
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.accessToken) {
      return false;
    }
    try {
      const response = await this.client.get("/organizations");
      return response.status === 200 && Array.isArray(response.data?.organizations);
    } catch {
      return false;
    }
  }

  // Get invoices with optional filters
  async getInvoices(params?: {
    date_start?: string;
    date_end?: string;
    status?: string;
    customer_id?: string;
  }): Promise<ZohoInvoice[]> {
    try {
      const response = await this.client.get("/invoices", {
        params: {
          organization_id: this.config.organizationId,
          ...params,
        },
      });
      return response.data.invoices || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch invoices from Zoho Books", error);
    }
  }

  // Get customers
  async getCustomers(params?: { search_text?: string }): Promise<ZohoCustomer[]> {
    try {
      const response = await this.client.get("/contacts", {
        params: {
          organization_id: this.config.organizationId,
          ...params,
        },
      });
      return response.data.contacts || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch customers from Zoho Books", error);
    }
  }
}
