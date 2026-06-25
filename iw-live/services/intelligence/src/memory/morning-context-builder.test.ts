import { describe, it, expect, vi } from "vitest";
import { MorningContextBuilder } from "./morning-context-builder";
import { MorningContextSchema } from "@integratewise/types";

describe("MorningContextBuilder", () => {
  it("should compile a fully populated MorningContext that satisfies the validation schema", async () => {
    // 1. Stub the D1 prepare and query results
    const mockD1 = {
      prepare: vi.fn().mockImplementation((query: string) => {
        return {
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockImplementation(async () => {
            if (query.includes("calendar_event")) {
              return {
                results: [
                  {
                    id: "evt-1",
                    name: "Strategy Standup",
                    data: JSON.stringify({
                      tenant_id: "tenant-123",
                      title: "Strategy Standup",
                      time: "09:00 AM",
                    }),
                  },
                ],
              };
            } else if (query.includes("ops_metric")) {
              return {
                results: [
                  {
                    id: "metric-1",
                    name: "CSAT Score",
                    data: JSON.stringify({
                      tenant_id: "tenant-123",
                      name: "CSAT Score",
                      value: 94.5,
                      target: 95.0,
                      trend: "up",
                    }),
                  },
                ],
              };
            } else if (query.includes("task") && query.includes("build_data")) {
              return {
                results: [
                  {
                    id: "tsk-1",
                    name: "Resolve Jira Ticket",
                    status: "active",
                    data: JSON.stringify({
                      tenant_id: "tenant-123",
                      title: "Resolve Jira Ticket",
                      priority: "high",
                      description: "Investigate and solve high-priority issue",
                      due_date: "2026-06-03T18:00:00Z",
                    }),
                  },
                ],
              };
            } else if (query.includes("governance_data")) {
              return {
                results: [
                  {
                    id: "gov-1",
                    status: "pending_review",
                    score: 0.85,
                    proposal_data: JSON.stringify({
                      tenant_id: "tenant-123",
                      action_type: "HubSpot Write Back",
                      action_description: "Approve HubSpot client syncing data payload",
                    }),
                  },
                ],
              };
            } else if (query.includes("cross_data") && query.includes("signal")) {
              return {
                results: [
                  {
                    id: "sig-1",
                    name: "At-Risk Account Signal",
                    severity: "critical",
                    category: "customer_success",
                    data: JSON.stringify({
                      tenant_id: "tenant-123",
                      title: "At-Risk Account Signal",
                      description: "Customer ACME Corp shows low activity",
                    }),
                  },
                ],
              };
            } else if (query.includes("conversational_memory")) {
              return {
                results: [
                  { role: "user", content: "Can you summarize the day?" },
                  { role: "assistant", content: "Sure, let's look at the metrics." },
                ],
              };
            } else if (query.includes("personal_memory")) {
              return {
                results: [
                  {
                    category: "preference",
                    title: "Focus Area",
                    content: "Focus on closing critical signals and high impact tasks.",
                  },
                ],
              };
            }
            return { results: [] };
          }),
        };
      }),
    };

    const mockEnv = {
      D1: mockD1 as any,
    } as any;

    const builder = new MorningContextBuilder(mockEnv);

    // 2. Build the Morning Context
    const morningContext = await builder.build("tenant-123", "user-456", "session-789");

    // 3. Assert properties and Zod validation structure
    expect(morningContext).toBeDefined();

    // Validate with MorningContextSchema
    const validation = MorningContextSchema.safeParse(morningContext);
    expect(validation.success).toBe(true);

    if (validation.success) {
      const data = validation.data;
      expect(data.day_overview.schedule[0].title).toBe("Strategy Standup");
      expect(data.day_overview.kpis[0].trend).toBe("up");
      expect(data.priorities[0].priority).toBe("high");
      expect(data.commitments[0].due_date).toBe("2026-06-03T18:00:00Z");
      expect(data.pending_decisions[0].score).toBe(0.85);
      expect(data.unresolved_items[0].severity).toBe("critical");
      expect(data.active_conversations).toContain("[user] Can you summarize the day?");
      expect(data.active_conversations).toContain("[assistant] Sure, let's look at the metrics.");
      expect(data.strategic_focus).toContain(
        "[preference] Focus Area: Focus on closing critical signals"
      );
    }
  });
});
