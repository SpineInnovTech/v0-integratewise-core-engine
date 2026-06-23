/**
 * useFlowC — AI Chat Context-to-Truth Loop
 *
 * v3.6 Flow C: AI Chat via MCP → Generate Entities → HITL Review → Write to Spine
 *
 * This hook closes the context-to-truth loop by:
 *   1. Capturing structured entities discovered during AI chat sessions
 *   2. Pushing them through HITL approval (Govern hard gate)
 *   3. Writing approved entities back to the Spine SSOT
 *   4. Tracking which chat sessions produced which truth records
 *
 * Rule: Flow C is ALWAYS HITL — no silent writes to Spine.
 */
import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

export interface DiscoveredEntity {
  type: string;
  data: Record<string, any>;
  confidence: number;
  source: "ai_chat" | "mcp_tool";
  sessionId: string;
}

export interface ContextToTruthResult {
  proposalId: string;
  status: "pending_approval" | "approved" | "rejected";
  entities: DiscoveredEntity[];
  createdAt: string;
}

export function useFlowC() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<ContextToTruthResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Push discovered entities from AI chat to the truth pipeline.
   * This creates a HITL proposal that must be approved before writing to Spine.
   */
  const pushToTruth = useCallback(
    async (
      sessionId: string,
      entities: Array<{ type: string; data: Record<string, any> }>,
      confidence: number
    ) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await apiFetch<ContextToTruthResult>(
          "/api/v1/cognitive/context-to-truth",
          {
            method: "POST",
            body: { sessionId, entities, confidence },
          },
          "ContextToTruth"
        );
        setLastResult(result);
        return result;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  /**
   * Check the status of a previously submitted context-to-truth proposal.
   */
  const checkProposal = useCallback(async (proposalId: string) => {
    try {
      const result = await apiFetch<ContextToTruthResult>(
        `/api/v1/cognitive/context-to-truth/${proposalId}`,
        {},
        "ContextToTruth Status"
      );
      setLastResult(result);
      return result;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, []);

  return {
    isSubmitting,
    lastResult,
    error,
    pushToTruth,
    checkProposal,
  };
}

export default useFlowC;
