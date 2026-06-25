import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Tally ERP / Tally Prime Connector
//
// Tally exposes data via its HTTP API (port 9000 by default).
// Supports both on-prem Tally (via gateway URL) and Tally Prime Server.
// Data is exchanged in XML (Tally's native format); this connector handles
// XML→JSON conversion for the IntegrateWise pipeline.
// ============================================================================

export interface TallyConfig extends ConnectorConfig {
  /** Gateway URL where Tally HTTP server is reachable (e.g. http://localhost:9000 or a tunnel). */
  gatewayUrl: string;
  /** Tally company name to query (optional — defaults to active company). */
  companyName?: string;
  /** API key for Tally Prime Server (cloud deployments). */
  apiKey?: string;
  /** Request timeout in ms (default: 30000). */
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Tally Entity Interfaces
// ---------------------------------------------------------------------------

export interface TallyLedger {
  name: string;
  parent: string;
  openingBalance: number;
  closingBalance: number;
  gstRegistrationType?: string;
  gstin?: string;
  address?: string;
  state?: string;
  pincode?: string;
  email?: string;
  phone?: string;
}

export interface TallyVoucher {
  voucherNumber: string;
  date: string;
  voucherType: string;
  partyLedgerName: string;
  amount: number;
  narration?: string;
  isInvoice: boolean;
  ledgerEntries: Array<{
    ledgerName: string;
    amount: number;
    isDeemedPositive: boolean;
  }>;
}

export interface TallyStockItem {
  name: string;
  parent: string;
  openingBalance: number;
  openingRate: number;
  openingValue: number;
  closingBalance: number;
  closingRate: number;
  closingValue: number;
  baseUnits: string;
  gstApplicable?: boolean;
  hsnCode?: string;
}

export interface TallyCompanyInfo {
  name: string;
  address: string;
  state: string;
  pincode: string;
  email?: string;
  phone?: string;
  gstin?: string;
  booksFrom: string;
  financialYearFrom: string;
  financialYearTo: string;
}

export class TallyConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: TallyConfig;

