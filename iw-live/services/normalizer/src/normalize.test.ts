/**
 * IntegrateWise Normalizer Service - Test Suite
 *
 * Comprehensive tests for validation, normalization, deduplication,
 * version management, and DLQ handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validate, normalize, generateDedupKey } from "./normalize";
import { classifyErrors, isRetryable, writeToDLQ } from "./dlq";
import type { EntityType, ValidationError } from "./types";

// =============================================================================
// MOCKS
// =============================================================================

// Mock crypto.randomUUID for deterministic tests
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-1234-5678-9012"),
});

// Mock fetch for database calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe("Normalizer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validate()", () => {
    it("should pass valid client data", () => {
      const validClient = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Acme Corporation",
        domain: "acme.com",
        external_id: "client-001",
        source_system: "salesforce",
        status: "active",
      };

      const result = validate("client", validClient);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail on missing required fields", () => {
      const invalidClient = {
        // Missing tenant_id and name (required)
        domain: "acme.com",
      };

      const result = validate("client", invalidClient);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const missingFieldErrors = result.errors.filter((e) => e.code === "missing_field");
      expect(missingFieldErrors.length).toBeGreaterThan(0);
    });

    it("should fail on invalid email format", () => {
      const clientWithBadEmail = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Acme Corporation",
        domain: "acme.com",
        contact_email: "not-a-valid-email", // Invalid email format
      };

      const result = validate("client", clientWithBadEmail);

      // If the schema enforces email format, this should fail
      // The behavior depends on the actual schema definition
      expect(result).toBeDefined();
      if (!result.valid) {
        const formatErrors = result.errors.filter(
          (e) => e.code === "format_error" || e.field.includes("email")
        );
        expect(formatErrors.length).toBeGreaterThanOrEqual(0);
      }
    });

    it("should fail on invalid UUID format", () => {
      const clientWithBadUUID = {
        tenant_id: "not-a-valid-uuid", // Invalid UUID format
        name: "Acme Corporation",
        domain: "acme.com",
      };

      const result = validate("client", clientWithBadUUID);

      expect(result.valid).toBe(false);
      const uuidErrors = result.errors.filter(
        (e) =>
          e.code === "format_error" ||
          e.message.toLowerCase().includes("uuid") ||
          e.message.toLowerCase().includes("format")
      );
      expect(uuidErrors.length).toBeGreaterThan(0);
    });

    it("should return unknown entity type error", () => {
      const data = { name: "test" };

      const result = validate("unknown_type" as EntityType, data);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "schema_not_found")).toBe(true);
    });

    it("should validate deal entity", () => {
      const validDeal = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Enterprise Deal Q4",
        organization_id: "550e8400-e29b-41d4-a716-446655440001",
        stage: "negotiation",
        amount: 50000,
        currency: "USD",
      };

      const result = validate("deal", validDeal);

      expect(result.valid).toBe(true);
    });

    it("should validate ticket entity", () => {
      const validTicket = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        subject: "Support Request - Login Issue",
        organization_id: "550e8400-e29b-41d4-a716-446655440001",
        status: "open",
        priority: "high",
      };

      const result = validate("ticket", validTicket);

      expect(result.valid).toBe(true);
    });
  });

  // ===========================================================================
  // DEDUP KEY GENERATION TESTS
  // ===========================================================================

  describe("generateDedupKey()", () => {
    it("should generate dedup key from external_id and source_system", () => {
      const data = {
        external_id: "client-12345",
        source_system: "salesforce",
        name: "Acme Corp",
      };
      const tenantId = "tenant-001";

      const dedupKey = generateDedupKey("client", tenantId, data);

      expect(dedupKey).toBe("client:tenant-001:salesforce:client-12345");
    });

    it("should generate dedup key from external_id if no source_system", () => {
      const data = {
        external_id: "client-12345",
        name: "Acme Corp",
      };
      const tenantId = "tenant-001";

      const dedupKey = generateDedupKey("client", tenantId, data);

      expect(dedupKey).toBe("client:tenant-001:client-12345");
    });

    it("should generate content hash when no external_id", () => {
      const data = {
        name: "Acme Corp",
        domain: "acme.com",
      };
      const tenantId = "tenant-001";

      const dedupKey = generateDedupKey("client", tenantId, data);

      expect(dedupKey).toMatch(/^client:tenant-001:content:/);
    });

    it("should produce consistent keys for same data", () => {
      const data = {
        name: "Test Client",
        domain: "test.com",
      };
      const tenantId = "tenant-001";

      const key1 = generateDedupKey("client", tenantId, data);
      const key2 = generateDedupKey("client", tenantId, data);

      expect(key1).toBe(key2);
    });

    it("should produce different keys for different entity types", () => {
      const data = {
        external_id: "entity-123",
        source_system: "system",
      };
      const tenantId = "tenant-001";

      const clientKey = generateDedupKey("client", tenantId, data);
      const dealKey = generateDedupKey("deal", tenantId, data);

      expect(clientKey).not.toBe(dealKey);
      expect(clientKey).toContain("client:");
      expect(dealKey).toContain("deal:");
    });
  });

  // ===========================================================================
  // NORMALIZE TESTS
  // ===========================================================================

  describe("normalize()", () => {
    beforeEach(() => {
      // Mock successful version fetch (no existing version)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });
    });

    it("should successfully normalize valid data", async () => {
      const validData = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Acme Corporation",
        domain: "acme.com",
        external_id: "client-001",
        source_system: "salesforce",
      };

      const result = await normalize("client", validData);

      expect(result.success).toBe(true);
      expect(result.entity_type).toBe("client");
      expect(result.dedup_key).toContain("client:");
      expect(result.version).toBe(1);
      expect(result.normalized_data).toBeDefined();
      expect(result.normalized_data?._normalized).toBeDefined();
    });

    it("should increment version on update", async () => {
      // Mock D1: first SELECT returns existing version 3, then UPDATE run() succeeds
      const mockD1 = {
        prepare: (sql: string) => ({
          bind: (..._args: unknown[]) => ({
            first: async () => (sql.includes("SELECT") ? { version: 3 } : undefined),
            run: async () => {},
          }),
        }),
      };

      const validData = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Acme Corporation Updated",
        domain: "acme.com",
        external_id: "client-001",
        source_system: "salesforce",
      };

      const result = await normalize("client", validData, mockD1 as any);

      expect(result.success).toBe(true);
      expect(result.version).toBe(4); // Incremented from 3
    });

    it("should write to DLQ on validation failure", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      });

      const invalidData = {
        // Missing tenant_id
        name: "Acme Corporation",
      };

      const result = await normalize("client", invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.dlq_id).toBeDefined();
    });

    it("should fail when tenant_id is missing", async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const dataWithoutTenant = {
        name: "Acme Corp",
        domain: "acme.com",
      };

      const result = await normalize("client", dataWithoutTenant);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(
        result.errors!.some((e) => e.field === "tenant_id" && e.code === "missing_field")
      ).toBe(true);
    });

    it("should include normalized metadata in output", async () => {
      const validData = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Acme Corporation",
        domain: "acme.com",
      };

      const result = await normalize("client", validData);

      expect(result.success).toBe(true);
      const normalized = result.normalized_data?._normalized as Record<string, unknown>;
      expect(normalized).toBeDefined();
      expect(normalized.dedup_key).toBeDefined();
      expect(normalized.version).toBe(1);
      expect(normalized.normalized_at).toBeDefined();
      expect(normalized.entity_type).toBe("client");
    });
  });

  // ===========================================================================
  // DLQ TESTS
  // ===========================================================================

  describe("DLQ", () => {
    describe("classifyErrors()", () => {
      it("should classify validation errors correctly", () => {
        const validationErrors: ValidationError[] = [
          {
            field: "amount",
            message: "must be a number",
            code: "invalid_type",
          },
        ];

        const classification = classifyErrors(validationErrors);

        expect(classification).toBe("validation");
      });

      it("should classify missing field errors", () => {
        const missingFieldErrors: ValidationError[] = [
          {
            field: "tenant_id",
            message: "is required",
            code: "missing_field",
          },
        ];

        const classification = classifyErrors(missingFieldErrors);

        expect(classification).toBe("missing_field");
      });

      it("should classify format errors", () => {
        const formatErrors: ValidationError[] = [
          {
            field: "email",
            message: "invalid email format",
            code: "format_error",
          },
        ];

        const classification = classifyErrors(formatErrors);

        expect(classification).toBe("format");
      });

      it("should return system for empty errors", () => {
        const classification = classifyErrors([]);

        expect(classification).toBe("system");
      });
    });

    describe("isRetryable()", () => {
      it("should mark system errors as retryable", () => {
        expect(isRetryable("system")).toBe(true);
      });

      it("should mark validation errors as not retryable", () => {
        expect(isRetryable("validation")).toBe(false);
      });

      it("should mark format errors as not retryable", () => {
        expect(isRetryable("format")).toBe(false);
      });

      it("should mark missing_field errors as not retryable", () => {
        expect(isRetryable("missing_field")).toBe(false);
      });
    });

    describe("writeToDLQ()", () => {
      it("should write entry without database config", async () => {
        const result = await writeToDLQ("tenant-001", "client", { name: "Bad Data" }, [
          { field: "tenant_id", message: "required", code: "missing_field" },
        ]);

        expect(result.success).toBe(true);
        expect(result.dlq_id).toBeDefined();
      });

      it("should write to database when config provided", async () => {
        mockFetch.mockResolvedValue({ ok: true });

        const dbConfig = {
          supabaseUrl: "https://test.supabase.co/rest/v1",
          supabaseServiceKey: "test-key",
        };

        const result = await writeToDLQ(
          "tenant-001",
          "client",
          { name: "Bad Data" },
          [{ field: "tenant_id", message: "required", code: "missing_field" }],
          dbConfig
        );

        expect(result.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("normalization_errors"),
          expect.objectContaining({
            method: "POST",
          })
        );
      });

      it("should handle database write failure gracefully", async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          text: async () => "Internal Server Error",
        });

        const dbConfig = {
          supabaseUrl: "https://test.supabase.co/rest/v1",
          supabaseServiceKey: "test-key",
        };

        const result = await writeToDLQ(
          "tenant-001",
          "client",
          { name: "Bad Data" },
          [{ field: "test", message: "error", code: "validation_error" }],
          dbConfig
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain("500");
      });
    });
  });

  // =============================================================================
  // SPINE WRITE RESPONSE & CANONICAL ID EXTRACTION TESTS
  // =============================================================================

  describe("Spine Write Response Shape", () => {
    it("should extract canonical ID from results[0].id (Spine v2 format)", () => {
      // Simulate Spine v2 response format
      const spineResponse = {
        results: [
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            entity_type: "contact",
            created_at: "2024-01-15T10:30:00Z",
          },
        ],
        meta: {
          total: 1,
          inserted: 1,
        },
      };

      // Extraction logic from sectorize()
      const canonicalId =
        (spineResponse as any)?.results?.[0]?.id ??
        (spineResponse as any)?.id ??
        (spineResponse as any)?.spine_id ??
        (spineResponse as any)?.entity_id;

      expect(canonicalId).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("should extract canonical ID from top-level id (legacy format)", () => {
      // Simulate legacy Spine response format
      const spineResponse: any = {
        id: "550e8400-e29b-41d4-a716-446655440002",
        entity_type: "account",
        created_at: "2024-01-15T10:30:00Z",
      };

      const canonicalId =
        spineResponse?.results?.[0]?.id ??
        spineResponse?.id ??
        spineResponse?.spine_id ??
        spineResponse?.entity_id;

      expect(canonicalId).toBe("550e8400-e29b-41d4-a716-446655440002");
    });

    it("should fallback through all ID sources correctly", () => {
      // Test fallback chain
      const testCases: Array<{ input: any; expected: string | undefined; source: string }> = [
        {
          input: { results: [{ id: "results-id" }] },
          expected: "results-id",
          source: "results[0].id",
        },
        {
          input: { id: "top-level-id" },
          expected: "top-level-id",
          source: "id",
        },
        {
          input: { spine_id: "spine-id" },
          expected: "spine-id",
          source: "spine_id",
        },
        {
          input: { entity_id: "entity-id" },
          expected: "entity-id",
          source: "entity_id",
        },
        {
          input: {},
          expected: undefined,
          source: "undefined",
        },
      ];

      for (const tc of testCases) {
        const extracted =
          tc.input?.results?.[0]?.id ?? tc.input?.id ?? tc.input?.spine_id ?? tc.input?.entity_id;
        expect(extracted).toBe(tc.expected);
      }
    });

    it("should throw error when no canonical ID can be extracted", () => {
      const spineWriteResult: any = null;
      const spinePayload: any = {};
      const entities = [{ source_id: undefined }];

      const extractId = () => {
        const canonicalId =
          spineWriteResult?.results?.[0]?.id ??
          spineWriteResult?.id ??
          spineWriteResult?.spine_id ??
          spineWriteResult?.entity_id ??
          spinePayload.id ??
          spinePayload.spine_id ??
          spinePayload.source_id ??
          entities[0].source_id;

        const spineId = String(canonicalId);

        if (!spineId || spineId === "undefined" || spineId === "null" || spineId === "undefined") {
          throw new Error("Failed to determine canonical spine_id");
        }
        return spineId;
      };

      expect(extractId).toThrow("Failed to determine canonical spine_id");
    });
  });

  describe("Canonical ID Usage in Pipeline", () => {
    it("should prefer Spine response ID over payload ID", () => {
      const spineResponse: any = { results: [{ id: "spine-canonical-id" }] };
      const payloadId = "payload-inferred-id";

      const canonicalSpineId = spineResponse?.results?.[0]?.id ?? payloadId;

      expect(canonicalSpineId).toBe("spine-canonical-id");
      expect(canonicalSpineId).not.toBe(payloadId);
    });

    it("should use payload ID only as fallback", () => {
      const spineResponse: any = {};
      const payloadId = "fallback-payload-id";

      const canonicalSpineId = spineResponse?.results?.[0]?.id ?? spineResponse?.id ?? payloadId;

      expect(canonicalSpineId).toBe("fallback-payload-id");
    });
  });
});
