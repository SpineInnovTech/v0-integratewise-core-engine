import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

// ============================================================================
// Zoom Connector — Zoom Server-to-Server OAuth / OAuth API v2
// Real connection → Creamy load → Delayed full load → Delta load
// ============================================================================

export interface ZoomConfig extends ConnectorConfig {
  accessToken: string; // OAuth access token (Server-to-Server or User-managed)
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Response Types
// ---------------------------------------------------------------------------
export interface ZoomUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: number; // 1=Basic, 2=Licensed, 3=On-prem
  status: "active" | "inactive" | "pending";
  pmi?: number;
  timezone?: string;
  dept?: string;
  created_at: string;
  last_login_time?: string;
  role_name?: string;
  language?: string;
  pic_url?: string;
  verified?: number;
}

export interface ZoomMeeting {
  id: number;
  uuid: string;
  topic: string;
  type: number; // 1=instant, 2=scheduled, 3=recurring-nofixed, 8=recurring-fixed
  start_time?: string;
  duration?: number; // in minutes
  timezone?: string;
  status: "waiting" | "started";
  created_at: string;
  start_url?: string;
  join_url: string;
  password?: string;
  host_id: string;
  agenda?: string;
  settings?: ZoomMeetingSettings;
}

export interface ZoomMeetingSettings {
  host_video?: boolean;
  participant_video?: boolean;
  cn_meeting?: boolean;
  in_meeting?: boolean;
  join_before_host?: boolean;
  mute_upon_entry?: boolean;
  auto_recording?: "local" | "cloud" | "none";
  waiting_room?: boolean;
}

export interface ZoomRecording {
  id: string;
  uuid: string;
  meeting_id: number;
  topic: string;
  start_time: string;
  duration: number;
  total_size: number;
  recording_count: number;
  host_id: string;
  host_email: string;
  recording_files: Array<{
    id: string;
    meeting_id: string;
    recording_start: string;
    recording_end: string;
    file_type: string;
    file_size: number;
    status: string;
    download_url: string;
    play_url?: string;
    recording_type: string;
  }>;
}

export interface ZoomWebinar {
  id: number;
  uuid: string;
  topic: string;
  type: number;
  start_time?: string;
  duration?: number;
  timezone?: string;
  created_at: string;
  join_url: string;
  host_id: string;
  agenda?: string;
}

export interface ZoomMeetingParticipant {
  id: string;
  name: string;
  user_email?: string;
  join_time: string;
  leave_time?: string;
  duration?: number;
  status?: string;
}

export interface ZoomPaginatedResponse<T> {
  page_count?: number;
  page_number?: number;
  page_size: number;
  total_records: number;
  next_page_token?: string;
  items?: T[];
  [key: string]: any;
}

