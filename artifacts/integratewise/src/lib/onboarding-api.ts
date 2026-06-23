/**
 * Onboarding API Integration (CF Gateway)
 *
 * Implements 4-step onboarding flow API calls routed through GatewayHttpClient:
 *   Step 1: initializeWorkspace → POST /api/v1/workspace/initialize
 *   Step 2: configureProfile → configure-domain + configure-rbac
 *   Step 3: authorizeConnector → OAuth redirect + callback
 *   Step 4: activateWorkspace → POST /api/v1/workspace/activate
 *
 * Each step integrates with OnboardingMachine for state tracking:
 *   - Sets step to loading before API call
 *   - Sets step data on success + advances
 *   - Sets step error on failure
 *   - Persistence handled automatically by OnboardingMachine (localStorage)
 *
 * Retry logic: retryCurrentStep() resets status to idle → caller re-invokes step function.
 *
 * Requirements: R4 (Onboarding Flow via CF Gateway), R11 (Connector OAuth Flow)
 */

import { gatewayClient } from "./gateway-client";
import {
  type OnboardingMachine,
  type Step1Data,
  type Step2Data,
  type Step3Data,
  type Step4Data,
  getOnboardingMachine,
} from "./onboarding";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface InitializeWorkspaceParams {
  domain: string;
  userMetadata?: Record<string, unknown>;
}

export interface InitializeWorkspaceResult {
  tenantId: string;
  workspaceId: string;
  slug?: string;
}

export interface ConfigureProfileParams {
  domain: string;
  industry?: string;
  role: string;
  department?: string;
}

export interface AuthorizeConnectorResult {
  authUrl: string;
  state: string;
}

export interface ConnectorCallbackParams {
  provider: string;
  code: string;
  state: string;
}

export interface ActivateWorkspaceResult {
  workspaceUrl?: string;
  initialPath?: string;
  hydrationStatus?: "pending" | "hydrating" | "ready";
}

// ─── Session Storage Keys ────────────────────────────────────────────────────

const OAUTH_STATE_KEY = "iw_oauth_state";
const OAUTH_PROVIDER_KEY = "iw_oauth_provider";

// ─── Step 1: Initialize Workspace ────────────────────────────────────────────

/**
 * Step 1: Creates the workspace/tenant via CF Gateway.
 *
 * Flow:
 *  1. Sets step 1 to loading
 *  2. POST /api/v1/workspace/initialize { domain, user_metadata }
 *  3. On success: sets step 1 data, advances to step 2
 *  4. On error: sets step 1 error
 */
export async function initializeWorkspace(
  machine: OnboardingMachine,
  params: InitializeWorkspaceParams
): Promise<InitializeWorkspaceResult> {
  machine.setStepLoading(1);

  try {
    const result = await gatewayClient.post<InitializeWorkspaceResult>(
      "/api/v1/workspace/initialize",
      {
        domain: params.domain,
        user_metadata: params.userMetadata,
      }
    );

    const stepData: Step1Data = {
      domain: params.domain,
      userMetadata: params.userMetadata,
    };

    machine.setStepSuccess(1, stepData);
    machine.advanceStep();

    return result;
  } catch (err: unknown) {
    const message = extractErrorMessage(err);
    machine.setStepError(1, message);
    throw err;
  }
}

// ─── Step 2: Configure Profile (Domain + RBAC) ──────────────────────────────

/**
 * Step 2: Configures domain schema and RBAC role assignment.
 *
 * Flow:
 *  1. Sets step 2 to loading
 *  2. Calls both configure-domain and configure-rbac in parallel
 *  3. On success of both: sets step 2 data, advances to step 3
 *  4. On error of either: sets step 2 error
 */
export async function configureProfile(
  machine: OnboardingMachine,
  params: ConfigureProfileParams
): Promise<void> {
  machine.setStepLoading(2);

  try {
    await Promise.all([
      gatewayClient.post("/api/v1/workspace/configure-domain", {
        domain: params.domain,
        industry: params.industry,
      }),
      gatewayClient.post("/api/v1/workspace/configure-rbac", {
        role: params.role,
        department: params.department,
      }),
    ]);

    const stepData: Step2Data = {
      domain: params.domain,
      industry: params.industry,
      role: params.role,
      department: params.department,
    };

    machine.setStepSuccess(2, stepData);
    machine.advanceStep();
  } catch (err: unknown) {
    const message = extractErrorMessage(err);
    machine.setStepError(2, message);
    throw err;
  }
}

