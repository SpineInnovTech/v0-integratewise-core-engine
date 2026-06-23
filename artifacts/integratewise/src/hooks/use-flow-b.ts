/**
 * useFlowB — Document Processing Feedback Loop
 *
 * v3.6 Flow B: Unstructured Docs → R2 upload → chunking → extraction → FEEDBACK → Spine
 *
 * This hook closes the feedback loop by:
 *   1. Tracking processing status of uploaded documents
 *   2. Allowing users to review/correct extracted entities
 *   3. Submitting feedback that refines the extraction pipeline
 *   4. Re-processing documents after corrections
 */
import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

export interface ExtractionResult {
  id: string;
  documentId: string;
  field: string;
  extractedValue: any;
  confidence: number;
  source: string;
  status: "pending_review" | "approved" | "corrected" | "rejected";
}

export interface ProcessingStatus {
  documentId: string;
  status: "uploading" | "chunking" | "extracting" | "validating" | "review" | "complete" | "error";
  progress: number;
  extractions: ExtractionResult[];
  error?: string;
}

export interface FlowBCorrection {
  field: string;
  original: any;
  corrected: any;
}

export function useFlowB() {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /** Check processing status of a document */
  const checkStatus = useCallback(async (documentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFetch<ProcessingStatus>(
        `/api/v1/knowledge/processing-status/${documentId}`,
        {},
        "FlowB Status"
      );
      setStatus(result);
      return result;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Submit feedback on extraction results (closes the loop) */
  const submitFeedback = useCallback(
    async (
      documentId: string,
      extractionId: string,
      corrections: FlowBCorrection[],
      approved: boolean
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await apiFetch(
          "/api/v1/knowledge/extraction-feedback",
          {
            method: "POST",
            body: { documentId, extractionId, corrections, approved },
          },
          "FlowB Feedback"
        );
        // Refresh status after feedback
        await checkStatus(documentId);
        return result;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [checkStatus]
  );

  /** Re-process document after corrections */
  const reprocess = useCallback(
    async (documentId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await apiFetch(
          `/api/v1/knowledge/reprocess/${documentId}`,
          { method: "POST" },
          "FlowB Reprocess"
        );
        // Start polling status
        await checkStatus(documentId);
        return result;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [checkStatus]
  );

  return {
    status,
    isLoading,
    error,
    checkStatus,
    submitFeedback,
    reprocess,
  };
}

export default useFlowB;
