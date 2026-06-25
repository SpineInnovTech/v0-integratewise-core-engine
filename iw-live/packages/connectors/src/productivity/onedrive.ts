import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface OneDriveConfig extends ConnectorConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface OneDriveItem {
  id: string;
  name: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
  folder?: { childCount: number };
  file?: { mimeType: string; hashes: any };
  parentReference?: { driveId: string; id: string; path: string };
  createdBy?: { user: { displayName: string; email: string } };
  lastModifiedBy?: { user: { displayName: string; email: string } };
}

export interface OneDriveDelta {
  value: OneDriveItem[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
}

export class OneDriveConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: OneDriveConfig;

  constructor(config: OneDriveConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://graph.microsoft.com/v1.0",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (
          error.response?.status === 401 &&
          config.refreshToken &&
          config.clientId &&
          config.clientSecret
        ) {
          const newToken = await this.refreshAccessToken();
          this.client.defaults.headers.Authorization = `Bearer ${newToken}`;
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return this.client.request(error.config);
        }
        if (error.response?.status === 403)
          throw new ConnectorError("OneDrive permission denied", error);
        if (error.response?.status === 404)
          throw new ConnectorError("OneDrive resource not found", error);
        if (error.response?.status === 429)
          throw new ConnectorError("OneDrive rate limit exceeded", error);
        throw new ConnectorError(
          `OneDrive API error: ${error.response?.data?.error?.message || error.message}`,
          error
        );
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const response = await axios.post(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      new URLSearchParams({
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        refresh_token: this.config.refreshToken!,
        grant_type: "refresh_token",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    this.config.accessToken = response.data.access_token;
    if (response.data.refresh_token) {
      this.config.refreshToken = response.data.refresh_token;
    }
    return response.data.access_token;
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "onedrive",
      name: "Microsoft OneDrive",
      version: "1.0.0",
      apiVersion: "v1.0",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/me/drive");
      return true;
    } catch {
      return false;
    }
  }

  async getDrive(): Promise<any> {
    try {
      const response = await this.client.get("/me/drive");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch OneDrive drive info", error);
    }
  }

  async listItems(params?: { path?: string; top?: number }): Promise<{ value: OneDriveItem[] }> {
    try {
      const path = params?.path || "/me/drive/root/children";
      const response = await this.client.get(path, {
        params: { $top: params?.top || 100 },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list OneDrive items", error);
    }
  }

  async getItem(itemId: string): Promise<OneDriveItem> {
    try {
      const response = await this.client.get(`/me/drive/items/${itemId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch OneDrive item ${itemId}`, error);
    }
  }

  async searchItems(query: string): Promise<{ value: OneDriveItem[] }> {
    try {
      const response = await this.client.get(`/me/drive/root/search(q='${query}')`);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to search OneDrive items", error);
    }
  }

  async getDelta(deltaLink?: string): Promise<OneDriveDelta> {
    try {
      const url = deltaLink || "/me/drive/root/delta";
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch OneDrive delta", error);
    }
  }

  async createFolder(parentId: string, name: string): Promise<OneDriveItem> {
    try {
      const response = await this.client.post(`/me/drive/items/${parentId}/children`, {
        name,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename",
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create OneDrive folder", error);
    }
  }

  async uploadFile(parentId: string, fileName: string, content: Buffer): Promise<OneDriveItem> {
    try {
      const response = await this.client.put(
        `/me/drive/items/${parentId}:/${fileName}:/content`,
        content,
        {
          headers: { "Content-Type": "application/octet-stream" },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to upload file to OneDrive", error);
    }
  }

  async downloadFile(itemId: string): Promise<Buffer> {
    try {
      const response = await this.client.get(`/me/drive/items/${itemId}/content`, {
        responseType: "arraybuffer",
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to download OneDrive file ${itemId}`, error);
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    try {
      await this.client.delete(`/me/drive/items/${itemId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete OneDrive item ${itemId}`, error);
    }
  }

  async moveItem(itemId: string, newParentId: string): Promise<OneDriveItem> {
    try {
      const response = await this.client.patch(`/me/drive/items/${itemId}`, {
        parentReference: { id: newParentId },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to move OneDrive item ${itemId}`, error);
    }
  }

  async copyItem(itemId: string, newParentId: string, newName?: string): Promise<any> {
    try {
      const response = await this.client.post(`/me/drive/items/${itemId}/copy`, {
        parentReference: { id: newParentId },
        name: newName,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to copy OneDrive item ${itemId}`, error);
    }
  }

  async getSharedItems(): Promise<{ value: OneDriveItem[] }> {
    try {
      const response = await this.client.get("/me/drive/sharedWithMe");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch shared OneDrive items", error);
    }
  }
}

export function createOneDriveConnector(config: OneDriveConfig): OneDriveConnector {
  return new OneDriveConnector(config);
}
