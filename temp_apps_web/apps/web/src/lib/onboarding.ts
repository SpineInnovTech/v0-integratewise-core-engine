/**
 * Onboarding State Machine
 *
 * 4-step onboarding flow state management layer:
 *   Step 1: Use-Case Selection → POST /api/v1/workspace/initialize
 *   Step 2: Profile → configure-domain + configure-rbac
 *   Step 3: Connectors → authorize + callback + Creamy Layer poll
 *   Step 4: Activate → POST /api/v1/workspace/activate
 *
 * Responsibilities:
 * - Track current step and step-specific data
 * - Manage per-step states (idle, loading, success, error)
 * - Persist to localStorage (`iw_onboarding_{user_id}`) on every transition
 * - Resume from persisted state on page reload
 * - Emit state changes for React consumption
 *
 * This module is the state management layer ONLY.
 * Actual API calls are implemented in tasks 8.2–8.5.
 *
 * Requirements: R4 (Onboarding Flow via CF Gateway), R11 (Connector OAuth Flow via CF Gateway)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type OnboardingStep = 1 | 2 | 3 | 4;

export type StepStatus = "idle" | "loading" | "success" | "error";

export interface StepState<TData = unknown> {
  status: StepStatus;
  data: TData | null;
  error: string | null;
}

/** Step 1: Use-Case Selection data */
export interface Step1Data {
  domain: string;
  userMetadata?: Record<string, unknown>;
}

/** Step 2: Profile data */
export interface Step2Data {
  domain: string;
  industry?: string;
  role: string;
  department?: string;
}

/** Step 3: Connectors data */
export interface Step3Data {
  connectedProviders: string[];
  pendingProvider?: string;
  syncStatus?: Record<string, "pending" | "syncing" | "completed" | "failed">;
}

/** Step 4: Activate data */
export interface Step4Data {
  activated: boolean;
  workspaceUrl?: string;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
  steps: {
    1: StepState<Step1Data>;
    2: StepState<Step2Data>;
    3: StepState<Step3Data>;
    4: StepState<Step4Data>;
  };
  completedAt?: number; // Unix timestamp when flow was fully completed
}

export type OnboardingEvent = "state_changed" | "step_advanced" | "step_error" | "flow_completed";

export type OnboardingListener = (state: OnboardingState, event: OnboardingEvent) => void;

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_PREFIX = "iw_onboarding_";
const TOTAL_STEPS = 4;

// ─── Default State Factory ───────────────────────────────────────────────────

function createDefaultStepState<T>(): StepState<T> {
  return { status: "idle", data: null, error: null };
}

function createDefaultState(): OnboardingState {
  return {
    currentStep: 1,
    steps: {
      1: createDefaultStepState<Step1Data>(),
      2: createDefaultStepState<Step2Data>(),
      3: createDefaultStepState<Step3Data>(),
      4: createDefaultStepState<Step4Data>(),
    },
  };
}

// ─── Storage Helpers ─────────────────────────────────────────────────────────

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadState(userId: string): OnboardingState | null {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingState;
    // Basic validation: ensure shape is correct
    if (
      typeof parsed.currentStep !== "number" ||
      parsed.currentStep < 1 ||
      parsed.currentStep > TOTAL_STEPS ||
      !parsed.steps
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveState(userId: string, state: OnboardingState): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    // localStorage unavailable or full — degrade gracefully
  }
}

function clearPersistedState(userId: string): void {
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch {
    // ignore
  }
}

// ─── OnboardingMachine Class ─────────────────────────────────────────────────

export class OnboardingMachine {
  private _state: OnboardingState;
  private _userId: string;
  private _listeners: Set<OnboardingListener> = new Set();

  constructor(userId: string) {
    this._userId = userId;

    // Attempt to restore persisted state; fall back to default
    const persisted = loadState(userId);
    this._state = persisted || createDefaultState();
  }

  // ─── Getters ───────────────────────────────────────────────────────────

  /** Current full state snapshot (read-only copy) */
  get state(): OnboardingState {
    return this._state;
  }

  /** Current step number */
  get currentStep(): OnboardingStep {
    return this._state.currentStep;
  }

  /** Get a specific step's state */
  getStepState<S extends OnboardingStep>(step: S): OnboardingState["steps"][S] {
    return this._state.steps[step];
  }

  /** Whether the entire flow has been completed */
  get isCompleted(): boolean {
    return this._state.completedAt != null;
  }

  // ─── State Transitions ─────────────────────────────────────────────────

