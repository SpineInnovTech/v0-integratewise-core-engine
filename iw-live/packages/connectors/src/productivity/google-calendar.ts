import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Google Calendar Connector — Google Calendar API v3
// ============================================================================

export interface GoogleCalendarConfig extends ConnectorConfig {
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
}

export interface CalendarEvent {
  id: string;
  status: "confirmed" | "tentative" | "cancelled";
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  recurrence?: string[];
  attendees?: CalendarAttendee[];
  organizer?: { email: string; displayName?: string; self?: boolean };
  creator?: { email: string; displayName?: string };
  htmlLink: string;
  created: string;
  updated: string;
  reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> };
  conferenceData?: any;
  hangoutLink?: string;
  colorId?: string;
  visibility?: "default" | "public" | "private" | "confidential";
  transparency?: "opaque" | "transparent";
}

export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus: "needsAction" | "declined" | "tentative" | "accepted";
  optional?: boolean;
  organizer?: boolean;
  self?: boolean;
  comment?: string;
}

export interface CalendarInfo {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
  primary?: boolean;
  accessRole: "freeBusyReader" | "reader" | "writer" | "owner";
}

export interface CalendarListParams {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  q?: string;
  singleEvents?: boolean;
  orderBy?: "startTime" | "updated";
  maxResults?: number;
  pageToken?: string;
  timeZone?: string;
  showDeleted?: boolean;
  updatedMin?: string;
}

export interface FreeBusyRequest {
  timeMin: string;
  timeMax: string;
  timeZone?: string;
  items: Array<{ id: string }>;
}