export class ZoomConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: ZoomConfig;

  constructor(config: ZoomConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.zoom.us/v2",
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
        const msg = error.response?.data?.message || error.message;
        const code = error.response?.data?.code;
        if (status === 401) throw new ConnectorError("Invalid or expired Zoom access token", error);
        if (status === 403) throw new ConnectorError(`Zoom permission denied: ${msg}`, error);
        if (status === 404) throw new ConnectorError(`Zoom resource not found: ${msg}`, error);
        if (status === 429) {
          const retryAfter = error.response?.headers?.["retry-after"];
          throw new ConnectorError(
            `Zoom rate limit exceeded. Retry after ${retryAfter}s (code: ${code})`,
            error
          );
        }
        throw new ConnectorError(`Zoom API error: ${msg}`, error);
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "zoom",
      name: "Zoom",
      version: "1.0.0",
      apiVersion: "v2",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/users/me");
      return response.status === 200 && !!response.data.id;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  async getMe(): Promise<ZoomUser> {
    try {
      const response = await this.client.get("/users/me");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get current Zoom user", error);
    }
  }

  async getUsers(params?: {
    status?: "active" | "inactive" | "pending";
    page_size?: number;
    page_number?: number;
    next_page_token?: string;
    role_id?: string;
  }): Promise<ZoomPaginatedResponse<ZoomUser> & { users: ZoomUser[] }> {
    try {
      const response = await this.client.get("/users", {
        params: { status: "active", page_size: 300, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to list Zoom users", error);
    }
  }

  async getUser(userId: string): Promise<ZoomUser> {
    try {
      const response = await this.client.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get Zoom user ${userId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Meetings
  // ---------------------------------------------------------------------------
  async getMeetings(
    userId: string = "me",
    params?: {
      type?: string;
      page_size?: number;
      next_page_token?: string;
      from?: string;
      to?: string;
    }
  ): Promise<ZoomPaginatedResponse<ZoomMeeting> & { meetings: ZoomMeeting[] }> {
    try {
      const response = await this.client.get(`/users/${userId}/meetings`, {
        params: { type: "scheduled", page_size: 30, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list meetings for user ${userId}`, error);
    }
  }

  async getMeeting(meetingId: number | string): Promise<ZoomMeeting> {
    try {
      const response = await this.client.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get meeting ${meetingId}`, error);
    }
  }

  async createMeeting(
    userId: string = "me",
    data: {
      topic: string;
      type?: number;
      start_time?: string;
      duration?: number;
      timezone?: string;
      agenda?: string;
      settings?: Partial<ZoomMeetingSettings>;
    }
  ): Promise<ZoomMeeting> {
    try {
      const response = await this.client.post(`/users/${userId}/meetings`, {
        type: 2,
        ...data,
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to create Zoom meeting", error);
    }
  }

  async updateMeeting(
    meetingId: number | string,
    data: Partial<{
      topic: string;
      type: number;
      start_time: string;
      duration: number;
      timezone: string;
      agenda: string;
      settings: Partial<ZoomMeetingSettings>;
    }>
  ): Promise<void> {
    try {
      await this.client.patch(`/meetings/${meetingId}`, data);
    } catch (error) {
      throw new ConnectorError(`Failed to update meeting ${meetingId}`, error);
    }
  }

  async deleteMeeting(meetingId: number | string): Promise<void> {
    try {
      await this.client.delete(`/meetings/${meetingId}`);
    } catch (error) {
      throw new ConnectorError(`Failed to delete meeting ${meetingId}`, error);
    }
  }

  async getMeetingParticipants(
    meetingId: number | string,
    params?: { page_size?: number; next_page_token?: string }
  ): Promise<
    ZoomPaginatedResponse<ZoomMeetingParticipant> & { participants: ZoomMeetingParticipant[] }
  > {
    try {
      const response = await this.client.get(`/past_meetings/${meetingId}/participants`, {
        params: { page_size: 30, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get participants for meeting ${meetingId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Recordings
  // ---------------------------------------------------------------------------
  async getRecordings(
    userId: string = "me",
    params?: { from?: string; to?: string; page_size?: number; next_page_token?: string }
  ): Promise<ZoomPaginatedResponse<ZoomRecording> & { meetings: ZoomRecording[] }> {
    try {
      const from =
        params?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const to = params?.to || new Date().toISOString().slice(0, 10);
      const response = await this.client.get(`/users/${userId}/recordings`, {
        params: {
          from,
          to,
          page_size: params?.page_size || 30,
          next_page_token: params?.next_page_token,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get recordings for user ${userId}`, error);
    }
  }

  async getMeetingRecordings(meetingId: number | string): Promise<ZoomRecording> {
    try {
      const response = await this.client.get(`/meetings/${meetingId}/recordings`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to get recordings for meeting ${meetingId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Webinars
  // ---------------------------------------------------------------------------
  async getWebinars(
    userId: string = "me",
    params?: { page_size?: number; next_page_token?: string }
  ): Promise<ZoomPaginatedResponse<ZoomWebinar> & { webinars: ZoomWebinar[] }> {
    try {
      const response = await this.client.get(`/users/${userId}/webinars`, {
        params: { page_size: 30, ...params },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to list webinars for user ${userId}`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Dashboard / Reports (admin)
  // ---------------------------------------------------------------------------
  async getDashboardMeetings(params?: {
    from?: string;
    to?: string;
    type?: string;
    page_size?: number;
    next_page_token?: string;
  }): Promise<any> {
    try {
      const from =
        params?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const to = params?.to || new Date().toISOString().slice(0, 10);
      const response = await this.client.get("/metrics/meetings", {
        params: {
          from,
          to,
          type: params?.type || "past",
          page_size: params?.page_size || 30,
          next_page_token: params?.next_page_token,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to get dashboard meetings", error);
    }
  }
}

export function createZoomConnector(config: ZoomConfig): ZoomConnector {
  return new ZoomConnector(config);
}
