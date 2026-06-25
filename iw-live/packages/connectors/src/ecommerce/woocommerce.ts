import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface WooCommerceConfig extends ConnectorConfig {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  apiVersion?: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: string;
  stock_quantity?: number;
  categories: Array<{ id: number; name: string }>;
  date_created: string;
  date_modified: string;
}

export interface WooCommerceOrder {
  id: number;
  order_key: string;
  status: string;
  currency: string;
  total: string;
  total_tax: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total: string;
  }>;
  date_created: string;
  date_modified: string;
}

export interface WooCommerceCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  date_created: string;
  date_modified: string;
}

export class WooCommerceConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: WooCommerceConfig;

  constructor(config: WooCommerceConfig) {
    super(config);
    this.config = config;

    const apiVersion = config.apiVersion || "wc/v3";
    this.client = axios.create({
      baseURL: `${config.storeUrl}/wp-json/${apiVersion}`,
      timeout: 30000,
      auth: {
        username: config.consumerKey,
        password: config.consumerSecret,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("WooCommerce authentication failed", error);
        if (error.response?.status === 403)
          throw new ConnectorError("WooCommerce permission denied", error);
        if (error.response?.status === 404)
          throw new ConnectorError("WooCommerce resource not found", error);
        throw new ConnectorError(
          `WooCommerce API error: ${error.response?.data?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "woocommerce",
      name: "WooCommerce",
      version: "1.0.0",
      apiVersion: this.config.apiVersion || "v3",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/system_status");
      return true;
    } catch {
      return false;
    }
  }

  async getProducts(params?: {
    page?: number;
    per_page?: number;
    modified_after?: string;
  }): Promise<WooCommerceProduct[]> {
    try {
      const response = await this.client.get("/products", {
        params: {
          page: params?.page || 1,
          per_page: params?.per_page || 100,
          modified_after: params?.modified_after,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch WooCommerce products", error);
    }
  }

  async getProduct(productId: number): Promise<WooCommerceProduct> {
    try {
      const response = await this.client.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch WooCommerce product ${productId}`, error);
    }
  }

  async getOrders(params?: {
    page?: number;
    per_page?: number;
    modified_after?: string;
    status?: string;
  }): Promise<WooCommerceOrder[]> {
    try {
      const response = await this.client.get("/orders", {
        params: {
          page: params?.page || 1,
          per_page: params?.per_page || 100,
          modified_after: params?.modified_after,
          status: params?.status,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch WooCommerce orders", error);
    }
  }

  async getOrder(orderId: number): Promise<WooCommerceOrder> {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch WooCommerce order ${orderId}`, error);
    }
  }

  async getCustomers(params?: {
    page?: number;
    per_page?: number;
    modified_after?: string;
  }): Promise<WooCommerceCustomer[]> {
    try {
      const response = await this.client.get("/customers", {
        params: {
          page: params?.page || 1,
          per_page: params?.per_page || 100,
          modified_after: params?.modified_after,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch WooCommerce customers", error);
    }
  }

  async getCustomer(customerId: number): Promise<WooCommerceCustomer> {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch WooCommerce customer ${customerId}`, error);
    }
  }

  async createProduct(product: Partial<WooCommerceProduct>): Promise<WooCommerceProduct> {
    try {
      const response = await this.client.post("/products", product);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create WooCommerce product", error);
    }
  }

  async updateProduct(
    productId: number,
    product: Partial<WooCommerceProduct>
  ): Promise<WooCommerceProduct> {
    try {
      const response = await this.client.put(`/products/${productId}`, product);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update WooCommerce product ${productId}`, error);
    }
  }

  async updateOrder(orderId: number, order: Partial<WooCommerceOrder>): Promise<WooCommerceOrder> {
    try {
      const response = await this.client.put(`/orders/${orderId}`, order);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update WooCommerce order ${orderId}`, error);
    }
  }
}

export function createWooCommerceConnector(config: WooCommerceConfig): WooCommerceConnector {
  return new WooCommerceConnector(config);
}
