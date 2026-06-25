import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Google Drive Connector — Google Drive API v3
// ============================================================================

export interface GoogleDriveConfig extends ConnectorConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  kind: string;
  starred: boolean;
  trashed: boolean;
  parents?: string[];
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  owners?: Array<{ displayName: string; emailAddress: string }>;
  shared?: boolean;
  permissions?: DrivePermission[];
}

export interface DrivePermission {
  id: string;
  type: "user" | "group" | "domain" | "anyone";
  role: "owner" | "organizer" | "fileOrganizer" | "writer" | "commenter" | "reader";
  emailAddress?: string;
  displayName?: string;
}

export interface DriveComment {
  id: string;
  content: string;
  author: { displayName: string; emailAddress: string };
  createdTime: string;
  modifiedTime: string;
  resolved: boolean;
  replies?: DriveReply[];
}

export interface DriveReply {
  id: string;
  content: string;
  author: { displayName: string; emailAddress: string };
  createdTime: string;
  modifiedTime: string;
}

export interface DriveChange {
  kind: string;
  changeType: string;
  time: string;
  removed: boolean;
  fileId?: string;
  file?: DriveFile;
}

export interface DriveListParams {
  q?: string;
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
  fields?: string;
  spaces?: string;
  corpora?: "user" | "drive" | "domain" | "allDrives";
  includeItemsFromAllDrives?: boolean;
  supportsAllDrives?: boolean;
}

