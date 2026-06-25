import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Discord Connector — Discord API v10 (Bot Token)
// ============================================================================

export interface DiscordConfig extends ConnectorConfig {
  botToken: string;
  applicationId?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner_id: string;
  member_count?: number;
  description?: string;
  features: string[];
  premium_tier: number;
  created_at?: string;
}

export interface DiscordChannel {
  id: string;
  guild_id?: string;
  name: string;
  type: number; // 0=text, 2=voice, 4=category, 5=announcement, 13=stage, 15=forum
  position?: number;
  topic?: string;
  nsfw?: boolean;
  parent_id?: string;
  last_message_id?: string;
  rate_limit_per_user?: number;
  permission_overwrites?: Array<{
    id: string;
    type: number;
    allow: string;
    deny: string;
  }>;
}

export interface DiscordMessage {
  id: string;
  channel_id: string;
  guild_id?: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    bot?: boolean;
  };
  content: string;
  timestamp: string;
  edited_timestamp?: string;
  tts: boolean;
  mention_everyone: boolean;
  mentions: Array<{ id: string; username: string }>;
  mention_roles: string[];
  attachments: Array<{
    id: string;
    filename: string;
    size: number;
    url: string;
    content_type?: string;
  }>;
  embeds: Array<{
    title?: string;
    description?: string;
    url?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  }>;
  reactions?: Array<{
    count: number;
    me: boolean;
    emoji: { id?: string; name: string };
  }>;
  pinned: boolean;
  type: number;
  thread?: DiscordChannel;
}

export interface DiscordMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    bot?: boolean;
  };
  nick?: string;
  roles: string[];
  joined_at: string;
  premium_since?: string;
  deaf: boolean;
  mute: boolean;
  pending?: boolean;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
}

export interface DiscordWebhook {
  id: string;
  type: number;
  guild_id?: string;
  channel_id: string;
  name?: string;
  avatar?: string;
  token?: string;
  url?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

export class DiscordConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: DiscordConfig;