// ─── Step 3: Connector OAuth ─────────────────────────────────────────────────

/**
 * Step 3a: Initiates OAuth authorization for a connector provider.
 *
 * Flow:
 *  1. Calls GET /api/v1/connectors/{provider}/authorize
 *  2. Stores OAuth state in sessionStorage for CSRF validation
 *  3. Redirects user to provider's OAuth consent page
 *
 * Note: Does NOT set step loading here — the redirect leaves the page.
 * On return (callback), handleConnectorCallback completes the flow.
 */
export async function authorizeConnector(
  machine: OnboardingMachine,
  provider: string
): Promise<AuthorizeConnectorResult | null> {
  // Update connector state to track pending provider
  machine.updateConnectorState({ pendingProvider: provider });

  try {
    const result = await gatewayClient.get<{
      authUrl: string | null;
      state: string | null;
      provider: string;
      authReady?: boolean;
    }>(`/api/v1/connectors/${provider}/authorize`, {
      origin: typeof window !== "undefined" ? window.location.origin : "",
    });

    if (!result?.authUrl || !result?.state) {
      machine.updateConnectorState({ pendingProvider: undefined });
      return null;
    }

    // Store state for CSRF validation on callback
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(OAUTH_STATE_KEY, result.state);
      sessionStorage.setItem(OAUTH_PROVIDER_KEY, provider);
    }

    return { authUrl: result.authUrl, state: result.state };
  } catch (err: unknown) {
    const message = extractErrorMessage(err);
    machine.setStepError(3, message);
    machine.updateConnectorState({ pendingProvider: undefined });
    throw err;
  }
}

/**
 * Step 3b: Handles the OAuth callback after user returns from provider.
 *
 * Flow:
 *  1. Validates state parameter against stored value (CSRF check)
 *  2. Calls GET /api/v1/connectors/{provider}/callback?code&state
 *  3. On success: updates connected providers in step 3 data
 *  4. On error: sets step 3 error
 */
export async function handleConnectorCallback(
  machine: OnboardingMachine,
  params: ConnectorCallbackParams
): Promise<void> {
  // CSRF validation: compare callback state with stored state
  const storedState =
    typeof sessionStorage !== "undefined" ? sessionStorage.getItem(OAUTH_STATE_KEY) : null;

  if (storedState && storedState !== params.state) {
    const error = "OAuth state mismatch — possible CSRF attack. Please retry the connection.";
    machine.setStepError(3, error);
    clearOAuthSessionState();
    throw new Error(error);
  }

  machine.setStepLoading(3);

  try {
    await gatewayClient.get(`/api/v1/connectors/${params.provider}/callback`, {
      code: params.code,
      state: params.state,
    });

    // Update connected providers list
    const currentStep3 = machine.getStepState(3);
    const connectedProviders = [...(currentStep3.data?.connectedProviders || [])];
    if (!connectedProviders.includes(params.provider)) {
      connectedProviders.push(params.provider);
    }

    const stepData: Step3Data = {
      connectedProviders,
      pendingProvider: undefined,
      syncStatus: {
        ...(currentStep3.data?.syncStatus || {}),
        [params.provider]: "pending",
      },
    };

    machine.setStepSuccess(3, stepData);
    clearOAuthSessionState();
  } catch (err: unknown) {
    const message = extractErrorMessage(err);
    machine.setStepError(3, message);
    clearOAuthSessionState();
    throw err;
  }
}

/**
 * Step 3c: Marks step 3 complete and advances (when user is done connecting providers).
 * Called when user clicks "Continue" / "Skip" on the connectors step.
 */
export function finalizeConnectorStep(machine: OnboardingMachine): void {
  const currentStep3 = machine.getStepState(3);

  // If already successful, just advance
  if (currentStep3.status === "success") {
    machine.advanceStep();
    return;
  }

  // Mark success with whatever providers are connected (can be empty = skipped)
  const stepData: Step3Data = {
    connectedProviders: currentStep3.data?.connectedProviders || [],
    syncStatus: currentStep3.data?.syncStatus || {},
  };

  machine.setStepSuccess(3, stepData);
  machine.advanceStep();
}

/**
 * Update sync status for a specific connector provider.
 * Called by Creamy Layer polling (task 9) to reflect pipeline progress.
 */
