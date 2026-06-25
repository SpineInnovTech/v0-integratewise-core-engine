/**
 * IntegrateWise Store Service - Test Suite
 *
 * Tests for file upload, R2 storage, tenant isolation,
 * file listing, and knowledge ingest triggering.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "./index";

// =============================================================================
// HELPERS
// =============================================================================

function env(overrides: Record<string, unknown> = {}) {
  return {
    DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          run: vi.fn(() => Promise.resolve({ success: true })),
          first: vi.fn(() => Promise.resolve(null)),
          all: vi.fn(() => Promise.resolve({ results: [] })),
        })),
      })),
    },
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_KEY: "test-key",
    R2_BUCKET: {
      put: vi.fn(() => Promise.resolve()),
      get: vi.fn(() => Promise.resolve(null)),
      list: vi.fn(() => Promise.resolve({ objects: [] })),
    },
    KNOWLEDGE: {
      fetch: vi.fn(() => Promise.resolve(new Response("ok"))),
    },
    ENVIRONMENT: "test",
    ...overrides,
  } as any;
}

function mockFetch(responses: Record<string, unknown>) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    for (const [key, val] of Object.entries(responses)) {
      if (url.includes(key)) {
        return new Response(JSON.stringify(val), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return new Response("[]", { status: 200 });
  }) as any;
}

// =============================================================================
// TESTS
// =============================================================================

describe("Store Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Health check", () => {
    it("should return operational status", async () => {
      const res = await app.request("/", {}, env());
      const body = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(body.service).toContain("Store");
      expect(body.status).toBe("operational");
    });
  });

  describe("POST /store/files", () => {
    it("should reject requests without x-tenant-id", async () => {
      mockFetch({});
      const res = await app.request(
        "/store/files",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "test.pdf" }),
        },
        env()
      );

      expect(res.status).toBe(400);
    });

    it("should reject invalid file metadata", async () => {
      mockFetch({});
      const res = await app.request(
        "/store/files",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": "tenant-1",
          },
          body: JSON.stringify({}), // missing required 'name'
        },
        env()
      );

      expect(res.status).toBe(400);
    });

    it("should create file record and return upload URL", async () => {
      mockFetch({ files: [{ id: "file-1" }] });
      const res = await app.request(
        "/store/files",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": "tenant-1",
          },
          body: JSON.stringify({ name: "test.pdf", content_type: "application/pdf" }),
        },
        env()
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.data.file_id).toBeDefined();
      expect(body.data.upload_url).toContain("upload");
    });
  });

  describe("GET /store/files", () => {
    it("should reject without tenant", async () => {
      mockFetch({});
      const res = await app.request("/store/files", {}, env());

      expect(res.status).toBe(400);
    });

    it("should list files for a tenant", async () => {
      const files = [{ id: "f1", name: "test.pdf" }];
      mockFetch({ files: files });

      const res = await app.request(
        "/store/files",
        {
          headers: { "x-tenant-id": "tenant-1" },
        },
        env()
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
    });
  });

  describe("GET /store/files/:id", () => {
    it("should return 404 for missing file", async () => {
      mockFetch({ files: [] });

      const res = await app.request(
        "/store/files/nonexistent",
        {
          headers: { "x-tenant-id": "tenant-1" },
        },
        env()
      );

      expect(res.status).toBe(404);
    });
  });
});