  constructor(config: DiscordConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: "https://discord.com/api/v10",
      timeout: 30000,
      headers: {
        Authorization: `Bot ${config.botToken}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new ConnectorError("Invalid Discord bot token", error);
        }
        if (error.response?.status === 403) {
          throw new ConnectorError("Discord bot lacks required permissions", error);
        }
        if (error.response?.status === 429) {
          const retryAfter = error.response.data?.retry_after;
          throw new ConnectorError(
            `Discord rate limit exceeded. Retry after ${retryAfter}s`,
            error
          );
        }
        throw new ConnectorError(
          `Discord API error: ${error.response?.data?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "discord",
      name: "Discord",
      version: "1.0.0",
      apiVersion: "v10",
      capabilities: { sync: true, webhooks: true, dataVelocity: "realtime" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/users/@me");
      return response.status === 200 && !!response.data.id;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Guilds (Servers)
  // ---------------------------------------------------------------------------
  async getGuilds(): Promise<DiscordGuild[]> {
    try {
      const response = await this.client.get("/users/@me/guilds");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Discord guilds", error);
    }
  }

  async getGuild(guildId: string): Promise<DiscordGuild> {
    try {
      const response = await this.client.get(`/guilds/${guildId}`, {
        params: { with_counts: true },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Discord guild ${guildId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Channels
  // ---------------------------------------------------------------------------
  async getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
    try {
      const response = await this.client.get(`/guilds/${guildId}/channels`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch channels for guild ${guildId}`, error);
    }
  }

  async getChannel(channelId: string): Promise<DiscordChannel> {
    try {
      const response = await this.client.get(`/channels/${channelId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Discord channel ${channelId}`, error);
    }
  }

  async createChannel(
    guildId: string,
    data: {
      name: string;
      type?: number;
      topic?: string;
      parent_id?: string;
      position?: number;
      nsfw?: boolean;
    }
  ): Promise<DiscordChannel> {
    try {
      const response = await this.client.post(`/guilds/${guildId}/channels`, data);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create Discord channel in guild ${guildId}`, error);
    }
  }

  async updateChannel(
    channelId: string,
    data: Partial<
      Pick<DiscordChannel, "name" | "topic" | "position" | "nsfw" | "rate_limit_per_user">
    >
  ): Promise<DiscordChannel> {
    try {
      const response = await this.client.patch(`/channels/${channelId}`, data);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Discord channel ${channelId}`, error);
    }
  }

  async deleteChannel(channelId: string): Promise<void> {
    try {
      await this.client.delete(`/channels/${channelId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete Discord channel ${channelId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------------
  async getMessages(
    channelId: string,
    params?: { limit?: number; before?: string; after?: string; around?: string }
  ): Promise<DiscordMessage[]> {
    try {
      const response = await this.client.get(`/channels/${channelId}/messages`, {
        params: { limit: 50, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch messages in channel ${channelId}`, error);
    }
  }

  async getMessage(channelId: string, messageId: string): Promise<DiscordMessage> {
    try {
      const response = await this.client.get(`/channels/${channelId}/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Discord message ${messageId}`, error);
    }
  }

  async sendMessage(
    channelId: string,
    content: string,
    options?: {
      tts?: boolean;
      embeds?: DiscordEmbed[];
      allowed_mentions?: { parse?: string[]; users?: string[]; roles?: string[] };
      message_reference?: { message_id: string; channel_id?: string; guild_id?: string };
    }
  ): Promise<DiscordMessage> {
    try {
      const response = await this.client.post(`/channels/${channelId}/messages`, {
        content,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to send message to channel ${channelId}`, error);
    }
  }

  async editMessage(
    channelId: string,
    messageId: string,
    content: string,
    embeds?: DiscordEmbed[]
  ): Promise<DiscordMessage> {
    try {
      const response = await this.client.patch(`/channels/${channelId}/messages/${messageId}`, {
        content,
        embeds,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to edit Discord message ${messageId}`, error);
    }
  }

  async deleteMessage(channelId: string, messageId: string): Promise<void> {
    try {
      await this.client.delete(`/channels/${channelId}/messages/${messageId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete Discord message ${messageId}`, error);
    }
  }

  async bulkDeleteMessages(channelId: string, messageIds: string[]): Promise<void> {
    try {
      await this.client.post(`/channels/${channelId}/messages/bulk-delete`, {
        messages: messageIds,
      });
    } catch (error) {
      throw new ConnectorError(`Failed to bulk delete messages in channel ${channelId}`, error);
    }
  }

  async pinMessage(channelId: string, messageId: string): Promise<void> {
    try {
      await this.client.put(`/channels/${channelId}/pins/${messageId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to pin Discord message ${messageId}`, error);
    }
  }

  async getPinnedMessages(channelId: string): Promise<DiscordMessage[]> {
    try {
      const response = await this.client.get(`/channels/${channelId}/pins`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch pinned messages in channel ${channelId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Reactions
  // ---------------------------------------------------------------------------
  async addReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    try {
      await this.client.put(
        `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`
      );
    } catch (error) {
      throw new ConnectorError(`Failed to add reaction to message ${messageId}`, error);
    }
  }

  async removeReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    try {
      await this.client.delete(
        `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`
      );
    } catch (error) {
      throw new ConnectorError(`Failed to remove reaction from message ${messageId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Members
  // ---------------------------------------------------------------------------
  async getGuildMembers(
    guildId: string,
    params?: { limit?: number; after?: string }
  ): Promise<DiscordMember[]> {
    try {
      const response = await this.client.get(`/guilds/${guildId}/members`, {
        params: { limit: 100, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch members for guild ${guildId}`, error);
    }
  }

  async getGuildMember(guildId: string, userId: string): Promise<DiscordMember> {
    try {
      const response = await this.client.get(`/guilds/${guildId}/members/${userId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch guild member ${userId}`, error);
    }
  }

  async addGuildMemberRole(guildId: string, userId: string, roleId: string): Promise<void> {
    try {
      await this.client.put(`/guilds/${guildId}/members/${userId}/roles/${roleId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to add role ${roleId} to member ${userId}`, error);
    }
  }

  async removeGuildMemberRole(guildId: string, userId: string, roleId: string): Promise<void> {
    try {
      await this.client.delete(`/guilds/${guildId}/members/${userId}/roles/${roleId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to remove role ${roleId} from member ${userId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Roles
  // ---------------------------------------------------------------------------
  async getGuildRoles(guildId: string): Promise<DiscordRole[]> {
    try {
      const response = await this.client.get(`/guilds/${guildId}/roles`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch roles for guild ${guildId}`, error);
    }
  }

  async createGuildRole(
    guildId: string,
    data: {
      name: string;
      color?: number;
      hoist?: boolean;
      permissions?: string;
      mentionable?: boolean;
    }
  ): Promise<DiscordRole> {
    try {
      const response = await this.client.post(`/guilds/${guildId}/roles`, data);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create role in guild ${guildId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Threads
  // ---------------------------------------------------------------------------
  async createThread(
    channelId: string,
    data: { name: string; type?: number; auto_archive_duration?: number; message_id?: string }
  ): Promise<DiscordChannel> {
    try {
      const path = data.message_id
        ? `/channels/${channelId}/messages/${data.message_id}/threads`
        : `/channels/${channelId}/threads`;
      const response = await this.client.post(path, {
        name: data.name,
        type: data.type || 11,
        auto_archive_duration: data.auto_archive_duration || 1440,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create thread in channel ${channelId}`, error);
    }
  }

  async getActiveThreads(guildId: string): Promise<{ threads: DiscordChannel[]; members: any[] }> {
    try {
      const response = await this.client.get(`/guilds/${guildId}/threads/active`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch active threads for guild ${guildId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------
  async getChannelWebhooks(channelId: string): Promise<DiscordWebhook[]> {
    try {
      const response = await this.client.get(`/channels/${channelId}/webhooks`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch webhooks for channel ${channelId}`, error);
    }
  }

  async createWebhook(channelId: string, name: string, avatar?: string): Promise<DiscordWebhook> {
    try {
      const response = await this.client.post(`/channels/${channelId}/webhooks`, { name, avatar });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create webhook in channel ${channelId}`, error);
    }
  }

  async executeWebhook(
    webhookId: string,
    webhookToken: string,
    data: {
      content?: string;
      username?: string;
      avatar_url?: string;
      embeds?: DiscordEmbed[];
    }
  ): Promise<void> {
    try {
      await this.client.post(`/webhooks/${webhookId}/${webhookToken}`, data);
    } catch (error) {
      throw new ConnectorError(`Failed to execute webhook ${webhookId}`, error);
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await this.client.delete(`/webhooks/${webhookId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete webhook ${webhookId}`, error);
    }
  }
}

export function createDiscordConnector(config: DiscordConfig): DiscordConnector {
  return new DiscordConnector(config);
}
