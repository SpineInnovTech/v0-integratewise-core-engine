import { describe, it, expect } from "vitest";
import worker from "./index";

describe("Think Service", () => {
  it("should return health status", async () => {
    const res = await worker.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; service: string };
    expect(body.status).toBe("ok");
    expect(body.service).toContain("Think");
  });

  it("should require x-tenant-id for signals", async () => {
    const res = await worker.fetch(new Request("http://localhost/v1/signals"));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("x-tenant-id");
  });
});
