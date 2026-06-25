import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Gmail Connector — Google Gmail API v1 (OAuth 2.0)
// ============================================================================

export interface GmailConfig extends ConnectorConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  sizeEstimate: number;
  payload: {
    mimeType: string;
    headers: Array<{ name: string; value: string }>;
    body?: { size: number; data?: string };
    parts?: Array<{
      mimeType: string;
      filename?: string;
      body: { size: number; data?: string; attachmentId?: string };
    }>;
  };
}

export interface GmailThread {
  id: string;
  historyId: string;
  messages: GmailMessage[];
  snippet: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: "system" | "user";
  messageListVisibility?: "show" | "hide";
  labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide";
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
}

export interface GmailDraft {
  id: string;
  message: GmailMessage;
}

export interface GmailSendOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    data: string; // base64
  }>;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export interface GmailSearchParams {
  query?: string;
  labelIds?: string[];
  maxResults?: number;
  pageToken?: string;
  includeSpamTrash?: boolean;
  since?: string;
}

export interface GmailSyncParams {
  limit?: number;
  cursor?: string;
  since?: string;
  startHistoryId?: string;
}

export class GmailConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: GmailConfig;

  constructor(config: GmailConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: "https://gmail.googleapis.com/gmail/v1/users/me",
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
          if (newToken) {
            error.config.headers["Authorization"] = `Bearer ${newToken}`;
            return this.client.request(error.config);
          }
        }
        if (error.response?.status === 429) {
          throw new ConnectorError("Gmail API rate limit exceeded", error);
        }
        throw new ConnectorError(
          `Gmail API error: ${error.response?.data?.error?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "gmail",
      name: "Gmail",
      version: "1.0.0",
      apiVersion: "v1",
      capabilities: { sync: true, webhooks: true, dataVelocity: "realtime" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/profile");
      return response.status === 200 && !!response.data.emailAddress;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // OAuth Token Refresh
  // ---------------------------------------------------------------------------
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: "refresh_token",
      });
      const newToken = response.data.access_token;
      this.config.accessToken = newToken;
      this.client.defaults.headers["Authorization"] = `Bearer ${newToken}`;
      return newToken;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------------
  async getProfile(): Promise<{
    emailAddress: string;
    messagesTotal: number;
    threadsTotal: number;
    historyId: string;
  }> {
    try {
      const response = await this.client.get("/profile");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Gmail profile", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Messages — List / Get / Search
  // ---------------------------------------------------------------------------
  async listMessages(params?: GmailSearchParams): Promise<{
    messages: Array<{ id: string; threadId: string }>;
    nextPageToken?: string;
    resultSizeEstimate: number;
  }> {
    try {
      const query = this.combineSearchQuery(params?.query, params?.since);
      const response = await this.client.get("/messages", {
        params: {
          q: query,
          labelIds: params?.labelIds?.join(","),
          maxResults: params?.maxResults || 50,
          pageToken: params?.pageToken,
          includeSpamTrash: params?.includeSpamTrash || false,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Gmail messages", error);
    }
  }

  /**
   * Sync helper:
   * - creamy/full: pulls message ids then hydrates metadata in batch
   * - delta: when startHistoryId is available, uses Gmail History API first
   */
  async getMessagesForSync(params?: GmailSyncParams): Promise<{
    messages: GmailMessage[];
    next_cursor?: string;
    latest_history_id?: string;
  }> {
    const safeLimit = Math.max(1, Math.min(params?.limit || 50, 500));

    if (params?.startHistoryId) {
      const history = await this.getHistory(params.startHistoryId, [
        "messageAdded",
        "messageDeleted",
      ]);
      const changedMessageIds = (history.history || [])
        .flatMap((h) => h.messagesAdded?.map((entry) => entry.message?.id) || [])
        .filter((id): id is string => Boolean(id));

      const uniqueIds = Array.from(new Set(changedMessageIds)).slice(0, safeLimit);
      const changedMessages = uniqueIds.length
        ? await this.getMessagesBatch(uniqueIds, "metadata")
        : [];
      return {
        messages: changedMessages,
        latest_history_id: history.historyId,
        next_cursor: history.nextPageToken,
      };
    }

    const listed = await this.listMessages({
      maxResults: safeLimit,
      pageToken: params?.cursor,
      since: params?.since,
    });

    const messageIds = listed.messages?.map((message) => message.id) || [];
    const hydrated = messageIds.length ? await this.getMessagesBatch(messageIds, "metadata") : [];
    const profile = await this.getProfile().catch(() => null);
    return {
      messages: hydrated,
      next_cursor: listed.nextPageToken,
      latest_history_id: profile?.historyId,
    };
  }

  async getMessage(
    messageId: string,
    format: "full" | "metadata" | "minimal" | "raw" = "full"
  ): Promise<GmailMessage> {
    try {
      const response = await this.client.get(`/messages/${messageId}`, { params: { format } });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Gmail message ${messageId}`, error);
    }
  }

  async getMessagesBatch(
    messageIds: string[],
    format: "full" | "metadata" | "minimal" = "metadata"
  ): Promise<GmailMessage[]> {
    const results = await Promise.allSettled(messageIds.map((id) => this.getMessage(id, format)));
    return results
      .filter((r): r is PromiseFulfilledResult<GmailMessage> => r.status === "fulfilled")
      .map((r) => r.value);
  }

  async searchMessages(query: string, maxResults = 50): Promise<GmailMessage[]> {
    try {
      const listResult = await this.listMessages({ query, maxResults });
      if (!listResult.messages?.length) return [];
      return this.getMessagesBatch(listResult.messages.map((m) => m.id));
    } catch (error) {
      throw new ConnectorError("Failed to search Gmail messages", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Messages — Send / Reply
  // ---------------------------------------------------------------------------
  async sendMessage(options: GmailSendOptions): Promise<GmailMessage> {
    try {
      const raw = this.buildRawMessage(options);
      const response = await this.client.post("/messages/send", {
        raw,
        threadId: options.threadId,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to send Gmail message", error);
    }
  }

  async replyToMessage(
    messageId: string,
    options: Omit<GmailSendOptions, "threadId">
  ): Promise<GmailMessage> {
    const original = await this.getMessage(messageId, "metadata");
    const messageIdHeader = original.payload.headers.find((h) => h.name === "Message-ID")?.value;
    const references = original.payload.headers.find((h) => h.name === "References")?.value || "";
    return this.sendMessage({
      ...options,
      threadId: original.threadId,
      inReplyTo: messageIdHeader,
      references: `${references} ${messageIdHeader}`.trim(),
    });
  }

  // ---------------------------------------------------------------------------
  // Messages — Modify / Trash / Delete
  // ---------------------------------------------------------------------------
  async modifyMessage(
    messageId: string,
    addLabelIds?: string[],
    removeLabelIds?: string[]
  ): Promise<GmailMessage> {
    try {
      const response = await this.client.post(`/messages/${messageId}/modify`, {
        addLabelIds: addLabelIds || [],
        removeLabelIds: removeLabelIds || [],
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to modify Gmail message ${messageId}`, error);
    }
  }

  async trashMessage(messageId: string): Promise<void> {
    try {
      await this.client.post(`/messages/${messageId}/trash`);
    } catch (error) {
      throw new ConnectorError(`Failed to trash Gmail message ${messageId}`, error);
    }
  }

  async untrashMessage(messageId: string): Promise<void> {
    try {
      await this.client.post(`/messages/${messageId}/untrash`);
    } catch (error) {
      throw new ConnectorError(`Failed to untrash Gmail message ${messageId}`, error);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.client.delete(`/messages/${messageId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete Gmail message ${messageId}`, error);
    }
  }

  async batchDeleteMessages(messageIds: string[]): Promise<void> {
    try {
      await this.client.post("/messages/batchDelete", { ids: messageIds });
    } catch (error) {
      throw new ConnectorError("Failed to batch delete Gmail messages", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Threads
  // ---------------------------------------------------------------------------
  async listThreads(params?: GmailSearchParams): Promise<{
    threads: Array<{ id: string; snippet: string; historyId: string }>;
    nextPageToken?: string;
  }> {
    try {
      const response = await this.client.get("/threads", {
        params: {
          q: params?.query,
          labelIds: params?.labelIds?.join(","),
          maxResults: params?.maxResults || 50,
          pageToken: params?.pageToken,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Gmail threads", error);
    }
  }

  async getThread(
    threadId: string,
    format: "full" | "metadata" | "minimal" = "full"
  ): Promise<GmailThread> {
    try {
      const response = await this.client.get(`/threads/${threadId}`, { params: { format } });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Gmail thread ${threadId}`, error);
    }
  }

  async trashThread(threadId: string): Promise<void> {
    try {
      await this.client.post(`/threads/${threadId}/trash`);
    } catch (error) {
      throw new ConnectorError(`Failed to trash Gmail thread ${threadId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Labels
  // ---------------------------------------------------------------------------
  async getLabels(): Promise<GmailLabel[]> {
    try {
      const response = await this.client.get("/labels");
      return response.data.labels || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Gmail labels", error);
    }
  }

  async createLabel(
    name: string,
    options?: {
      messageListVisibility?: "show" | "hide";
      labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide";
    }
  ): Promise<GmailLabel> {
    try {
      const response = await this.client.post("/labels", { name, ...options });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create Gmail label "${name}"`, error);
    }
  }

  async deleteLabel(labelId: string): Promise<void> {
    try {
      await this.client.delete(`/labels/${labelId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete Gmail label ${labelId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Drafts
  // ---------------------------------------------------------------------------
  async listDrafts(
    maxResults = 50,
    pageToken?: string
  ): Promise<{ drafts: GmailDraft[]; nextPageToken?: string }> {
    try {
      const response = await this.client.get("/drafts", { params: { maxResults, pageToken } });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Gmail drafts", error);
    }
  }

  async createDraft(options: GmailSendOptions): Promise<GmailDraft> {
    try {
      const raw = this.buildRawMessage(options);
      const response = await this.client.post("/drafts", {
        message: { raw, threadId: options.threadId },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Gmail draft", error);
    }
  }

  async sendDraft(draftId: string): Promise<GmailMessage> {
    try {
      const response = await this.client.post("/drafts/send", { id: draftId });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to send Gmail draft ${draftId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Watch (Push Notifications via Pub/Sub)
  // ---------------------------------------------------------------------------
  async watchInbox(
    topicName: string,
    labelIds?: string[]
  ): Promise<{ historyId: string; expiration: string }> {
    try {
      const response = await this.client.post("/watch", {
        topicName,
        labelIds: labelIds || ["INBOX"],
        labelFilterBehavior: "INCLUDE",
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to set up Gmail push notifications", error);
    }
  }

  async stopWatch(): Promise<void> {
    try {
      await this.client.post("/stop");
    } catch (error) {
      throw new ConnectorError("Failed to stop Gmail push notifications", error);
    }
  }

  // ---------------------------------------------------------------------------
  // History (Incremental Sync)
  // ---------------------------------------------------------------------------
  async getHistory(
    startHistoryId: string,
    historyTypes?: Array<"messageAdded" | "messageDeleted" | "labelAdded" | "labelRemoved">
  ): Promise<{
    history: Array<{
      id: string;
      messages?: Array<{ id: string; threadId: string }>;
      messagesAdded?: Array<{ message: { id: string; threadId: string; labelIds: string[] } }>;
      messagesDeleted?: Array<{ message: { id: string; threadId: string } }>;
    }>;
    nextPageToken?: string;
    historyId: string;
  }> {
    try {
      const response = await this.client.get("/history", {
        params: { startHistoryId, historyTypes: historyTypes?.join(",") },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Gmail history", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private buildRawMessage(options: GmailSendOptions): string {
    const boundary = `boundary_${Date.now()}`;
    const headers = [
      `To: ${options.to.join(", ")}`,
      options.cc?.length ? `Cc: ${options.cc.join(", ")}` : "",
      options.bcc?.length ? `Bcc: ${options.bcc.join(", ")}` : "",
      `Subject: ${options.subject}`,
      options.inReplyTo ? `In-Reply-To: ${options.inReplyTo}` : "",
      options.references ? `References: ${options.references}` : "",
      `MIME-Version: 1.0`,
    ].filter(Boolean);

    let message: string;
    if (options.attachments?.length) {
      headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      const parts = [
        `--${boundary}`,
        `Content-Type: ${options.htmlBody ? "text/html" : "text/plain"}; charset="UTF-8"`,
        "",
        options.htmlBody || options.body,
      ];
      for (const att of options.attachments) {
        parts.push(
          `--${boundary}`,
          `Content-Type: ${att.mimeType}; name="${att.filename}"`,
          `Content-Disposition: attachment; filename="${att.filename}"`,
          `Content-Transfer-Encoding: base64`,
          "",
          att.data
        );
      }
      parts.push(`--${boundary}--`);
      message = `${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}`;
    } else {
      headers.push(
        `Content-Type: ${options.htmlBody ? "text/html" : "text/plain"}; charset="UTF-8"`
      );
      message = `${headers.join("\r\n")}\r\n\r\n${options.htmlBody || options.body}`;
    }
    return Buffer.from(message).toString("base64url");
  }

  extractHeader(message: GmailMessage, headerName: string): string | undefined {
    return message.payload.headers.find((h) => h.name.toLowerCase() === headerName.toLowerCase())
      ?.value;
  }

  extractBody(message: GmailMessage): string {
    if (message.payload.body?.data) {
      return Buffer.from(message.payload.body.data, "base64url").toString("utf-8");
    }
    const textPart = message.payload.parts?.find((p) => p.mimeType === "text/plain");
    if (textPart?.body.data) {
      return Buffer.from(textPart.body.data, "base64url").toString("utf-8");
    }
    const htmlPart = message.payload.parts?.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body.data) {
      return Buffer.from(htmlPart.body.data, "base64url").toString("utf-8");
    }
    return "";
  }

  private combineSearchQuery(query?: string, since?: string): string | undefined {
    const dateFilter = this.sinceToAfterQuery(since);
    if (query && dateFilter) return `${query} ${dateFilter}`.trim();
    return query || dateFilter;
  }

  private sinceToAfterQuery(since?: string): string | undefined {
    if (!since) return undefined;
    const parsed = new Date(since);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return `after:${Math.floor(parsed.getTime() / 1000)}`;
  }
}

export function createGmailConnector(config: GmailConfig): GmailConnector {
  return new GmailConnector(config);
}
