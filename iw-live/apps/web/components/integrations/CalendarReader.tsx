"use client";

/**
 * Calendar Reader Component - Consent-based Integration
 * 
 * Client-side Google/Microsoft/Apple Calendar integration
 * Uses OAuth 2.0 browser flow with no server-side keys
 * Requires 'integrations.calendar.read' capability
 */

import { useState } from "react";

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees?: number;
  location?: string;
}

export default function CalendarReader() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [provider, setProvider] = useState<"google" | "microsoft" | "apple" | null>(null);

  const connectGoogle = async () => {
    setIsLoading(true);
    try {
      // Mock: In production, this would trigger OAuth 2.0 implicit/browser flow
      // const client = google.accounts.oauth2.initTokenClient({
      //   client_id: 'YOUR_CLIENT_ID',
      //   scope: 'https://www.googleapis.com/auth/calendar.readonly',
      //   callback: (tokenResponse) => { ... }
      // });
      // client.requestAccessToken();

      // Simulate OAuth flow and API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock calendar events
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          summary: "Team Standup",
          start: "2025-12-19T10:00:00",
          end: "2025-12-19T10:30:00",
          attendees: 5,
        },
        {
          id: "2",
          summary: "Client Kickoff - Project Alpha",
          start: "2025-12-19T14:00:00",
          end: "2025-12-19T15:00:00",
          attendees: 8,
          location: "Zoom",
        },
        {
          id: "3",
          summary: "Design Review",
          start: "2025-12-20T11:00:00",
          end: "2025-12-20T12:00:00",
          attendees: 4,
        },
      ];

      setEvents(mockEvents);
      setProvider("google");
      setIsConnected(true);
    } catch (error) {
      console.error("Google Calendar connection failed:", error);
      alert("Failed to connect to Google Calendar. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const connectMicrosoft = async () => {
    setIsLoading(true);
    try {
      // Mock: In production, this would use MSAL.js for Microsoft authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          summary: "Weekly Planning",
          start: "2025-12-19T09:00:00",
          end: "2025-12-19T10:00:00",
          attendees: 3,
        },
      ];

      setEvents(mockEvents);
      setProvider("microsoft");
      setIsConnected(true);
    } catch (error) {
      console.error("Microsoft Calendar connection failed:", error);
      alert("Failed to connect to Microsoft Calendar. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const connectApple = async () => {
    setIsLoading(true);
    try {
      // Mock: In production, this would use Sign in with Apple
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          summary: "Coffee Meeting",
          start: "2025-12-19T15:00:00",
          end: "2025-12-19T16:00:00",
        },
      ];

      setEvents(mockEvents);
      setProvider("apple");
      setIsConnected(true);
    } catch (error) {
      console.error("Apple Calendar connection failed:", error);
      alert("Failed to connect to Apple Calendar. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setEvents([]);
    setProvider(null);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Calendar Integration</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your calendar to see upcoming events
            </p>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
            Disconnected
          </span>
        </div>

        <div className="space-y-3">
          <button
            onClick={connectGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 border rounded-md px-4 py-3 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium">
              {isLoading && provider === null ? "Connecting..." : "Connect Google Calendar"}
            </span>
          </button>

          <button
            onClick={connectMicrosoft}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 border rounded-md px-4 py-3 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00A4EF">
              <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
            </svg>
            <span className="font-medium">Connect Microsoft Calendar</span>
          </button>

          <button
            onClick={connectApple}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 border rounded-md px-4 py-3 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span className="font-medium">Connect Apple Calendar</span>
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded text-xs text-muted-foreground">
          <strong>Privacy:</strong> Your calendar data stays on your device. 
          No server-side storage or API keys required.
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>Calendar</span>
            {provider && (
              <span className="text-xs px-2 py-1 bg-muted rounded">
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {events.length} event{events.length !== 1 ? "s" : ""} upcoming
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
            Connected
          </span>
          <button
            onClick={disconnect}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Disconnect
          </button>
        </div>
      </div>

      {events.length > 0 ? (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="border-l-2 border-blue-600 pl-3 py-2 bg-muted/30 rounded-r">
              <div className="font-medium text-sm">{event.summary}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                <span>{formatDate(event.start)} • {formatTime(event.start)} → {formatTime(event.end)}</span>
                {event.attendees && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {event.attendees}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No upcoming events</p>
      )}

      <button
        onClick={() => alert("Refresh calendar events")}
        className="mt-4 w-full text-sm text-blue-600 hover:underline"
      >
        Refresh Events
      </button>
    </div>
  );
}