export class GoogleCalendarConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: GoogleCalendarConfig;

  constructor(config: GoogleCalendarConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://www.googleapis.com/calendar/v3",
      timeout: 15000,
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
          throw new ConnectorError("Google Calendar permission denied", error);
        if (error.response?.status === 404)
          throw new ConnectorError("Google Calendar resource not found", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Google Calendar rate limit exceeded", error);
        throw new ConnectorError(
          `Google Calendar API error: ${error.response?.data?.error?.message || error.message}`,
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
      id: "google-calendar",
      name: "Google Calendar",
      version: "1.0.0",
      apiVersion: "v3",
      capabilities: { sync: true, webhooks: true },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get("/calendars/primary");
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Calendar List
  // ---------------------------------------------------------------------------
  async listCalendars(params?: {
    minAccessRole?: string;
    showHidden?: boolean;
    pageToken?: string;
  }): Promise<{ items: CalendarInfo[]; nextPageToken?: string }> {
    try {
      const response = await this.client.get("/users/me/calendarList", { params });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list calendars", error);
    }
  }

  async getCalendar(calendarId: string = "primary"): Promise<CalendarInfo> {
    try {
      const response = await this.client.get(`/calendars/${encodeURIComponent(calendarId)}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get calendar ${calendarId}`, error);
    }
  }

  async createCalendar(
    summary: string,
    options?: { description?: string; timeZone?: string }
  ): Promise<CalendarInfo> {
    try {
      const response = await this.client.post("/calendars", { summary, ...options });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create calendar", error);
    }
  }

  async deleteCalendar(calendarId: string): Promise<void> {
    try {
      await this.client.delete(`/calendars/${encodeURIComponent(calendarId)}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete calendar ${calendarId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  async listEvents(
    params?: CalendarListParams
  ): Promise<{ items: CalendarEvent[]; nextPageToken?: string; nextSyncToken?: string }> {
    try {
      const calendarId = params?.calendarId || "primary";
      const { calendarId: _, ...queryParams } = params || {};
      const response = await this.client.get(
        `/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          params: { maxResults: 250, singleEvents: true, orderBy: "startTime", ...queryParams },
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list calendar events", error);
    }
  }

  async getEvent(eventId: string, calendarId: string = "primary"): Promise<CalendarEvent> {
    try {
      const response = await this.client.get(
        `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get event ${eventId}`, error);
    }
  }

  async createEvent(
    event: {
      summary: string;
      description?: string;
      location?: string;
      start: { dateTime?: string; date?: string; timeZone?: string };
      end: { dateTime?: string; date?: string; timeZone?: string };
      attendees?: Array<{ email: string; optional?: boolean }>;
      recurrence?: string[];
      reminders?: any;
      conferenceDataVersion?: number;
      visibility?: string;
      colorId?: string;
    },
    calendarId: string = "primary",
    sendUpdates: "all" | "externalOnly" | "none" = "none"
  ): Promise<CalendarEvent> {
    try {
      const response = await this.client.post(
        `/calendars/${encodeURIComponent(calendarId)}/events`,
        event,
        { params: { sendUpdates } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create calendar event", error);
    }
  }

  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>,
    calendarId: string = "primary",
    sendUpdates: "all" | "externalOnly" | "none" = "none"
  ): Promise<CalendarEvent> {
    try {
      const response = await this.client.patch(
        `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        updates,
        { params: { sendUpdates } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to update event ${eventId}`, error);
    }
  }

  async deleteEvent(
    eventId: string,
    calendarId: string = "primary",
    sendUpdates: "all" | "externalOnly" | "none" = "none"
  ): Promise<void> {
    try {
      await this.client.delete(`/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
        params: { sendUpdates },
      });
    } catch (error) {
      throw new ConnectorError(`Failed to delete event ${eventId}`, error);
    }
  }

  async moveEvent(
    eventId: string,
    destinationCalendarId: string,
    sourceCalendarId: string = "primary"
  ): Promise<CalendarEvent> {
    try {
      const response = await this.client.post(
        `/calendars/${encodeURIComponent(sourceCalendarId)}/events/${eventId}/move`,
        null,
        { params: { destination: destinationCalendarId } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to move event ${eventId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Quick Add (natural language event creation)
  // ---------------------------------------------------------------------------
  async quickAdd(text: string, calendarId: string = "primary"): Promise<CalendarEvent> {
    try {
      const response = await this.client.post(
        `/calendars/${encodeURIComponent(calendarId)}/events/quickAdd`,
        null,
        { params: { text } }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to quick-add calendar event", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Event Instances (recurring events)
  // ---------------------------------------------------------------------------
  async listEventInstances(
    eventId: string,
    calendarId: string = "primary",
    params?: { timeMin?: string; timeMax?: string; maxResults?: number }
  ): Promise<{ items: CalendarEvent[] }> {
    try {
      const response = await this.client.get(
        `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}/instances`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list instances of event ${eventId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Free/Busy
  // ---------------------------------------------------------------------------
  async queryFreeBusy(
    request: FreeBusyRequest
  ): Promise<Record<string, { busy: Array<{ start: string; end: string }> }>> {
    try {
      const response = await this.client.post("/freeBusy", request);
      return response.data.calendars;
    } catch (error) {
      throw new ConnectorError("Failed to query free/busy", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Watch (push notifications)
  // ---------------------------------------------------------------------------
  async watchEvents(
    calendarId: string,
    channel: { id: string; address: string; expiration?: number }
  ): Promise<{ resourceId: string; expiration: string }> {
    try {
      const response = await this.client.post(
        `/calendars/${encodeURIComponent(calendarId)}/events/watch`,
        {
          id: channel.id,
          type: "web_hook",
          address: channel.address,
          expiration: channel.expiration,
        }
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to watch calendar ${calendarId}`, error);
    }
  }

  async stopChannel(channelId: string, resourceId: string): Promise<void> {
    try {
      await this.client.post("/channels/stop", { id: channelId, resourceId });
    } catch (error) {
      throw new ConnectorError(`Failed to stop watch channel ${channelId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Incremental sync
  // ---------------------------------------------------------------------------
  async syncEvents(
    syncToken: string,
    calendarId: string = "primary"
  ): Promise<{
    items: CalendarEvent[];
    nextSyncToken?: string;
    nextPageToken?: string;
  }> {
    try {
      const response = await this.client.get(
        `/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          params: { syncToken },
        }
      );
      return response.data;
    } catch (error: any) {
      // 410 Gone means sync token expired, need full sync
      if (error.response?.status === 410) {
        throw new ConnectorError("Sync token expired, full sync required", error);
      }
      throw new ConnectorError("Failed to sync calendar events", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  async getUpcomingEvents(
    hours: number = 24,
    calendarId: string = "primary"
  ): Promise<CalendarEvent[]> {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const result = await this.listEvents({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });
    return result.items || [];
  }

  async findAvailableSlots(
    calendarIds: string[],
    timeMin: string,
    timeMax: string,
    durationMinutes: number = 30
  ): Promise<Array<{ start: string; end: string }>> {
    const busy = await this.queryFreeBusy({
      timeMin,
      timeMax,
      items: calendarIds.map((id) => ({ id })),
    });
    // Merge all busy slots
    const allBusy: Array<{ start: number; end: number }> = [];
    for (const cal of Object.values(busy)) {
      for (const slot of cal.busy) {
        allBusy.push({ start: new Date(slot.start).getTime(), end: new Date(slot.end).getTime() });
      }
    }
    allBusy.sort((a, b) => a.start - b.start);

    // Find gaps
    const slots: Array<{ start: string; end: string }> = [];
    let cursor = new Date(timeMin).getTime();
    const endTime = new Date(timeMax).getTime();
    const durationMs = durationMinutes * 60 * 1000;

    for (const busy of allBusy) {
      if (busy.start - cursor >= durationMs) {
        slots.push({
          start: new Date(cursor).toISOString(),
          end: new Date(busy.start).toISOString(),
        });
      }
      cursor = Math.max(cursor, busy.end);
    }
    if (endTime - cursor >= durationMs) {
      slots.push({ start: new Date(cursor).toISOString(), end: new Date(endTime).toISOString() });
    }
    return slots;
  }
}

export function createGoogleCalendarConnector(
  config: GoogleCalendarConfig
): GoogleCalendarConnector {
  return new GoogleCalendarConnector(config);
}
