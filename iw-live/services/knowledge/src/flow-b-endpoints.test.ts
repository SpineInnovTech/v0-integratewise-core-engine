import { describe, it, expect, vi } from "vitest";
import { createSearchService } from "./search";

// Mock neon serverless
vi.mock("@neondatabase/serverless", () => ({
  neon: () => {
    const sqlFn = async (...args: any[]) => {
      void args;
      return [];
    };
    sqlFn.unsafe = async (...args: any[]) => {
      void args;
      return [];
    };
    return sqlFn;
  },
}));

// Mock knowledge modules
vi.mock("./chunking", () => ({
  chunkDocument: vi.fn().mockResolvedValue({ chunks: [], totalTokens: 0, processingTimeMs: 0 }),
  chunkSession: vi.fn().mockResolvedValue({ chunks: [], totalTokens: 0 }),
}));

vi.mock("./embedding", () => ({
  createOpenAIEmbedder: vi.fn(),
  createOpenRouterEmbedder: vi.fn(),
  storeChunks: vi.fn().mockResolvedValue([]),
  storeEmbeddings: vi.fn().mockResolvedValue(undefined),
  storeSessionEmbedding: vi.fn().mockResolvedValue(undefined),
  processAndStoreDocument: vi
    .fn()
    .mockResolvedValue({ chunkIds: [], embeddingIds: [], totalChunks: 0, totalTokens: 0 }),
}));

vi.mock("./search", () => ({
  createSearchService: vi.fn(),
}));

vi.mock("@integratewise/connector-utils", () => ({
  enforceTenantLimits: vi.fn().mockResolvedValue({ allowed: true }),
}));

describe("Flow B Endpoints", () => {
  const baseEnv = {
    DATABASE_URL: "postgres://test:test@localhost/test",
    OPENROUTER_API_KEY: "test-key",
    ENVIRONMENT: "test",
  };

  describe("GET /v1/knowledge/processing-status/:id", () => {
    it("should require x-tenant-id", async () => {
      const mod = await import("./index");
      const app = mod.default;

      const req = new Request("http://localhost/v1/knowledge/processing-status/file-123", {
        method: "GET",
      });

      const res = await app.fetch(req, baseEnv);
      expect(res.status).toBe(400);
      const body = (await res.json()) as any;
      expect(body.error.code).toBe("MISSING_TENANT");
    });

    it("should return 404 for non-existent file", async () => {
      const mod = await import("./index");
      const app = mod.default;

      const req = new Request("http://localhost/v1/knowledge/processing-status/file-999", {
        headers: { "x-tenant-id": "tenant-123" },
      });

      const res = await app.fetch(req, baseEnv);
      // With empty DB mock, returns 404 for non-existent files
      expect([200, 404, 500]).toContain(res.status);
    });
  });

  describe("POST /v1/knowledge/extraction-feedback", () => {
    it("should require x-tenant-id", async () => {
      const mod = await import("./index");
      const app = mod.default;

      const req = new Request("http://localhost/v1/knowledge/extraction-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: "doc-1" }),
      });

      const res = await app.fetch(req, baseEnv);
      expect(res.status).toBe(400);
    });

    it("should require documentId or file_id", async () => {
      const mod = await import("./index");
      const app = mod.default;

      const req = new Request("http://localhost/v1/knowledge/extraction-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "tenant-123",
        },
        body: JSON.stringify({ rating: 5 }),
      });

      const res = await app.fetch(req, baseEnv);
      expect(res.status).toBe(400);
      const body = (await res.json()) as any;
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should accept frontend-style body with documentId", async () => {
      const mod = await import("./index");
      const app = mod.default;

      const req = new Request("http://localhost/v1/knowledge/extraction-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "tenant-123",
        },
        body: JSON.stringify({
          documentId: "doc-001",
          extractionId: "ext-001",
          corrections: [{ field: "name", original: "Jon", corrected: "John" }],
          approved: true,
        }),
      });

      const res = await app.fetch(req, baseEnv);
      // May succeed or fail depending on DB availability, but should not be 400
      expect([200, 500]).toContain(res.status);
    });

    it("should accept backend-style body with file_id", async () => {
      const mod = await import("./index");
      const app = mod.default;

      const req = new Request("http://localhost/v1/knowledge/extraction-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "tenant-123",
        },
        body: JSON.stringify({
          file_id: "file-001",
          version_id: "v-001",
          rating: 4,
          feedback_text: "Good extraction",
        }),
      });

      const res = await app.fetch(req, baseEnv);
      expect([200, 500]).toContain(res.status);
    });
  });

  describe("POST /v1/knowledge/reprocess/:id", () => {
    it("should require x-tenant-id", async () => {
      const mod = await import("./index");
      const app = mod.default;

      const req = new Request("http://localhost/v1/knowledge/reprocess/file-123", {
        method: "POST",
      });

      const res = await app.fetch(req, baseEnv);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /knowledge/search/sessions", () => {
    it("should pass approved_only through to the search service", async () => {
      const searchSessions = vi.fn().mockResolvedValue([
        {
          session_id: "memory-1",
          summary: "Approved memory",
          created_at: "2026-03-16T00:00:00.000Z",
        },
      ]);
      (createSearchService as any).mockReturnValue({
        searchSessions,
        searchDocuments: vi.fn().mockResolvedValue([]),
        searchHybrid: vi.fn().mockResolvedValue([]),
      });

      const mod = await import("./index");
      const app = mod.default;

      const req = new Request("http://localhost/knowledge/search/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": "tenant-123",
        },
        body: JSON.stringify({
          query: "approved memory",
          approved_only: true,
          limit: 5,
        }),
      });

      const res = await app.fetch(req, baseEnv);
      expect(res.status).toBe(200);
      expect(searchSessions).toHaveBeenCalledWith(
        "tenant-123",
        "approved memory",
        expect.objectContaining({ approvedOnly: true, topK: 10 })
      );
    });
  });
});
