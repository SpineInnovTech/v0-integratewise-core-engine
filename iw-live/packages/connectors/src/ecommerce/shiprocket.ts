import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Shiprocket Connector — Indian E-Commerce Logistics
//
// Shiprocket is the largest e-commerce logistics aggregator in India,
// used by D2C brands and SMB sellers. REST API with token-based auth.
// ============================================================================

export interface ShiprocketConfig extends ConnectorConfig {
  email: string;
  password: string;
  /** Cached auth token (obtained via login). */
  token?: string;
  baseUrl?: string;
}

export interface ShiprocketOrder {
  id: number;
  channel_id: number;
  channel_order_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  status: string;
  status_code: number;
  payment_method: "COD" | "Prepaid";
  total: number;
  sub_total: number;
  shipping_charges?: number;
  created_at: string;
  pickup_location: string;
  items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
  }>;
}

export interface ShiprocketShipment {
  id: number;
  order_id: number;
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
  status: string;
  status_code: number;
  delivered_date?: string;
  etd?: string;
  weight: number;
  dimensions?: { length: number; breadth: number; height: number };
}

export interface ShiprocketTracking {
  awb_code: string;
  courier_name: string;
  current_status: string;
  current_status_id: number;
  shipment_status: number;
  delivered_date?: string;
  etd?: string;
  scans: Array<{
    date: string;
    activity: string;
    location: string;
    status: string;
  }>;
}

export class ShiprocketConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: ShiprocketConfig;

  constructor(config: ShiprocketConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://apiv2.shiprocket.in/v1/external",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Try to re-authenticate
          try {
            await this.authenticate();
            error.config.headers.Authorization = `Bearer ${this.config.token}`;
            return this.client.request(error.config);
          } catch {
            throw new ConnectorError("Shiprocket authentication failed", error);
          }
        }
        if (error.response?.status === 429)
          throw new ConnectorError("Shiprocket rate limit exceeded", error);
        throw new ConnectorError(
          `Shiprocket API error: ${error.response?.data?.message || error.message}`,
          error
        );
      }
    );
  }

  private async authenticate(): Promise<void> {
    const response = await axios.post(
      `${this.config.baseUrl || "https://apiv2.shiprocket.in/v1/external"}/auth/login`,
      { email: this.config.email, password: this.config.password }
    );
    this.config.token = response.data.token;
    this.client.defaults.headers.Authorization = `Bearer ${response.data.token}`;
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "shiprocket",
      name: "Shiprocket",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: true },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.config.token) await this.authenticate();
      await this.client.get("/orders", { params: { per_page: 1 } });
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Orders
  // ---------------------------------------------------------------------------

  async getOrders(params?: {
    per_page?: number;
    page?: number;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<{
    data: ShiprocketOrder[];
    meta: { pagination: { total: number; current_page: number; last_page: number } };
  }> {
    try {
      if (!this.config.token) await this.authenticate();
      const response = await this.client.get("/orders", {
        params: {
          per_page: params?.per_page || 50,
          page: params?.page || 1,
          status: params?.status,
          from: params?.from,
          to: params?.to,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Shiprocket orders", error);
    }
  }

  async getOrder(orderId: number): Promise<ShiprocketOrder> {
    try {
      if (!this.config.token) await this.authenticate();
      const response = await this.client.get(`/orders/show/${orderId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get Shiprocket order ${orderId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Shipments
  // ---------------------------------------------------------------------------

  async getShipments(params?: {
    per_page?: number;
    page?: number;
  }): Promise<{ data: ShiprocketShipment[] }> {
    try {
      if (!this.config.token) await this.authenticate();
      const response = await this.client.get("/shipments", {
        params: {
          per_page: params?.per_page || 50,
          page: params?.page || 1,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Shiprocket shipments", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Tracking
  // ---------------------------------------------------------------------------

  async trackShipment(awbCode: string): Promise<ShiprocketTracking> {
    try {
      if (!this.config.token) await this.authenticate();
      const response = await this.client.get(`/courier/track/awb/${awbCode}`);
      return response.data.tracking_data;
    } catch (error) {
      throw new ConnectorError(`Failed to track shipment ${awbCode}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Returns
  // ---------------------------------------------------------------------------

  async getReturns(params?: { per_page?: number; page?: number }): Promise<{ data: any[] }> {
    try {
      if (!this.config.token) await this.authenticate();
      const response = await this.client.get("/orders/processing/return", {
        params: {
          per_page: params?.per_page || 50,
          page: params?.page || 1,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Shiprocket returns", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Channels
  // ---------------------------------------------------------------------------

  async getChannels(): Promise<{ data: Array<{ id: number; name: string; base: string }> }> {
    try {
      if (!this.config.token) await this.authenticate();
      const response = await this.client.get("/channels");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Shiprocket channels", error);
    }
  }
}

export function createShiprocketConnector(config: ShiprocketConfig): ShiprocketConnector {
  return new ShiprocketConnector(config);
}
