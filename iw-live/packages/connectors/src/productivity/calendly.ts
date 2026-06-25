import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Calendly Connector — Calendly API v2
// ============================================================================

export interface CalendlyConfig extends ConnectorConfig {
  accessToken: string;
  organizationUri?: string;
  baseUrl?: string;
}

export interface CalendlyUser {
  uri: string;
  name: string;
  slug: string;
  email: string;
  scheduling_url: string;
  timezone: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  current_organization: string;
}

export interface CalendlyEventType {
  uri: string;
  name: string;
  active: boolean;
  booking_method: string;
  slug: string;
  scheduling_url: string;
  duration: number;
  kind: "solo" | "group";
  type: "StandardEventType" | "AdhocEventType";
  color: string;
  description_plain: string;
  description_html: string;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
  profile: { type: string; name: string; owner: string };
}

export interface CalendlyScheduledEvent {
  uri: string;
  name: string;
  status: "active" | "canceled";
  start_time: string;
  end_time: string;
  event_type: string;
  location: { type: string; location?: string; join_url?: string; data?: any } | null;
  invitees_counter: { total: number; active: number; limit: number };
  created_at: string;
  updated_at: string;
  event_memberships: Array<{ user: string; user_email: string; user_name: string }>;
  calendar_event?: { external_id: string; kind: string };
  cancellation?: { canceled_by: string; reason: string; canceler_type: string };
}

export interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  status: "active" | "canceled";
  timezone: string;
  created_at: string;
  updated_at: string;
  questions_and_answers: Array<{ question: string; answer: string; position: number }>;
  tracking: {
    utm_campaign: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_term: string | null;
    utm_content: string | null;
    salesforce_uuid: string | null;
  };
  cancel_url: string;
  reschedule_url: string;
  no_show: { uri: string; created_at: string } | null;
  payment?: {
    external_id: string;
    provider: string;
    amount: number;
    currency: string;
    terms: string;
  };
}

export interface CalendlyWebhookSubscription {
  uri: string;
  callback_url: string;
  created_at: string;
  updated_at: string;
  retry_started_at: string | null;
  state: "active" | "disabled";
  events: string[];
  scope: "user" | "organization";
  organization: string;
  user?: string;
  creator: string;
}

export interface CalendlyAvailabilitySchedule {
  uri: string;
  name: string;
  default: boolean;
  timezone: string;
  rules: Array<{
    type: "wday" | "date";
    wday?: string;
    date?: string;
    intervals: Array<{ from: string; to: string }>;
  }>;
}

export interface CalendlyListParams {
  count?: number;
  page_token?: string;
  sort?: string;
  status?: "active" | "canceled";
  min_start_time?: string;
  max_start_time?: string;
}

