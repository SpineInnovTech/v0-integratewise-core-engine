/**
 * Email domain facade — reads from the api-server relay which proxies Gmail
 * via the google-mail Replit connector.
 *
 * Source taxonomy: "local-relay" (the relay is live-connected to Gmail, not to
 * the Cloudflare platform gateway — that distinction is honest and correct).
 *
 * Doctrine: live-read at open; staleTime/gcTime 0; no silent fallback.
 */
import { useQuery } from "@tanstack/react-query";
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
}

export const GMAIL_INBOX_QUERY_KEY = ["email", "inbox", "gmail"] as const;

export function useGmailInbox(): DomainResource<GmailEmail[]> {
  const query = useQuery<GmailEmail[], Error>({
    queryKey: GMAIL_INBOX_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/email/inbox", { signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          (body as { message?: string }).message ?? `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return res.json() as Promise<GmailEmail[]>;
    },
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

  const emails = query.data ?? [];
  return {
    data: emails,
    source: "local-relay",
    state: emails.length > 0 ? "ready" : "empty",
  };
}
