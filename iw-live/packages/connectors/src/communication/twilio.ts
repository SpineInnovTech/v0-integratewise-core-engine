import axios, { AxiosInstance } from "axios";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface TwilioConfig extends ConnectorConfig {
  accountSid: string;
  authToken: string;
  baseUrl?: string;
}

export interface TwilioMessage {
  sid: string;
  account_sid: string;
  from: string;
  to: string;
  body: string;
  status: string;
  direction: string;
  date_created: string;
  date_updated: string;
  date_sent?: string;
  price?: string;
  price_unit?: string;
  error_code?: string;
  error_message?: string;
}

export interface TwilioCall {
  sid: string;
  account_sid: string;
  from: string;
  to: string;
  status: string;
  direction: string;
  duration?: string;
  price?: string;
  price_unit?: string;
  date_created: string;
  date_updated: string;
  start_time?: string;
  end_time?: string;
}

export interface TwilioPhoneNumber {
  sid: string;
  account_sid: string;
  friendly_name: string;
  phone_number: string;
  sms_url?: string;
  voice_url?: string;
  status_callback?: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
    fax: boolean;
  };
  date_created: string;
  date_updated: string;
}

export class TwilioConnector extends BaseConnector {
  private client: AxiosInstance;
  protected override config: TwilioConfig;

  constructor(config: TwilioConfig) {
    super(config);
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl || `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}`,
      timeout: 30000,
      auth: {
        username: config.accountSid,
        password: config.authToken,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401)
          throw new ConnectorError("Twilio authentication failed", error);
        if (error.response?.status === 403)
          throw new ConnectorError("Twilio permission denied", error);
        if (error.response?.status === 404)
          throw new ConnectorError("Twilio resource not found", error);
        if (error.response?.status === 429)
          throw new ConnectorError("Twilio rate limit exceeded", error);
        throw new ConnectorError(
          `Twilio API error: ${error.response?.data?.message || error.message}`,
          error
        );
      }
    );
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "twilio",
      name: "Twilio",
      version: "1.0.0",
      apiVersion: "2010-04-01",
      capabilities: { sync: true, webhooks: true, dataVelocity: "high" },
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get(".json");
      return true;
    } catch {
      return false;
    }
  }

  async getAccount(): Promise<any> {
    try {
      const response = await this.client.get(".json");
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Twilio account", error);
    }
  }

  async getMessages(params?: {
    PageSize?: number;
    Page?: number;
    DateSent?: string;
  }): Promise<{ messages: TwilioMessage[]; next_page_uri?: string }> {
    try {
      const response = await this.client.get("/Messages.json", {
        params: {
          PageSize: params?.PageSize || 100,
          Page: params?.Page || 0,
          DateSent: params?.DateSent,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Twilio messages", error);
    }
  }

  async getMessage(messageSid: string): Promise<TwilioMessage> {
    try {
      const response = await this.client.get(`/Messages/${messageSid}.json`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Twilio message ${messageSid}`, error);
    }
  }

  async sendMessage(params: { To: string; From: string; Body: string }): Promise<TwilioMessage> {
    try {
      const response = await this.client.post(
        "/Messages.json",
        new URLSearchParams({
          To: params.To,
          From: params.From,
          Body: params.Body,
        })
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to send Twilio message", error);
    }
  }

  async getCalls(params?: {
    PageSize?: number;
    Page?: number;
    StartTime?: string;
  }): Promise<{ calls: TwilioCall[]; next_page_uri?: string }> {
    try {
      const response = await this.client.get("/Calls.json", {
        params: {
          PageSize: params?.PageSize || 100,
          Page: params?.Page || 0,
          StartTime: params?.StartTime,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Twilio calls", error);
    }
  }

  async getCall(callSid: string): Promise<TwilioCall> {
    try {
      const response = await this.client.get(`/Calls/${callSid}.json`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Twilio call ${callSid}`, error);
    }
  }

  async makeCall(params: { To: string; From: string; Url: string }): Promise<TwilioCall> {
    try {
      const response = await this.client.post(
        "/Calls.json",
        new URLSearchParams({
          To: params.To,
          From: params.From,
          Url: params.Url,
        })
      );
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to make Twilio call", error);
    }
  }

  async getPhoneNumbers(params?: {
    PageSize?: number;
    Page?: number;
  }): Promise<{ incoming_phone_numbers: TwilioPhoneNumber[]; next_page_uri?: string }> {
    try {
      const response = await this.client.get("/IncomingPhoneNumbers.json", {
        params: {
          PageSize: params?.PageSize || 100,
          Page: params?.Page || 0,
        },
      });
      return response.data;
    } catch (error) {
      throw new ConnectorError("Failed to fetch Twilio phone numbers", error);
    }
  }

  async getPhoneNumber(phoneNumberSid: string): Promise<TwilioPhoneNumber> {
    try {
      const response = await this.client.get(`/IncomingPhoneNumbers/${phoneNumberSid}.json`);
      return response.data;
    } catch (error) {
      throw new ConnectorError(`Failed to fetch Twilio phone number ${phoneNumberSid}`, error);
    }
  }
}

export function createTwilioConnector(config: TwilioConfig): TwilioConnector {
  return new TwilioConnector(config);
}