export class CalendlyConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: CalendlyConfig;
  private userUri: string | null = null;
  private orgUri: string | null = null;

  constructor(config: CalendlyConfig) {
    super(config);
    this.config = config;
    this.orgUri = config.organizationUri || null;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.calendly.com",
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const msg = error.response?.data?.message || error.message;
        if (status === 401) throw new ConnectorError("Invalid Calendly access token", error);
        if (status === 403) throw new ConnectorError(`Calendly permission denied: ${msg}`, error);
        if (status === 404) throw new ConnectorError("Calendly resource not found", error);
        if (status === 429) throw new ConnectorError("Calendly rate limit exceeded", error);
        throw new ConnectorError(`Calendly API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "calendly",
      name: "Calendly",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: true },
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

  private async ensureUserUri(): Promise<string> {
    if (!this.userUri) {
      const me = await this.getMe();
      this.userUri = me.uri;
      if (!this.orgUri) this.orgUri = me.current_organization;
    }
    return this.userUri;
  }

  private async ensureOrgUri(): Promise<string> {
    if (!this.orgUri) {
      await this.ensureUserUri();
    }
    return this.orgUri!;
  }

  // ---------------------------------------------------------------------------
  // User
  // ---------------------------------------------------------------------------
  async getMe(): Promise<CalendlyUser> {
    try {
      const response = await this.client.get("/users/me");
      const user = response.data.resource;
      this.userUri = user.uri;
      if (!this.orgUri) this.orgUri = user.current_organization;
      return user;
    } catch (error) {
      throw new ConnectorError("Failed to get current Calendly user", error);
    }
  }

  async getUser(userUri: string): Promise<CalendlyUser> {
    try {
      const response = await this.client.get(userUri);
      return response.data.resource;
    } catch (error) {
      throw new ConnectorError("Failed to get Calendly user", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Event Types
  // ---------------------------------------------------------------------------
  async listEventTypes(params?: {
    active?: boolean;
    count?: number;
    page_token?: string;
    sort?: string;
    user_uri?: string;
  }): Promise<{
    collection: CalendlyEventType[];
    pagination: { count: number; next_page_token: string | null };
  }> {
    try {
      const userUri = params?.user_uri || (await this.ensureUserUri());
      const response = await this.client.get("/event_types", {
        params: {
          user: userUri,
          active: params?.active,
          count: params?.count || 20,
          page_token: params?.page_token,
          sort: params?.sort,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Calendly event types", error);
    }
  }

  async getEventType(eventTypeUri: string): Promise<CalendlyEventType> {
    try {
      const response = await this.client.get(eventTypeUri);
      return response.data.resource;
    } catch (error) {
      throw new ConnectorError("Failed to get Calendly event type", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Scheduled Events
  // ---------------------------------------------------------------------------
  async listScheduledEvents(
    params?: CalendlyListParams & { user_uri?: string; organization_uri?: string }
  ): Promise<{
    collection: CalendlyScheduledEvent[];
    pagination: { count: number; next_page_token: string | null };
  }> {
    try {
      const userUri = params?.user_uri || (await this.ensureUserUri());
      const response = await this.client.get("/scheduled_events", {
        params: {
          user: userUri,
          organization: params?.organization_uri,
          count: params?.count || 20,
          page_token: params?.page_token,
          sort: params?.sort || "start_time:asc",
          status: params?.status,
          min_start_time: params?.min_start_time,
          max_start_time: params?.max_start_time,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Calendly scheduled events", error);
    }
  }

  async getScheduledEvent(eventUri: string): Promise<CalendlyScheduledEvent> {
    try {
      const response = await this.client.get(eventUri);
      return response.data.resource;
    } catch (error) {
      throw new ConnectorError("Failed to get Calendly scheduled event", error);
    }
  }

  async cancelEvent(eventUri: string, reason?: string): Promise<void> {
    try {
      await this.client.post(`${eventUri}/cancellation`, {
        reason: reason || "Canceled via IntegrateWise",
      });
    } catch (error) {
      throw new ConnectorError("Failed to cancel Calendly event", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Invitees
  // ---------------------------------------------------------------------------
  async listInvitees(
    eventUri: string,
    params?: {
      count?: number;
      page_token?: string;
      sort?: string;
      status?: "active" | "canceled";
      email?: string;
    }
  ): Promise<{
    collection: CalendlyInvitee[];
    pagination: { count: number; next_page_token: string | null };
  }> {
    try {
      const response = await this.client.get(`${eventUri}/invitees`, {
        params: {
          count: params?.count || 20,
          page_token: params?.page_token,
          sort: params?.sort,
          status: params?.status,
          email: params?.email,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Calendly invitees", error);
    }
  }

  async getInvitee(inviteeUri: string): Promise<CalendlyInvitee> {
    try {
      const response = await this.client.get(inviteeUri);
      return response.data.resource;
    } catch (error) {
      throw new ConnectorError("Failed to get Calendly invitee", error);
    }
  }

  async markNoShow(inviteeUri: string): Promise<{ uri: string; created_at: string }> {
    try {
      const response = await this.client.post("/invitee_no_shows", { invitee: inviteeUri });
      return response.data.resource;
    } catch (error) {
      throw new ConnectorError("Failed to mark invitee as no-show", error);
    }
  }

  async unmarkNoShow(noShowUri: string): Promise<void> {
    try {
      await this.client.delete(noShowUri);
    } catch (error) {
      throw new ConnectorError("Failed to unmark no-show", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Webhook Subscriptions
  // ---------------------------------------------------------------------------
  async listWebhookSubscriptions(
    scope: "user" | "organization" = "user",
    params?: { count?: number; page_token?: string; sort?: string }
  ): Promise<{ collection: CalendlyWebhookSubscription[]; pagination: any }> {
    try {
      const scopeUri =
        scope === "organization" ? await this.ensureOrgUri() : await this.ensureUserUri();
      const response = await this.client.get("/webhook_subscriptions", {
        params: {
          organization: await this.ensureOrgUri(),
          scope,
          user: scope === "user" ? scopeUri : undefined,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Calendly webhook subscriptions", error);
    }
  }

  async createWebhookSubscription(
    callbackUrl: string,
    events: string[],
    scope: "user" | "organization" = "user",
    signingKey?: string
  ): Promise<CalendlyWebhookSubscription> {
    try {
      const orgUri = await this.ensureOrgUri();
      const userUri = scope === "user" ? await this.ensureUserUri() : undefined;
      const response = await this.client.post("/webhook_subscriptions", {
        url: callbackUrl,
        events,
        organization: orgUri,
        user: userUri,
        scope,
        signing_key: signingKey,
      });
      return response.data.resource;
    } catch (error) {
      throw new ConnectorError("Failed to create Calendly webhook subscription", error);
    }
  }

  async deleteWebhookSubscription(webhookUri: string): Promise<void> {
    try {
      await this.client.delete(webhookUri);
    } catch (error) {
      throw new ConnectorError("Failed to delete Calendly webhook subscription", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Availability
  // ---------------------------------------------------------------------------
  async listAvailabilitySchedules(
    userUri?: string
  ): Promise<{ collection: CalendlyAvailabilitySchedule[] }> {
    try {
      const uri = userUri || (await this.ensureUserUri());
      const response = await this.client.get("/user_availability_schedules", {
        params: { user: uri },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list availability schedules", error);
    }
  }

  async getAvailabilitySchedule(scheduleUri: string): Promise<CalendlyAvailabilitySchedule> {
    try {
      const response = await this.client.get(scheduleUri);
      return response.data.resource;
    } catch (error) {
      throw new ConnectorError("Failed to get availability schedule", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Organization
  // ---------------------------------------------------------------------------
  async listOrganizationMembers(params?: {
    count?: number;
    page_token?: string;
    email?: string;
  }): Promise<{
    collection: Array<{
      uri: string;
      role: string;
      user: CalendlyUser;
      created_at: string;
      updated_at: string;
    }>;
    pagination: any;
  }> {
    try {
      const orgUri = await this.ensureOrgUri();
      const response = await this.client.get("/organization_memberships", {
        params: { organization: orgUri, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list organization members", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  async getUpcomingEvents(days: number = 7): Promise<CalendlyScheduledEvent[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const result = await this.listScheduledEvents({
      status: "active",
      min_start_time: now.toISOString(),
      max_start_time: future.toISOString(),
      sort: "start_time:asc",
      count: 50,
    });
    return result.collection;
  }
}

export function createCalendlyConnector(config: CalendlyConfig): CalendlyConnector {
  return new CalendlyConnector(config);
}