  /**
   * Mark a step as loading (API call in progress).
   */
  setStepLoading(step: OnboardingStep): void {
    const current = this._state.steps[step];
    (this._state.steps as Record<OnboardingStep, StepState>)[step] = {
      ...current,
      status: "loading",
      error: null,
    };
    this._persist();
    this._emit("state_changed");
  }

  /**
   * Mark a step as successfully completed with its data.
   */
  setStepSuccess(step: OnboardingStep, data: Step1Data | Step2Data | Step3Data | Step4Data): void {
    (this._state.steps as Record<OnboardingStep, StepState>)[step] = {
      status: "success",
      data,
      error: null,
    };
    this._persist();
    this._emit("state_changed");
  }

  /**
   * Mark a step as errored.
   */
  setStepError(step: OnboardingStep, error: string): void {
    const current = this._state.steps[step];
    (this._state.steps as Record<OnboardingStep, StepState>)[step] = {
      ...current,
      status: "error",
      error,
    };
    this._persist();
    this._emit("step_error");
  }

  /**
   * Advance to the next step. Only advances if current step is successful.
   * Returns the new current step, or the same step if advancement conditions aren't met.
   */
  advanceStep(): OnboardingStep {
    const current = this._state.currentStep;
    const currentStepState = this._state.steps[current];

    // Can only advance if the current step has succeeded
    if (currentStepState.status !== "success") {
      return current;
    }

    if (current >= TOTAL_STEPS) {
      // Flow is complete
      this._state.completedAt = Date.now();
      this._persist();
      this._emit("flow_completed");
      return current;
    }

    const nextStep = (current + 1) as OnboardingStep;
    this._state.currentStep = nextStep;
    this._persist();
    this._emit("step_advanced");
    return nextStep;
  }

  /**
   * Go back to a previous step. Only allows going back to steps that have
   * already been visited (completed or current).
   */
  goToStep(step: OnboardingStep): boolean {
    if (step < 1 || step > TOTAL_STEPS) return false;
    // Allow going back to any step up to and including the current one
    if (step > this._state.currentStep) return false;

    this._state.currentStep = step;
    this._persist();
    this._emit("state_changed");
    return true;
  }

  /**
   * Retry the current step — resets its status to idle so the caller can
   * re-execute the API call.
   */
  retryCurrentStep(): void {
    const current = this._state.currentStep;
    const stepState = this._state.steps[current];
    (this._state.steps as Record<OnboardingStep, StepState>)[current] = {
      ...stepState,
      status: "idle",
      error: null,
    };
    this._persist();
    this._emit("state_changed");
  }

  /**
   * Reset the entire onboarding flow (e.g., user wants to start over).
   */
  reset(): void {
    this._state = createDefaultState();
    this._persist();
    this._emit("state_changed");
  }

  /**
   * Clear persisted state and reset in-memory state.
   * Used when the user completes onboarding or cancels permanently.
   */
  clear(): void {
    clearPersistedState(this._userId);
    this._state = createDefaultState();
    this._emit("state_changed");
  }

  // ─── Step 3 Specific: Connector Helpers ────────────────────────────────

  /**
   * Update Step 3 connector data — track which providers are connected
   * and their sync statuses.
   */
  updateConnectorState(update: Partial<Step3Data>): void {
    const current = this._state.steps[3];
    this._state.steps[3] = {
      ...current,
      data: {
        connectedProviders: [],
        ...current.data,
        ...update,
      },
    };
    this._persist();
    this._emit("state_changed");
  }

  // ─── Event Emitter ─────────────────────────────────────────────────────

  /**
   * Subscribe to state changes. Returns an unsubscribe function.
   */
  subscribe(listener: OnboardingListener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  // ─── Private Helpers ───────────────────────────────────────────────────

  private _persist(): void {
    saveState(this._userId, this._state);
  }

  private _emit(event: OnboardingEvent): void {
    for (const listener of this._listeners) {
      try {
        listener(this._state, event);
      } catch {
        // Don't let a bad listener break the state machine
      }
    }
  }
}

// ─── Factory / Singleton Management ──────────────────────────────────────────

/**
 * Cache of machines by user ID. In practice there's usually one user,
 * but this handles edge cases (account switching).
 */
const _machineCache = new Map<string, OnboardingMachine>();

/**
 * Get or create an OnboardingMachine for a given user.
 * Restores persisted state automatically.
 */
export function getOnboardingMachine(userId: string): OnboardingMachine {
  let machine = _machineCache.get(userId);
  if (!machine) {
    machine = new OnboardingMachine(userId);
    _machineCache.set(userId, machine);
  }
  return machine;
}

/**
 * Destroy a cached machine (e.g., on sign-out).
 */
export function destroyOnboardingMachine(userId: string): void {
  _machineCache.delete(userId);
}
