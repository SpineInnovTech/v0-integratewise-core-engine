/**
 * IntegrateWise Admin Service - Test Suite
 *
 * Tests for auth middleware, tenant CRUD, user management,
 * workspace management, newsletter, and contact forms.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// =============================================================================
// MOCKS
// =============================================================================

const mockSql = vi.fn();
vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}));

import app from "./index";

// =============================================================================
// HELPERS
// =============================================================================

function env(overrides: Record<string, unknown> = {}) {
  return {
    DATABASE_URL: "postgres://test:test@localhost/test",
    ENVIRONMENT: "test",
    ADMIN_API_KEY: "test-admin-key",
    JWT_SECRET: "test-jwt-secret",
    ...overrides,
  } as any;
}

function adminHeaders(apiKey = "test-admin-key") {
  return { "x-admin-api-key": apiKey, "Content-Type": "application/json" };
}

// =============================================================================
// TESTS
// =============================================================================

describe("Admin Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSql.mockReset();
  });

  // ─── Public endpoints ───────────────────────────────────
  describe("Health check", () => {
    it("should return service info on /", async () => {
      const res = await app.request("/", {}, env());
      const body = (await res.json()) as any;

      expect(res.status).toBe(200);
      expect(body.service).toContain("Admin");
      expect(body.status).toBe("operational");
    });
  });

  // ─── Auth middleware ────────────────────────────────────
  describe("Auth middleware", () => {
    it("should reject requests without auth to /v1/*", async () => {
      const res = await app.request("/v1/tenants", {}, env());

      expect(res.status).toBe(401);
    });

    it("should accept valid API key", async () => {
      mockSql.mockResolvedValue([]);
      // Override tagged template calls
      mockSql.mockImplementation(() => Promise.resolve([]));

      const res = await app.request(
        "/v1/tenants",
        {
          headers: adminHeaders(),
        },
        env()
      );

      // Should not be 401 — auth passed
      expect(res.status).not.toBe(401);
    });

    it("should reject invalid API key", async () => {
      const res = await app.request(
        "/v1/tenants",
        {
          headers: adminHeaders("wrong-key"),
        },
        env()
      );

      expect(res.status).toBe(401);
    });
  });

  // ─── Tenant CRUD ────────────────────────────────────────
  describe("Tenant management", () => {
    it("POST /v1/tenants should create a tenant", async () => {
      // Mock: slug check returns empty (available)
      // Mock: insert success
      // Mock: workspace insert
      // Mock: subscription insert
      mockSql
        .mockResolvedValueOnce([]) // slug check
        .mockResolvedValueOnce([]) // tenant insert
        .mockResolvedValueOnce([]) // workspace insert
        .mockResolvedValueOnce([]); // subscription insert

      const res = await app.request(
        "/v1/tenants",
        {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({
            name: "Test Corp",
            slug: "test-corp",
            plan: "starter",
          }),
        },
        env()
      );

      expect(res.status).toBe(201);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.tenant.name).toBe("Test Corp");
    });

    it("POST /v1/tenants should reject duplicate slug", async () => {
      mockSql.mockResolvedValueOnce([{ id: "existing-tenant" }]); // slug exists

      const res = await app.request(
        "/v1/tenants",
        {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({
            name: "Dupe Corp",
            slug: "taken-slug",
          }),
        },
        env()
      );

      expect(res.status).toBe(409);
    });

    it("POST /v1/tenants should reject missing name/slug", async () => {
      const res = await app.request(
        "/v1/tenants",
        {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({}),
        },
        env()
      );

      expect(res.status).toBe(400);
    });

    it("DELETE /v1/tenants/:id should soft-delete", async () => {
      mockSql.mockResolvedValueOnce([{ id: "tenant-1" }]);

      const res = await app.request(
        "/v1/tenants/tenant-1",
        {
          method: "DELETE",
          headers: adminHeaders(),
        },
        env()
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.status).toBe("churned");
    });
  });

  // ─── User management ───────────────────────────────────
  describe("User management", () => {
    it("POST /v1/tenants/:id/users should add a user", async () => {
      mockSql
        .mockResolvedValueOnce([]) // existing check
        .mockResolvedValueOnce([]); // insert

      const res = await app.request(
        "/v1/tenants/t1/users",
        {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({ email: "user@test.com", name: "Test User" }),
        },
        env()
      );

      expect(res.status).toBe(201);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.user.email).toBe("user@test.com");
    });

    it("POST /v1/tenants/:id/users should reject duplicate email", async () => {
      mockSql.mockResolvedValueOnce([{ id: "existing-user" }]);

      const res = await app.request(
        "/v1/tenants/t1/users",
        {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({ email: "existing@test.com" }),
        },
        env()
      );

      expect(res.status).toBe(409);
    });

    it("POST /v1/tenants/:id/users should reject missing email", async () => {
      const res = await app.request(
        "/v1/tenants/t1/users",
        {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({ name: "No Email" }),
        },
        env()
      );

      expect(res.status).toBe(400);
    });
  });

  // ─── Newsletter ─────────────────────────────────────────
  describe("Newsletter", () => {
    it("POST /v1/newsletter/subscribe should accept valid email", async () => {
      mockSql.mockResolvedValueOnce([]);

      const res = await app.request(
        "/v1/newsletter/subscribe",
        {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({ email: "subscriber@test.com" }),
        },
        env()
      );

      expect(res.status).toBe(201);
    });

    it("POST /v1/newsletter/subscribe should reject invalid email", async () => {
      const res = await app.request(
        "/v1/newsletter/subscribe",
        {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({ email: "not-an-email" }),
        },
        env()
      );

      expect(res.status).toBe(400);
    });

    it("POST /v1/public/newsletter should accept public submissions without admin auth", async () => {
      mockSql.mockResolvedValueOnce([]);

      const res = await app.request(
        "/v1/public/newsletter",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "public@test.com" }),
        },
        env()
      );

      expect(res.status).toBe(201);
    });
  });

  // ─── Contact form ───────────────────────────────────────
  describe("Contact submissions", () => {
    it("POST /v1/contact-submissions should store valid submission", async () => {
      mockSql.mockResolvedValueOnce([]);

      const res = await app.request(
        "/v1/contact-submissions",
        {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({
            name: "Jane Doe",
            email: "jane@example.com",
            message: "I want a demo",
          }),
        },
        env()
      );

      expect(res.status).toBe(201);
    });

    it("POST /v1/contact-submissions should reject missing fields", async () => {
      const res = await app.request(
        "/v1/contact-submissions",
        {
          method: "POST",
          headers: adminHeaders(),
          body: JSON.stringify({ name: "Jane" }),
        },
        env()
      );

      expect(res.status).toBe(400);
    });

    it("POST /v1/public/contact should accept public submissions without admin auth", async () => {
      mockSql.mockResolvedValueOnce([]);

      const res = await app.request(
        "/v1/public/contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Doe",
            email: "jane@example.com",
            message: "Need a demo",
          }),
        },
        env()
      );

      expect(res.status).toBe(201);
    });
  });

  describe("Support intake", () => {
    const gatewayHeaders = {
      "Content-Type": "application/json",
      "x-tenant-id": "11111111-1111-1111-1111-111111111111",
      "x-user-id": "22222222-2222-2222-2222-222222222222",
      "x-user-email": "customer@test.com",
    };

    it("POST /v1/support/tickets should accept authenticated gateway requests", async () => {
      mockSql.mockResolvedValueOnce([]);

      const res = await app.request(
        "/v1/support/tickets",
        {
          method: "POST",
          headers: gatewayHeaders,
          body: JSON.stringify({
            subject: "Connector issue",
            description: "HubSpot sync failed",
            category: "connector_issue",
          }),
        },
        env()
      );

      expect(res.status).toBe(201);
    });

    it("POST /v1/support/feedback should store feedback", async () => {
      mockSql.mockResolvedValueOnce([]);

      const res = await app.request(
        "/v1/support/feedback",
        {
          method: "POST",
          headers: gatewayHeaders,
          body: JSON.stringify({
            request_kind: "feature_request",
            subject: "Need saved filters",
            message: "Saved queue filters would help our support team.",
          }),
        },
        env()
      );

      expect(res.status).toBe(201);
    });

    it("GET /v1/support/me should return recent tickets and feedback", async () => {
      mockSql
        .mockResolvedValueOnce([
          {
            id: "ticket-1",
            subject: "Connector issue",
            status: "open",
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "feedback-1",
            request_kind: "nps",
            score: 8,
          },
        ]);

      const res = await app.request(
        "/v1/support/me",
        {
          method: "GET",
          headers: gatewayHeaders,
        },
        env()
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.tickets).toHaveLength(1);
      expect(body.feedback).toHaveLength(1);
    });
  });
});
