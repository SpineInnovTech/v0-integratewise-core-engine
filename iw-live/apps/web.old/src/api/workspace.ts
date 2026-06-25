/**
 * Workspace API Client
 * Handles: onboarding, initialize-spine, sync progress
 */

import { apiFetch } from "@/lib/api-client";

// Types
export interface InitializeSpineRequest {
  // UI domain (workspace context). Department/trait lives in `department`.
  domain:
    | "CUSTOMER_SUCCESS"
    | "SALES"
    | "REVOPS"
    | "MARKETING"
    | "PRODUCT_ENGINEERING"
    | "FINANCE"
    | "SERVICE"
    | "PROCUREMENT"
    | "BIZOPS";
  industry?: string;
  department?: string;
  connectors: Array<{
    provider: string;
    flowType: "A" | "B" | "C";
    // NOTE: entityTypes is Backend IP - handled internally, never exposed to frontend
  }>;
}

export interface InitializeSpineResponse {
  tenantConfig: {
    id: string;
    domain: string;
    // NOTE: allowedEntityTypes removed - Schema is Backend IP
    connectors: Record<string, any>;
  };
  syncJobs: Array<{
    jobId: string;
    connector: string;
    status: string;
  }>;
}

export interface OnboardingState {
  status: "not_started" | "in_progress" | "completed";
  currentStep: string;
  completedSteps: string[];
  connectorsConfig?: Array<{
    provider: string;
    flowType: "A" | "B" | "C";
    // NOTE: entityTypes removed - Schema is Backend IP
  }>;
  creamyJobId?: string;
  normalizerJobId?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface CompleteOnboardingRequest {
  preferences?: Record<string, any>;
}

export interface CompleteOnboardingResponse {
  success: boolean;
  redirectUrl: string;
  backgroundJobs: Array<{
    jobId: string;
    type: string;
    status: string;
  }>;
}

export interface SyncJob {
  jobId: string;
  connector: string;
  phase: "creamy" | "needed" | "delta";
  status: "pending" | "running" | "completed" | "failed";
  progress: {
    total?: number;
    processed?: number;
    percentage?: number;
    stage?: string;
  };
}

function unwrapData<T>(response: T | { data: T }): T {
  if (response && typeof response === "object" && "data" in response) {
    return response.data;
  }

  return response as T;
}

// API functions
export async function initializeSpine(
  data: InitializeSpineRequest
): Promise<InitializeSpineResponse> {
  const response = await apiFetch<InitializeSpineResponse | { data: InitializeSpineResponse }>(
    "/api/v1/workspace/initialize-spine",
    { method: "POST", body: data },
    "WorkspaceInitializeSpine"
  );
  return unwrapData(response);
}

export async function getOnboardingState(): Promise<{ onboarding: OnboardingState }> {
  const response = await apiFetch<
    { onboarding: OnboardingState } | { data: { onboarding: OnboardingState } }
  >("/api/v1/workspace/onboarding-state", {}, "WorkspaceOnboardingState");
  return unwrapData(response);
}

export async function completeOnboarding(
  data?: CompleteOnboardingRequest
): Promise<CompleteOnboardingResponse> {
  const response = await apiFetch<
    CompleteOnboardingResponse | { data: CompleteOnboardingResponse }
  >(
    "/api/v1/workspace/complete-onboarding",
    { method: "POST", body: data || {} },
    "WorkspaceCompleteOnboarding"
  );
  return unwrapData(response);
}

// Progress subscription uses authenticated polling so it works with the same
// bearer-token path as the rest of the API client.
export function subscribeToProgress(
  onProgress: (jobs: SyncJob[]) => void,
  onError?: (error: Error) => void
): () => void {
  let active = true;

  const poll = async () => {
    try {
      const response = await apiFetch<
        | { type: "sync_progress"; jobs: SyncJob[] }
        | { data: { type: "sync_progress"; jobs: SyncJob[] } }
      >("/api/v1/workspace/progress", {}, "WorkspaceProgress");
      const data = unwrapData(response);

      if (active && data.type === "sync_progress") {
        onProgress(data.jobs);
      }
    } catch (error) {
      if (active) {
        onError?.(error instanceof Error ? error : new Error("Progress polling failed"));
      }
    }
  };

  poll();
  const interval = window.setInterval(poll, 2000);

  return () => {
    active = false;
    window.clearInterval(interval);
  };
}

// Creamy layer specific progress
export interface CreamyProgress {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: {
    total: number;
    processed: number;
    percentage: number;
  };
  extractedCount: number;
  message?: string;
}

export async function getCreamyProgress(jobId: string): Promise<CreamyProgress> {
  const response = await apiFetch<CreamyProgress | { data: CreamyProgress }>(
    `/api/v1/loader/creamy/${jobId}`,
    {},
    `CreamyProgress(${jobId})`
  );
  return unwrapData(response);
}
