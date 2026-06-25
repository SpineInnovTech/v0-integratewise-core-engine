import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Outlook / Microsoft Graph Mail Connector — Graph API v1.0 (OAuth 2.0)
// ============================================================================

export interface OutlookConfig extends ConnectorConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  userPrincipalName?: string; // defaults to "me"
}

export interface OutlookMessage {
  id: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  receivedDateTime: string;
  sentDateTime?: string;
  subject: string;
  bodyPreview: string;
  importance: "low" | "normal" | "high";
  isRead: boolean;
  isDraft: boolean;
  hasAttachments: boolean;
  internetMessageId?: string;
  conversationId: string;
  conversationIndex?: string;
  from?: { emailAddress: { name: string; address: string } };
  sender?: { emailAddress: { name: string; address: string } };
  toRecipients: Array<{ emailAddress: { name: string; address: string } }>;
  ccRecipients: Array<{ emailAddress: { name: string; address: string } }>;
  bccRecipients: Array<{ emailAddress: { name: string; address: string } }>;
  body: { contentType: "text" | "html"; content: string };
  categories: string[];
  flag: { flagStatus: "notFlagged" | "flagged" | "complete" };
  webLink: string;
}

export interface OutlookMailFolder {
  id: string;
  displayName: string;
  parentFolderId?: string;
  childFolderCount: number;
  totalItemCount: number;
  unreadItemCount: number;
  isHidden: boolean;
}

export interface OutlookAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
  lastModifiedDateTime: string;
  contentBytes?: string; // base64
}

export interface OutlookContact {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  emailAddresses: Array<{ name?: string; address: string }>;
  businessPhones: string[];
  mobilePhone?: string;
  companyName?: string;
  jobTitle?: string;
  department?: string;
}

export interface OutlookEvent {
  id: string;
  subject: string;
  bodyPreview: string;
  body: { contentType: "text" | "html"; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location: { displayName: string };
  attendees: Array<{
    emailAddress: { name: string; address: string };
    type: "required" | "optional" | "resource";
    status: { response: string; time: string };
  }>;
  organizer: { emailAddress: { name: string; address: string } };
  isAllDay: boolean;
  isCancelled: boolean;
  recurrence?: any;
  webLink: string;
}

export interface OutlookSendOptions {
  to: Array<{ name?: string; address: string }>;
  cc?: Array<{ name?: string; address: string }>;
  bcc?: Array<{ name?: string; address: string }>;
  subject: string;
  body: string;
  contentType?: "text" | "html";
  importance?: "low" | "normal" | "high";
  attachments?: Array<{
    name: string;
    contentType: string;
    contentBytes: string; // base64
  }>;
  saveToSentItems?: boolean;
}

export interface OutlookListParams {
  $top?: number;
  $skip?: number;
  $filter?: string;
  $select?: string;
  $orderby?: string;
  $search?: string;
}

export class OutlookConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: OutlookConfig;
  private userPath: string;

  constructor(config: OutlookConfig) {
    super(config);
    this.config = config;
    this.userPath = config.userPrincipalName ? `/users/${config.userPrincipalName}` : "/me";

    this.client = axios.create({
      baseURL: "https://graph.microsoft.com/v1.0",
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
          const retryAfter = error.response.headers["retry-after"];
          throw new ConnectorError(
            `Microsoft Graph rate limit exceeded. Retry after ${retryAfter}s`,
            error
          );
        }
        throw new ConnectorError(
          `Microsoft Graph API error: ${error.response?.data?.error?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "outlook",
      name: "Microsoft Outlook",
      version: "1.0.0",
      apiVersion: "v1.0",
      capabilities: { sync: true, webhooks: true, dataVelocity: "realtime" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get(`${this.userPath}`);
      return response.status === 200 && !!response.data.id;
    } catch {
      return false;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const tenantId = this.config.tenantId || "common";
      const response = await axios.post(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: this.config.clientId!,
          client_secret: this.config.clientSecret!,
          refresh_token: this.config.refreshToken!,
          grant_type: "refresh_token",
          scope: "https://graph.microsoft.com/.default",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      const newToken = response.data.access_token;
      this.config.accessToken = newToken;
      this.client.defaults.headers["Authorization"] = `Bearer ${newToken}`;
      return newToken;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Messages — List / Get / Search
  // ---------------------------------------------------------------------------
  async listMessages(
    params?: OutlookListParams
  ): Promise<{ value: OutlookMessage[]; "@odata.nextLink"?: string }> {
    try {
      const response = await this.client.get(`${this.userPath}/messages`, {
        params: { $top: 50, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Outlook messages", error);
    }
  }

  async getMessage(messageId: string, select?: string): Promise<OutlookMessage> {
    try {
      const response = await this.client.get(`${this.userPath}/messages/${messageId}`, {
        params: select ? { $select: select } : undefined,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Outlook message ${messageId}`, error);
    }
  }

