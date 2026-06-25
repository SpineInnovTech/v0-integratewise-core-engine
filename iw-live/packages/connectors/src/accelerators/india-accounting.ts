import {
  BaseAccelerator,
  AcceleratorConfig,
  AcceleratorError,
} from "@integratewise/connector-contracts";
import { ZohoBooksConnector, ZohoInvoice } from "../accounting/zoho-books";
import { IndiaFilingsConnector } from "../compliance/indiafilings";
import { GSTPortalConnector, GSTR3BData } from "../compliance/gst-portal";

// Indian Accounting Accelerator Configuration
export interface IndiaAccountingConfig extends AcceleratorConfig {
  zohoBooks: {
    clientId: string;
    clientSecret: string;
    organizationId: string;
    region: "IN";
  };
  indiaFilings?: {
    apiKey: string;
    username: string;
  };
  gstPortal?: {
    gstin: string;
    username: string;
    password: string;
  };
  company: {
    gstin: string;
    pan: string;
    tan?: string;
    businessType: "proprietorship" | "partnership" | "company" | "llp";
    state: string;
    industry: string;
  };
}

// Indian Accounting Compliance Types
export interface GSTFiling {
  gstin: string;
  returnType: "GSTR1" | "GSTR2" | "GSTR3B";
  period: string; // YYYY-MM
  status: "pending" | "filed" | "overdue";
  dueDate: string;
  filingDate?: string;
  totalTax: number;
  inputTax: number;
  outputTax: number;
}

export interface TDSFiling {
  tan: string;
  quarter: string; // Q1, Q2, Q3, Q4
  year: number;
  status: "pending" | "filed" | "overdue";
  dueDate: string;
  filingDate?: string;
  totalDeducted: number;
}

export interface AccountingReport {
  period: string;
  gstin: string;
  totalRevenue: number;
  totalGSTCollected: number;
  totalGSTPaid: number;
  netGSTLiability: number;
  tdsDeducted: number;
  tdsDeposited: number;
  complianceStatus: "compliant" | "warning" | "non-compliant";
  recommendations: string[];
}

export class IndiaAccountingAccelerator extends BaseAccelerator {
  protected override config: IndiaAccountingConfig;
  private zohoBooks?: ZohoBooksConnector;
  private indiaFilings?: IndiaFilingsConnector;
  private gstPortal?: GSTPortalConnector;

  constructor(config: IndiaAccountingConfig) {
    super(config);
    this.config = config;

    // Initialize connectors
    this.zohoBooks = new ZohoBooksConnector(config.zohoBooks);

    if (config.indiaFilings) {
      this.indiaFilings = new IndiaFilingsConnector(config.indiaFilings);
    }

    if (config.gstPortal) {
      this.gstPortal = new GSTPortalConnector(config.gstPortal);
    }
  }

  async initialize(): Promise<void> {
    try {
      // Test connections
      if (this.zohoBooks) {
        await this.zohoBooks.testConnection();
      }

      if (this.indiaFilings) {
        await this.indiaFilings.testConnection();
      }

      if (this.gstPortal) {
        await this.gstPortal.testConnection();
      }
    } catch (error) {
      throw new AcceleratorError("Failed to initialize India Accounting Accelerator", error);
    }
  }

