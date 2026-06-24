/**
 * Gmail connector — @replit/connectors-sdk (google-mail)
 * Doctrine: never cache the client — tokens expire; create fresh on every call.
 *
 * Granted scopes: gmail.readonly, gmail.send, gmail.labels.
 * NOT granted (build send-ready but gated, never faked): gmail.modify (mark
 * read / archive / label messages), gmail.settings.basic (server-side filters).
 */
import { ReplitConnectors } from "@replit/connectors-sdk";

function getConnectors() {
  return new ReplitConnectors();
}

const GMAIL_BASE = "/gmail/v1/users/me";

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
  labelIds: string[];
}

export interface InboxPage {
  emails: NormalizedEmail[];
  nextPageToken: string | null;
  resultSizeEstimate: number;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface GmailFullMessage extends NormalizedEmail {
  to: string;
  cc: string;
  date: string;
  body_text: string;
  body_html: string;
  /** RFC822 Message-ID header — used to thread replies (In-Reply-To). */
  messageIdHeader: string;
  references: string;
}

export interface SendEmailInput {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  /** Gmail thread id — set on reply/reply-all so the message stays in-thread. */
  threadId?: string;
  /** RFC822 Message-ID of the message being replied to. */
  inReplyTo?: string;
  /** RFC822 References chain. */
  references?: string;
}

export interface SendEmailResult {
  id: string;
  threadId: string;
  labelIds: string[];
}

interface GmailMessageStub {
  id: string;
  threadId: string;
}

interface GmailPayloadPart {
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: { data?: string; size?: number };
  parts?: GmailPayloadPart[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: GmailPayloadPart;
  error?: { message: string };
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
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  return { name: from, email: from };
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Walk the MIME tree collecting the first text/plain and text/html bodies. */
function extractBodies(part: GmailPayloadPart | undefined): {
  text: string;
  html: string;
} {
  let text = "";
  let html = "";

  const walk = (p?: GmailPayloadPart) => {
    if (!p) return;
    const mime = p.mimeType ?? "";
    if (p.body?.data) {
      if (mime === "text/plain" && !text) text = decodeBase64Url(p.body.data);
      else if (mime === "text/html" && !html) html = decodeBase64Url(p.body.data);
    }
    p.parts?.forEach(walk);
  };

  walk(part);
  return { text, html };
}

function normalize(msg: GmailMessage): NormalizedEmail {
  const headers = msg.payload?.headers ?? [];
  const from = getHeader(headers, "from");
  const subject = getHeader(headers, "subject");
  const sender = parseSender(from);
  const labelIds = msg.labelIds ?? [];

  return {
    id: msg.id,
    threadId: msg.threadId,
    sender_name: sender.name || sender.email,
    sender_email: sender.email,
    subject: subject || "(no subject)",
    preview: msg.snippet ?? "",
    received_at: msg.internalDate
      ? new Date(Number(msg.internalDate)).toISOString()
      : new Date().toISOString(),
    is_read: !labelIds.includes("UNREAD"),
    is_starred: labelIds.includes("STARRED"),
    labelIds,
  };
}

/**
 * Paginated, filterable message list. Accepts Gmail label ids and/or a free-text
 * `q` query (the same syntax as the Gmail search box).
 */
export async function listMessages(opts: {
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
  q?: string;
} = {}): Promise<InboxPage> {
  const connectors = getConnectors();
  const { maxResults = 25, pageToken, labelIds, q } = opts;

  const params = new URLSearchParams();
  params.set("maxResults", String(maxResults));
  if (pageToken) params.set("pageToken", pageToken);
  if (q) params.set("q", q);
  (labelIds && labelIds.length ? labelIds : q ? [] : ["INBOX"]).forEach((l) =>
    params.append("labelIds", l),
  );

  const listRes = await connectors.proxy(
    "google-mail",
    `${GMAIL_BASE}/messages?${params.toString()}`,
    { method: "GET" },
  );

  const listData = (await listRes.json()) as {
    messages?: GmailMessageStub[];
    nextPageToken?: string;
    resultSizeEstimate?: number;
    error?: { message: string };
  };

  if (listData.error) {
    throw new Error(`Gmail API: ${listData.error.message}`);
  }

  if (!listData.messages?.length) {
    return {
      emails: [],
      nextPageToken: listData.nextPageToken ?? null,
      resultSizeEstimate: listData.resultSizeEstimate ?? 0,
    };
  }

  const messages = await Promise.all(
    listData.messages.map(async ({ id }) => {
      const msgRes = await connectors.proxy(
        "google-mail",
        `${GMAIL_BASE}/messages/${id}?format=metadata` +
          `&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { method: "GET" },
      );
      return msgRes.json() as Promise<GmailMessage>;
    }),
  );

  const emails = messages
    .filter((msg) => msg && msg.id && msg.internalDate)
    .map(normalize);

  return {
    emails,
    nextPageToken: listData.nextPageToken ?? null,
    resultSizeEstimate: listData.resultSizeEstimate ?? emails.length,
  };
}

/** Back-compat helper used by the Home dashboard widget. */
export async function listInbox(maxResults = 20): Promise<NormalizedEmail[]> {
  const { emails } = await listMessages({ maxResults });
  return emails;
}

function toFullMessage(msg: GmailMessage): GmailFullMessage {
  const base = normalize(msg);
  const headers = msg.payload?.headers ?? [];
  const { text, html } = extractBodies(msg.payload);
  return {
    ...base,
    to: getHeader(headers, "to"),
    cc: getHeader(headers, "cc"),
    date: getHeader(headers, "date"),
    body_text: text,
    body_html: html,
    messageIdHeader: getHeader(headers, "message-id"),
    references: getHeader(headers, "references"),
  };
}

/** Fetch a single message with its full body. */
export async function getMessage(id: string): Promise<GmailFullMessage> {
  const connectors = getConnectors();
  const res = await connectors.proxy(
    "google-mail",
    `${GMAIL_BASE}/messages/${id}?format=full`,
    { method: "GET" },
  );
  const msg = (await res.json()) as GmailMessage;
  if (msg.error) throw new Error(`Gmail API: ${msg.error.message}`);
  return toFullMessage(msg);
}

/** Fetch a full thread (all messages, oldest → newest, with bodies). */
export async function getThread(threadId: string): Promise<{
  id: string;
  messages: GmailFullMessage[];
}> {
  const connectors = getConnectors();
  const res = await connectors.proxy(
    "google-mail",
    `${GMAIL_BASE}/threads/${threadId}?format=full`,
    { method: "GET" },
  );
  const data = (await res.json()) as {
    id: string;
    messages?: GmailMessage[];
    error?: { message: string };
  };
  if (data.error) throw new Error(`Gmail API: ${data.error.message}`);
  return {
    id: data.id,
    messages: (data.messages ?? []).map(toFullMessage),
  };
}

/** List label definitions (the taxonomy used for triage views). */
export async function listLabels(): Promise<GmailLabel[]> {
  const connectors = getConnectors();
  const res = await connectors.proxy("google-mail", `${GMAIL_BASE}/labels`, {
    method: "GET",
  });
  const data = (await res.json()) as {
    labels?: GmailLabel[];
    error?: { message: string };
  };
  if (data.error) throw new Error(`Gmail API: ${data.error.message}`);
  return data.labels ?? [];
}

function buildMime(input: SendEmailInput): string {
  const lines: string[] = [];
  lines.push(`To: ${input.to}`);
  if (input.cc) lines.push(`Cc: ${input.cc}`);
  if (input.bcc) lines.push(`Bcc: ${input.bcc}`);
  lines.push(`Subject: ${input.subject}`);
  if (input.inReplyTo) lines.push(`In-Reply-To: ${input.inReplyTo}`);
  if (input.references) lines.push(`References: ${input.references}`);
  lines.push("MIME-Version: 1.0");
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  lines.push("Content-Transfer-Encoding: 7bit");
  lines.push("");
  lines.push(input.body);
  return lines.join("\r\n");
}

/**
 * Send an outbound message via the granted gmail.send scope. Reply/reply-all/
 * forward awareness comes from the caller setting threadId + In-Reply-To +
 * References. Surfaces real Gmail errors honestly — no fake success.
 */
export async function sendMessage(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const connectors = getConnectors();
  const raw = encodeBase64Url(buildMime(input));

  const body: { raw: string; threadId?: string } = { raw };
  if (input.threadId) body.threadId = input.threadId;

  const res = await connectors.proxy(
    "google-mail",
    `${GMAIL_BASE}/messages/send`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await res.json()) as {
    id?: string;
    threadId?: string;
    labelIds?: string[];
    error?: { message: string };
  };

  if (!res.ok || data.error) {
    throw new Error(
      `Gmail send failed: ${data.error?.message ?? `HTTP ${res.status}`}`,
    );
  }

  return {
    id: data.id ?? "",
    threadId: data.threadId ?? "",
    labelIds: data.labelIds ?? [],
  };
}
