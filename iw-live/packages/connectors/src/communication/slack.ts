import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Slack Connector — Slack Web API (Bot Token)
// Real connection → Creamy load → Delayed full load → Delta load
// ============================================================================

export interface SlackConfig extends ConnectorConfig {
  botToken: string;
  appToken?: string; // For Socket Mode
  signingSecret?: string; // For webhook verification
}

// ---------------------------------------------------------------------------
// Slack API Response Types
// ---------------------------------------------------------------------------
export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  real_name?: string;
  profile: {
    display_name?: string;
    email?: string;
    image_72?: string;
    title?: string;
    phone?: string;
    status_text?: string;
    status_emoji?: string;
  };
  is_admin: boolean;
  is_owner: boolean;
  is_bot: boolean;
  deleted: boolean;
  updated: number;
  tz?: string;
  tz_label?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  is_archived: boolean;
  created: number;
  creator: string;
  num_members?: number;
  topic?: { value: string; creator: string; last_set: number };
  purpose?: { value: string; creator: string; last_set: number };
  unlinked?: number;
  name_normalized?: string;
}

export interface SlackMessage {
  type: string;
  subtype?: string;
  ts: string;
  user?: string;
  bot_id?: string;
  text: string;
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reactions?: Array<{ name: string; count: number; users: string[] }>;
  files?: Array<{
    id: string;
    name: string;
    mimetype: string;
    size: number;
    url_private: string;
  }>;
  attachments?: Array<{
    fallback?: string;
    title?: string;
    text?: string;
    color?: string;
  }>;
  edited?: { user: string; ts: string };
}

export interface SlackTeamInfo {
  id: string;
  name: string;
  domain: string;
  email_domain?: string;
  icon?: { image_68?: string; image_132?: string };
}

export interface SlackUserGroup {
  id: string;
  team_id: string;
  name: string;
  description?: string;
  handle: string;
  is_external: boolean;
  date_create: number;
  date_update: number;
  date_delete: number;
  created_by: string;
  updated_by?: string;
  deleted_by?: string;
  user_count: number;
  users?: string[];
}

export interface SlackFile {
  id: string;
  name: string;
  title: string;
  mimetype: string;
  filetype: string;
  size: number;
  user: string;
  created: number;
  timestamp: number;
  url_private: string;
  permalink: string;
  channels?: string[];
  groups?: string[];
  ims?: string[];
}

export interface SlackReaction {
  name: string;
  count: number;
  users: string[];
}

export interface SlackPaginatedResponse {
  ok: boolean;
  error?: string;
  response_metadata?: { next_cursor?: string };
  [key: string]: any;
}

