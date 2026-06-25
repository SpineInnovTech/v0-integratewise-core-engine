import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Google Sheets Connector — Google Sheets API v4 + Drive API v3 (for listing)
// ============================================================================

export interface GoogleSheetsConfig extends ConnectorConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface Spreadsheet {
  spreadsheetId: string;
  properties: SpreadsheetProperties;
  sheets?: Sheet[];
  spreadsheetUrl?: string;
}

export interface SpreadsheetProperties {
  title: string;
  locale?: string;
  autoRecalc?: string;
  timeZone?: string;
  defaultFormat?: Record<string, any>;
}

export interface Sheet {
  properties: SheetProperties;
  data?: GridData[];
}

export interface SheetProperties {
  sheetId: number;
  title: string;
  index: number;
  sheetType: "GRID" | "OBJECT" | "DATA_SOURCE";
  gridProperties?: {
    rowCount: number;
    columnCount: number;
    frozenRowCount?: number;
    frozenColumnCount?: number;
  };
  hidden?: boolean;
}

export interface GridData {
  startRow?: number;
  startColumn?: number;
  rowData?: RowData[];
}

export interface RowData {
  values?: CellData[];
}

export interface CellData {
  formattedValue?: string;
  userEnteredValue?: {
    stringValue?: string;
    numberValue?: number;
    boolValue?: boolean;
    formulaValue?: string;
  };
  effectiveValue?: {
    stringValue?: string;
    numberValue?: number;
    boolValue?: boolean;
  };
}

export interface ValueRange {
  range: string;
  majorDimension: "ROWS" | "COLUMNS";
  values: any[][];
}

/** Minimal Drive file shape used when listing spreadsheets via Drive API. */
interface DriveSpreadsheetFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  owners?: Array<{ displayName: string; emailAddress: string }>;
  webViewLink?: string;
  shared?: boolean;
}

export class GoogleSheetsConnector extends BaseConnector {
  private sheetsClient: AxiosInstance;
  private driveClient: AxiosInstance;
  protected override config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    super(config);
    this.config = config;

    const authHeaders = {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    };

    this.sheetsClient = axios.create({
      baseURL: config.baseUrl || "https://sheets.googleapis.com/v4",
      timeout: 30000,
      headers: authHeaders,
    });

    // Drive API is needed to list spreadsheets (there is no Sheets API endpoint for that)
    this.driveClient = axios.create({
      baseURL: "https://www.googleapis.com/drive/v3",
      timeout: 30000,
      headers: authHeaders,
    });

    // Shared 401/403/429 interceptor for both clients
    const errorInterceptor = async (error: any) => {
      if (
        error.response?.status === 401 &&
        config.refreshToken &&
        config.clientId &&
        config.clientSecret
      ) {
        const newToken = await this.refreshAccessToken();
        // Update both clients
        this.sheetsClient.defaults.headers.Authorization = `Bearer ${newToken}`;
        this.driveClient.defaults.headers.Authorization = `Bearer ${newToken}`;
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axios.request(error.config);
      }
      if (error.response?.status === 403)
        throw new ConnectorError("Google Sheets permission denied", error);
      if (error.response?.status === 404)
        throw new ConnectorError("Google Sheets resource not found", error);
      if (error.response?.status === 429)
        throw new ConnectorError("Google Sheets rate limit exceeded", error);
      throw new ConnectorError(
        `Google Sheets API error: ${error.response?.data?.error?.message || error.message}`,
        error
      );
    };

