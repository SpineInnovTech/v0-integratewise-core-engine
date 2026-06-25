import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Microsoft Teams Connector — Microsoft Graph API v1.0
// Real connection → Creamy load → Delayed full load → Delta load
// ============================================================================

export interface MicrosoftTeamsConfig extends ConnectorConfig {
  accessToken: string; // OAuth2 access token (delegated or application)
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------
export interface TeamsTeam {
  id: string;
  displayName: string;
  description?: string;
  createdDateTime: string;
  visibility?: "public" | "private";
  isArchived: boolean;
  membershipType?: string;
  webUrl?: string;
}

export interface TeamsChannel {
  id: string;
  displayName: string;
  description?: string;
  membershipType?: "standard" | "private" | "shared";
  createdDateTime: string;
  webUrl?: string;
  email?: string;
}

export interface TeamsMessage {
  id: string;
  createdDateTime: string;
  lastModifiedDateTime?: string;
  body: { content: string; contentType: "text" | "html" };
  from?: {
    user?: { id: string; displayName: string; userIdentityType: string };
    application?: { id: string; displayName: string };
  };
  subject?: string;
  importance?: "normal" | "high" | "urgent";
  mentions?: Array<{
    id: number;
    mentionText: string;
    mentioned: { user: { id: string; displayName: string } };
  }>;
  attachments?: Array<{
    id: string;
    contentType: string;
    contentUrl?: string;
    name?: string;
    thumbnailUrl?: string;
  }>;
  reactions?: Array<{
    reactionType: string;
    user: { id: string; displayName: string };
    createdDateTime: string;
  }>;
  replies?: TeamsMessage[];
  webUrl?: string;
}

export interface TeamsMember {
  id: string;
  displayName: string;
  userId: string;
  email?: string;
  roles: string[]; // ["owner"] or ["guest"] or []
}

export interface TeamsChat {
  id: string;
  topic?: string;
  chatType: "oneOnOne" | "group" | "meeting";
  createdDateTime: string;
  lastUpdatedDateTime?: string;
  members?: TeamsMember[];
  webUrl?: string;
}

export interface TeamsUser {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  accountEnabled?: boolean;
}

export interface TeamsPresence {
  id: string;
  availability: string; // Available, Busy, DoNotDisturb, Away, Offline, etc.
  activity: string;
}

export interface GraphListResponse<T> {
  "@odata.count"?: number;
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
  value: T[];
}

export class MicrosoftTeamsConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: MicrosoftTeamsConfig;