export class SlackConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: SlackConfig;

  constructor(config: SlackConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: "https://slack.com/api",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.botToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });

    this.client.interceptors.response.use(
      (response) => {
        // Slack returns 200 for all responses; errors are in body
        if (response.data && !response.data.ok) {
          const error = response.data.error || "unknown_error";
          if (error === "invalid_auth" || error === "not_authed") {
            throw new ConnectorError("Invalid Slack bot token", error);
          }
          if (error === "ratelimited") {
            const retryAfter = response.headers["retry-after"];
            throw new ConnectorError(
              `Slack rate limit exceeded. Retry after ${retryAfter}s`,
              error
            );
          }
          if (error === "missing_scope") {
            throw new ConnectorError(
              `Slack bot token missing required scope: ${response.data.needed}`,
              error
            );
          }
        }
        return response;
      },
      (error) => {
        throw new ConnectorError(`Slack API request failed: ${error.message}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "slack",
      name: "Slack",
      version: "1.0.0",
      apiVersion: "web-api",
      capabilities: { sync: true, webhooks: true, dataVelocity: "realtime" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await this.client.post("/auth.test");
      return res.data.ok === true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Auth Info
  // ---------------------------------------------------------------------------
  async getAuthInfo(): Promise<{
    user_id: string;
    user: string;
    team_id: string;
    team: string;
    bot_id?: string;
    url: string;
  }> {
    const res = await this.client.post("/auth.test");
    if (!res.data.ok) throw new ConnectorError("Slack auth.test failed", res.data.error);
    return res.data;
  }

  async getTeamInfo(): Promise<SlackTeamInfo> {
    const res = await this.client.get("/team.info");
    if (!res.data.ok) throw new ConnectorError("Failed to get Slack team info", res.data.error);
    return res.data.team;
  }

  // ---------------------------------------------------------------------------
  // Channels / Conversations
  // ---------------------------------------------------------------------------
  async getChannels(params?: {
    types?: string;
    limit?: number;
    cursor?: string;
    exclude_archived?: boolean;
  }): Promise<{ channels: SlackChannel[]; next_cursor?: string }> {
    const res = await this.client.get("/conversations.list", {
      params: {
        types: params?.types || "public_channel,private_channel",
        limit: params?.limit || 200,
        cursor: params?.cursor,
        exclude_archived: params?.exclude_archived ?? true,
      },
    });
    if (!res.data.ok) throw new ConnectorError("Failed to list Slack channels", res.data.error);
    return {
      channels: res.data.channels || [],
      next_cursor: res.data.response_metadata?.next_cursor || undefined,
    };
  }

  async getChannel(channelId: string): Promise<SlackChannel> {
    const res = await this.client.get("/conversations.info", {
      params: { channel: channelId },
    });
    if (!res.data.ok)
      throw new ConnectorError(`Failed to get channel ${channelId}`, res.data.error);
    return res.data.channel;
  }

  async getChannelMembers(
    channelId: string,
    params?: { limit?: number; cursor?: string }
  ): Promise<{ members: string[]; next_cursor?: string }> {
    const res = await this.client.get("/conversations.members", {
      params: { channel: channelId, limit: params?.limit || 200, cursor: params?.cursor },
    });
    if (!res.data.ok)
      throw new ConnectorError(`Failed to get members for channel ${channelId}`, res.data.error);
    return {
      members: res.data.members || [],
      next_cursor: res.data.response_metadata?.next_cursor || undefined,
    };
  }

  async createChannel(name: string, isPrivate = false): Promise<SlackChannel> {
    const res = await this.client.post("/conversations.create", {
      name,
      is_private: isPrivate,
    });
    if (!res.data.ok) throw new ConnectorError("Failed to create Slack channel", res.data.error);
    return res.data.channel;
  }

  async archiveChannel(channelId: string): Promise<void> {
    const res = await this.client.post("/conversations.archive", {
      channel: channelId,
    });
    if (!res.data.ok)
      throw new ConnectorError(`Failed to archive channel ${channelId}`, res.data.error);
  }

  async setChannelTopic(channelId: string, topic: string): Promise<void> {
    const res = await this.client.post("/conversations.setTopic", {
      channel: channelId,
      topic,
    });
    if (!res.data.ok)
      throw new ConnectorError(`Failed to set topic for channel ${channelId}`, res.data.error);
  }

  async setChannelPurpose(channelId: string, purpose: string): Promise<void> {
    const res = await this.client.post("/conversations.setPurpose", {
      channel: channelId,
      purpose,
    });
    if (!res.data.ok)
      throw new ConnectorError(`Failed to set purpose for channel ${channelId}`, res.data.error);
  }

  // ---------------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------------
  async getMessages(
    channelId: string,
    params?: {
      limit?: number;
      cursor?: string;
      oldest?: string;
      latest?: string;
      inclusive?: boolean;
    }
  ): Promise<{ messages: SlackMessage[]; has_more: boolean; next_cursor?: string }> {
    const res = await this.client.get("/conversations.history", {
      params: {
        channel: channelId,
        limit: params?.limit || 100,
        cursor: params?.cursor,
        oldest: params?.oldest,
        latest: params?.latest,
        inclusive: params?.inclusive,
      },
    });
    if (!res.data.ok)
      throw new ConnectorError(`Failed to get messages for channel ${channelId}`, res.data.error);
    return {
      messages: res.data.messages || [],
      has_more: res.data.has_more || false,
      next_cursor: res.data.response_metadata?.next_cursor || undefined,
    };
  }

  async getThreadReplies(
    channelId: string,
    threadTs: string,
    params?: { limit?: number; cursor?: string }
  ): Promise<{ messages: SlackMessage[]; has_more: boolean }> {
    const res = await this.client.get("/conversations.replies", {
      params: {
        channel: channelId,
        ts: threadTs,
        limit: params?.limit || 100,
        cursor: params?.cursor,
      },
    });
    if (!res.data.ok)
      throw new ConnectorError(`Failed to get thread replies for ${threadTs}`, res.data.error);
    return {
      messages: res.data.messages || [],
      has_more: res.data.has_more || false,
    };
  }

  async sendMessage(
    channelId: string,
    text: string,
    options?: {
      thread_ts?: string;
      blocks?: any[];
      attachments?: any[];
      unfurl_links?: boolean;
      unfurl_media?: boolean;
      reply_broadcast?: boolean;
    }
  ): Promise<SlackMessage> {
    const res = await this.client.post("/chat.postMessage", {
      channel: channelId,
      text,
      ...options,
    });
    if (!res.data.ok) throw new ConnectorError("Failed to send Slack message", res.data.error);
    return res.data.message;
  }

  async updateMessage(
    channelId: string,
    ts: string,
    text: string,
    options?: { blocks?: any[]; attachments?: any[] }
  ): Promise<SlackMessage> {
    const res = await this.client.post("/chat.update", {
      channel: channelId,
      ts,
      text,
      ...options,
    });
    if (!res.data.ok) throw new ConnectorError("Failed to update Slack message", res.data.error);
    return res.data.message;
  }

  async deleteMessage(channelId: string, ts: string): Promise<void> {
    const res = await this.client.post("/chat.delete", { channel: channelId, ts });
    if (!res.data.ok) throw new ConnectorError("Failed to delete Slack message", res.data.error);
  }

  async addReaction(channelId: string, ts: string, name: string): Promise<void> {
    const res = await this.client.post("/reactions.add", {
      channel: channelId,
      timestamp: ts,
      name,
    });
    if (!res.data.ok) throw new ConnectorError("Failed to add Slack reaction", res.data.error);
  }

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  async getUsers(params?: {
    limit?: number;
    cursor?: string;
    include_locale?: boolean;
  }): Promise<{ members: SlackUser[]; next_cursor?: string }> {
    const res = await this.client.get("/users.list", {
      params: {
        limit: params?.limit || 200,
        cursor: params?.cursor,
        include_locale: params?.include_locale,
      },
    });
    if (!res.data.ok) throw new ConnectorError("Failed to list Slack users", res.data.error);
    return {
      members: res.data.members || [],
      next_cursor: res.data.response_metadata?.next_cursor || undefined,
    };
  }

  async getUser(userId: string): Promise<SlackUser> {
    const res = await this.client.get("/users.info", { params: { user: userId } });
    if (!res.data.ok)
      throw new ConnectorError(`Failed to get Slack user ${userId}`, res.data.error);
    return res.data.user;
  }

  async getUserByEmail(email: string): Promise<SlackUser> {
    const res = await this.client.get("/users.lookupByEmail", { params: { email } });
    if (!res.data.ok) throw new ConnectorError(`Failed to look up user by email`, res.data.error);
    return res.data.user;
  }

  async getUserPresence(userId: string): Promise<{ presence: string; online: boolean }> {
    const res = await this.client.get("/users.getPresence", { params: { user: userId } });
    if (!res.data.ok)
      throw new ConnectorError(`Failed to get presence for user ${userId}`, res.data.error);
    return { presence: res.data.presence, online: res.data.online || false };
  }

  // ---------------------------------------------------------------------------
  // User Groups
  // ---------------------------------------------------------------------------
  async getUserGroups(params?: {
    include_users?: boolean;
    include_count?: boolean;
    include_disabled?: boolean;
  }): Promise<SlackUserGroup[]> {
    const res = await this.client.get("/usergroups.list", { params });
    if (!res.data.ok) throw new ConnectorError("Failed to list Slack user groups", res.data.error);
    return res.data.usergroups || [];
  }

  // ---------------------------------------------------------------------------
  // Files
  // ---------------------------------------------------------------------------
  async getFiles(params?: {
    channel?: string;
    user?: string;
    ts_from?: string;
    ts_to?: string;
    types?: string;
    count?: number;
    page?: number;
  }): Promise<{
    files: SlackFile[];
    paging: { count: number; total: number; page: number; pages: number };
  }> {
    const res = await this.client.get("/files.list", { params });
    if (!res.data.ok) throw new ConnectorError("Failed to list Slack files", res.data.error);
    return { files: res.data.files || [], paging: res.data.paging };
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------
  async searchMessages(
    query: string,
    params?: { sort?: string; sort_dir?: string; count?: number; page?: number }
  ): Promise<{ messages: { total: number; matches: any[] } }> {
    const res = await this.client.get("/search.messages", {
      params: { query, ...params },
    });
    if (!res.data.ok) throw new ConnectorError("Failed to search Slack messages", res.data.error);
    return { messages: res.data.messages };
  }

  // ---------------------------------------------------------------------------
  // Emoji
  // ---------------------------------------------------------------------------
  async getCustomEmoji(): Promise<Record<string, string>> {
    const res = await this.client.get("/emoji.list");
    if (!res.data.ok) throw new ConnectorError("Failed to list custom emoji", res.data.error);
    return res.data.emoji || {};
  }

  // ---------------------------------------------------------------------------
  // Pins
  // ---------------------------------------------------------------------------
  async getPinnedItems(channelId: string): Promise<any[]> {
    const res = await this.client.get("/pins.list", { params: { channel: channelId } });
    if (!res.data.ok)
      throw new ConnectorError(`Failed to get pins for channel ${channelId}`, res.data.error);
    return res.data.items || [];
  }

  async pinMessage(channelId: string, ts: string): Promise<void> {
    const res = await this.client.post("/pins.add", { channel: channelId, timestamp: ts });
    if (!res.data.ok) throw new ConnectorError("Failed to pin message", res.data.error);
  }

  // ---------------------------------------------------------------------------
  // Bookmarks
  // ---------------------------------------------------------------------------
  async getBookmarks(channelId: string): Promise<any[]> {
    const res = await this.client.post("/bookmarks.list", { channel_id: channelId });
    if (!res.data.ok) throw new ConnectorError("Failed to list bookmarks", res.data.error);
    return res.data.bookmarks || [];
  }

  // ---------------------------------------------------------------------------
  // Pagination helper
  // ---------------------------------------------------------------------------
  async *paginateChannels(types?: string): AsyncGenerator<SlackChannel[], void, undefined> {
    let cursor: string | undefined;
    do {
      const result = await this.getChannels({ types, cursor, limit: 200 });
      if (result.channels.length > 0) yield result.channels;
      cursor = result.next_cursor;
    } while (cursor);
  }

  async *paginateUsers(): AsyncGenerator<SlackUser[], void, undefined> {
    let cursor: string | undefined;
    do {
      const result = await this.getUsers({ cursor, limit: 200 });
      if (result.members.length > 0) yield result.members;
      cursor = result.next_cursor;
    } while (cursor);
  }
}

export function createSlackConnector(config: SlackConfig): SlackConnector {
  return new SlackConnector(config);
}
