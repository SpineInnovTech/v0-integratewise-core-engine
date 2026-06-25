import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface PaddleConfig extends ConnectorConfig {
  apiKey: string;
  vendorId: string;
  environment?: "sandbox" | "production";
  baseUrl?: string;
}

export interface PaddleSubscription {
  subscription_id: number;
  plan_id: number;
  user_id: number;
  user_email: string;
  state: string;
  signup_date: string;
  last_payment: { amount: number; currency: string; date: string };
  next_payment: { amount: number; currency: string; date: string };
  update_url: string;
  cancel_url: string;
  paused_at?: string;
  paused_from?: string;
}

export interface PaddleTransaction {
  order_id: string;
  checkout_id: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
  passthrough?: string;
  product_id: number;
  is_subscription: boolean;
  user: { user_id: number; email: string; country: string };
}

export interface PaddleProduct {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  currency: string;
  icon?: string;
}

export interface PaddlePlan {
  id: number;
  name: string;
  billing_type: string;
  billing_period: number;
  initial_price: { USD: string };
  recurring_price: { USD: string };
  trial_days: number;
}

export class PaddleConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: PaddleConfig;

  constructor(config: PaddleConfig) {
    super(config);
    this.config = config;

    const baseUrl =
      config.baseUrl ||
      (config.environment === "sandbox"
        ? "https://sandbox-vendors.paddle.com/api/2.0"
        : "https://vendors.paddle.com/api/2.0");

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 403)
          throw new ConnectorError("Paddle permission denied", error);
        if (error.response?.status === 404)
          throw new ConnectorError("Paddle resource not found", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Paddle rate limit exceeded", error);
        throw new ConnectorError(
          `Paddle API error: ${error.response?.data?.error?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "paddle",
      name: "Paddle",
      version: "1.0.0",
      apiVersion: "2.0",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getProducts({ page: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async getSubscriptions(params?: {
    plan?: number;
    state?: string;
    page?: number;
  }): Promise<PaddleSubscription[]> {
    try {
      const response = await this.client.post("/subscription/users", {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        plan: params?.plan,
        state: params?.state,
        page: params?.page || 1,
      });
      return response.data.response || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Paddle subscriptions", error);
    }
  }

  async getSubscription(subscriptionId: number): Promise<PaddleSubscription> {
    try {
      const response = await this.client.post("/subscription/users", {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        subscription_id: subscriptionId,
      });
      const subs = response.data.response || [];
      if (subs.length === 0) {
        throw new Error("Subscription not found");
      }
      return subs[0];
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Paddle subscription ${subscriptionId}`, error);
    }
  }

  async getTransactions(params?: { page?: number }): Promise<PaddleTransaction[]> {
    try {
      const response = await this.client.post("/order/get_details", {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        page: params?.page || 1,
      });
      return response.data.response || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Paddle transactions", error);
    }
  }

  async getProducts(params?: { page?: number }): Promise<PaddleProduct[]> {
    try {
      const response = await this.client.post("/product/get_products", {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        page: params?.page || 1,
      });
      return response.data.response.products || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Paddle products", error);
    }
  }

  async getPlans(params?: { plan?: number }): Promise<PaddlePlan[]> {
    try {
      const response = await this.client.post("/subscription/plans", {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        plan: params?.plan,
      });
      return response.data.response || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Paddle plans", error);
    }
  }

  async cancelSubscription(subscriptionId: number): Promise<any> {
    try {
      const response = await this.client.post("/subscription/users_cancel", {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        subscription_id: subscriptionId,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to cancel Paddle subscription ${subscriptionId}`, error);
    }
  }

  async updateSubscription(
    subscriptionId: number,
    updates: { plan_id?: number; quantity?: number; price?: number }
  ): Promise<any> {
    try {
      const response = await this.client.post("/subscription/users/update", {
        vendor_id: this.config.vendorId,
        vendor_auth_code: this.config.apiKey,
        subscription_id: subscriptionId,
        ...updates,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Paddle subscription ${subscriptionId}`, error);
    }
  }
}

export function createPaddleConnector(config: PaddleConfig): PaddleConnector {
  return new PaddleConnector(config);
}