export function updateConnectorSyncStatus(
  machine: OnboardingMachine,
  provider: string,
  status: "pending" | "syncing" | "completed" | "failed"
): void {
  machine.updateConnectorState({
    syncStatus: {
      ...(machine.getStepState(3).data?.syncStatus || {}),
      [provider]: status,
    },
  });
}

// ─── Step 4: Activate Workspace ──────────────────────────────────────────────

/**
 * Step 4: Finalizes workspace activation.
 *
 * Flow:
 *  1. Sets step 4 to loading
 *  2. POST /api/v1/workspace/activate
 *  3. On success: marks step 4 complete, advances (triggers flow_completed)
 *  4. On error: sets step 4 error
 */
export async function activateWorkspace(
  machine: OnboardingMachine
): Promise<ActivateWorkspaceResult> {
  machine.setStepLoading(4);

  try {
    const result = await gatewayClient.post<ActivateWorkspaceResult>(
      "/api/v1/workspace/activate",
      {}
    );

    const stepData: Step4Data = {
      activated: true,
      workspaceUrl: result.workspaceUrl,
    };

    machine.setStepSuccess(4, stepData);
    machine.advanceStep(); // Triggers flow_completed event

    // Clear persisted onboarding state on successful activation
    machine.clear();

    return result;
  } catch (err: unknown) {
    const message = extractErrorMessage(err);
    machine.setStepError(4, message);
    throw err;
  }
}

// ─── Retry Logic ─────────────────────────────────────────────────────────────

/**
 * Retry the current step's API call.
 *
 * Resets the current step to idle via OnboardingMachine.retryCurrentStep(),
 * then re-executes the appropriate step function.
 *
 * The caller must provide the original params for the step being retried.
 */
export async function retryCurrentStep(
  machine: OnboardingMachine,
  stepParams: {
    step1?: InitializeWorkspaceParams;
    step2?: ConfigureProfileParams;
    step3Provider?: string;
    step3Callback?: ConnectorCallbackParams;
  }
): Promise<void> {
  machine.retryCurrentStep();

  const step = machine.currentStep;

  switch (step) {
    case 1:
      if (stepParams.step1) {
        await initializeWorkspace(machine, stepParams.step1);
      }
      break;
    case 2:
      if (stepParams.step2) {
        await configureProfile(machine, stepParams.step2);
      }
      break;
    case 3:
      if (stepParams.step3Callback) {
        await handleConnectorCallback(machine, stepParams.step3Callback);
      } else if (stepParams.step3Provider) {
        await authorizeConnector(machine, stepParams.step3Provider);
      }
      break;
    case 4:
      await activateWorkspace(machine);
      break;
  }
}

// ─── Resume On Reload ────────────────────────────────────────────────────────

/**
 * Resume onboarding flow from persisted state.
 *
 * The OnboardingMachine constructor already restores from localStorage.
 * This function checks if there's an in-progress OAuth callback that
 * needs to be completed (user redirected back from provider).
 *
 * Call this on page load when the onboarding route is active.
 */
export function resumeOnboarding(userId: string): {
  machine: OnboardingMachine;
  hasPendingCallback: boolean;
  pendingProvider?: string;
} {
  const machine = getOnboardingMachine(userId);

  // Check for pending OAuth callback (user returned from provider redirect)
  const pendingProvider =
    typeof sessionStorage !== "undefined" ? sessionStorage.getItem(OAUTH_PROVIDER_KEY) : null;

  return {
    machine,
    hasPendingCallback: !!pendingProvider,
    pendingProvider: pendingProvider || undefined,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    if ("message" in err && typeof (err as { message: unknown }).message === "string") {
      return (err as { message: string }).message;
    }
  }
  return "An unexpected error occurred. Please try again.";
}

function clearOAuthSessionState(): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_PROVIDER_KEY);
  }
}

// ─── Legacy Exports (used by existing components) ────────────────────────────

/**
 * Check if the workspace is ready after activation.
 * Used by WorkplaceLoading component for polling readiness.
 */
export async function checkWorkspaceReady(tenantId: string): Promise<boolean> {
  try {
    const result = await gatewayClient.get<{ ready: boolean; status?: string }>(
      "/api/v1/workspace/ready",
      { tenantId }
    );
    return result?.ready === true;
  } catch {
    return false;
  }
}

/**
 * Trigger connector hydration after workspace activation.
 * Non-critical — will retry on next app load if it fails.
 */
export async function triggerConnectorHydration(): Promise<void> {
  await gatewayClient.post("/api/v1/workspace/hydrate-connectors", {});
}