  async searchMessages(query: string, top = 50): Promise<OutlookMessage[]> {
    try {
      const response = await this.client.get(`${this.userPath}/messages`, {
        params: { $search: `"${query}"`, $top: top },
      });
      return response.data.value || [];
    } catch (error) {
      throw new ConnectorError("Failed to search Outlook messages", error);
    }
  }

  async getMessagesInFolder(
    folderId: string,
    params?: OutlookListParams
  ): Promise<{ value: OutlookMessage[]; "@odata.nextLink"?: string }> {
    try {
      const response = await this.client.get(`${this.userPath}/mailFolders/${folderId}/messages`, {
        params: { $top: 50, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list messages in folder ${folderId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Messages — Send / Reply / Forward
  // ---------------------------------------------------------------------------
  async sendMessage(options: OutlookSendOptions): Promise<void> {
    try {
      const message: any = {
        subject: options.subject,
        body: { contentType: options.contentType || "text", content: options.body },
        toRecipients: options.to.map((r) => ({ emailAddress: r })),
        importance: options.importance || "normal",
      };
      if (options.cc) message.ccRecipients = options.cc.map((r) => ({ emailAddress: r }));
      if (options.bcc) message.bccRecipients = options.bcc.map((r) => ({ emailAddress: r }));
      if (options.attachments) {
        message.attachments = options.attachments.map((a) => ({
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: a.name,
          contentType: a.contentType,
          contentBytes: a.contentBytes,
        }));
      }

      await this.client.post(`${this.userPath}/sendMail`, {
        message,
        saveToSentItems: options.saveToSentItems !== false,
      });
    } catch (error) {
      throw new ConnectorError("Failed to send Outlook message", error);
    }
  }

  async replyToMessage(messageId: string, comment: string): Promise<void> {
    try {
      await this.client.post(`${this.userPath}/messages/${messageId}/reply`, { comment });
    } catch (error) {
      throw new ConnectorError(`Failed to reply to Outlook message ${messageId}`, error);
    }
  }

  async replyAllToMessage(messageId: string, comment: string): Promise<void> {
    try {
      await this.client.post(`${this.userPath}/messages/${messageId}/replyAll`, { comment });
    } catch (error) {
      throw new ConnectorError(`Failed to reply all to Outlook message ${messageId}`, error);
    }
  }

  async forwardMessage(
    messageId: string,
    toRecipients: Array<{ name?: string; address: string }>,
    comment?: string
  ): Promise<void> {
    try {
      await this.client.post(`${this.userPath}/messages/${messageId}/forward`, {
        comment,
        toRecipients: toRecipients.map((r) => ({ emailAddress: r })),
      });
    } catch (error) {
      throw new ConnectorError(`Failed to forward Outlook message ${messageId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Messages — Update / Move / Delete
  // ---------------------------------------------------------------------------
  async updateMessage(
    messageId: string,
    update: Partial<
      Pick<OutlookMessage, "isRead" | "categories" | "flag" | "importance" | "subject">
    >
  ): Promise<OutlookMessage> {
    try {
      const response = await this.client.patch(`${this.userPath}/messages/${messageId}`, update);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update Outlook message ${messageId}`, error);
    }
  }

  async moveMessage(messageId: string, destinationFolderId: string): Promise<OutlookMessage> {
    try {
      const response = await this.client.post(`${this.userPath}/messages/${messageId}/move`, {
        destinationId: destinationFolderId,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to move Outlook message ${messageId}`, error);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.client.delete(`${this.userPath}/messages/${messageId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete Outlook message ${messageId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Attachments
  // ---------------------------------------------------------------------------
  async getAttachments(messageId: string): Promise<OutlookAttachment[]> {
    try {
      const response = await this.client.get(`${this.userPath}/messages/${messageId}/attachments`);
      return response.data.value || [];
    } catch (error) {
      throw new ConnectorError(`Failed to fetch attachments for message ${messageId}`, error);
    }
  }

  async addAttachment(
    messageId: string,
    attachment: { name: string; contentType: string; contentBytes: string }
  ): Promise<OutlookAttachment> {
    try {
      const response = await this.client.post(
        `${this.userPath}/messages/${messageId}/attachments`,
        {
          "@odata.type": "#microsoft.graph.fileAttachment",
          ...attachment,
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to add attachment to message ${messageId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Mail Folders
  // ---------------------------------------------------------------------------
  async getMailFolders(): Promise<OutlookMailFolder[]> {
    try {
      const response = await this.client.get(`${this.userPath}/mailFolders`);
      return response.data.value || [];
    } catch (error) {
      throw new ConnectorError("Failed to fetch Outlook mail folders", error);
    }
  }

  async createMailFolder(displayName: string, parentFolderId?: string): Promise<OutlookMailFolder> {
    try {
      const path = parentFolderId
        ? `${this.userPath}/mailFolders/${parentFolderId}/childFolders`
        : `${this.userPath}/mailFolders`;
      const response = await this.client.post(path, { displayName });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to create Outlook mail folder "${displayName}"`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Contacts
  // ---------------------------------------------------------------------------
  async listContacts(
    params?: OutlookListParams
  ): Promise<{ value: OutlookContact[]; "@odata.nextLink"?: string }> {
    try {
      const response = await this.client.get(`${this.userPath}/contacts`, {
        params: { $top: 50, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Outlook contacts", error);
    }
  }

  async createContact(contact: Partial<OutlookContact>): Promise<OutlookContact> {
    try {
      const response = await this.client.post(`${this.userPath}/contacts`, contact);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Outlook contact", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Calendar Events
  // ---------------------------------------------------------------------------
  async listEvents(
    params?: OutlookListParams
  ): Promise<{ value: OutlookEvent[]; "@odata.nextLink"?: string }> {
    try {
      const response = await this.client.get(`${this.userPath}/events`, {
        params: { $top: 50, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Outlook events", error);
    }
  }

  async createEvent(event: Partial<OutlookEvent>): Promise<OutlookEvent> {
    try {
      const response = await this.client.post(`${this.userPath}/events`, event);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Outlook event", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Subscriptions (Webhooks)
  // ---------------------------------------------------------------------------
  async createSubscription(options: {
    changeType: "created" | "updated" | "deleted";
    resource: string;
    notificationUrl: string;
    expirationDateTime: string;
    clientState?: string;
  }): Promise<{ id: string; resource: string; expirationDateTime: string }> {
    try {
      const response = await this.client.post("/subscriptions", {
        changeType: options.changeType,
        notificationUrl: options.notificationUrl,
        resource: `${this.userPath}/${options.resource}`,
        expirationDateTime: options.expirationDateTime,
        clientState: options.clientState,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Microsoft Graph subscription", error);
    }
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.client.delete(`/subscriptions/${subscriptionId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete subscription ${subscriptionId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Delta Queries (Incremental Sync)
  // ---------------------------------------------------------------------------
  async getMessagesDelta(
    deltaLink?: string
  ): Promise<{ value: OutlookMessage[]; "@odata.deltaLink"?: string; "@odata.nextLink"?: string }> {
    try {
      const url = deltaLink || `${this.userPath}/mailFolders/inbox/messages/delta`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch message delta", error);
    }
  }
}

export function createOutlookConnector(config: OutlookConfig): OutlookConnector {
  return new OutlookConnector(config);
}
