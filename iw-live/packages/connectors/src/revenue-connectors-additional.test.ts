import { describe, expect, it, vi } from "vitest";
import { PipedriveConnector } from "./crm/pipedrive";
import { FreshsalesConnector } from "./crm/freshsales";
import { CloseConnector } from "./crm/close";
import { ChargebeeConnector } from "./accounting/chargebee";

describe("additional revenue connectors", () => {
  it("pipedrive exposes contact/account/deal pagination with next cursor", async () => {
    const connector = new PipedriveConnector({
      accessToken: "token",
      companyDomain: "acme",
    });
    const get = vi.fn().mockResolvedValue({
      data: {
        data: [{ id: 1, name: "Acme Person" }],
        additional_data: {
          pagination: {
            start: 0,
            limit: 1,
            more_items_in_collection: true,
            next_start: 1,
          },
        },
      },
    });
    (connector as any).client = { get };

    const result = await connector.getContacts({
      limit: 1,
      cursor: "0",
      since: "2026-01-01T00:00:00.000Z",
    });
    expect(get).toHaveBeenCalledTimes(1);
    expect(result.data).toHaveLength(1);
    expect(result.next_cursor).toBe("1");
  });

  it("freshsales uses endpoint fallback and returns page cursor", async () => {
    const connector = new FreshsalesConnector({ apiKey: "token", domain: "acme.myfreshworks.com" });
    const get = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({
        data: {
          contacts: [{ id: 1, first_name: "Nirmal" }],
          meta: { has_more: true },
        },
      });
    (connector as any).client = { get };

    const result = await connector.getContacts({
      limit: 1,
      cursor: "1",
      since: "2026-01-01T00:00:00.000Z",
    });
    expect(result.data).toHaveLength(1);
    expect(result.next_cursor).toBe("2");
  });

  it("close supports delta filters and offset cursor", async () => {
    const connector = new CloseConnector({ apiKey: "close-api-key" });
    const get = vi.fn().mockResolvedValue({
      data: {
        data: [{ id: "lead_1", name: "Acme Lead" }],
        has_more: true,
      },
    });
    (connector as any).client = { get };

    const result = await connector.getAccounts({
      limit: 1,
      cursor: "0",
      since: "2026-01-01T00:00:00.000Z",
    });
    expect(get).toHaveBeenCalledTimes(1);
    expect(result.data[0].id).toBe("lead_1");
    expect(result.next_cursor).toBe("1");
  });

  it("chargebee unwraps list envelopes and next offsets", async () => {
    const connector = new ChargebeeConnector({ site: "acme", apiKey: "cb_test" });
    const get = vi.fn().mockResolvedValue({
      data: {
        list: [{ subscription: { id: "sub_1", status: "active" } }],
        next_offset: "cursor_2",
      },
    });
    (connector as any).client = { get };

    const result = await connector.getSubscriptions({
      limit: 1,
      cursor: "cursor_1",
      since: "2026-01-01T00:00:00.000Z",
    });
    expect(get).toHaveBeenCalledTimes(1);
    expect(result.data[0].id).toBe("sub_1");
    expect(result.next_cursor).toBe("cursor_2");
  });
});
