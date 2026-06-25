/**
 * Twin Activation (spine-hydration-lifecycle Phase 7 / R12).
 *
 * The Twin activates because CONTINUITY EXISTS — not because onboarding finished.
 * Until enough memory/signals have formed, the Twin stays in a limited state and
 * tells the user continuity is still forming, rather than answering blind and
 * hallucinating. Pure + deterministic (unit-testable).
 */

export interface ActivationThresholds {
  minMemories: number;
  minSignals: number;
  requireCreamy: boolean;
}

export interface ContinuitySnapshot {
  /** Total promoted memories assembled into Continuity. */
  totalMemories: number;
  /** Number of signals available to the tenant (optional; 0 if unknown). */
  signalsAvailable?: number;
  /** Whether the Creamy first-sync has completed. */
  creamyComplete?: boolean;
}

export interface ActivationState {
  active: boolean;
  reasons: string[];
  thresholds: ActivationThresholds;
  snapshot: ContinuitySnapshot;
}

/**
 * Default thresholds. Configurable per Identity (R12.4): callers may pass
 * identity-derived thresholds; these are the safe defaults.
 */
export const DEFAULT_ACTIVATION_THRESHOLDS: ActivationThresholds = {
  minMemories: 3,
  minSignals: 0,
  requireCreamy: false,
};

/**
 * Pure activation evaluation. Returns active=true only when every threshold is
 * met; otherwise active=false with human-readable reasons describing what is
 * still forming.
 */
export function evaluateActivation(
  snapshot: ContinuitySnapshot,
  thresholds: ActivationThresholds = DEFAULT_ACTIVATION_THRESHOLDS
): ActivationState {
  const reasons: string[] = [];
  const memories = snapshot.totalMemories ?? 0;
  const signals = snapshot.signalsAvailable ?? 0;

  if (thresholds.requireCreamy && !snapshot.creamyComplete) {
    reasons.push("Creamy first-sync is not complete yet.");
  }
  if (memories < thresholds.minMemories) {
    reasons.push(
      `Continuity is still forming: ${memories}/${thresholds.minMemories} memories promoted.`
    );
  }
  if (signals < thresholds.minSignals) {
    reasons.push(`Awaiting signals: ${signals}/${thresholds.minSignals}.`);
  }

  return {
    active: reasons.length === 0,
    reasons,
    thresholds,
    snapshot,
  };
}
