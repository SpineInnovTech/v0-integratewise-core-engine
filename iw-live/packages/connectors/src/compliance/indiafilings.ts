import axios, { AxiosInstance } from "axios";
import { BaseConnector, ConnectorConfig, ConnectorError } from "@integratewise/connector-contracts";

// IndiaFilings API Configuration
export interface IndiaFilingsConfig extends ConnectorConfig {
  apiKey: string;
  username: string;
  baseURL?: string;
}

// IndiaFilings API Response Types
export interface FilingStatus {
  filing_id: string;
  service_type: "GST" | "TDS" | "ITR" | "MCA";
  status: "pending" | "processing" | "completed" | "failed";
  submitted_date: string;
  completed_date?: string;
  reference_number?: string;
  documents: Array<{
    document_id: string;
    document_type: string;
    status: "uploaded" | "verified" | "rejected";
  }>;
}

export interface GSTReturn {
  gstin: string;
  return_type: "GSTR1" | "GSTR2" | "GSTR3B";
  period: string;
  status: "draft" | "filed" | "amended";
  filing_date?: string;
  due_date: string;
  total_tax: number;
  input_tax_credit: number;
  output_tax: number;
}

export interface CompanyCompliance {
  company_id: string;
  gstin?: string;
  pan: string;
  tan?: string;
  compliance_status: {
    gst: "compliant" | "warning" | "non-compliant";
    tds: "compliant" | "warning" | "non-compliant";
    itr: "compliant" | "warning" | "non-compliant";
    mca: "compliant" | "warning" | "non-compliant";
  };
  upcoming_deadlines: Array<{
    type: string;
    due_date: string;
    description: string;
  }>;
}

export class IndiaFilingsConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: IndiaFilingsConfig;

  constructor(config: IndiaFilingsConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseURL || "https://api.indiafilings.com/v1",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
        "X-Username": config.username,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new ConnectorError("Invalid API credentials for IndiaFilings", error);
        }
        if (error.response?.status === 429) {
          throw new ConnectorError("Rate limit exceeded for IndiaFilings API", error);
        }
        throw new ConnectorError("IndiaFilings API error", error);
      }
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.status === 200;
    } catch (error) {
      throw new ConnectorError("Failed to test IndiaFilings connection", error);
    }
  }

  async getFilingStatus(filingId: string): Promise<FilingStatus> {
    try {
      const response = await this.client.get(`/filings/${filingId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get filing status from IndiaFilings", error);
    }
  }

  async getAllFilings(params?: {
    status?: string;
    service_type?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<FilingStatus[]> {
    try {
      const response = await this.client.get("/filings", { params });
      return response.data.filings || [];
    } catch (error) {
      throw new ConnectorError("Failed to get filings from IndiaFilings", error);
    }
  }

  async submitGSTReturn(gstData: {
    gstin: string;
    return_type: "GSTR1" | "GSTR2" | "GSTR3B";
    period: string;
    sales_data: Array<{
      invoice_number: string;
      invoice_date: string;
      customer_gstin?: string;
      taxable_value: number;
      igst_rate?: number;
      cgst_rate?: number;
      sgst_rate?: number;
      igst_amount?: number;
      cgst_amount?: number;
      sgst_amount?: number;
    }>;
    purchase_data?: Array<{
      invoice_number: string;
      invoice_date: string;
      supplier_gstin?: string;
      taxable_value: number;
      igst_rate?: number;
      cgst_rate?: number;
      sgst_rate?: number;
      igst_amount?: number;
      cgst_amount?: number;
      sgst_amount?: number;
    }>;
  }): Promise<{ filing_id: string; status: string }> {
    try {
      const response = await this.client.post("/gst/returns", gstData);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to submit GST return to IndiaFilings", error);
    }
  }

  async submitTDSReturn(tdsData: {
    tan: string;
    quarter: string;
    year: number;
    deductee_details: Array<{
      deductee_name: string;
      deductee_pan: string;
      section: string;
      amount_paid: number;
      tds_amount: number;
      rate: number;
    }>;
  }): Promise<{ filing_id: string; status: string }> {
    try {
      const response = await this.client.post("/tds/returns", tdsData);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to submit TDS return to IndiaFilings", error);
    }
  }

  async getComplianceStatus(companyId: string): Promise<CompanyCompliance> {
    try {
      const response = await this.client.get(`/companies/${companyId}/compliance`);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get compliance status from IndiaFilings", error);
    }
  }

  async getUpcomingDeadlines(companyId: string): Promise<
    Array<{
      type: string;
      due_date: string;
      description: string;
      priority: "high" | "medium" | "low";
    }>
  > {
    try {
      const response = await this.client.get(`/companies/${companyId}/deadlines`);
      return response.data.deadlines || [];
    } catch (error) {
      throw new ConnectorError("Failed to get upcoming deadlines from IndiaFilings", error);
    }
  }

  async uploadDocument(
    filingId: string,
    document: {
      document_type: "invoice" | "receipt" | "form" | "certificate";
      file_name: string;
      file_content: string; // base64 encoded
      mime_type: string;
    }
  ): Promise<{ document_id: string; status: string }> {
    try {
      const response = await this.client.post(`/filings/${filingId}/documents`, document);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to upload document to IndiaFilings", error);
    }
  }

  async getGSTReturns(
    gstin: string,
    params?: {
      from_period?: string;
      to_period?: string;
      return_type?: string;
    }
  ): Promise<GSTReturn[]> {
    try {
      const response = await this.client.get(`/gst/${gstin}/returns`, { params });
      return response.data.returns || [];
    } catch (error) {
      throw new ConnectorError("Failed to get GST returns from IndiaFilings", error);
    }
  }

  async generateITR(itrData: {
    pan: string;
    assessment_year: string;
    income_details: {
      salary: number;
      business: number;
      house_property: number;
      capital_gains: number;
      other_sources: number;
    };
    deductions: {
      section_80c: number;
      section_80d: number;
      section_24b: number;
      other_deductions: number;
    };
    tax_paid: number;
  }): Promise<{ itr_id: string; status: string; download_url?: string }> {
    try {
      const response = await this.client.post("/itr/generate", itrData);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to generate ITR with IndiaFilings", error);
    }
  }
}

// Factory function for creating IndiaFilings connector
export function createIndiaFilingsConnector(config: IndiaFilingsConfig): IndiaFilingsConnector {
  return new IndiaFilingsConnector(config);
}
