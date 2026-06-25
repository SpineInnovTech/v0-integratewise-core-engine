"use client";

/**
 * Universal Context Provider
 *
 * Manages the current viewing context:
 * - Personal: User's own data
 * - CSM: Account-specific view
 * - Business: Portfolio-wide view
 * - Team: Team-scoped view
 *
 * The same components render different data based on this context.
 * Persists context state to Cookies for SSR compatibility.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { User, Users, Building2, UserCircle, ChevronDown, Check } from "lucide-react";
import useSWR from "swr";

// =============================================================================
// COOKIE HELPERS
// =============================================================================
function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

export type EntityCategory = "personal" | "csm" | "business" | "team";

export interface SpineContext {
  category: EntityCategory;
  accountId?: string; // Set when viewing specific account (CSM mode)
  accountName?: string; // Display name for current account
  teamId?: string; // Set when viewing specific team
  teamName?: string; // Display name for current team
  userId?: string; // Current user ID
  userRole?: "personal" | "csm" | "executive" | "admin";
  tenantId?: string; // Current tenant
}

interface SpineContextProviderValue extends SpineContext {
  // Context-switching functions
  setPersonalContext: () => void;
  setCsmContext: (accountId: string, accountName?: string) => void;
  setBusinessContext: () => void;
  setTeamContext: (teamId: string, teamName?: string) => void;

  // Helper to check current context
  isPersonal: boolean;
  isCsm: boolean;
  isBusiness: boolean;
  isTeam: boolean;

  // Get query params for API calls
  getQueryParams: () => Record<string, string>;
}

const SpineContextContext = createContext<SpineContextProviderValue | undefined>(undefined);

interface SpineContextProviderProps {
  children: ReactNode;
  initialContext?: Partial<SpineContext>;
}

export function SpineContextProvider({ children, initialContext }: SpineContextProviderProps) {
  // Initialize from Cookies if available (Client-side), falling back to initialContext (SSR props)
  // Note: During hydration, we should stick to initialContext or handle mismatch.
  // Ideally, middleware passes cookie values as initialContext.

  const [context, setContext] = useState<SpineContext>({
    category: initialContext?.category || "personal",
    accountId: initialContext?.accountId,
    accountName: initialContext?.accountName,
    teamId: initialContext?.teamId,
    teamName: initialContext?.teamName,
    userId: initialContext?.userId,
    userRole: initialContext?.userRole || "personal",
    tenantId: initialContext?.tenantId,
  });

  // Only run on client mount to sync with cookies if initialContext was empty
  useEffect(() => {
    const savedCategory = getCookie("spine-context-category") as EntityCategory;
    if (savedCategory && savedCategory !== context.category) {
      setContext((prev) => ({
        ...prev,
        category: savedCategory,
        accountId: getCookie("spine-context-account-id"),
        teamId: getCookie("spine-context-team-id"),
      }));
    }
  }, []);

  const updateContext = (newContext: Partial<SpineContext>) => {
    setContext((prev) => {
      const updated = { ...prev, ...newContext };
      // Persist to cookies
      setCookie("spine-context-category", updated.category);
      if (updated.accountId) setCookie("spine-context-account-id", updated.accountId);
      else setCookie("spine-context-account-id", "", -1); // Delete

      if (updated.teamId) setCookie("spine-context-team-id", updated.teamId);
      else setCookie("spine-context-team-id", "", -1);

      return updated;
    });
  };

  const setPersonalContext = useCallback(() => {
    updateContext({
      category: "personal",
      accountId: undefined,
      accountName: undefined,
    });
  }, []);

  const setCsmContext = useCallback((accountId: string, accountName?: string) => {
    updateContext({
      category: "csm",
      accountId,
      accountName,
    });
  }, []);

  const setBusinessContext = useCallback(() => {
    updateContext({
      category: "business",
      accountId: undefined,
      accountName: undefined,
    });
  }, []);

  const setTeamContext = useCallback((teamId: string, teamName?: string) => {
    updateContext({
      category: "team",
      teamId,
      teamName,
    });
  }, []);

  const getQueryParams = useCallback(() => {
    const params: Record<string, string> = {
      category: context.category,
    };
    if (context.accountId) params.account_id = context.accountId;
    if (context.teamId) params.team_id = context.teamId;
    if (context.tenantId) params.tenant_id = context.tenantId;
    return params;
  }, [context]);

  const value: SpineContextProviderValue = {
    ...context,
    setPersonalContext,
    setCsmContext,
    setBusinessContext,
    setTeamContext,
    isPersonal: context.category === "personal",
    isCsm: context.category === "csm",
    isBusiness: context.category === "business",
    isTeam: context.category === "team",
    getQueryParams,
  };

  return <SpineContextContext.Provider value={value}>{children}</SpineContextContext.Provider>;
}

export function useSpineContext() {
  const context = useContext(SpineContextContext);
  if (context === undefined) {
    throw new Error("useSpineContext must be used within a SpineContextProvider");
  }
  return context;
}

// =============================================================================
// CONTEXT SWITCHER COMPONENT
// =============================================================================

const CONTEXT_CONFIGS = {
  personal: {
    icon: User,
    label: "Personal",
    description: "Your personal workspace",
    color: "text-[var(--iw-forest-mid)] bg-[var(--iw-forest)]/10",
  },
  csm: {
    icon: UserCircle,
    label: "Customer",
    description: "Account-specific view",
    color: "text-green-600 bg-green-50",
  },
  business: {
    icon: Building2,
    label: "Business",
    description: "Portfolio-wide view",
    color: "text-iw-gold bg-[var(--iw-gold)]/10",
  },
  team: {
    icon: Users,
    label: "Team",
    description: "Team-scoped view",
    color: "text-orange-600 bg-orange-50",
  },
};

export function ContextSwitcher() {
  const context = useSpineContext();
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = CONTEXT_CONFIGS[context.category];
  const CurrentIcon = currentConfig.icon;

  // Get available contexts based on user role
  const availableContexts = React.useMemo(() => {
    const contexts: EntityCategory[] = ["personal"];

    if (
      context.userRole === "csm" ||
      context.userRole === "executive" ||
      context.userRole === "admin"
    ) {
      contexts.push("csm");
    }
    if (context.userRole === "executive" || context.userRole === "admin") {
      contexts.push("business");
    }
    contexts.push("team");

    return contexts;
  }, [context.userRole]);

  const handleContextChange = (newCategory: EntityCategory) => {
    switch (newCategory) {
      case "personal":
        context.setPersonalContext();
        break;
      case "csm":
        // In real app, would show account picker
        context.setCsmContext("", "Select Account...");
        break;
      case "business":
        context.setBusinessContext();
        break;
      case "team":
        // In real app, would use user's default team
        context.setTeamContext("", "My Team");
        break;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        title={`Switch Context (Current: ${currentConfig.label})`}
      >
        <div className={`p-1 rounded ${currentConfig.color}`}>
          <CurrentIcon className="w-4 h-4" />
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-medium text-gray-900">{currentConfig.label}</p>
          {context.accountName && <p className="text-xs text-gray-500">{context.accountName}</p>}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-1">
              {availableContexts.map((cat) => {
                const config = CONTEXT_CONFIGS[cat];
                const Icon = config.icon;
                const isActive = context.category === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => handleContextChange(cat)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-1.5 rounded ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{config.label}</p>
                      <p className="text-xs text-gray-500">{config.description}</p>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-green-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// CONTEXT-AWARE DATA HOOKS
// =============================================================================

interface UseEntitiesOptions {
  status?: string;
  limit?: number;
}

/**
 * Hook to fetch entities with current context applied
 */