  constructor(config: MicrosoftTeamsConfig) {
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
      (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.error?.message || error.message;
        if (status === 401)
          throw new ConnectorError("Invalid or expired Microsoft access token", error);
        if (status === 403)
          throw new ConnectorError(`Microsoft Graph permission denied: ${msg}`, error);
        if (status === 404) throw new ConnectorError(`Microsoft resource not found: ${msg}`, error);
        if (status === 429) {
          const retryAfter = error.response?.headers?.["retry-after"];
          throw new ConnectorError(
            `Microsoft Graph rate limit exceeded. Retry after ${retryAfter}s`,
            error
          );
        }
        throw new ConnectorError(`Microsoft Graph API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "microsoft-teams",
      name: "Microsoft Teams",
      version: "1.0.0",
      apiVersion: "v1.0",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/me");
      return response.status === 200 && !!response.data.id;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Current User
  // ---------------------------------------------------------------------------
  async getMe(): Promise<TeamsUser> {
    try {
      const response = await this.client.get("/me");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get current user", error);
    }
  }

  async getMyPresence(): Promise<TeamsPresence> {
    try {
      const response = await this.client.get("/me/presence");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get current user presence", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Teams
  // ---------------------------------------------------------------------------
  async getJoinedTeams(): Promise<TeamsTeam[]> {
    try {
      const response = await this.client.get("/me/joinedTeams");
      return response.data.value || [];
    } catch (error) {
      throw new ConnectorError("Failed to get joined teams", error);
    }
  }

  async getTeam(teamId: string): Promise<TeamsTeam> {
    try {
      const response = await this.client.get(`/teams/${teamId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get team ${teamId}`, error);
    }
  }

  async getTeamMembers(teamId: string): Promise<TeamsMember[]> {
    try {
      const response = await this.client.get(`/teams/${teamId}/members`);
      return response.data.value || [];
    } catch (error) {
      throw new ConnectorError(`Failed to get members of team ${teamId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Channels
  // ---------------------------------------------------------------------------
  async getChannels(teamId: string): Promise<TeamsChannel[]> {
    try {
      const response = await this.client.get(`/teams/${teamId}/channels`);
      return response.data.value || [];
    } catch (error) {
      throw new ConnectorError(`Failed to get channels for team ${teamId}`, error);
    }
  }

  async getChannel(teamId: string, channelId: string): Promise<TeamsChannel> {
    try {
      const response = await this.client.get(`/teams/${teamId}/channels/${channelId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get channel ${channelId}`, error);
    }
  }

  async createChannel(
    teamId: string,
    data: { displayName: string; description?: string; membershipType?: string }
  ): Promise<TeamsChannel> {
    try {
      const response = await this.client.post(`/teams/${teamId}/channels`, data);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create channel in team ${teamId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------------------
  async getChannelMessages(
    teamId: string,
    channelId: string,
    params?: { $top?: number; $skip?: number }
  ): Promise<GraphListResponse<TeamsMessage>> {
    try {
      const response = await this.client.get(`/teams/${teamId}/channels/${channelId}/messages`, {
        params: { $top: params?.$top || 50, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get messages for channel ${channelId}`, error);
    }
  }

  async getMessageReplies(
    teamId: string,
    channelId: string,
    messageId: string,
    params?: { $top?: number }
  ): Promise<GraphListResponse<TeamsMessage>> {
    try {
      const response = await this.client.get(
        `/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get replies for message ${messageId}`, error);
    }
  }

  async sendChannelMessage(
    teamId: string,
    channelId: string,
    content: string,
    contentType: "text" | "html" = "text"
  ): Promise<TeamsMessage> {
    try {
      const response = await this.client.post(`/teams/${teamId}/channels/${channelId}/messages`, {
        body: { content, contentType },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to send message to channel ${channelId}`, error);
    }
  }

  async replyToMessage(
    teamId: string,
    channelId: string,
    messageId: string,
    content: string,
    contentType: "text" | "html" = "text"
  ): Promise<TeamsMessage> {
    try {
      const response = await this.client.post(
        `/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`,
        { body: { content, contentType } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to reply to message ${messageId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Chats (1:1 and Group)
  // ---------------------------------------------------------------------------
  async getChats(params?: {
    $top?: number;
    $skip?: number;
  }): Promise<GraphListResponse<TeamsChat>> {
    try {
      const response = await this.client.get("/me/chats", {
        params: { $top: params?.$top || 50, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get chats", error);
    }
  }

  async getChatMessages(
    chatId: string,
    params?: { $top?: number }
  ): Promise<GraphListResponse<TeamsMessage>> {
    try {
      const response = await this.client.get(`/me/chats/${chatId}/messages`, {
        params: { $top: params?.$top || 50 },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get messages for chat ${chatId}`, error);
    }
  }

  async sendChatMessage(
    chatId: string,
    content: string,
    contentType: "text" | "html" = "text"
  ): Promise<TeamsMessage> {
    try {
      const response = await this.client.post(`/chats/${chatId}/messages`, {
        body: { content, contentType },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to send message to chat ${chatId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Users (via Graph)
  // ---------------------------------------------------------------------------
  async getUsers(params?: {
    $top?: number;
    $select?: string;
    $filter?: string;
    $skipToken?: string;
  }): Promise<GraphListResponse<TeamsUser>> {
    try {
      const response = await this.client.get("/users", {
        params: {
          $top: params?.$top || 100,
          $select:
            params?.$select ||
            "id,displayName,mail,userPrincipalName,jobTitle,department,accountEnabled",
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get users", error);
    }
  }

  async getUser(userId: string): Promise<TeamsUser> {
    try {
      const response = await this.client.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get user ${userId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Delta queries (for delta sync)
  // ---------------------------------------------------------------------------
  async getChannelMessagesDelta(
    teamId: string,
    channelId: string,
    deltaLink?: string
  ): Promise<GraphListResponse<TeamsMessage>> {
    try {
      const url = deltaLink || `/teams/${teamId}/channels/${channelId}/messages/delta`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get delta messages for channel ${channelId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Presence
  // ---------------------------------------------------------------------------
  async getUsersPresence(userIds: string[]): Promise<TeamsPresence[]> {
    try {
      const response = await this.client.post("/communications/getPresencesByUserId", {
        ids: userIds,
      });
      return response.data.value || [];
    } catch (error) {
      throw new ConnectorError("Failed to get users presence", error);
    }
  }
}

export function createMicrosoftTeamsConnector(
  config: MicrosoftTeamsConfig
): MicrosoftTeamsConnector {
  return new MicrosoftTeamsConnector(config);
}
