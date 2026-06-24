/**
 * Email domain facade — reads from the api-server relay which proxies Gmail
 * via the google-mail Replit connector.
 *
 * Source taxonomy: "local-relay" (the relay is live-connected to Gmail, not to
 * the Cloudflare platform gateway — that distinction is honest and correct).
 *
 * Doctrine: live-read at open; staleTime/gcTime 0; no silent fallback.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { DomainResource } from "./data-source";

export interface GmailEmail {
  id: string;
  threadId: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  preview: string;
  received_at: string;
  is_read: boolean;
  is_starred: boolean;
  labelIds: string[];
}

export interface GmailFullMessage extends GmailEmail {
  to: string;
  cc: string;
  date: string;
  body_text: string;
  body_html: string;
  messageIdHeader: string;
  references: string;
}

export interface GmailThread {
  id: string;
  messages: GmailFullMessage[];
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface InboxPage {
  emails: GmailEmail[];
  nextPageToken: string | null;
  resultSizeEstimate: number;
}

export interface SendEmailPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export const GMAIL_INBOX_QUERY_KEY = ["email", "inbox", "gmail"] as const;

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { message?: string }).message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

function buildInboxUrl(params: {
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
  q?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.maxResults) sp.set("maxResults", String(params.maxResults));
  if (params.pageToken) sp.set("pageToken", params.pageToken);
  if (params.labelIds?.length) sp.set("labelIds", params.labelIds.join(","));
  if (params.q) sp.set("q", params.q);
  const base = params.q ? "/api/email/search" : "/api/email/inbox";
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Dashboard widget read — the latest inbox messages as a flat list.
 */
export function useGmailInbox(): DomainResource<GmailEmail[]> {
  const query = useQuery<InboxPage, Error>({
    queryKey: GMAIL_INBOX_QUERY_KEY,
    queryFn: ({ signal }) =>
      getJson<InboxPage>(buildInboxUrl({ maxResults: 20 }), signal),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  if (query.isPending) {
    return { data: null, source: "local-relay", state: "loading" };
  }
  if (query.isError) {
    return {
      data: null,
      source: "local-relay",
      state: "error",
      error: query.error.message,
    };
  }

  const emails = query.data?.emails ?? [];
  return {
    data: emails,
    source: "local-relay",
    state: emails.length > 0 ? "ready" : "empty",
  };
}

/**
 * Full email workspace read — paginated and filterable by Gmail label / query.
 * Returns the React Query result directly so the view can drive pagination via
 * pageToken and surface load/error state honestly.
 */
export function useGmailMessages(params: {
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
  q?: string;
}) {
  return useQuery<InboxPage, Error>({
    queryKey: [
      "email",
      "messages",
      params.labelIds ?? null,
      params.q ?? null,
      params.pageToken ?? null,
    ],
    queryFn: ({ signal }) => getJson<InboxPage>(buildInboxUrl(params), signal),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    retry: false,
    placeholderData: (prev) => prev,
  });
}

export function useGmailMessage(id: string | null) {
  return useQuery<GmailFullMessage, Error>({
    queryKey: ["email", "message", id],
    queryFn: ({ signal }) =>
      getJson<GmailFullMessage>(`/api/email/messages/${id}`, signal),
    enabled: Boolean(id),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}

export function useGmailThread(threadId: string | null) {
  return useQuery<GmailThread, Error>({
    queryKey: ["email", "thread", threadId],
    queryFn: ({ signal }) =>
      getJson<GmailThread>(`/api/email/threads/${threadId}`, signal),
    enabled: Boolean(threadId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}

export function useGmailLabels() {
  return useQuery<GmailLabel[], Error>({
    queryKey: ["email", "labels"],
    queryFn: ({ signal }) => getJson<GmailLabel[]>("/api/email/labels", signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * Send an outbound message through the relay's gmail.send capability. The view
 * routes every call through the GovernanceGate first — a human approves each
 * outbound message before this mutation fires. Surfaces real errors honestly.
 */
export function useSendEmail() {
  const queryClient = useQueryClient();
  return useMutation<
    { id: string; threadId: string; labelIds: string[] },
    Error,
    SendEmailPayload
  >({
    mutationFn: async (payload) => {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message ?? `HTTP ${res.status}`,
        );
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GMAIL_INBOX_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["email", "messages"] });
      void queryClient.invalidateQueries({ queryKey: ["email", "thread"] });
    },
  });
}
