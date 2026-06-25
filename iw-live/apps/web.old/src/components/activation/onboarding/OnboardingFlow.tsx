/**
 * Onboarding Flow - Redesigned UI & Pipeline Sequence
 *
 * Pipeline Sequence:
 * signup → welcome → profile (spine hydration) → goals → connector → [CF auth gate] → AI Loader (creamy) → Normalizer → Spine → User Workbench
 *
 * Steps:
 * 0. Welcome (use case: Personal/Work/Business)
 * 1. Profile (industry + department + company size) → Spine schema initialized immediately
 * 2. Goals & Workspace (goals + workspace creation)
 * 3. Connectors (data sources with Flow A/B/C) → OAuth + data ingestion triggered
 * 4. AILoader (creamy layer extraction progress)
 * 5. WorkplaceLoading (normalizer/spine/traits/ui stages)
 *
 * PRINCIPLE: Schema is Backend IP - Frontend NEVER sees entity_type, field names, or schema structure.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { initializeSpine, completeOnboarding } from "@/api/workspace";
import { apiFetch } from "@/lib/api-client";
import { triggerConnectorHydration } from "@/lib/onboarding-api";
import { useAuth } from "@/components/core/auth/auth-provider";
import { Logo } from "@/components/common/brand/logo";

import { WelcomeStep } from "./steps/WelcomeStep";
import { ProfileStep } from "./steps/ProfileStep";
import { GoalsStep } from "./steps/GoalsStep";
import { ConnectorsStep } from "./steps/ConnectorsStep";
import { AILoader } from "./AILoader";
import { WorkplaceLoading } from "./WorkplaceLoading";

interface OnboardingData {
  useCase?: "personal" | "work" | "business";
  industry?: string;
  department?: string;
  companySize?: string;
  goal?: string;
  workspaceName?: string;
  workspaceType?: string;
  connectors: Array<{ provider: string; flowType: "A" | "B" | "C" }>;
  creamyJobId?: string; // job ID passed to AILoader for real-time progress
  spineInitialized?: boolean;
}

const USE_CASE_DOMAINS: Record<string, Record<string, string>> = {
  personal: { default: "PERSONAL" },
  work: {}, // no default domain for work use case; domain derived strictly from department selection
  business: {
    SALES: "SALES",
    MARKETING: "MARKETING",
    REVOPS: "REVOPS",
    CUSTOMER_SUCCESS: "CUSTOMER_SUCCESS",
    ENGINEERING: "PRODUCT_ENGINEERING",
    PRODUCT: "PRODUCT_ENGINEERING",
    IT: "PRODUCT_ENGINEERING",
    OPERATIONS: "CUSTOMER_SUCCESS",
    SUPPLY_CHAIN: "PROCUREMENT",
    SERVICE_OPS: "SERVICE",
    PROJECT_MANAGEMENT: "CUSTOMER_SUCCESS",
    FINANCE: "FINANCE",
    LEGAL: "CUSTOMER_SUCCESS",
    HR: "CUSTOMER_SUCCESS",
    default: "CUSTOMER_SUCCESS",
  },
};

const DEPARTMENT_CTX_MAP: Record<string, string> = {
  SALES: "CTX_SALES",
  MARKETING: "CTX_MARKETING",
  REVOPS: "CTX_REVOPS",
  CUSTOMER_SUCCESS: "CTX_CS",
  SUPPORT: "CTX_SUPPORT",
  ENGINEERING: "CTX_TECH",
  PRODUCT: "CTX_PRODUCT",
  IT: "CTX_TECH",
  OPERATIONS: "CTX_CS",
  SUPPLY_CHAIN: "CTX_SUPPLY_CHAIN",
  SERVICE_OPS: "CTX_SERVICE_OPS",
  PROJECT_MANAGEMENT: "CTX_CS",
  FINANCE: "CTX_FINANCE",
  LEGAL: "CTX_CS",
  HR: "CTX_CS",
  default: "CTX_CS",
};

/**
 * Resolve domain for useCase + department.
 * - Only personal domain has a default.
 * - For work: no default domain. Domain must come from department selection (use department as domain if no map entry).
 * - Business falls back to its default if needed.
 */
function resolveDomain(useCase: string, department: string): string {
  const domainMap = USE_CASE_DOMAINS[useCase] || USE_CASE_DOMAINS.business;
  let domain = domainMap[department] || domainMap.default;
  if (!domain) {
    if (useCase === "personal") {
      domain = "PERSONAL";
    } else if (useCase === "work") {
      // No default domain for work per spec. Only personal has default.
      // Domain is strictly from chosen department selection (or direct map).
      const busMap = USE_CASE_DOMAINS.business;
      domain = busMap[department] || department?.toUpperCase?.().replace(/[\s/-]+/g, "_") || "";
    } else {
      domain = domainMap.default || "CUSTOMER_SUCCESS";
    }
  }
  // Final safety: only default to PERSONAL when useCase personal and still empty; work must retain chosen.
  if (!domain) {
    domain =
      useCase === "personal"
        ? "PERSONAL"
        : department?.toUpperCase?.().replace(/[\s/-]+/g, "_") || "";
  }
  return domain;
}

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "profile", label: "Profile" },
  { id: "goals", label: "Goals" },
  { id: "connectors", label: "Connect" },
];