export class GoogleDriveConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: GoogleDriveConfig;

  constructor(config: GoogleDriveConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://www.googleapis.com/drive/v3",
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
          throw new ConnectorError("Google Drive permission denied", error);
        if (error.response?.status === 404)
          throw new ConnectorError("Google Drive file not found", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Google Drive rate limit exceeded", error);
        throw new ConnectorError(
          `Google Drive API error: ${error.response?.data?.error?.message || error.message}`,
          error
        );
      }
    );
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
      id: "google-drive",
      name: "Google Drive",
      version: "1.0.0",
      apiVersion: "v3",
      capabilities: { sync: true, webhooks: true },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/about", { params: { fields: "user" } });
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // About
  // ---------------------------------------------------------------------------
  async getAbout(): Promise<{
    user: { displayName: string; emailAddress: string };
    storageQuota: any;
  }> {
    try {
      const response = await this.client.get("/about", { params: { fields: "user,storageQuota" } });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get Google Drive about info", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Files
  // ---------------------------------------------------------------------------
  async listFiles(
    params?: DriveListParams
  ): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
    try {
      const response = await this.client.get("/files", {
        params: {
          pageSize: params?.pageSize || 100,
          fields:
            params?.fields ||
            "nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,size,parents,webViewLink,shared,owners,starred,trashed)",
          supportsAllDrives: params?.supportsAllDrives ?? true,
          includeItemsFromAllDrives: params?.includeItemsFromAllDrives ?? true,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Google Drive files", error);
    }
  }

  async getFile(fileId: string, fields?: string): Promise<DriveFile> {
    try {
      const response = await this.client.get(`/files/${fileId}`, {
        params: { fields: fields || "*", supportsAllDrives: true },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get Google Drive file ${fileId}`, error);
    }
  }

  async createFile(metadata: {
    name: string;
    mimeType?: string;
    parents?: string[];
    [key: string]: any;
  }): Promise<DriveFile> {
    try {
      const response = await this.client.post("/files", metadata, {
        params: { supportsAllDrives: true },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Google Drive file", error);
    }
  }

  async uploadFile(
    metadata: { name: string; mimeType: string; parents?: string[] },
    content: Buffer | string
  ): Promise<DriveFile> {
    try {
      const uploadClient = axios.create({
        baseURL: "https://www.googleapis.com/upload/drive/v3",
        timeout: 120000,
        headers: { Authorization: `Bearer ${this.config.accessToken}` },
      });

      // Simple upload (< 5MB). For larger files, resumable upload would be needed.
      const boundary = "iw_boundary_" + Date.now();
      const body = [
        `--${boundary}`,
        "Content-Type: application/json; charset=UTF-8",
        "",
        JSON.stringify(metadata),
        `--${boundary}`,
        `Content-Type: ${metadata.mimeType}`,
        "",
        typeof content === "string" ? content : content.toString("base64"),
        `--${boundary}--`,
      ].join("\r\n");

      const response = await uploadClient.post("/files", body, {
        params: { uploadType: "multipart", supportsAllDrives: true },
        headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to upload file to Google Drive", error);
    }
  }

  async updateFile(
    fileId: string,
    metadata: Partial<{
      name: string;
      mimeType: string;
      starred: boolean;
      trashed: boolean;
      [key: string]: any;
    }>
  ): Promise<DriveFile> {
    try {
      const response = await this.client.patch(`/files/${fileId}`, metadata, {
        params: { supportsAllDrives: true },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Google Drive file ${fileId}`, error);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.client.delete(`/files/${fileId}`, { params: { supportsAllDrives: true } });
    } catch (error) {
      throw new ConnectorError(`Failed to delete Google Drive file ${fileId}`, error);
    }
  }

  async copyFile(
    fileId: string,
    metadata?: { name?: string; parents?: string[] }
  ): Promise<DriveFile> {
    try {
      const response = await this.client.post(`/files/${fileId}/copy`, metadata || {}, {
        params: { supportsAllDrives: true },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to copy Google Drive file ${fileId}`, error);
    }
  }

  async moveFile(
    fileId: string,
    newParentId: string,
    removeFromParentId: string
  ): Promise<DriveFile> {
    try {
      const response = await this.client.patch(
        `/files/${fileId}`,
        {},
        {
          params: {
            addParents: newParentId,
            removeParents: removeFromParentId,
            supportsAllDrives: true,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to move Google Drive file ${fileId}`, error);
    }
  }

  async exportFile(fileId: string, mimeType: string): Promise<any> {
    try {
      const response = await this.client.get(`/files/${fileId}/export`, {
        params: { mimeType },
        responseType: "arraybuffer",
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to export Google Drive file ${fileId}`, error);
    }
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const response = await this.client.get(`/files/${fileId}`, {
        params: { alt: "media", supportsAllDrives: true },
        responseType: "arraybuffer",
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to download Google Drive file ${fileId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------
  async listPermissions(fileId: string): Promise<{ permissions: DrivePermission[] }> {
    try {
      const response = await this.client.get(`/files/${fileId}/permissions`, {
        params: {
          supportsAllDrives: true,
          fields: "permissions(id,type,role,emailAddress,displayName)",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list permissions for file ${fileId}`, error);
    }
  }

  async createPermission(
    fileId: string,
    permission: {
      type: "user" | "group" | "domain" | "anyone";
      role: "owner" | "organizer" | "fileOrganizer" | "writer" | "commenter" | "reader";
      emailAddress?: string;
      domain?: string;
    },
    sendNotification = true
  ): Promise<DrivePermission> {
    try {
      const response = await this.client.post(`/files/${fileId}/permissions`, permission, {
        params: { supportsAllDrives: true, sendNotificationEmail: sendNotification },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create permission on file ${fileId}`, error);
    }
  }

  async deletePermission(fileId: string, permissionId: string): Promise<void> {
    try {
      await this.client.delete(`/files/${fileId}/permissions/${permissionId}`, {
        params: { supportsAllDrives: true },
      });
    } catch (error) {
      throw new ConnectorError(`Failed to delete permission ${permissionId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------
  async listComments(
    fileId: string,
    params?: { pageSize?: number; pageToken?: string }
  ): Promise<{ comments: DriveComment[]; nextPageToken?: string }> {
    try {
      const response = await this.client.get(`/files/${fileId}/comments`, {
        params: {
          fields: "nextPageToken,comments(id,content,author,createdTime,modifiedTime,resolved)",
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list comments on file ${fileId}`, error);
    }
  }

  async createComment(fileId: string, content: string): Promise<DriveComment> {
    try {
      const response = await this.client.post(
        `/files/${fileId}/comments`,
        { content },
        { params: { fields: "*" } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create comment on file ${fileId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Changes (incremental sync)
  // ---------------------------------------------------------------------------
  async getStartPageToken(): Promise<string> {
    try {
      const response = await this.client.get("/changes/startPageToken", {
        params: { supportsAllDrives: true },
      });
      return response.data.startPageToken;
    } catch (error) {
      throw new ConnectorError("Failed to get changes start page token", error);
    }
  }

  async listChanges(
    pageToken: string,
    params?: { pageSize?: number; spaces?: string }
  ): Promise<{
    changes: DriveChange[];
    newStartPageToken?: string;
    nextPageToken?: string;
  }> {
    try {
      const response = await this.client.get("/changes", {
        params: {
          pageToken,
          pageSize: params?.pageSize || 100,
          spaces: params?.spaces || "drive",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          fields:
            "nextPageToken,newStartPageToken,changes(changeType,time,removed,fileId,file(id,name,mimeType,modifiedTime,trashed))",
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Google Drive changes", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Watch (push notifications)
  // ---------------------------------------------------------------------------
  async watchChanges(
    pageToken: string,
    channel: { id: string; address: string; expiration?: number }
  ): Promise<{ resourceId: string; expiration: string }> {
    try {
      const response = await this.client.post("/changes/watch", {
        id: channel.id,
        type: "web_hook",
        address: channel.address,
        expiration: channel.expiration,
        pageToken,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Google Drive watch channel", error);
    }
  }

  async stopChannel(channelId: string, resourceId: string): Promise<void> {
    try {
      await this.client.post("/channels/stop", { id: channelId, resourceId });
    } catch (error) {
      throw new ConnectorError(`Failed to stop Google Drive watch channel ${channelId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Shared Drives
  // ---------------------------------------------------------------------------
  async listSharedDrives(params?: { pageSize?: number; pageToken?: string }): Promise<{
    drives: Array<{ id: string; name: string; kind: string }>;
    nextPageToken?: string;
  }> {
    try {
      const response = await this.client.get("/drives", {
        params: { pageSize: params?.pageSize || 100, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list shared drives", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Search helper
  // ---------------------------------------------------------------------------
  async searchFiles(query: string, params?: { pageSize?: number }): Promise<DriveFile[]> {
    const result = await this.listFiles({ q: query, pageSize: params?.pageSize || 50 });
    return result.files;
  }

  async findFilesByName(name: string): Promise<DriveFile[]> {
    return this.searchFiles(`name contains '${name.replace(/'/g, "\\'")}'`);
  }

  async findFilesByType(mimeType: string): Promise<DriveFile[]> {
    return this.searchFiles(`mimeType = '${mimeType}'`);
  }
}

export function createGoogleDriveConnector(config: GoogleDriveConfig): GoogleDriveConnector {
  return new GoogleDriveConnector(config);
}
