import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Dropbox Connector — Dropbox API v2
// Real connection → Creamy load → Delayed full load → Delta load
// ============================================================================

export interface DropboxConfig extends ConnectorConfig {
  accessToken: string; // OAuth2 access token
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------
export interface DropboxFileMetadata {
  ".tag": "file";
  id: string;
  name: string;
  path_lower: string;
  path_display: string;
  client_modified: string;
  server_modified: string;
  rev: string;
  size: number;
  content_hash?: string;
  is_downloadable: boolean;
}

export interface DropboxFolderMetadata {
  ".tag": "folder";
  id: string;
  name: string;
  path_lower: string;
  path_display: string;
}

export interface DropboxDeletedMetadata {
  ".tag": "deleted";
  name: string;
  path_lower: string;
  path_display: string;
}

export type DropboxMetadata = DropboxFileMetadata | DropboxFolderMetadata | DropboxDeletedMetadata;

export interface DropboxSharedLinkMetadata {
  url: string;
  name: string;
  path_lower: string;
  id: string;
  ".tag": "file" | "folder";
  link_permissions: {
    can_revoke: boolean;
    resolved_visibility: { ".tag": string };
  };
  client_modified?: string;
  server_modified?: string;
  rev?: string;
  size?: number;
}

export interface DropboxAccountInfo {
  account_id: string;
  name: { given_name: string; surname: string; display_name: string };
  email: string;
  email_verified: boolean;
  profile_photo_url?: string;
  country?: string;
  locale: string;
  account_type: { ".tag": "basic" | "pro" | "business" };
}

export interface DropboxSpaceUsage {
  used: number;
  allocation: {
    ".tag": "individual" | "team";
    allocated: number;
  };
}

export interface DropboxTeamMember {
  profile: {
    team_member_id: string;
    email: string;
    name: { given_name: string; surname: string; display_name: string };
    status: { ".tag": "active" | "invited" | "suspended" | "removed" };
    account_id: string;
    joined_on?: string;
    role: { ".tag": "team_admin" | "user_management_admin" | "support_admin" | "member_only" };
  };
}

export interface DropboxListFolderResult {
  entries: DropboxMetadata[];
  cursor: string;
  has_more: boolean;
}

export interface DropboxSearchResult {
  matches: Array<{
    match_type: { ".tag": string };
    metadata: { ".tag": string; metadata: DropboxMetadata };
  }>;
  has_more: boolean;
  cursor?: string;
}

export class DropboxConnector extends BaseConnector {
  private apiClient: AxiosInstance;
  private contentClient: AxiosInstance;
  protected override config: DropboxConfig;