const STEP_TIMINGS = ["~15s", "~30s", "~25s", "~45s"] as const;

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, updateUser } = useAuth();
  const storageKey = user?.id ? `iw_onboarding_draft_${user.id}` : null;
  const finishingRef = useRef(false);
  const spineInitRef = useRef(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({ connectors: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { currentStep?: number; data?: OnboardingData };
      if (typeof parsed?.currentStep === "number") setCurrentStep(parsed.currentStep);
      if (parsed?.data && typeof parsed.data === "object") setData(parsed.data);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || finishingRef.current) return;
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 1,
          currentStep,
          data,
          updatedAt: Date.now(),
        })
      );
    } catch {
      /* ignore */
    }
  }, [currentStep, data, storageKey]);

  const handleSpineInit = useCallback(
    async (initData: { industry: string; department: string }) => {
      spineInitRef.current = true;

      const useCase = data.useCase || "business";
      const department = initData.department;
      const domain = resolveDomain(useCase, department);
      const activeCtx = DEPARTMENT_CTX_MAP[department] || DEPARTMENT_CTX_MAP.default;

      console.log("[Onboarding] Initializing Spine schema:", {
        industry: initData.industry,
        department,
        domain,
        activeCtx,
      });

      try {
        // Use the canonical D1-direct initialize-spine (wired in gateway to hydrateSpineSchema + creamy trigger)
        await initializeSpine({
          domain: domain as any,
          industry: initData.industry,
          department,
          connectors: [], // early schema only; real connectors come in step 3
        });
        console.log("[Onboarding] Spine schema initialized successfully via initializeSpine");
      } catch (err) {
        console.warn(
          "[Onboarding] Spine init deferred (non-fatal, will retry in connectors step):",
          err
        );
      }

      setData((prev) => ({ ...prev, spineInitialized: true }));
    },
    [data.useCase, user?.email]
  );

  const handleWelcomeComplete = useCallback(
    (welcomeData: { useCase: "personal" | "work" | "business" }) => {
      setData((prev) => ({ ...prev, useCase: welcomeData.useCase }));
      setCurrentStep(1);
    },
    []
  );

  const handleProfileComplete = useCallback(
    (profileData: { industry: string; department: string; companySize: string }) => {
      setData((prev) => ({
        ...prev,
        industry: profileData.industry,
        department: profileData.department,
        companySize: profileData.companySize,
      }));
      setCurrentStep(2);
    },
    []
  );

  const handleGoalsComplete = useCallback(
    (goalsData: { goal: string; workspaceName: string; workspaceType: string }) => {
      setData((prev) => ({
        ...prev,
        goal: goalsData.goal,
        workspaceName: goalsData.workspaceName,
        workspaceType: goalsData.workspaceType,
      }));
      setCurrentStep(3);
    },
    []
  );

  /**
   * handleConnectorsComplete — universal post-connector handler.
   *
   * All flows (A/B/C — data load, delta, synchronous) go through the same
   * UI path: AILoader (creamy layer) → WorkplaceLoading (normalizer).
   * No branching on flow type. Backend calls consolidated in handleWorkplaceReady.
   *
   * CF Zero Trust: API calls use the CF access token from authManager.
   */
  const handleConnectorsComplete = useCallback(
    async (connectorsData: {
      connectors: Array<{ provider: string; flowType: "A" | "B" | "C" }>;
    }) => {
      setIsLoading(true);
      setError(null);

      const useCase = data.useCase || "business";
      const department = data.department || "OPERATIONS";
      const domain = resolveDomain(useCase, department);

      let creamyJobId: string | undefined;

      // For REAL user flow only: call initializeSpine which triggers real creamy for the selected connectors.
      // Real path requires success to get jobId and proceed. Errors are surfaced (see CZ Verification panel).
      // Demo/skip (no connectors) tolerated with fallbacks.
      const isRealFlow = connectorsData.connectors.length > 0;
      try {
        const result = await initializeSpine({
          domain: domain as any,
          industry: data.industry,
          department,
          connectors: connectorsData.connectors,
        });
        creamyJobId = result.syncJobs?.[0]?.jobId;
      } catch (err) {
        console.error(
          "[Onboarding] initializeSpine failed for REAL user flow — check verification panel",
          err
        );
        if (isRealFlow) {
          // For real user flow, do not fake advance. Surface error.
          setError(
            "Failed to initialize spine/hydration for real connectors. See CZ Verification panel."
          );
          setIsLoading(false);
          return; // do not advance to loader
        }
        // only for pure skip/demo allow continue
      }

      // Store connector data + any running job ID for AILoader (real jobId only for real connectors)
      setData((prev) => ({
        ...prev,
        connectors: connectorsData.connectors,
        creamyJobId,
      }));

      setCurrentStep(4);
      setIsLoading(false);
    },
    [data.department, data.industry, data.useCase, user?.email]
  );

  // AILoader → WorkplaceLoading (normalizer)
  const handleLoaderComplete = useCallback(() => {
    setCurrentStep(5);
  }, []);

  /**
   * handleWorkplaceReady — normalizer complete, finalize onboarding.
   *
   * Fires all backend calls, persists metadata to CF + localStorage,
   * then calls onComplete() → AppShell sets stage to "workspace" directly.
   */
  const handleWorkplaceReady = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const useCase = data.useCase || "business";
    const department = data.department || "OPERATIONS";
    const domain = resolveDomain(useCase, department);

    // 1. Persist onboarding metadata LOCALLY first (authoritative for next render).
    //    updateUser writes localStorage instantly + best-effort CF Gateway sync.
    if (user) {
      try {
        await updateUser({
          onboarding_complete: true,
          domain,
          department,
          useCase: data.useCase as any,
          userName: data.workspaceName || user.name || user.email?.split("@")[0] || "User",
        });
      } catch (err) {
        console.error("[Onboarding] updateUser sync failed for real flow:", err);
      }
    }

    // 2. Best-effort backend finalization — none of these block entering the workspace.
    completeOnboarding({
      preferences: {
        useCase: data.useCase,
        industry: data.industry,
        department: data.department,
        companySize: data.companySize,
        goal: data.goal,
        workspaceName: data.workspaceName,
        workspaceType: data.workspaceType,
        connectors: data.connectors.map((c) => c.provider),
      },
    }).catch((err) => {
      console.error("[Onboarding] completeOnboarding failed for real user flow:", err);
    });

    const tenantId = user?.tenant_id;
    if (tenantId) {
      apiFetch(
        "/api/v1/subscriptions",
        { method: "POST", body: JSON.stringify({ tenantId, planId: "free" }) },
        "CreateFreeSubscription"
      ).catch((err) => {
        console.error("[Onboarding] Free subscription failed for real flow:", err);
      });
    }

    triggerConnectorHydration().catch((err) => {
      console.error("[Onboarding] Hydration trigger failed for real flow:", err);
    });

    // 3. Clear draft + hand off to AppShell (stage → workspace). Always runs.
    finishingRef.current = true;
    if (storageKey) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    }
    setIsLoading(false);
    onComplete();
  }, [data, onComplete, storageKey, updateUser, user]);

  const handleBack = useCallback(() => {
    // Only allow back navigation through the 4 visible steps (0-3)
    if (currentStep > 0 && currentStep <= 3) {
      setCurrentStep((prev) => prev - 1);
      if (currentStep === 2) {
        spineInitRef.current = false;
      }
    }
  }, [currentStep]);

  // Derive domain key from useCase + department for domain-specific messages
  // The loader maps use snake_case lower keys (e.g. customer_success). Pass lower for UI.
  // Keep the UPPER resolvedDomain for API calls (initializeSpine etc).
  const resolvedDomain = useMemo(() => {
    const useCase = data.useCase || "business";
    const department = data.department || "OPERATIONS";
    return resolveDomain(useCase, department);
  }, [data.useCase, data.department]);

  // Canonical UPPER for everything (D1, Spine, L1 differentiation). Lower normalization done at usage site.
  const activeDomain = resolvedDomain;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onComplete={handleWelcomeComplete} />;

      case 1:
        return (
          <ProfileStep
            onComplete={handleProfileComplete}
            onBack={handleBack}
            onSpineInit={handleSpineInit}
          />
        );

      case 2:
        return <GoalsStep onComplete={handleGoalsComplete} onBack={handleBack} />;

      case 3:
        return (
          <ConnectorsStep
            onComplete={handleConnectorsComplete}
            onBack={handleBack}
            role={data.department}
            industry={data.industry}
          />
        );

      case 4:
        return (
          <AILoader
            jobId={data.creamyJobId || ""}
            connector={data.connectors[0]?.provider || "CRM"}
            domain={activeDomain}
            onComplete={handleLoaderComplete}
          />
        );

      case 5:
        return (
          <WorkplaceLoading
            domain={activeDomain}
            onStart={async () => {}}
            onReady={handleWorkplaceReady}
            realFlow={!!data.connectors && data.connectors.length > 0} // enforce real user flow only when connectors provided
            tenantId={user?.tenant_id}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-iw-sans">
      <header className="px-8 py-6 w-full max-w-[1200px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo width={112} />
          {currentStep < 4 && (
            <span className="font-bold text-foreground text-base">Step {currentStep + 1} of 4</span>
          )}
        </div>
        <div className="text-muted-foreground font-medium text-sm">
          {currentStep < 4 ? STEP_TIMINGS[currentStep] : STEP_TIMINGS[STEP_TIMINGS.length - 1]}
        </div>
      </header>

      {currentStep < 4 && (
        <div className="w-full max-w-[1200px] mx-auto flex gap-3 px-8 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= currentStep ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      )}

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-8 pb-20">
        <div className="bg-card border border-border rounded-[24px] shadow-[0_16px_48px_-30px_rgba(12,12,12,0.08)] p-8 md:p-12 min-h-[500px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm absolute bottom-8 left-8 right-8"
            >
              {error}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

export default OnboardingFlow;
