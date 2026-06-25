import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface BigCommerceConfig extends ConnectorConfig {
  storeHash: string;
  accessToken: string;
  baseUrl?: string;
}

export interface BigCommerceProduct {
  id: number;
  name: string;
  type: string;
  sku: string;
  price: number;
  sale_price?: number;
  inventory_level: number;
  inventory_tracking: string;
  categories: number[];
  date_created: string;
  date_modified: string;
}

export interface BigCommerceOrder {
  id: number;
  customer_id: number;
  status_id: number;
  status: string;
  subtotal_ex_tax: string;
  subtotal_inc_tax: string;
  total_ex_tax: string;
  total_inc_tax: string;
  currency_code: string;
  billing_address: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    street_1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  products: {
    url: string;
    resource: string;
  };
  date_created: string;
  date_modified: string;
}

export interface BigCommerceCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  phone: string;
  store_credit_amounts: Array<{ amount: number }>;
  date_created: string;
  date_modified: string;
}

export class BigCommerceConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: BigCommerceConfig;

  constructor(config: BigCommerceConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || `https://api.bigcommerce.com/stores/${config.storeHash}/v3`,
      timeout: 30000,
      headers: {
        "X-Auth-Token": config.accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("BigCommerce authentication failed", error);
        if (error.response?.status === 403)
          throw new ConnectorError("BigCommerce permission denied", error);
        if (error.response?.status === 404)
          throw new ConnectorError("BigCommerce resource not found", error);
        if (error.response?.status === 429)
          throw new ConnectorError("BigCommerce rate limit exceeded", error);
        throw new ConnectorError(
          `BigCommerce API error: ${error.response?.data?.title || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "bigcommerce",
      name: "BigCommerce",
      version: "1.0.0",
      apiVersion: "v3",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/catalog/summary");
      return true;
    } catch {
      return false;
    }
  }

  async getProducts(params?: {
    page?: number;
    limit?: number;
    date_modified?: string;
  }): Promise<{ data: BigCommerceProduct[]; meta: { pagination: any } }> {
    try {
      const response = await this.client.get("/catalog/products", {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 250,
          "date_modified:min": params?.date_modified,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch BigCommerce products", error);
    }
  }

  async getProduct(productId: number): Promise<BigCommerceProduct> {
    try {
      const response = await this.client.get(`/catalog/products/${productId}`);
      return response.data.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch BigCommerce product ${productId}`, error);
    }
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
    min_date_modified?: string;
  }): Promise<BigCommerceOrder[]> {
    try {
      const v2Client = axios.create({
        baseURL: `https://api.bigcommerce.com/stores/${this.config.storeHash}/v2`,
        headers: {
          "X-Auth-Token": this.config.accessToken,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const response = await v2Client.get("/orders", {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 250,
          min_date_modified: params?.min_date_modified,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch BigCommerce orders", error);
    }
  }

  async getOrder(orderId: number): Promise<BigCommerceOrder> {
    try {
      const v2Client = axios.create({
        baseURL: `https://api.bigcommerce.com/stores/${this.config.storeHash}/v2`,
        headers: {
          "X-Auth-Token": this.config.accessToken,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const response = await v2Client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch BigCommerce order ${orderId}`, error);
    }
  }

  async getCustomers(params?: {
    page?: number;
    limit?: number;
    date_modified?: string;
  }): Promise<{ data: BigCommerceCustomer[]; meta: { pagination: any } }> {
    try {
      const response = await this.client.get("/customers", {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 250,
          "date_modified:min": params?.date_modified,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch BigCommerce customers", error);
    }
  }

  async getCustomer(customerId: number): Promise<BigCommerceCustomer> {
    try {
      const response = await this.client.get(`/customers?id:in=${customerId}`);
      return response.data.data[0];
    } catch (error) {
      throw new ConnectorError(`Failed to fetch BigCommerce customer ${customerId}`, error);
    }
  }

  async createProduct(product: Partial<BigCommerceProduct>): Promise<BigCommerceProduct> {
    try {
      const response = await this.client.post("/catalog/products", product);
      return response.data.data;
    } catch (error) {
      throw new ConnectorError("Failed to create BigCommerce product", error);
    }
  }

  async updateProduct(
    productId: number,
    product: Partial<BigCommerceProduct>
  ): Promise<BigCommerceProduct> {
    try {
      const response = await this.client.put(`/catalog/products/${productId}`, product);
      return response.data.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update BigCommerce product ${productId}`, error);
    }
  }
}

export function createBigCommerceConnector(config: BigCommerceConfig): BigCommerceConnector {
  return new BigCommerceConnector(config);
}