  constructor(config: DropboxConfig) {
    super(config);
    this.config = config;

    // API endpoints (RPC-style)
    this.apiClient = axios.create({
      baseURL: config.baseUrl || "https://api.dropboxapi.com/2",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Content endpoints (upload/download)
    this.contentClient = axios.create({
      baseURL: "https://content.dropboxapi.com/2",
      timeout: 120000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    const errorHandler = (error: any) => {
      const status = error.response?.status;
      const msg =
        error.response?.data?.error_summary ||
        error.response?.data?.error?.[".tag"] ||
        error.message;
      if (status === 401)
        throw new ConnectorError("Invalid or expired Dropbox access token", error);
      if (status === 403) throw new ConnectorError(`Dropbox access denied: ${msg}`, error);
      if (status === 409) throw new ConnectorError(`Dropbox path conflict: ${msg}`, error);
      if (status === 429) {
        const retryAfter = error.response?.headers?.["retry-after"];
        throw new ConnectorError(`Dropbox rate limit exceeded. Retry after ${retryAfter}s`, error);
      }
      throw new ConnectorError(`Dropbox API error: ${msg}`, error);
    };

    this.apiClient.interceptors.response.use((r) => r, errorHandler);
    this.contentClient.interceptors.response.use((r) => r, errorHandler);
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "dropbox",
      name: "Dropbox",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: true },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.apiClient.post("/users/get_current_account", null);
      return response.status === 200 && !!response.data.account_id;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Account
  // ---------------------------------------------------------------------------
  async getCurrentAccount(): Promise<DropboxAccountInfo> {
    try {
      const response = await this.apiClient.post("/users/get_current_account", null);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get current Dropbox account", error);
    }
  }

  async getSpaceUsage(): Promise<DropboxSpaceUsage> {
    try {
      const response = await this.apiClient.post("/users/get_space_usage", null);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get Dropbox space usage", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Files & Folders
  // ---------------------------------------------------------------------------
  async listFolder(
    path: string,
    params?: {
      recursive?: boolean;
      include_deleted?: boolean;
      include_mounted_folders?: boolean;
      limit?: number;
    }
  ): Promise<DropboxListFolderResult> {
    try {
      const response = await this.apiClient.post("/files/list_folder", {
        path: path === "/" ? "" : path,
        recursive: params?.recursive || false,
        include_deleted: params?.include_deleted || false,
        include_mounted_folders: params?.include_mounted_folders ?? true,
        limit: params?.limit || 2000,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list folder at ${path}`, error);
    }
  }

  async listFolderContinue(cursor: string): Promise<DropboxListFolderResult> {
    try {
      const response = await this.apiClient.post("/files/list_folder/continue", { cursor });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to continue listing folder", error);
    }
  }

  async listFolderGetLatestCursor(path: string, recursive = false): Promise<{ cursor: string }> {
    try {
      const response = await this.apiClient.post("/files/list_folder/get_latest_cursor", {
        path: path === "/" ? "" : path,
        recursive,
        include_deleted: false,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get latest cursor", error);
    }
  }

  async getFileMetadata(path: string): Promise<DropboxMetadata> {
    try {
      const response = await this.apiClient.post("/files/get_metadata", {
        path,
        include_media_info: false,
        include_deleted: false,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get metadata for ${path}`, error);
    }
  }

  async createFolder(path: string, autorename = false): Promise<DropboxFolderMetadata> {
    try {
      const response = await this.apiClient.post("/files/create_folder_v2", { path, autorename });
      return response.data.metadata;
    } catch (error) {
      throw new ConnectorError(`Failed to create folder at ${path}`, error);
    }
  }

  async deleteFile(path: string): Promise<DropboxMetadata> {
    try {
      const response = await this.apiClient.post("/files/delete_v2", { path });
      return response.data.metadata;
    } catch (error) {
      throw new ConnectorError(`Failed to delete ${path}`, error);
    }
  }

  async moveFile(fromPath: string, toPath: string, autorename = false): Promise<DropboxMetadata> {
    try {
      const response = await this.apiClient.post("/files/move_v2", {
        from_path: fromPath,
        to_path: toPath,
        autorename,
      });
      return response.data.metadata;
    } catch (error) {
      throw new ConnectorError(`Failed to move ${fromPath} to ${toPath}`, error);
    }
  }

  async copyFile(fromPath: string, toPath: string, autorename = false): Promise<DropboxMetadata> {
    try {
      const response = await this.apiClient.post("/files/copy_v2", {
        from_path: fromPath,
        to_path: toPath,
        autorename,
      });
      return response.data.metadata;
    } catch (error) {
      throw new ConnectorError(`Failed to copy ${fromPath} to ${toPath}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // File Content
  // ---------------------------------------------------------------------------
  async downloadFile(path: string): Promise<{ data: Buffer; metadata: DropboxFileMetadata }> {
    try {
      const response = await this.contentClient.post("/files/download", null, {
        headers: {
          "Dropbox-API-Arg": JSON.stringify({ path }),
        },
        responseType: "arraybuffer",
      });
      const metadata = JSON.parse(response.headers["dropbox-api-result"] || "{}");
      return { data: response.data, metadata };
    } catch (error) {
      throw new ConnectorError(`Failed to download ${path}`, error);
    }
  }

  async uploadFile(
    path: string,
    content: Buffer | string,
    options?: {
      mode?: "add" | "overwrite" | "update";
      autorename?: boolean;
      mute?: boolean;
    }
  ): Promise<DropboxFileMetadata> {
    try {
      const response = await this.contentClient.post("/files/upload", content, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify({
            path,
            mode: options?.mode || "add",
            autorename: options?.autorename ?? true,
            mute: options?.mute || false,
          }),
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to upload to ${path}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------
  async search(
    query: string,
    params?: {
      path?: string;
      max_results?: number;
      file_status?: "active" | "deleted";
      file_categories?: string[];
    }
  ): Promise<DropboxSearchResult> {
    try {
      const body: any = {
        query,
        options: {
          max_results: params?.max_results || 100,
          file_status: params?.file_status || "active",
        },
      };
      if (params?.path) body.options.path = params.path;
      if (params?.file_categories) body.options.file_categories = params.file_categories;

      const response = await this.apiClient.post("/files/search_v2", body);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to search Dropbox", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Shared Links
  // ---------------------------------------------------------------------------
  async createSharedLink(
    path: string,
    settings?: { requested_visibility?: "public" | "team_only" | "password"; audience?: string }
  ): Promise<DropboxSharedLinkMetadata> {
    try {
      const response = await this.apiClient.post("/sharing/create_shared_link_with_settings", {
        path,
        settings,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create shared link for ${path}`, error);
    }
  }

  async listSharedLinks(params?: {
    path?: string;
    cursor?: string;
    direct_only?: boolean;
  }): Promise<{ links: DropboxSharedLinkMetadata[]; has_more: boolean; cursor?: string }> {
    try {
      const response = await this.apiClient.post("/sharing/list_shared_links", params || {});
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list shared links", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Team (Business accounts)
  // ---------------------------------------------------------------------------
  async listTeamMembers(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ members: DropboxTeamMember[]; cursor?: string; has_more: boolean }> {
    try {
      const endpoint = params?.cursor ? "/team/members/list/continue_v2" : "/team/members/list_v2";
      const body = params?.cursor ? { cursor: params.cursor } : { limit: params?.limit || 1000 };
      const response = await this.apiClient.post(endpoint, body);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list team members", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Pagination helper: iterate all files in a folder
  // ---------------------------------------------------------------------------
  async *paginateFolder(
    path: string,
    recursive = false
  ): AsyncGenerator<DropboxMetadata[], void, undefined> {
    let result = await this.listFolder(path, { recursive });
    if (result.entries.length > 0) yield result.entries;
    while (result.has_more) {
      result = await this.listFolderContinue(result.cursor);
      if (result.entries.length > 0) yield result.entries;
    }
  }
}

export function createDropboxConnector(config: DropboxConfig): DropboxConnector {
  return new DropboxConnector(config);
}
