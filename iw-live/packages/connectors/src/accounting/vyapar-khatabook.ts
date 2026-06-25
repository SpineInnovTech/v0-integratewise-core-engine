import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Vyapar Connector — Indian Invoicing & Accounting App
//
// Vyapar is used by millions of Indian SMBs for invoicing, inventory,
// and GST compliance. API access is via their REST API.
// ============================================================================

export interface VyaparConfig extends ConnectorConfig {
  accessToken: string;
  refreshToken?: string;
  businessId?: string;
  baseUrl?: string;
}

export interface VyaparInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  items: Array<{
    name: string;
    quantity: number;
    rate: number;
    amount: number;
    hsnCode?: string;
    gstRate?: number;
  }>;
  gstin?: string;
}

export interface VyaparCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  balance: number;
}

export interface VyaparProduct {
  id: string;
  name: string;
  salePrice: number;
  purchasePrice?: number;
  stock: number;
  unit: string;
  hsnCode?: string;
  gstRate?: number;
  category?: string;
}

export class VyaparConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: VyaparConfig;

  constructor(config: VyaparConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.vyaparapp.in/v1",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("Vyapar authentication failed — check access token", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Vyapar rate limit exceeded", error);
        throw new ConnectorError(
          `Vyapar API error: ${error.response?.data?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "vyapar",
      name: "Vyapar",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: false },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/business/profile");
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Invoices
  // ---------------------------------------------------------------------------

  async getInvoices(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<{ data: VyaparInvoice[]; total: number }> {
    try {
      const response = await this.client.get("/invoices", {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset || 0,
          status: params?.status,
          from_date: params?.from,
          to_date: params?.to,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Vyapar invoices", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Customers (Parties)
  // ---------------------------------------------------------------------------

  async getCustomers(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ data: VyaparCustomer[]; total: number }> {
    try {
      const response = await this.client.get("/parties", {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset || 0,
          type: "customer",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Vyapar customers", error);
    }
  }

  async getVendors(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ data: VyaparCustomer[]; total: number }> {
    try {
      const response = await this.client.get("/parties", {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset || 0,
          type: "vendor",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Vyapar vendors", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Products (Items)
  // ---------------------------------------------------------------------------

  async getProducts(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ data: VyaparProduct[]; total: number }> {
    try {
      const response = await this.client.get("/items", {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset || 0,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Vyapar products", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Expenses
  // ---------------------------------------------------------------------------

  async getExpenses(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    try {
      const response = await this.client.get("/expenses", {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset || 0,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Vyapar expenses", error);
    }
  }
}

export function createVyaparConnector(config: VyaparConfig): VyaparConnector {
  return new VyaparConnector(config);
}

// ============================================================================
// Khatabook Connector — Digital Ledger for Indian Small Businesses
//
// Khatabook is primarily mobile-first with limited API access.
// This connector provides the interface for when API access becomes available.
// ============================================================================

export interface KhatabookConfig extends ConnectorConfig {
  apiKey: string;
  businessId: string;
  baseUrl?: string;
}

export class KhatabookConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: KhatabookConfig;

  constructor(config: KhatabookConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.khatabook.com/v1",
      timeout: 30000,
      headers: {
        "X-Api-Key": config.apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "khatabook",
      name: "Khatabook",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: false },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get(`/business/${this.config.businessId}`);
      return true;
    } catch {
      return false;
    }
  }

  async getLedgerEntries(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    try {
      const response = await this.client.get(`/business/${this.config.businessId}/entries`, {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset || 0,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Khatabook ledger entries", error);
    }
  }

  async getCustomers(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    try {
      const response = await this.client.get(`/business/${this.config.businessId}/customers`, {
        params: {
          limit: params?.limit || 50,
          offset: params?.offset || 0,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Khatabook customers", error);
    }
  }
}

export function createKhatabookConnector(config: KhatabookConfig): KhatabookConnector {
  return new KhatabookConnector(config);
}