    this.sheetsClient.interceptors.response.use((r) => r, errorInterceptor);
    this.driveClient.interceptors.response.use((r) => r, errorInterceptor);
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: "refresh_token",
    });
    this.config.accessToken = response.data.access_token;
    return response.data.access_token;
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "google-sheets",
      name: "Google Sheets",
      version: "1.0.0",
      apiVersion: "v4",
      capabilities: { sync: true, webhooks: false },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      // Quick Drive API call to verify token validity
      await this.driveClient.get("/about", { params: { fields: "user" } });
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // List Spreadsheets (via Drive API, filtered by mime type)
  // ---------------------------------------------------------------------------

  async listSpreadsheets(params?: {
    pageSize?: number;
    pageToken?: string;
    orderBy?: string;
    q?: string;
  }): Promise<{ files: DriveSpreadsheetFile[]; nextPageToken?: string }> {
    try {
      const mimeFilter = "mimeType = 'application/vnd.google-apps.spreadsheet'";
      const q = params?.q ? `${mimeFilter} and ${params.q}` : mimeFilter;

      const response = await this.driveClient.get("/files", {
        params: {
          q,
          pageSize: params?.pageSize || 50,
          pageToken: params?.pageToken,
          orderBy: params?.orderBy || "modifiedTime desc",
          fields: "nextPageToken,files(id,name,createdTime,modifiedTime,owners,webViewLink,shared)",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        },
      });

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      throw new ConnectorError("Failed to list Google Sheets spreadsheets", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Spreadsheet Metadata
  // ---------------------------------------------------------------------------

  async getSpreadsheet(spreadsheetId: string, includeGridData = false): Promise<Spreadsheet> {
    try {
      const response = await this.sheetsClient.get(`/spreadsheets/${spreadsheetId}`, {
        params: {
          includeGridData,
          fields: includeGridData
            ? "*"
            : "spreadsheetId,properties,sheets.properties,spreadsheetUrl",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get spreadsheet ${spreadsheetId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Read Values
  // ---------------------------------------------------------------------------

  async getValues(
    spreadsheetId: string,
    range: string,
    options?: {
      majorDimension?: "ROWS" | "COLUMNS";
      valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA";
      dateTimeRenderOption?: "SERIAL_NUMBER" | "FORMATTED_STRING";
    }
  ): Promise<ValueRange> {
    try {
      const response = await this.sheetsClient.get(
        `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {
          params: {
            majorDimension: options?.majorDimension || "ROWS",
            valueRenderOption: options?.valueRenderOption || "FORMATTED_VALUE",
            dateTimeRenderOption: options?.dateTimeRenderOption || "FORMATTED_STRING",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get values from ${spreadsheetId} range ${range}`, error);
    }
  }

  async batchGetValues(
    spreadsheetId: string,
    ranges: string[],
    options?: {
      majorDimension?: "ROWS" | "COLUMNS";
      valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA";
    }
  ): Promise<{ valueRanges: ValueRange[] }> {
    try {
      const response = await this.sheetsClient.get(
        `/spreadsheets/${spreadsheetId}/values:batchGet`,
        {
          params: {
            ranges,
            majorDimension: options?.majorDimension || "ROWS",
            valueRenderOption: options?.valueRenderOption || "FORMATTED_VALUE",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to batch get values from ${spreadsheetId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Write Values
  // ---------------------------------------------------------------------------

  async updateValues(
    spreadsheetId: string,
    range: string,
    values: any[][],
    options?: {
      valueInputOption?: "RAW" | "USER_ENTERED";
    }
  ): Promise<{ updatedRange: string; updatedRows: number; updatedColumns: number }> {
    try {
      const response = await this.sheetsClient.put(
        `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {
          range,
          majorDimension: "ROWS",
          values,
        },
        {
          params: {
            valueInputOption: options?.valueInputOption || "USER_ENTERED",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update values in ${spreadsheetId} range ${range}`, error);
    }
  }

  async appendValues(
    spreadsheetId: string,
    range: string,
    values: any[][],
    options?: {
      valueInputOption?: "RAW" | "USER_ENTERED";
      insertDataOption?: "INSERT_ROWS" | "OVERWRITE";
    }
  ): Promise<{ updates: { updatedRange: string; updatedRows: number } }> {
    try {
      const response = await this.sheetsClient.post(
        `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append`,
        {
          range,
          majorDimension: "ROWS",
          values,
        },
        {
          params: {
            valueInputOption: options?.valueInputOption || "USER_ENTERED",
            insertDataOption: options?.insertDataOption || "INSERT_ROWS",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to append values to ${spreadsheetId} range ${range}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Batch Update (structural changes — add/delete sheets, merge cells, etc.)
  // ---------------------------------------------------------------------------

  async batchUpdate(
    spreadsheetId: string,
    requests: Record<string, any>[]
  ): Promise<{ replies: Record<string, any>[] }> {
    try {
      const response = await this.sheetsClient.post(`/spreadsheets/${spreadsheetId}:batchUpdate`, {
        requests,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to batch update spreadsheet ${spreadsheetId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Convenience: create a new spreadsheet
  // ---------------------------------------------------------------------------

  async createSpreadsheet(title: string, sheetTitles?: string[]): Promise<Spreadsheet> {
    try {
      const sheets = (sheetTitles || ["Sheet1"]).map((t, i) => ({
        properties: { title: t, index: i },
      }));
      const response = await this.sheetsClient.post("/spreadsheets", {
        properties: { title },
        sheets,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create spreadsheet", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Convenience: get header row (first row of first sheet)
  // ---------------------------------------------------------------------------

  async getHeaderRow(spreadsheetId: string, sheetTitle?: string): Promise<string[]> {
    const range = sheetTitle ? `'${sheetTitle}'!1:1` : "1:1";
    const result = await this.getValues(spreadsheetId, range);
    return result.values?.[0] || [];
  }

  // ---------------------------------------------------------------------------
  // Convenience: get all rows as objects (using header row as keys)
  // ---------------------------------------------------------------------------

  async getRowsAsObjects(
    spreadsheetId: string,
    sheetTitle?: string,
    options?: { limit?: number }
  ): Promise<Record<string, any>[]> {
    const range = sheetTitle ? `'${sheetTitle}'` : "Sheet1";
    const result = await this.getValues(spreadsheetId, range);
    if (!result.values || result.values.length < 2) return [];

    const headers = result.values[0].map((h: any) => String(h).trim());
    let dataRows = result.values.slice(1);
    if (options?.limit) {
      dataRows = dataRows.slice(0, options.limit);
    }

    return dataRows.map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((header: string, i: number) => {
        obj[header] = row[i] ?? null;
      });
      return obj;
    });
  }
}

export function createGoogleSheetsConnector(config: GoogleSheetsConfig): GoogleSheetsConnector {
  return new GoogleSheetsConnector(config);
}
