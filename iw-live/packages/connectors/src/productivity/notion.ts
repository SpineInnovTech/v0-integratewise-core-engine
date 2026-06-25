import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Notion Connector — Notion API (2022-06-28)
// ============================================================================

export interface NotionConfig extends ConnectorConfig {
  integrationToken: string;
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------
export interface NotionUser {
  object: "user";
  id: string;
  type: "person" | "bot";
  name: string;
  avatar_url: string | null;
}

export interface NotionPage {
  object: "page";
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  icon: any;
  cover: any;
  properties: Record<string, any>;
  parent: { type: string; database_id?: string; page_id?: string; workspace?: boolean };
  url: string;
}

export interface NotionDatabase {
  object: "database";
  id: string;
  created_time: string;
  last_edited_time: string;
  title: Array<{ type: string; text: { content: string } }>;
  description: Array<any>;
  properties: Record<string, { id: string; name: string; type: string; [key: string]: any }>;
  archived: boolean;
  url: string;
}

export interface NotionBlock {
  object: "block";
  id: string;
  type: string;
  created_time: string;
  last_edited_time: string;
  has_children: boolean;
  archived: boolean;
  [key: string]: any;
}

export interface NotionComment {
  object: "comment";
  id: string;
  created_time: string;
  parent: { type: string; page_id?: string; block_id?: string };
  rich_text: Array<{ type: string; text: { content: string } }>;
}

export interface NotionListResponse<T> {
  object: "list";
  results: T[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface NotionSearchParams {
  query?: string;
  filter?: { value: "page" | "database"; property: "object" };
  sort?: { direction: "ascending" | "descending"; timestamp: "last_edited_time" };
  start_cursor?: string;
  page_size?: number;
}

export class NotionConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: NotionConfig;

  constructor(config: NotionConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.notion.com/v1",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.integrationToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.message || error.message;
        if (status === 401) throw new ConnectorError("Invalid Notion integration token", error);
        if (status === 403) throw new ConnectorError(`Notion access denied: ${msg}`, error);
        if (status === 404) throw new ConnectorError(`Notion resource not found: ${msg}`, error);
        if (status === 429) throw new ConnectorError("Notion API rate limit exceeded", error);
        throw new ConnectorError(`Notion API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "notion",
      name: "Notion",
      version: "1.0.0",
      apiVersion: "2022-06-28",
      capabilities: { sync: true, webhooks: false },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/users/me");
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  async getMe(): Promise<NotionUser> {
    try {
      const response = await this.client.get("/users/me");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get current Notion user", error);
    }
  }

  async listUsers(params?: {
    start_cursor?: string;
    page_size?: number;
  }): Promise<NotionListResponse<NotionUser>> {
    try {
      const response = await this.client.get("/users", { params });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Notion users", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Pages
  // ---------------------------------------------------------------------------
  async getPage(pageId: string): Promise<NotionPage> {
    try {
      const response = await this.client.get(`/pages/${pageId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get Notion page ${pageId}`, error);
    }
  }

  async createPage(body: {
    parent: { database_id: string } | { page_id: string };
    properties: Record<string, any>;
    children?: any[];
    icon?: any;
    cover?: any;
  }): Promise<NotionPage> {
    try {
      const response = await this.client.post("/pages", body);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Notion page", error);
    }
  }

  async updatePage(
    pageId: string,
    body: {
      properties?: Record<string, any>;
      archived?: boolean;
      icon?: any;
      cover?: any;
    }
  ): Promise<NotionPage> {
    try {
      const response = await this.client.patch(`/pages/${pageId}`, body);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Notion page ${pageId}`, error);
    }
  }

  async archivePage(pageId: string): Promise<NotionPage> {
    return this.updatePage(pageId, { archived: true });
  }

  async getPageProperty(
    pageId: string,
    propertyId: string,
    params?: { start_cursor?: string; page_size?: number }
  ): Promise<any> {
    try {
      const response = await this.client.get(`/pages/${pageId}/properties/${propertyId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get page property ${propertyId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Databases
  // ---------------------------------------------------------------------------
  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    try {
      const response = await this.client.get(`/databases/${databaseId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get Notion database ${databaseId}`, error);
    }
  }

  async createDatabase(body: {
    parent: { page_id: string } | { database_id: string };
    title: Array<{ type: "text"; text: { content: string } }>;
    properties: Record<string, any>;
  }): Promise<NotionDatabase> {
    try {
      const response = await this.client.post("/databases", body);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Notion database", error);
    }
  }

  async updateDatabase(
    databaseId: string,
    body: {
      title?: Array<{ type: "text"; text: { content: string } }>;
      description?: Array<any>;
      properties?: Record<string, any>;
      archived?: boolean;
    }
  ): Promise<NotionDatabase> {
    try {
      const response = await this.client.patch(`/databases/${databaseId}`, body);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Notion database ${databaseId}`, error);
    }
  }

  async queryDatabase(
    databaseId: string,
    body?: {
      filter?: any;
      sorts?: Array<
        | { property: string; direction: "ascending" | "descending" }
        | { timestamp: "created_time" | "last_edited_time"; direction: "ascending" | "descending" }
      >;
      start_cursor?: string;
      page_size?: number;
    }
  ): Promise<NotionListResponse<NotionPage>> {
    try {
      const response = await this.client.post(`/databases/${databaseId}/query`, body || {});
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to query Notion database ${databaseId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Blocks (content)
  // ---------------------------------------------------------------------------
  async getBlock(blockId: string): Promise<NotionBlock> {
    try {
      const response = await this.client.get(`/blocks/${blockId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get Notion block ${blockId}`, error);
    }
  }

  async getBlockChildren(
    blockId: string,
    params?: { start_cursor?: string; page_size?: number }
  ): Promise<NotionListResponse<NotionBlock>> {
    try {
      const response = await this.client.get(`/blocks/${blockId}/children`, { params });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get children of block ${blockId}`, error);
    }
  }

  async appendBlockChildren(
    blockId: string,
    children: any[]
  ): Promise<NotionListResponse<NotionBlock>> {
    try {
      const response = await this.client.patch(`/blocks/${blockId}/children`, { children });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to append children to block ${blockId}`, error);
    }
  }

  async updateBlock(blockId: string, body: Record<string, any>): Promise<NotionBlock> {
    try {
      const response = await this.client.patch(`/blocks/${blockId}`, body);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Notion block ${blockId}`, error);
    }
  }

  async deleteBlock(blockId: string): Promise<NotionBlock> {
    try {
      const response = await this.client.delete(`/blocks/${blockId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to delete Notion block ${blockId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------
  async search(
    params?: NotionSearchParams
  ): Promise<NotionListResponse<NotionPage | NotionDatabase>> {
    try {
      const response = await this.client.post("/search", params || {});
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to search Notion", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------
  async listComments(
    blockId: string,
    params?: { start_cursor?: string; page_size?: number }
  ): Promise<NotionListResponse<NotionComment>> {
    try {
      const response = await this.client.get("/comments", {
        params: { block_id: blockId, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list comments on block ${blockId}`, error);
    }
  }

  async createComment(body: {
    parent: { page_id: string };
    rich_text: Array<{ type: "text"; text: { content: string } }>;
    discussion_id?: string;
  }): Promise<NotionComment> {
    try {
      const response = await this.client.post("/comments", body);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Notion comment", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Pagination helper
  // ---------------------------------------------------------------------------
  async *paginateDatabase(
    databaseId: string,
    filter?: any,
    sorts?: any[]
  ): AsyncGenerator<NotionPage[], void, undefined> {
    let cursor: string | undefined;
    let hasMore = true;
    while (hasMore) {
      const result = await this.queryDatabase(databaseId, {
        filter,
        sorts,
        start_cursor: cursor,
        page_size: 100,
      });
      yield result.results;
      hasMore = result.has_more;
      cursor = result.next_cursor || undefined;
    }
  }
}

export function createNotionConnector(config: NotionConfig): NotionConnector {
  return new NotionConnector(config);
}
