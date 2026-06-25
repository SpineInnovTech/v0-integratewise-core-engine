import axios, { AxiosInstance } from "axios";
import { BaseConnector, ConnectorConfig, ConnectorError } from "@integratewise/connector-contracts";

// GST Portal Configuration
export interface GSTPortalConfig extends ConnectorConfig {
  gstin: string;
  username: string;
  password: string;
  baseURL?: string;
}

// GST Portal API Response Types
export interface GSTPortalReturn {
  gstin: string;
  return_type: "GSTR1" | "GSTR2" | "GSTR3B";
  period: string;
  status: "pending" | "filed" | "amended" | "rejected";
  filing_date?: string;
  due_date: string;
  reference_number?: string;
  total_tax: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface GSTINDetails {
  gstin: string;
  legal_name: string;
  trade_name?: string;
  address: string;
  state: string;
  pincode: string;
  status: "active" | "inactive" | "cancelled";
  registration_date: string;
  business_type: string;
}

export interface LiabilityLedger {
  gstin: string;
  period: string;
  opening_balance: number;
  transactions: Array<{
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    reference_number?: string;
  }>;
  closing_balance: number;
}

export interface GSTR3BData {
  gstin: string;
  period: string;
  section_3_1_a: number; // Outward taxable supplies
  section_3_1_b: number; // Outward taxable supplies (zero rated)
  section_3_1_c: number; // Other outward supplies (nil rated, exempted)
  section_3_1_d: number; // Inward supplies (liable to reverse charge)
  section_3_1_e: number; // Non-GST outward supplies

  section_3_2_a_1: number; // IGST
  section_3_2_a_2: number; // CGST
  section_3_2_a_3: number; // SGST/UTGST
  section_3_2_a_4: number; // Cess

  section_4_a_1: number; // ITC from imports
  section_4_a_2: number; // ITC from inward supplies
  section_4_a_3: number; // ITC under reverse charge
  section_4_a_4: number; // ITC from all other sources

  section_5_1: number; // Interest
  section_5_2: number; // Late fee
}

export class GSTPortalConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: GSTPortalConfig;
  private sessionToken?: string;

  constructor(config: GSTPortalConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseURL || "https://api.gst.gov.in/v1",
      timeout: 60000, // GST portal can be slow
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "IntegrateWise-GST-Connector/1.0",
      },
    });

    // Add request interceptor for session management
    this.client.interceptors.request.use(async (config) => {
      if (!this.sessionToken) {
        await this.authenticate();
      }
      config.headers["Authorization"] = `Bearer ${this.sessionToken}`;
      config.headers["gstin"] = this.config.gstin;
      return config;
    });

    // Add response interceptor for session refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Session expired, try to refresh
          this.sessionToken = undefined;
          await this.authenticate();
          // Retry the request
          const config = error.config;
          config.headers["Authorization"] = `Bearer ${this.sessionToken}`;
          return this.client.request(config);
        }
        throw error;
      }
    );
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(
        "https://api.gst.gov.in/v1/authenticate",
        {
          gstin: this.config.gstin,
          username: this.config.username,
          password: this.config.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      this.sessionToken = response.data.token;
      if (!this.sessionToken) {
        throw new Error("No session token received from GST portal");
      }
    } catch (error) {
      throw new ConnectorError("Failed to authenticate with GST Portal", error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/gstin/details");
      return response.status === 200 && response.data.gstin === this.config.gstin;
    } catch (error) {
      throw new ConnectorError("Failed to test GST Portal connection", error);
    }
  }

  async getGSTINDetails(): Promise<GSTINDetails> {
    try {
      const response = await this.client.get("/gstin/details");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get GSTIN details from GST Portal", error);
    }
  }

  async getGSTReturns(params?: {
    fromDate?: string;
    toDate?: string;
    returnType?: "GSTR1" | "GSTR2" | "GSTR3B";
  }): Promise<GSTPortalReturn[]> {
    try {
      const response = await this.client.get("/returns", { params });
      return response.data.returns || [];
    } catch (error) {
      throw new ConnectorError("Failed to get GST returns from GST Portal", error);
    }
  }

  async fileGSTR3B(gstr3bData: GSTR3BData): Promise<{
    referenceNumber: string;
    status: string;
    filingDate: string;
  }> {
    try {
      const response = await this.client.post("/returns/gstr3b", gstr3bData);
      return {
        referenceNumber: response.data.reference_number,
        status: response.data.status,
        filingDate: response.data.filing_date,
      };
    } catch (error) {
      throw new ConnectorError("Failed to file GSTR-3B with GST Portal", error);
    }
  }

  async getLiabilityLedger(period: string): Promise<LiabilityLedger> {
    try {
      const response = await this.client.get("/liability-ledger", {
        params: { period },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get liability ledger from GST Portal", error);
    }
  }

  async getOutstandingLiability(): Promise<{
    gstin: string;
    totalOutstanding: number;
    breakdown: {
      igst: number;
      cgst: number;
      sgst: number;
      cess: number;
      interest: number;
      penalty: number;
    };
  }> {
    try {
      const response = await this.client.get("/liability/outstanding");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get outstanding liability from GST Portal", error);
    }
  }

  async downloadGSTReturn(
    returnType: string,
    period: string
  ): Promise<{
    fileContent: string; // base64 encoded PDF
    fileName: string;
  }> {
    try {
      const response = await this.client.get("/returns/download", {
        params: { return_type: returnType, period },
        responseType: "arraybuffer",
      });

      return {
        fileContent: Buffer.from(response.data, "binary").toString("base64"),
        fileName: `${returnType}_${period}.pdf`,
      };
    } catch (error) {
      throw new ConnectorError("Failed to download GST return from GST Portal", error);
    }
  }

  async getFilingStatus(
    returnType: string,
    period: string
  ): Promise<{
    status: "not_filed" | "filed" | "pending" | "rejected";
    filing_date?: string;
    due_date: string;
    reference_number?: string;
  }> {
    try {
      const response = await this.client.get("/returns/status", {
        params: { return_type: returnType, period },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get filing status from GST Portal", error);
    }
  }

  async amendGSTReturn(
    returnType: string,
    period: string,
    amendmentData: any
  ): Promise<{
    amendmentReference: string;
    status: string;
  }> {
    try {
      const response = await this.client.post("/returns/amend", {
        return_type: returnType,
        period,
        ...amendmentData,
      });
      return {
        amendmentReference: response.data.amendment_reference,
        status: response.data.status,
      };
    } catch (error) {
      throw new ConnectorError("Failed to amend GST return with GST Portal", error);
    }
  }

  async getPaymentHistory(params?: { fromDate?: string; toDate?: string }): Promise<
    Array<{
      date: string;
      amount: number;
      reference_number: string;
      payment_mode: string;
      status: "success" | "failed" | "pending";
    }>
  > {
    try {
      const response = await this.client.get("/payments/history", { params });
      return response.data.payments || [];
    } catch (error) {
      throw new ConnectorError("Failed to get payment history from GST Portal", error);
    }
  }
}

// Factory function for creating GST Portal connector
export function createGSTPortalConnector(config: GSTPortalConfig): GSTPortalConnector {
  return new GSTPortalConnector(config);
}
