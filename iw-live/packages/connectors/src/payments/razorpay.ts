import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Razorpay Connector — Customer Data (Payments, Orders, Settlements, Disputes)
//
// This is a CUSTOMER-FACING connector that syncs a tenant's Razorpay data
// into the IntegrateWise Spine. It is distinct from the IntegrateWise billing
// service's internal Razorpay integration.
// ============================================================================

export interface RazorpayConfig extends ConnectorConfig {
  keyId: string;
  keySecret: string;
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Razorpay Entity Interfaces
// ---------------------------------------------------------------------------

export interface RazorpayPayment {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string;
  order_id?: string;
  description?: string;
  email?: string;
  contact?: string;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  notes?: Record<string, string>;
  created_at: number;
  captured_at?: number;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  international?: boolean;
}

export interface RazorpayOrder {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: "created" | "attempted" | "paid";
  notes?: Record<string, string>;
  created_at: number;
}

export interface RazorpaySettlement {
  id: string;
  entity: "settlement";
  amount: number;
  status: "created" | "processed" | "failed";
  fees: number;
  tax: number;
  utr: string;
  created_at: number;
}

export interface RazorpayRefund {
  id: string;
  entity: "refund";
  payment_id: string;
  amount: number;
  currency: string;
  status: "pending" | "processed" | "failed";
  speed_requested: "normal" | "optimum";
  speed_processed: "normal" | "instant";
  notes?: Record<string, string>;
  created_at: number;
}

export interface RazorpayDispute {
  id: string;
  entity: "dispute";
  payment_id: string;
  amount: number;
  currency: string;
  amount_deducted: number;
  status: "open" | "under_review" | "won" | "lost" | "closed" | "accepted";
  reason_code: string;
  reason_description: string;
  phase: "chargeback" | "pre_arbitration" | "arbitration" | "fraud";
  respond_by: number;
  created_at: number;
}

export interface RazorpayCustomer {
  id: string;
  entity: "customer";
  name?: string;
  email?: string;
  contact?: string;
  gstin?: string;
  notes?: Record<string, string>;
  created_at: number;
}

export interface RazorpayListParams {
  count?: number;
  skip?: number;
  from?: number;
  to?: number;
}

export class RazorpayConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: RazorpayConfig;

  constructor(config: RazorpayConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.razorpay.com/v1",
      timeout: 30000,
      auth: {
        username: config.keyId,
        password: config.keySecret,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError(
            "Razorpay authentication failed — check key_id and key_secret",
            error
          );
        if (error.response?.status === 400)
          throw new ConnectorError(
            `Razorpay bad request: ${error.response?.data?.error?.description || error.message}`,
            error
          );
        if (error.response?.status === 429)
          throw new ConnectorError("Razorpay rate limit exceeded", error);
        throw new ConnectorError(
          `Razorpay API error: ${error.response?.data?.error?.description || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "razorpay",
      name: "Razorpay",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: true },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/payments", { params: { count: 1 } });
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Payments
  // ---------------------------------------------------------------------------

  async getPayments(
    params?: RazorpayListParams
  ): Promise<{ items: RazorpayPayment[]; count: number }> {
    try {
      const response = await this.client.get("/payments", {
        params: {
          count: params?.count || 100,
          skip: params?.skip || 0,
          from: params?.from,
          to: params?.to,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Razorpay payments", error);
    }
  }

  async getPayment(paymentId: string): Promise<RazorpayPayment> {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get payment ${paymentId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Orders
  // ---------------------------------------------------------------------------

  async getOrders(params?: RazorpayListParams): Promise<{ items: RazorpayOrder[]; count: number }> {
    try {
      const response = await this.client.get("/orders", {
        params: {
          count: params?.count || 100,
          skip: params?.skip || 0,
          from: params?.from,
          to: params?.to,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Razorpay orders", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Settlements
  // ---------------------------------------------------------------------------

  async getSettlements(
    params?: RazorpayListParams
  ): Promise<{ items: RazorpaySettlement[]; count: number }> {
    try {
      const response = await this.client.get("/settlements", {
        params: {
          count: params?.count || 100,
          skip: params?.skip || 0,
          from: params?.from,
          to: params?.to,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Razorpay settlements", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Refunds
  // ---------------------------------------------------------------------------

  async getRefunds(
    params?: RazorpayListParams
  ): Promise<{ items: RazorpayRefund[]; count: number }> {
    try {
      const response = await this.client.get("/refunds", {
        params: {
          count: params?.count || 100,
          skip: params?.skip || 0,
          from: params?.from,
          to: params?.to,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Razorpay refunds", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Disputes
  // ---------------------------------------------------------------------------

  async getDisputes(
    params?: RazorpayListParams
  ): Promise<{ items: RazorpayDispute[]; count: number }> {
    try {
      const response = await this.client.get("/disputes", {
        params: {
          count: params?.count || 100,
          skip: params?.skip || 0,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Razorpay disputes", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Customers
  // ---------------------------------------------------------------------------

  async getCustomers(
    params?: RazorpayListParams
  ): Promise<{ items: RazorpayCustomer[]; count: number }> {
    try {
      const response = await this.client.get("/customers", {
        params: {
          count: params?.count || 100,
          skip: params?.skip || 0,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Razorpay customers", error);
    }
  }

  async getCustomer(customerId: string): Promise<RazorpayCustomer> {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get customer ${customerId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Invoices (Razorpay payment links / invoices)
  // ---------------------------------------------------------------------------

  async getInvoices(params?: RazorpayListParams): Promise<{ items: any[]; count: number }> {
    try {
      const response = await this.client.get("/invoices", {
        params: {
          count: params?.count || 100,
          skip: params?.skip || 0,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Razorpay invoices", error);
    }
  }
}

export function createRazorpayConnector(config: RazorpayConfig): RazorpayConnector {
  return new RazorpayConnector(config);
}
