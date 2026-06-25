import { describe, expect, it, vi } from "vitest";
import {
  syncChargebee,
  syncClose,
  syncFreshsales,
  syncGmail,
  syncGoogleAnalytics,
  syncHubSpot,
  syncMixpanel,
  syncPipedrive,
  syncQuickBooks,
  syncStripe,
} from "./sync-adapters";

describe("revenue sync adapters", () => {
  it("syncHubSpot forwards since/cursor for delta-ready fetch", async () => {
    const connector = {
      getContacts: vi
        .fn()
        .mockResolvedValue({ results: [{ id: "1", properties: { email: "a@b.com" } }] }),
      getCompanies: vi.fn().mockResolvedValue({ results: [] }),
      getDeals: vi.fn().mockResolvedValue({ results: [] }),
    };

    const result = await syncHubSpot(connector, {
      entityType: "contact",
      since: "2026-01-01T00:00:00.000Z",
      cursor: "100",
    });
    expect(connector.getContacts).toHaveBeenCalledWith(100, "100", "2026-01-01T00:00:00.000Z");
    expect(result.entities).toHaveLength(1);
  });

  it("syncStripe forwards since/cursor and returns next cursor", async () => {
    const connector = {
      getCustomers: vi.fn().mockResolvedValue({
        data: [{ id: "cus_1", email: "a@b.com", balance: 0, created: 1 }],
        next_cursor: "cus_2",
      }),
      getInvoices: vi.fn().mockResolvedValue({ data: [] }),
      getSubscriptions: vi.fn().mockResolvedValue({ data: [] }),
    };

    const result = await syncStripe(connector, {
      entityType: "account",
      cursor: "cus_0",
      since: "2026-01-01T00:00:00.000Z",
    });
    expect(connector.getCustomers).toHaveBeenCalledWith({
      limit: 100,
      cursor: "cus_0",
      since: "2026-01-01T00:00:00.000Z",
    });
    expect(result.next_cursor).toBe("cus_2");
  });

  it("syncQuickBooks uses sync params and surfaces next cursor", async () => {
    const connector = {
      getInvoices: vi.fn().mockResolvedValue({
        data: [{ Id: "1", DocNumber: "INV-1", TotalAmt: 10, Balance: 0 }],
        next_cursor: "2",
      }),
      getCustomers: vi.fn().mockResolvedValue({ data: [] }),
    };

    const result = await syncQuickBooks(connector, {
      entityType: "invoice",
      cursor: "1",
      since: "2026-01-01T00:00:00.000Z",
      limit: 50,
    });
    expect(connector.getInvoices).toHaveBeenCalledWith({
      limit: 50,
      cursor: "1",
      since: "2026-01-01T00:00:00.000Z",
    });
    expect(result.next_cursor).toBe("2");
    expect(result.entities[0].entity_type).toBe("invoice");
  });

  it("syncGmail uses hydrated sync helper with cursor", async () => {
    const connector = {
      getMessagesForSync: vi.fn().mockResolvedValue({
        messages: [
          { id: "m1", threadId: "t1", snippet: "Hi", historyId: "10", labelIds: ["INBOX"] },
        ],
        next_cursor: "cursor_2",
      }),
    };

    const result = await syncGmail(connector, {
      cursor: "cursor_1",
      since: "2026-01-01T00:00:00.000Z",
      limit: 20,
    });
    expect(connector.getMessagesForSync).toHaveBeenCalledWith({
      limit: 20,
      cursor: "cursor_1",
      since: "2026-01-01T00:00:00.000Z",
    });
    expect(result.next_cursor).toBe("cursor_2");
    expect(result.entities[0].source).toBe("gmail");
  });

  it("syncMixpanel maps raw events to interaction entities", async () => {
    const connector = {
      getEventsForSync: vi.fn().mockResolvedValue({
        events: [
          {
            event: "Signup",
            properties: { distinct_id: "user_1", time: 123, $insert_id: "ins_1" },
          },
        ],
        next_cursor: "1",
      }),
    };

    const result = await syncMixpanel(connector, {
      cursor: "0",
      since: "2026-01-01T00:00:00.000Z",
      limit: 1,
    });
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].entity_type).toBe("interaction_event");
    expect(result.next_cursor).toBe("1");
  });

  it("syncGoogleAnalytics maps report rows to interaction entities", async () => {
    const connector = {
      getEventsForSync: vi.fn().mockResolvedValue({
        rows: [
          {
            dimensionValues: [{ value: "page_view" }, { value: "202601010101" }],
            metricValues: [{ value: "10" }, { value: "3" }],
          },
        ],
        next_cursor: "20",
      }),
    };
    const result = await syncGoogleAnalytics(connector, { cursor: "10", limit: 10 });
    expect(result.entities[0].source).toBe("google-analytics");
    expect(result.next_cursor).toBe("20");
  });

  it("syncPipedrive/syncFreshsales/syncClose/syncChargebee return schema-shaped entities", async () => {
    const pipedrive = {
      getContacts: vi
        .fn()
        .mockResolvedValue({ data: [{ id: 1, name: "Person" }], next_cursor: "2" }),
      getAccounts: vi.fn().mockResolvedValue({ data: [] }),
      getDeals: vi.fn().mockResolvedValue({ data: [] }),
    };
    const freshsales = {
      getContacts: vi.fn().mockResolvedValue({
        data: [{ id: 1, first_name: "Fresh", last_name: "Contact" }],
        next_cursor: "2",
      }),
      getAccounts: vi.fn().mockResolvedValue({ data: [] }),
      getDeals: vi.fn().mockResolvedValue({ data: [] }),
    };
    const close = {
      getContacts: vi
        .fn()
        .mockResolvedValue({ data: [{ id: "ct_1", name: "Close Contact" }], next_cursor: "2" }),
      getAccounts: vi.fn().mockResolvedValue({ data: [] }),
      getDeals: vi.fn().mockResolvedValue({ data: [] }),
    };
    const chargebee = {
      getCustomers: vi
        .fn()
        .mockResolvedValue({ data: [{ id: "cust_1", email: "a@b.com" }], next_cursor: "2" }),
      getSubscriptions: vi.fn().mockResolvedValue({ data: [] }),
      getInvoices: vi.fn().mockResolvedValue({ data: [] }),
    };

    const p = await syncPipedrive(pipedrive, {
      entityType: "contact",
      since: "2026-01-01T00:00:00.000Z",
    });
    const f = await syncFreshsales(freshsales, {
      entityType: "contact",
      since: "2026-01-01T00:00:00.000Z",
    });
    const c = await syncClose(close, { entityType: "contact", since: "2026-01-01T00:00:00.000Z" });
    const cb = await syncChargebee(chargebee, {
      entityType: "account",
      since: "2026-01-01T00:00:00.000Z",
    });

    expect(p.entities[0].source).toBe("pipedrive");
    expect(f.entities[0].source).toBe("freshsales");
    expect(c.entities[0].source).toBe("close");
    expect(cb.entities[0].source).toBe("chargebee");
    expect(p.next_cursor).toBe("2");
    expect(f.next_cursor).toBe("2");
    expect(c.next_cursor).toBe("2");
    expect(cb.next_cursor).toBe("2");
  });
});
