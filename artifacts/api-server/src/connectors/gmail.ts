/**
 * Gmail connector — @replit/connectors-sdk (google-mail)
 * Doctrine: never cache the client — tokens expire; create fresh on every call.
 */
import { ReplitConnectors } from "@replit/connectors-sdk";

function getConnectors() {
  return new ReplitConnectors();
}

export interface NormalizedEmail {
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

interface GmailMessageStub {
  id: string;
  threadId: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
}

function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string,
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: from, email: from };
}

export async function listInbox(maxResults = 20): Promise<NormalizedEmail[]> {
  const connectors = getConnectors();

  const listRes = await connectors.proxy(
    "google-mail",
    `/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=${maxResults}`,
    { method: "GET" },
  );

  const listData = (await listRes.json()) as {
    messages?: GmailMessageStub[];
    error?: { message: string };
  };

  if (listData.error) {
    throw new Error(`Gmail API: ${listData.error.message}`);
  }

  if (!listData.messages?.length) return [];

  const messages = await Promise.all(
    listData.messages.slice(0, maxResults).map(async ({ id }) => {
      const msgRes = await connectors.proxy(
        "google-mail",
        `/gmail/v1/users/me/messages/${id}?format=metadata` +
          `&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { method: "GET" },
      );
      return msgRes.json() as Promise<GmailMessage>;
    }),
  );

  return messages
    .filter(
      (msg) =>
        // Drop any responses that are error objects or missing core fields
        msg && msg.id && msg.internalDate,
    )
    .map((msg): NormalizedEmail => {
      const headers = msg.payload?.headers ?? [];
      const from = getHeader(headers, "from");
      const subject = getHeader(headers, "subject");
      const sender = parseSender(from);
      const isRead = !(msg.labelIds ?? []).includes("UNREAD");
      const isStarred = (msg.labelIds ?? []).includes("STARRED");

      return {
        id: msg.id,
        threadId: msg.threadId,
        sender_name: sender.name || sender.email,
        sender_email: sender.email,
        subject: subject || "(no subject)",
        preview: msg.snippet ?? "",
        received_at: new Date(Number(msg.internalDate)).toISOString(),
        is_read: isRead,
        is_starred: isStarred,
      };
    });
}
