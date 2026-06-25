/**
 * Governed Cognition Proposal - Test Suite
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { scoreProposal, executeAction, createProposal } from "./proposal";
import type { Proposal, ProposalStatus } from "@integratewise/types";

// =============================================================================
// MOCK D1 DATABASE
// =============================================================================

const createMockD1 = () => {
  const prepareMock = vi.fn();
  const bindMock = vi.fn();
  const firstMock = vi.fn();
  const allMock = vi.fn();
  const runMock = vi.fn();

  let activeSql = "";
  let boundStatus: string | null = null;

  // Chain bindings
  prepareMock.mockImplementation((sql) => {
    activeSql = sql;
    return {
      bind: bindMock.mockImplementation((...args) => {
        if (sql.includes("UPDATE governance_data")) {
          boundStatus = args[0];
        }
        return {
          first: firstMock,
          all: allMock,
          run: runMock,
        };
      }),
      first: firstMock,
      all: allMock,
      run: runMock,
    };
  });

  return {
    db: {
      prepare: prepareMock,
    } as any,
    prepareMock,
    bindMock,
    firstMock,
    allMock,
    runMock,
    getActiveSql: () => activeSql,
    getBoundStatus: () => boundStatus,
    setBoundStatus: (status: string | null) => {
      boundStatus = status;
    },
  };
};

const mockEnv = {
  D1: {} as any,
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_KEY: "test-key",
  CACHE: {
    delete: vi.fn().mockResolvedValue(undefined),
  } as any,
  ENVIRONMENT: "test",
  SIGNATURE_KEY: "test-signature-key",
  BFF: {
    fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))),
  } as any,
};

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const createTestProposal = (overrides: Partial<Proposal> = {}): Proposal => ({
  id: "proposal-001",
  tenant_id: "tenant-001",
  status: "pending_review",
  governance_level: "manual",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  originating_entity_id: "account-001",
  originating_entity_type: "account",
  originating_signal: {
    signal_id: "signal-001",
    signal_category: "churn_risk",
    signal_confidence: 0.9,
    signal_severity: "high",
    key_indicators: [{ name: "nps", value: 12, trend: "down" }],
    reasoning: "Account has low NPS and high churn probability.",
  },
  lineage_id: "lineage-001",
  action_type: "create_task",
  action_target: {
    entity_id: "task-001",
    entity_type: "task",
  },
  action_parameters: {
    priority: "high",
    due_date: "2026-06-15",
  },
  action_description:
    "Proactively send comprehensive onboarding guidelines, platform usage setup instructions, and best practice documentation email to the primary stakeholder to drive adoption.",
  confidence: 0.92,
  reasoning_summary:
    "High confidence signal derived from platform usage data indicating that the customer has reached their key milestone and is highly interested in further technical optimization and advanced setup configurations.",
  evidence_count: 5,
  ops_priority: "high",
  ops_surface: "queue",
  ...overrides,
});

// =============================================================================
// TEST CASES
// =============================================================================

describe("Governed Proposal Scoring & Operator Execution", () => {
  let mockD1: ReturnType<typeof createMockD1>;

  beforeEach(() => {
    mockD1 = createMockD1();
    vi.clearAllMocks();

    // Set default behavior for first() based on prepared SQL
    mockD1.firstMock.mockImplementation(() => {
      const sql = mockD1.getActiveSql();
      if (sql.includes("FROM governance_data")) {
        if (sql.includes("type = 'sync_status'")) {
          return null;
        }
        const currentStatus = mockD1.getBoundStatus() || "approved";
        return {
          proposal_data: JSON.stringify({
            id: "proposal-001",
            tenant_id: "tenant-001",
            status: currentStatus, // Returns the dynamically updated status!
            governance_level: "manual",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            originating_entity_id: "account-001",
            originating_entity_type: "account",
            originating_signal: {
              signal_id: "signal-001",
              signal_category: "churn_risk",
              signal_confidence: 0.9,
              signal_severity: "high",
              key_indicators: [{ name: "nps", value: 12, trend: "down" }],
              reasoning: "Account has low NPS.",
            },
            lineage_id: "lineage-001",
            action_type: "create_task",
            action_target: {
              entity_id: "task-001",
              entity_type: "task",
            },
            action_parameters: {
              priority: "high",
              due_date: "2026-06-15",
            },
            action_description:
              "Proactively send comprehensive onboarding guidelines, platform usage setup instructions, and best practice documentation email to the primary stakeholder to drive adoption.",
            confidence: 0.92,
            reasoning_summary:
              "High confidence signal derived from platform usage data indicating that the customer has reached their key milestone and is highly interested in further technical optimization and advanced setup configurations.",
            evidence_count: 5,
            ops_priority: "high",
            ops_surface: "queue",
          }),
        };
      }
      if (
        sql.includes("FROM grow_data") ||
        sql.includes("FROM build_data") ||
        sql.includes("SELECT 1 FROM")
      ) {
        return {
          id: "account-100",
          data: JSON.stringify({
            id: "account-100",
            name: "Acme Corp",
            health_score: 80,
          }),
        };
      }
      return null;
    });

    mockD1.allMock.mockImplementation(() => {
      return { results: [] };
    });
  });

  describe("scoreProposal()", () => {
    it("should score high-quality, high-evidence proposal for auto-approval (>= 0.85)", async () => {
      const proposal = createTestProposal();

      const result = await scoreProposal(mockD1.db, proposal);

      expect(result.score).toBeGreaterThanOrEqual(0.85);
      expect(result.decision).toBe("auto_approved");
      expect(result.breakdown.evidence_quality).toBe(1.0);
      expect(result.breakdown.category_fit).toBe(1.0);
      expect(result.breakdown.novelty).toBe(1.0);
    });

    it("should auto-reject vague proposals with low specificity (< 0.60)", async () => {
      const proposal = createTestProposal({
        evidence_count: 0,
        confidence: 0.4,
        originating_signal: {
          signal_id: "signal-002",
          signal_category: "unknown_category",
          signal_confidence: 0.4,
          signal_severity: "low",
          key_indicators: [],
          reasoning: "Vague warning.",
        },
        action_description: "do something vague stuff",
        reasoning_summary: "something vague happened somewhere basically",
        originating_entity_id: "", // no grounding
      });

      // Override mock for entity existence to return null
      mockD1.firstMock.mockImplementation(() => {
        const sql = mockD1.getActiveSql();
        if (sql.includes("SELECT 1 FROM")) {
          return null;
        }
        return null;
      });

      const result = await scoreProposal(mockD1.db, proposal);

      expect(result.score).toBeLessThan(0.6);
      expect(result.decision).toBe("rejected");
      expect(result.reasoning).toContain("Auto-rejected");
    });
  });

  describe("createProposal() User Bypass", () => {
    it("should bypass scoring and stage directly to pending_review if source is user", async () => {
      const input = {
        tenant_id: "tenant-001",
        originating_entity_id: "account-001",
        originating_entity_type: "account",
        originating_signal: {
          signal_id: "sig-123",
          signal_category: "doctrine",
          signal_confidence: 0.9,
          signal_severity: "medium" as const,
          key_indicators: [],
          reasoning: "Manual user input",
        },
        action_type: "create_task" as const,
        action_target: { entity_id: "task-001", entity_type: "task" },
        action_parameters: {},
        action_description: "User guidelines memory record",
        confidence: 1.0,
        reasoning_summary: "I want to manually remember this decision",
        source: "user",
      };

      const env = { ...mockEnv, D1: mockD1.db };
      const proposal = await createProposal(env, input as any);

      expect(proposal.status).toBe("pending_review");
      expect(proposal.governance_level).toBe("manual");
      expect(proposal.review_notes).toBe("User-initiated proposal bypassing triage scoring.");
    });
  });

  describe("executeAction()", () => {
    it("should execute create_task by inserting to build_data and link_data D1 tables and logging lineage", async () => {
      const proposal = createTestProposal({
        action_type: "create_task",
        action_target: {
          entity_id: "task-100",
          entity_type: "task",
        },
        action_parameters: {
          priority: "urgent",
          doc_type: "Playbook",
        },
      });

      mockD1.runMock.mockResolvedValue({ success: true });

      const env = { ...mockEnv, D1: mockD1.db };

      await executeAction(env, proposal);

      expect(mockD1.prepareMock).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO build_data")
      );
      expect(mockD1.prepareMock).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO link_data")
      );
      expect(mockD1.prepareMock).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE governance_data")
      );
      expect(env.BFF.fetch).toHaveBeenCalled();
    });

    it("should execute update_entity by merging parameters, updating D1, invalidating KV, and logging lineage", async () => {
      const proposal = createTestProposal({
        action_type: "update_entity",
        action_target: {
          entity_id: "account-100",
          entity_type: "account",
        },
        action_parameters: {
          health_score: 95,
        },
      });

      mockD1.runMock.mockResolvedValue({ success: true });

      const env = { ...mockEnv, D1: mockD1.db };

      await executeAction(env, proposal);

      expect(mockD1.prepareMock).toHaveBeenCalledWith(expect.stringContaining("UPDATE grow_data"));
      expect(env.CACHE.delete).toHaveBeenCalledWith("entity:account-100");
      expect(env.BFF.fetch).toHaveBeenCalled();
    });

    it("should simulate external writeback and log lineage when connector is not connected", async () => {
      const proposal = createTestProposal({
        action_type: "archive_entity",
        action_target: {
          tool: "salesforce",
          entity_id: "sf-contact-123",
          entity_type: "contact",
        },
      });

      mockD1.runMock.mockResolvedValue({ success: true });

      const env = { ...mockEnv, D1: mockD1.db };

      await executeAction(env, proposal);

      // Verify UPDATE statement to complete proposal with simulated suffix
      expect(mockD1.prepareMock).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE governance_data")
      );
      expect(env.BFF.fetch).toHaveBeenCalled();
    });
  });
});
