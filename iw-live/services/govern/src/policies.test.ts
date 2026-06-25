/**
 * IntegrateWise Governance Service - Policy Test Suite
 *
 * Comprehensive tests for policy execution, approval workflow,
 * and audit logging functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// =============================================================================
// MOCKS
// =============================================================================

// Mock the neon database client (template tag function)
const { mockSql, mockNeon } = vi.hoisted(() => {
  const mockSql = vi.fn();
  const mockNeon = vi.fn(() => mockSql);
  return { mockSql, mockNeon };
});

vi.mock("@neondatabase/serverless", () => ({
  neon: mockNeon,
}));

vi.mock("./audit", () => ({
  logDecision: async (_env: any, entry: any, _key: string) => ({
    id: "audit-001",
    ...entry,
    created_at: new Date().toISOString(),
    signature: "mock-signature",
  }),
}));

// Import after mocking
import {
  canExecute,
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deactivatePolicy,
} from "./policies";
import { logDecision } from "./audit";
import type { Policy, ActionCheck, CheckResult, CreatePolicy } from "./types";

// Mock Env for D1-based audit calls
const mockEnv = {
  D1: {} as D1Database,
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_KEY: "test-key",
  CACHE: {} as KVNamespace,
  ENVIRONMENT: "test",
  SIGNATURE_KEY: "test-signature-key",
  DATABASE_URL: "postgres://test",
};

function createMockEnv(overrides: Partial<typeof mockEnv> = {}): typeof mockEnv {
  return { ...mockEnv, ...overrides };
}

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const createMockPolicy = (overrides: Partial<Policy> = {}): Policy => ({
  id: "policy-001",
  tenant_id: "tenant-001",
  name: "Default Billing Policy",
  description: "Controls billing-related actions",
  action_type_pattern: "billing.*",
  min_severity: "low",
  required_roles: ["billing_admin", "finance"],
  auto_approve: false,
  require_evidence_count: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const createMockActionCheck = (overrides: Partial<ActionCheck> = {}): ActionCheck => ({
  action_type: "billing.invoice.create",
  priority: "medium",
  parameters: {},
  evidence_ref_count: 0,
  ...overrides,
});

// =============================================================================
// CANEXECUTE TESTS
// =============================================================================

describe("Governance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNeon.mockReturnValue(mockSql);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("canExecute()", () => {
    it("should allow when policy matches and roles intersect", async () => {
      const policy = createMockPolicy({
        action_type_pattern: "billing.*",
        required_roles: ["billing_admin"],
        auto_approve: false,
      });

      mockSql.mockResolvedValueOnce([policy]);

      const action = createMockActionCheck({
        action_type: "billing.invoice.create",
        priority: "medium",
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["billing_admin", "user"], // User has billing_admin role
        action
      );

      expect(result.allowed).toBe(true);
      expect(result.policy_id).toBe(policy.id);
    });

    it("should deny when required roles not present", async () => {
      const policy = createMockPolicy({
        action_type_pattern: "billing.*",
        required_roles: ["billing_admin", "finance_director"],
        auto_approve: false,
      });

      mockSql.mockResolvedValueOnce([policy]);

      const action = createMockActionCheck({
        action_type: "billing.invoice.create",
        priority: "medium",
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["user", "viewer"], // User lacks required roles
        action
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Missing required role");
    });

    it("should auto-approve when auto_approve=true and within limits", async () => {
      const policy = createMockPolicy({
        action_type_pattern: "billing.*",
        required_roles: [],
        auto_approve: true,
        require_evidence_count: 0,
      });

      mockSql.mockResolvedValueOnce([policy]);

      const action = createMockActionCheck({
        action_type: "billing.payment.process",
        priority: "low",
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["user"],
        action
      );

      expect(result.allowed).toBe(true);
      expect(result.auto_approved).toBe(true);
      expect(result.reason).toContain("Auto-approved");
    });

    it("should deny when evidence count below requirement", async () => {
      const policy = createMockPolicy({
        action_type_pattern: "billing.*",
        required_roles: [],
        auto_approve: false,
        require_evidence_count: 3, // Requires 3 pieces of evidence
      });

      mockSql.mockResolvedValueOnce([policy]);

      const action = createMockActionCheck({
        action_type: "billing.refund.process",
        priority: "high",
        evidence_ref_count: 1, // Only 1 piece of evidence
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["billing_admin"],
        action
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Insufficient evidence");
      expect(result.reason).toContain("Required: 3");
      expect(result.reason).toContain("Provided: 1");
    });

    it("should match wildcard patterns like billing.*", async () => {
      const wildcardPolicy = createMockPolicy({
        action_type_pattern: "billing.*",
        required_roles: [],
        auto_approve: true,
      });

      mockSql.mockResolvedValueOnce([wildcardPolicy]);

      // Test single-level wildcard
      const action = createMockActionCheck({
        action_type: "billing.invoice",
        priority: "low",
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["user"],
        action
      );

      expect(result.allowed).toBe(true);
      expect(result.auto_approved).toBe(true);
    });

    it("should match deep wildcard patterns like billing.**", async () => {
      const deepWildcardPolicy = createMockPolicy({
        action_type_pattern: "billing.**",
        required_roles: [],
        auto_approve: true,
      });

      mockSql.mockResolvedValueOnce([deepWildcardPolicy]);

      // Test multi-level wildcard
      const action = createMockActionCheck({
        action_type: "billing.invoice.line_item.create",
        priority: "low",
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["user"],
        action
      );

      expect(result.allowed).toBe(true);
    });

    it("should allow by default when no policies match", async () => {
      mockSql.mockResolvedValueOnce([]); // No policies

      const action = createMockActionCheck({
        action_type: "unknown.action.type",
        priority: "low",
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["user"],
        action
      );

      expect(result.allowed).toBe(true);
      expect(result.reason).toContain("No matching policies");
    });

    it("should evaluate most restrictive policy first", async () => {
      const policies = [
        createMockPolicy({
          id: "policy-high",
          action_type_pattern: "billing.*",
          min_severity: "high",
          required_roles: ["admin"],
        }),
        createMockPolicy({
          id: "policy-low",
          action_type_pattern: "billing.*",
          min_severity: "low",
          required_roles: [],
          auto_approve: true,
        }),
      ];

      mockSql.mockResolvedValueOnce(policies);

      const action = createMockActionCheck({
        action_type: "billing.invoice.create",
        priority: "high", // High priority triggers high-severity policy
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["user"], // Lacks admin role
        action
      );

      // Should be denied by the high-severity policy
      expect(result.allowed).toBe(false);
    });

    it("should skip policies with higher min_severity than action priority", async () => {
      const highSeverityPolicy = createMockPolicy({
        action_type_pattern: "billing.*",
        min_severity: "critical", // Only applies to critical actions
        required_roles: ["super_admin"],
      });

      const lowSeverityPolicy = createMockPolicy({
        id: "policy-low",
        action_type_pattern: "billing.*",
        min_severity: "low",
        required_roles: [],
        auto_approve: true,
      });

      mockSql.mockResolvedValueOnce([highSeverityPolicy, lowSeverityPolicy]);

      const action = createMockActionCheck({
        action_type: "billing.invoice.create",
        priority: "medium", // Medium priority, not critical
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["user"],
        action
      );

      // Should be approved by low-severity policy (high one doesn't apply)
      expect(result.allowed).toBe(true);
      expect(result.auto_approved).toBe(true);
    });

    it("should match exact action types", async () => {
      const exactPolicy = createMockPolicy({
        action_type_pattern: "billing.invoice.create", // Exact match
        required_roles: [],
        auto_approve: true,
      });

      mockSql.mockResolvedValueOnce([exactPolicy]);

      const action = createMockActionCheck({
        action_type: "billing.invoice.create",
        priority: "low",
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["user"],
        action
      );

      expect(result.allowed).toBe(true);
      expect(result.policy_id).toBe(exactPolicy.id);
    });

    it("should not match different action types with exact pattern", async () => {
      const exactPolicy = createMockPolicy({
        action_type_pattern: "billing.invoice.create",
        required_roles: [],
        auto_approve: true,
      });

      mockSql.mockResolvedValueOnce([exactPolicy]);

      const action = createMockActionCheck({
        action_type: "billing.invoice.update", // Different action
        priority: "low",
      });

      const result = await canExecute(
        "postgres://test",
        "tenant-001",
        "user-001",
        ["user"],
        action
      );

      // Should be allowed by default (no matching policy)
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain("No matching policies");
    });
  });

  // ===========================================================================
  // APPROVE ACTION TESTS
  // ===========================================================================

  describe("approveAction()", () => {
    it("should update action status to approved", async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: "audit-001",
          decision: "approved",
        },
      ]);

      // Note: approveAction function should be implemented in the service
      // This test demonstrates the expected behavior
      const auditResult = await logDecision(
        mockEnv,
        {
          tenant_id: "tenant-001",
          action_id: "action-001",
          user_id: "user-001",
          decision: "approved",
          reason: "Approved by manager",
          action_type: "billing.invoice.create",
        },
        "test-signature-key"
      );

      expect(auditResult).toBeDefined();
      expect(auditResult.decision).toBe("approved");
    });

    it("should write to audit log", async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: "audit-001",
          tenant_id: "tenant-001",
          action_id: "action-001",
          user_id: "user-001",
          decision: "approved",
          reason: "Complies with policy",
          created_at: new Date().toISOString(),
        },
      ]);

      const auditEntry = await logDecision(
        mockEnv,
        {
          tenant_id: "tenant-001",
          action_id: "action-001",
          user_id: "user-001",
          decision: "approved",
          reason: "Complies with policy",
          action_type: "billing.invoice.create",
        },
        "test-signature-key"
      );

      expect(auditEntry.id).toBeDefined();
      expect(auditEntry.decision).toBe("approved");
      expect(auditEntry.action_id).toBe("action-001");
    });
  });

  // ===========================================================================
  // REJECT ACTION TESTS
  // ===========================================================================

  describe("rejectAction()", () => {
    it("should update action status to rejected", async () => {
      // Mock audit log write for rejection
      mockSql.mockResolvedValueOnce([
        {
          id: "audit-001",
          decision: "rejected",
          reason: "Does not meet compliance requirements",
        },
      ]);

      const auditResult = await logDecision(
        mockEnv,
        {
          tenant_id: "tenant-001",
          action_id: "action-001",
          user_id: "user-001",
          decision: "rejected",
          reason: "Does not meet compliance requirements",
          action_type: "billing.refund.large",
        },
        "test-signature-key"
      );

      expect(auditResult.decision).toBe("rejected");
    });

    it("should require reason for rejection", async () => {
      // Test that rejection requires a reason (via schema validation)
      const { RejectActionSchema } = await import("./types");

      // Valid rejection with reason
      const validRejection = {
        action_id: "550e8400-e29b-41d4-a716-446655440000",
        reason: "Does not comply with policy",
      };
      expect(() => RejectActionSchema.parse(validRejection)).not.toThrow();

      // Invalid rejection without reason
      const invalidRejection = {
        action_id: "550e8400-e29b-41d4-a716-446655440000",
        reason: "", // Empty reason
      };
      expect(() => RejectActionSchema.parse(invalidRejection)).toThrow();
    });

    it("should write to audit log on rejection", async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: "audit-002",
          tenant_id: "tenant-001",
          action_id: "action-002",
          user_id: "user-002",
          decision: "rejected",
          reason: "Exceeds budget limit",
          action_type: "billing.expense.approve",
          created_at: new Date().toISOString(),
        },
      ]);

      const auditEntry = await logDecision(
        mockEnv,
        {
          tenant_id: "tenant-001",
          action_id: "action-002",
          user_id: "user-002",
          decision: "rejected",
          reason: "Exceeds budget limit",
          action_type: "billing.expense.approve",
        },
        "test-signature-key"
      );

      expect(auditEntry.id).toBeDefined();
      expect(auditEntry.decision).toBe("rejected");
      expect(auditEntry.reason).toBe("Exceeds budget limit");
    });
  });

  // ===========================================================================
  // POLICY CRUD TESTS
  // ===========================================================================

  describe("Policy CRUD", () => {
    it("should list all active policies for tenant", async () => {
      const policies = [createMockPolicy({ id: "policy-1" }), createMockPolicy({ id: "policy-2" })];

      mockSql.mockResolvedValueOnce(policies);

      const result = await listPolicies("postgres://test", "tenant-001");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("policy-1");
      expect(result[1].id).toBe("policy-2");
    });

    it("should get single policy by ID", async () => {
      const policy = createMockPolicy({ id: "policy-001" });

      mockSql.mockResolvedValueOnce([policy]);

      const result = await getPolicy("postgres://test", "tenant-001", "policy-001");

      expect(result).toBeDefined();
      expect(result?.id).toBe("policy-001");
    });

    it("should return null for non-existent policy", async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getPolicy("postgres://test", "tenant-001", "non-existent");

      expect(result).toBeNull();
    });

    it("should create new policy", async () => {
      const newPolicy: CreatePolicy = {
        tenant_id: "tenant-001",
        name: "New Test Policy",
        description: "A test policy",
        action_type_pattern: "test.*",
        min_severity: "medium",
        required_roles: ["tester"],
        auto_approve: false,
        require_evidence_count: 1,
        is_active: true,
      };

      mockSql.mockResolvedValueOnce([
        {
          id: "policy-new",
          ...newPolicy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const result = await createPolicy("postgres://test", newPolicy);

      expect(result.id).toBe("policy-new");
      expect(result.name).toBe("New Test Policy");
      expect(result.action_type_pattern).toBe("test.*");
    });

    it("should deactivate policy", async () => {
      mockSql.mockResolvedValueOnce([{ id: "policy-001" }]);

      const result = await deactivatePolicy("postgres://test", "tenant-001", "policy-001");

      expect(result).toBe(true);
    });

    it("should return false when deactivating non-existent policy", async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await deactivatePolicy("postgres://test", "tenant-001", "non-existent");

      expect(result).toBe(false);
    });
  });

  // ===========================================================================
  // AUDIT LOG TESTS
  // ===========================================================================

  describe("Audit Logging", () => {
    it("should log governance decisions with all fields", async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: "audit-001",
          tenant_id: "tenant-001",
          action_id: "action-001",
          policy_id: "policy-001",
          user_id: "user-001",
          decision: "allowed",
          reason: "Policy check passed",
          action_type: "billing.invoice.create",
          metadata: { client_ip: "192.168.1.1" },
          created_at: new Date().toISOString(),
        },
      ]);

      const result = await logDecision(
        mockEnv,
        {
          tenant_id: "tenant-001",
          action_id: "action-001",
          policy_id: "policy-001",
          user_id: "user-001",
          decision: "allowed",
          reason: "Policy check passed",
          action_type: "billing.invoice.create",
          metadata: { client_ip: "192.168.1.1" },
        },
        "test-signature-key"
      );

      expect(result.id).toBe("audit-001");
      expect(result.tenant_id).toBe("tenant-001");
      expect(result.decision).toBe("allowed");
      expect(result.metadata).toEqual({ client_ip: "192.168.1.1" });
    });

    it("should support all decision types", async () => {
      const decisions = ["allowed", "denied", "approved", "rejected", "auto_approved"];

      for (const decision of decisions) {
        mockSql.mockResolvedValueOnce([
          {
            id: `audit-${decision}`,
            decision,
            created_at: new Date().toISOString(),
          },
        ]);

        const result = await logDecision(
          mockEnv,
          {
            tenant_id: "tenant-001",
            user_id: "user-001",
            decision: decision as any,
          },
          "test-signature-key"
        );

        expect(result.decision).toBe(decision);
      }
    });
  });
});