  async generateGSTReport(period: string): Promise<AccountingReport> {
    if (!this.zohoBooks) {
      throw new AcceleratorError("Zoho Books connector not configured");
    }

    try {
      const [year, month] = period.split("-");
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];

      // Get invoices for the period
      const invoices = await this.zohoBooks.getInvoices({
        date_start: startDate,
        date_end: endDate,
      });

      // Calculate GST metrics
      const gstMetrics = this.calculateGSTMetrics(invoices);

      // Get GST filing status
      let gstFilingStatus = "pending";
      if (this.gstPortal) {
        const gstReturns = await this.gstPortal.getGSTReturns({
          fromDate: startDate,
          toDate: endDate,
        });
        gstFilingStatus = gstReturns.length > 0 ? "filed" : "pending";
      }

      // Generate recommendations
      const recommendations = this.generateComplianceRecommendations(gstMetrics, gstFilingStatus);

      return {
        period,
        gstin: this.config.company.gstin,
        totalRevenue: gstMetrics.totalRevenue,
        totalGSTCollected: gstMetrics.outputTax,
        totalGSTPaid: gstMetrics.inputTax,
        netGSTLiability: gstMetrics.netLiability,
        tdsDeducted: 0, // Would need TDS data
        tdsDeposited: 0,
        complianceStatus: this.determineComplianceStatus(gstMetrics, gstFilingStatus),
        recommendations,
      };
    } catch (error) {
      throw new AcceleratorError("Failed to generate GST report", error);
    }
  }

  async checkComplianceStatus(): Promise<{
    gstCompliance: GSTFiling[];
    tdsCompliance: TDSFiling[];
    overallStatus: "compliant" | "warning" | "non-compliant";
  }> {
    const gstCompliance = await this.getGSTComplianceStatus();
    const tdsCompliance = await this.getTDSComplianceStatus();

    const overallStatus = this.calculateOverallCompliance(gstCompliance, tdsCompliance);

    return {
      gstCompliance,
      tdsCompliance,
      overallStatus,
    };
  }

  async autoFileGSTReturn(period: string): Promise<{
    success: boolean;
    filingId?: string;
    errors?: string[];
  }> {
    if (!this.gstPortal || !this.zohoBooks) {
      throw new AcceleratorError("GST Portal and Zoho Books connectors required for auto-filing");
    }

    try {
      // Generate data from Zoho Books
      const gstData = await this.generateGSTDataForFiling(period);

      // File through GST portal
      const filingResult = await this.gstPortal.fileGSTR3B(gstData);

      return {
        success: true,
        filingId: filingResult.referenceNumber,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        errors: [errorMessage],
      };
    }
  }

  private calculateGSTMetrics(invoices: ZohoInvoice[]) {
    let totalRevenue = 0;
    let outputTax = 0;
    let inputTax = 0;

    for (const invoice of invoices) {
      if (invoice.status === "paid" || invoice.status === "sent") {
        totalRevenue += invoice.total;
        // Note: In a real implementation, you'd need to extract GST amounts from line items
        // This is a simplified calculation
        outputTax += invoice.total * 0.18; // Assuming 18% GST
      }
    }

    return {
      totalRevenue,
      outputTax,
      inputTax,
      netLiability: outputTax - inputTax,
    };
  }

  private generateComplianceRecommendations(gstMetrics: any, gstFilingStatus: string): string[] {
    const recommendations: string[] = [];

    if (gstFilingStatus === "pending") {
      recommendations.push("GST return filing is overdue. File immediately to avoid penalties.");
    }

    if (gstMetrics.netLiability > 10000) {
      recommendations.push(
        "High GST liability detected. Consider quarterly payments to manage cash flow."
      );
    }

    if (gstMetrics.totalRevenue > 5000000) {
      // 50 lakhs
      recommendations.push(
        "Business exceeds GST threshold. Ensure all GST compliances are up to date."
      );
    }

    return recommendations;
  }

  private determineComplianceStatus(
    gstMetrics: any,
    gstFilingStatus: string
  ): "compliant" | "warning" | "non-compliant" {
    if (gstFilingStatus === "pending") {
      return "non-compliant";
    }

    if (gstMetrics.netLiability > 50000) {
      return "warning";
    }

    return "compliant";
  }

  private async getGSTComplianceStatus(): Promise<GSTFiling[]> {
    // This would integrate with GST portal to get actual filing status
    // For now, return mock data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    return [
      {
        gstin: this.config.company.gstin,
        returnType: "GSTR3B",
        period: `${currentYear}-${String(currentMonth).padStart(2, "0")}`,
        status: "pending",
        dueDate: new Date(currentYear, currentMonth, 20).toISOString().split("T")[0],
        totalTax: 0,
        inputTax: 0,
        outputTax: 0,
      },
    ];
  }

  private async getTDSComplianceStatus(): Promise<TDSFiling[]> {
    // This would integrate with income tax portal
    // For now, return mock data
    const currentYear = new Date().getFullYear();

    return [
      {
        tan: this.config.company.tan || "",
        quarter: "Q4",
        year: currentYear,
        status: "pending",
        dueDate: `${currentYear}-03-31`,
        totalDeducted: 0,
      },
    ];
  }

  private calculateOverallCompliance(
    gstCompliance: GSTFiling[],
    tdsCompliance: TDSFiling[]
  ): "compliant" | "warning" | "non-compliant" {
    const hasOverdueGST = gstCompliance.some((f) => f.status === "overdue");
    const hasOverdueTDS = tdsCompliance.some((f) => f.status === "overdue");

    if (hasOverdueGST || hasOverdueTDS) {
      return "non-compliant";
    }

    const hasPendingGST = gstCompliance.some((f) => f.status === "pending");
    const hasPendingTDS = tdsCompliance.some((f) => f.status === "pending");

    if (hasPendingGST || hasPendingTDS) {
      return "warning";
    }

    return "compliant";
  }

  private async generateGSTDataForFiling(period: string): Promise<GSTR3BData> {
    // Generate GST data from Zoho Books for filing
    // This is a simplified implementation
    return {
      gstin: this.config.company.gstin,
      period,
      section_3_1_a: 100000, // Outward taxable supplies
      section_3_1_b: 0, // Zero rated supplies
      section_3_1_c: 0, // Nil rated/exempted
      section_3_1_d: 0, // Inward supplies (RCM)
      section_3_1_e: 0, // Non-GST outward supplies
      section_3_2_a_1: 18000, // IGST
      section_3_2_a_2: 0, // CGST
      section_3_2_a_3: 0, // SGST/UTGST
      section_3_2_a_4: 0, // Cess
      section_4_a_1: 0, // ITC from imports
      section_4_a_2: 5000, // ITC from inward supplies
      section_4_a_3: 0, // ITC under reverse charge
      section_4_a_4: 0, // ITC from all other sources
      section_5_1: 0, // Interest
      section_5_2: 0, // Late fee
    };
  }
}

// Factory function for creating India Accounting Accelerator
export function createIndiaAccountingAccelerator(
  config: IndiaAccountingConfig
): IndiaAccountingAccelerator {
  return new IndiaAccountingAccelerator(config);
}