  constructor(config: TallyConfig) {
    super(config);
    this.config = config;

    const headers: Record<string, string> = {
      "Content-Type": "application/xml",
      Accept: "application/xml",
    };

    if (config.apiKey) {
      headers["X-Tally-ApiKey"] = config.apiKey;
    }

    this.client = axios.create({
      baseURL: config.gatewayUrl,
      timeout: config.timeout || 30000,
      headers,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === "ECONNREFUSED") {
          throw new ConnectorError(
            "Tally is not running or gateway URL is incorrect. Ensure Tally is running with the HTTP server enabled.",
            error
          );
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new ConnectorError("Tally authentication failed — check API key", error);
        }
        throw new ConnectorError(`Tally API error: ${error.message}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "tally",
      name: "Tally ERP / Tally Prime",
      version: "1.0.0",
      apiVersion: "HTTP XML API",
      capabilities: { sync: true, webhooks: false },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      // Request active company info — if Tally is running, this returns XML
      const xml = this.buildRequestXml("List of Companies", "<STATICVARIABLES></STATICVARIABLES>");
      const response = await this.client.post("", xml);
      return response.status === 200 && response.data?.length > 0;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Company Info
  // ---------------------------------------------------------------------------

  async getCompanyInfo(): Promise<TallyCompanyInfo> {
    try {
      const xml = this.buildRequestXml(
        "Company",
        `<STATICVARIABLES>
          ${this.config.companyName ? `<SVCURRENTCOMPANY>${this.escapeXml(this.config.companyName)}</SVCURRENTCOMPANY>` : ""}
        </STATICVARIABLES>`,
        "Company"
      );
      const response = await this.client.post("", xml);
      return this.parseCompanyInfo(response.data);
    } catch (error) {
      throw new ConnectorError("Failed to get Tally company info", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Ledgers (Accounts/Contacts — Tally's equivalent of customers, vendors, etc.)
  // ---------------------------------------------------------------------------

  async getLedgers(params?: { group?: string; limit?: number }): Promise<TallyLedger[]> {
    try {
      const filter = params?.group ? `<CHILDOF>${this.escapeXml(params.group)}</CHILDOF>` : "";

      const xml = this.buildCollectionXml("Ledger", "LedgerCollection", filter, [
        "Name",
        "Parent",
        "OpeningBalance",
        "ClosingBalance",
        "LedgerGSTRegistrationType",
        "PartyGSTIN",
        "Address",
        "LedgerStateName",
        "PINCode",
        "LedgerMobile",
        "Email",
      ]);

      const response = await this.client.post("", xml);
      const ledgers = this.parseLedgerCollection(response.data);
      return params?.limit ? ledgers.slice(0, params.limit) : ledgers;
    } catch (error) {
      throw new ConnectorError("Failed to get Tally ledgers", error);
    }
  }

  async getSundryDebtors(limit?: number): Promise<TallyLedger[]> {
    return this.getLedgers({ group: "Sundry Debtors", limit });
  }

  async getSundryCreditors(limit?: number): Promise<TallyLedger[]> {
    return this.getLedgers({ group: "Sundry Creditors", limit });
  }

  // ---------------------------------------------------------------------------
  // Vouchers (Invoices, Payments, Receipts, Journal entries)
  // ---------------------------------------------------------------------------

  async getVouchers(params?: {
    voucherType?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): Promise<TallyVoucher[]> {
    try {
      const filters: string[] = [];
      if (params?.voucherType) {
        filters.push(`<VOUCHERTYPENAME>${this.escapeXml(params.voucherType)}</VOUCHERTYPENAME>`);
      }
      if (params?.fromDate) {
        filters.push(`<SVFROMDATE>${params.fromDate}</SVFROMDATE>`);
      }
      if (params?.toDate) {
        filters.push(`<SVTODATE>${params.toDate}</SVTODATE>`);
      }

      const xml = this.buildCollectionXml("Voucher", "VoucherCollection", filters.join("\n"), [
        "VoucherNumber",
        "Date",
        "VoucherTypeName",
        "PartyLedgerName",
        "Amount",
        "Narration",
        "IsInvoice",
      ]);

      const response = await this.client.post("", xml);
      const vouchers = this.parseVoucherCollection(response.data);
      return params?.limit ? vouchers.slice(0, params.limit) : vouchers;
    } catch (error) {
      throw new ConnectorError("Failed to get Tally vouchers", error);
    }
  }

  async getSalesVouchers(limit?: number): Promise<TallyVoucher[]> {
    return this.getVouchers({ voucherType: "Sales", limit });
  }

  async getPurchaseVouchers(limit?: number): Promise<TallyVoucher[]> {
    return this.getVouchers({ voucherType: "Purchase", limit });
  }

  // ---------------------------------------------------------------------------
  // Stock Items (Inventory)
  // ---------------------------------------------------------------------------

  async getStockItems(params?: { group?: string; limit?: number }): Promise<TallyStockItem[]> {
    try {
      const filter = params?.group ? `<CHILDOF>${this.escapeXml(params.group)}</CHILDOF>` : "";

      const xml = this.buildCollectionXml("StockItem", "StockItemCollection", filter, [
        "Name",
        "Parent",
        "OpeningBalance",
        "OpeningRate",
        "OpeningValue",
        "ClosingBalance",
        "ClosingRate",
        "ClosingValue",
        "BaseUnits",
        "GSTApplicable",
        "HSNCode",
      ]);

      const response = await this.client.post("", xml);
      const items = this.parseStockItemCollection(response.data);
      return params?.limit ? items.slice(0, params.limit) : items;
    } catch (error) {
      throw new ConnectorError("Failed to get Tally stock items", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Day Book (all transactions for a date range)
  // ---------------------------------------------------------------------------

  async getDayBook(fromDate: string, toDate: string): Promise<TallyVoucher[]> {
    return this.getVouchers({ fromDate, toDate });
  }

  // ---------------------------------------------------------------------------
  // Trial Balance / Balance Sheet
  // ---------------------------------------------------------------------------

  async getTrialBalance(): Promise<TallyLedger[]> {
    return this.getLedgers();
  }

  // ---------------------------------------------------------------------------
  // XML Request Builders (Tally's HTTP API uses XML POST)
  // ---------------------------------------------------------------------------

  private buildRequestXml(requestType: string, body: string, fetchType?: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>${requestType}</TYPE>
    <ID>${fetchType || requestType}</ID>
  </HEADER>
  <BODY>
    <DESC>
      ${body}
    </DESC>
  </BODY>
</ENVELOPE>`;
  }

  private buildCollectionXml(
    objectType: string,
    collectionName: string,
    filters: string,
    fetchFields: string[]
  ): string {
    const company = this.config.companyName
      ? `<SVCURRENTCOMPANY>${this.escapeXml(this.config.companyName)}</SVCURRENTCOMPANY>`
      : "";

    const fetchXml = fetchFields.map((f) => `<FETCH>${f}</FETCH>`).join("\n          ");

    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>${collectionName}</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        ${company}
        ${filters}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="${collectionName}" ISMODIFY="No">
            <TYPE>${objectType}</TYPE>
            ${fetchXml}
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // ---------------------------------------------------------------------------
  // XML Response Parsers (lightweight — no external XML library dependency)
  //
  // Tally returns XML; we extract values using regex patterns.
  // For production, consider a streaming XML parser if volumes are large.
  // ---------------------------------------------------------------------------

  private extractXmlValue(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
    const match = xml.match(regex);
    return match?.[1]?.trim() || "";
  }

  private extractXmlBlocks(xml: string, tag: string): string[] {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "gi");
    return xml.match(regex) || [];
  }

  private parseCompanyInfo(xml: string): TallyCompanyInfo {
    return {
      name: this.extractXmlValue(xml, "NAME"),
      address: this.extractXmlValue(xml, "ADDRESS"),
      state: this.extractXmlValue(xml, "STATENAME"),
      pincode: this.extractXmlValue(xml, "PINCODE"),
      email: this.extractXmlValue(xml, "EMAIL") || undefined,
      phone: this.extractXmlValue(xml, "PHONENUMBER") || undefined,
      gstin: this.extractXmlValue(xml, "GSTIN") || undefined,
      booksFrom: this.extractXmlValue(xml, "BOOKSFROM"),
      financialYearFrom: this.extractXmlValue(xml, "STARTINGFROM"),
      financialYearTo: this.extractXmlValue(xml, "ENDINGAT"),
    };
  }

  private parseLedgerCollection(xml: string): TallyLedger[] {
    const blocks = this.extractXmlBlocks(xml, "LEDGER");
    return blocks.map((block) => ({
      name: this.extractXmlValue(block, "NAME"),
      parent: this.extractXmlValue(block, "PARENT"),
      openingBalance: parseFloat(this.extractXmlValue(block, "OPENINGBALANCE")) || 0,
      closingBalance: parseFloat(this.extractXmlValue(block, "CLOSINGBALANCE")) || 0,
      gstRegistrationType: this.extractXmlValue(block, "LEDGERGSTREGISTRATIONTYPE") || undefined,
      gstin: this.extractXmlValue(block, "PARTYGSTIN") || undefined,
      address: this.extractXmlValue(block, "ADDRESS") || undefined,
      state: this.extractXmlValue(block, "LEDGERSTATENAME") || undefined,
      pincode: this.extractXmlValue(block, "PINCODE") || undefined,
      email: this.extractXmlValue(block, "EMAIL") || undefined,
      phone: this.extractXmlValue(block, "LEDGERMOBILE") || undefined,
    }));
  }

  private parseVoucherCollection(xml: string): TallyVoucher[] {
    const blocks = this.extractXmlBlocks(xml, "VOUCHER");
    return blocks.map((block) => ({
      voucherNumber: this.extractXmlValue(block, "VOUCHERNUMBER"),
      date: this.extractXmlValue(block, "DATE"),
      voucherType: this.extractXmlValue(block, "VOUCHERTYPENAME"),
      partyLedgerName: this.extractXmlValue(block, "PARTYLEDGERNAME"),
      amount: parseFloat(this.extractXmlValue(block, "AMOUNT")) || 0,
      narration: this.extractXmlValue(block, "NARRATION") || undefined,
      isInvoice: this.extractXmlValue(block, "ISINVOICE")?.toUpperCase() === "YES",
      ledgerEntries: this.extractXmlBlocks(block, "ALLLEDGERENTRIES.LIST").map((entry) => ({
        ledgerName: this.extractXmlValue(entry, "LEDGERNAME"),
        amount: parseFloat(this.extractXmlValue(entry, "AMOUNT")) || 0,
        isDeemedPositive: this.extractXmlValue(entry, "ISDEEMEDPOSITIVE")?.toUpperCase() === "YES",
      })),
    }));
  }

  private parseStockItemCollection(xml: string): TallyStockItem[] {
    const blocks = this.extractXmlBlocks(xml, "STOCKITEM");
    return blocks.map((block) => ({
      name: this.extractXmlValue(block, "NAME"),
      parent: this.extractXmlValue(block, "PARENT"),
      openingBalance: parseFloat(this.extractXmlValue(block, "OPENINGBALANCE")) || 0,
      openingRate: parseFloat(this.extractXmlValue(block, "OPENINGRATE")) || 0,
      openingValue: parseFloat(this.extractXmlValue(block, "OPENINGVALUE")) || 0,
      closingBalance: parseFloat(this.extractXmlValue(block, "CLOSINGBALANCE")) || 0,
      closingRate: parseFloat(this.extractXmlValue(block, "CLOSINGRATE")) || 0,
      closingValue: parseFloat(this.extractXmlValue(block, "CLOSINGVALUE")) || 0,
      baseUnits: this.extractXmlValue(block, "BASEUNITS"),
      gstApplicable: this.extractXmlValue(block, "GSTAPPLICABLE")?.toUpperCase() === "YES",
      hsnCode: this.extractXmlValue(block, "HSNCODE") || undefined,
    }));
  }
}

export function createTallyConnector(config: TallyConfig): TallyConnector {
  return new TallyConnector(config);
}
