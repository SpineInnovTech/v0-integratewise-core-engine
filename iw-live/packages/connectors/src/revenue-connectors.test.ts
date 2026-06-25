import { describe, expect, it, vi } from "vitest";
import { SalesforceConnector } from "./crm/salesforce";
import { HubSpotConnector } from "./crm/hubspot";
import { StripeConnector } from "./accounting/stripe";
import { GmailConnector } from "./communication/gmail";
import { QuickBooksConnector } from "./accounting/quickbooks";
import { GoogleAnalyticsConnector } from "./analytics/google-analytics";
import { MixpanelConnector } from "./analytics/mixpanel";

describe("revenue connectors", () => {
  it("salesforce query returns records in sync-adapter compatible shape", async () => {
    const connector = new SalesforceConnector({
      instanceUrl: "https://example.my.salesforce.com",
      accessToken: "token",
    });
    const get = vi.fn().mockResolvedValue({
      data: {
        records: [{ Id: "001", Name: "Acme" }],
        totalSize: 1,
        done: true,
      },
    });
    (connector as any).client = { get };

    const result = await connector.query("SELECT Id, Name FROM Account LIMIT 1");
    expect(Array.isArray(result)).toBe(true);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].Id).toBe("001");
  });

  it("hubspot uses search endpoint for delta fetch", async () => {
    const connector = new HubSpotConnector({ accessToken: "token" });
    const post = vi.fn().mockResolvedValue({ data: { results: [{ id: "1" }] } });
    (connector as any).client = { post, get: vi.fn() };

    const result = await connector.getContacts(20, "10", "2026-01-01T00:00:00.000Z");
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe("/crm/v3/objects/contacts/search");
    expect(result.results).toHaveLength(1);
  });

  it("stripe exposes sync-friendly customer alias with cursor and since", async () => {
    const connector = new StripeConnector({ secretKey: "sk_test_123" });
    const get = vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: "cus_1",
            object: "customer",
            created: 1,
            balance: 0,
            delinquent: false,
            metadata: {},
          },
        ],
        has_more: true,
      },
    });
    (connector as any).client = { get };

    const result = await connector.getCustomers({
      limit: 1,
      cursor: "cus_prev",
      since: "2026-01-01T00:00:00.000Z",
    });
    expect(get).toHaveBeenCalledTimes(1);
    expect(result.data[0].id).toBe("cus_1");
    expect(result.next_cursor).toBe("cus_1");
  });

  it("gmail supports since-based search and history-based delta hydration", async () => {
    const connector = new GmailConnector({ accessToken: "token" });
    const get = vi.fn().mockResolvedValue({
      data: { messages: [{ id: "m1", threadId: "t1" }], resultSizeEstimate: 1 },
    });
    (connector as any).client = { get };

    await connector.listMessages({ since: "2026-01-01T00:00:00.000Z", maxResults: 1 });
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][1].params.q).toContain("after:");

    vi.spyOn(connector, "getHistory").mockResolvedValue({
      history: [
        { id: "h1", messagesAdded: [{ message: { id: "m2", threadId: "t2", labelIds: [] } }] },
      ],
      historyId: "200",
      nextPageToken: "next-history",
    } as any);
    vi.spyOn(connector, "getMessagesBatch").mockResolvedValue([{ id: "m2" } as any]);

    const delta = await connector.getMessagesForSync({ startHistoryId: "100", limit: 10 });
    expect(delta.messages).toHaveLength(1);
    expect(delta.latest_history_id).toBe("200");
    expect(delta.next_cursor).toBe("next-history");
  });

  it("quickbooks query helper supports limit/cursor/since pagination", async () => {
    const connector = new QuickBooksConnector({
      realmId: "12345",
      accessToken: "token",
      environment: "sandbox",
    });
    const get = vi.fn().mockResolvedValue({
      data: {
        QueryResponse: {
          Invoice: [{ Id: "inv_1", DocNumber: "INV-001" }],
        },
      },
    });
    (connector as any).client = { get };

    const invoices = await connector.getInvoices({
      limit: 1,
      cursor: "1",
      since: "2026-01-01T00:00:00.000Z",
    });
    expect(Array.isArray(invoices)).toBe(true);
    expect(invoices[0].Id).toBe("inv_1");
    expect(invoices.next_cursor).toBe("2");
  });

  it("google analytics exposes sync-friendly events fetch", async () => {
    const connector = new GoogleAnalyticsConnector({
      accessToken: "token",
      propertyId: "123456",
    });

    const post = vi.fn().mockResolvedValue({
      data: {
        rows: [
          {
            dimensionValues: [{ value: "signup" }, { value: "202601010101" }],
            metricValues: [{ value: "5" }, { value: "3" }],
          },
        ],
        rowCount: 1,
        totals: [{ metricValues: [{ value: "5" }, { value: "3" }] }],
      },
    });
    (connector as any).dataClient = { post };

    const events = await connector.getEventsForSync({ limit: 1 });
    expect(events.rows).toHaveLength(1);
    expect(events.propertyId).toBe("123456");
    expect(events.next_cursor).toBe("1");
  });

  it("mixpanel export parser supports cursor-based sync paging", async () => {
    const connector = new MixpanelConnector({
      projectToken: "token",
      serviceAccountUser: "svc",
      serviceAccountSecret: "secret",
    });
    const get = vi.fn().mockResolvedValue({
      data: '{"event":"Signup","properties":{"distinct_id":"u1"}}\n{"event":"Login","properties":{"distinct_id":"u1"}}\n',
    });
    (connector as any).exportClient = { get };

    const page = await connector.getEventsForSync({ limit: 1, cursor: "0" });
    expect(page.events).toHaveLength(1);
    expect(page.next_cursor).toBe("1");
  });
});