export function useEntities<T>(entityType: string, options: UseEntitiesOptions = {}) {
  const context = useSpineContext();

  const queryParams = new URLSearchParams({
    ...context.getQueryParams(),
    ...(options.status && { status: options.status }),
    ...(options.limit && { limit: String(options.limit) }),
  });

  const { data, error, isLoading, mutate } = useSWR(
    `/api/entities/${entityType}?${queryParams.toString()}`,
    (url) => fetch(url).then((res) => res.json())
  );

  return {
    entities: (data?.data || []) as T[],
    error,
    isLoading,
    refresh: mutate,
    context: context.category,
  };
}

/**
 * Hook to fetch analytics with current context applied
 */
export function useAnalytics(metricType: string) {
  const context = useSpineContext();

  const queryParams = new URLSearchParams({
    ...context.getQueryParams(),
    metric: metricType,
  });

  // SWR Cache Key includes queryParams, so it refreshes on context change
  const { data, error, isLoading } = useSWR(`/api/analytics?${queryParams.toString()}`, (url) =>
    fetch(url).then((res) => res.json())
  );

  return {
    metrics: data?.data,
    error,
    isLoading,
    context: context.category,
  };
}

/**
 * Hook to fetch evidence/timeline with current context
 */
export function useEvidence(entityId?: string, entityType?: string, limit: number = 50) {
  const context = useSpineContext();

  const queryParams = new URLSearchParams({
    ...context.getQueryParams(),
    ...(entityId && { entity_id: entityId }),
    ...(entityType && { entity_type: entityType }),
    limit: String(limit),
  });

  const { data, error, isLoading } = useSWR(`/api/evidence?${queryParams.toString()}`, (url) =>
    fetch(url).then((res) => res.json())
  );

  return {
    events: data?.data || [],
    error,
    isLoading,
    context: context.category,
  };
}
