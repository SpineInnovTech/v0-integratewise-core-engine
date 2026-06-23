import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import type { CTXEnum, Industry, SchemaGroup, SchemaState } from "./types";
import { DEFAULT_SCHEMA_AVAILABILITY, type SchemaMap } from "./schema-availability";
import { INDUSTRIES } from "./industry-registry";
import { deriveWorkspace, type DerivedWorkspace } from "./derive-workspace";
import { MOCK_USER } from "@/lib/mock-auth";

const STORAGE_KEY = "iw.spine.v1";

interface PersistedState {
  role: CTXEnum;
  industry: Industry;
  schema?: Partial<SchemaMap>;
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function persist(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

interface SpineContextValue {
  userName: string;
  role: CTXEnum;
  industry: Industry;
  schema: SchemaMap;
  connectedApps: string[];
  workspace: DerivedWorkspace;
  setRole: (role: CTXEnum) => void;
  setIndustry: (industry: Industry) => void;
  setSchemaState: (group: SchemaGroup, state: SchemaState) => void;
}

const SpineContext = createContext<SpineContextValue | null>(null);

export function SpineProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersisted();
  const [role, setRoleState] = useState<CTXEnum>(persisted?.role ?? "CTX_BIZOPS");
  const [industry, setIndustryState] = useState<Industry>(persisted?.industry ?? "SAAS");
  const [schema, setSchema] = useState<SchemaMap>(() => ({
    ...DEFAULT_SCHEMA_AVAILABILITY,
    ...(persisted?.schema ?? {}),
  }));

  const setRole = useCallback((next: CTXEnum) => {
    setRoleState(next);
    setIndustryState((ind) => {
      persist({ role: next, industry: ind, schema });
      return ind;
    });
  }, [schema]);

  const setIndustry = useCallback((next: Industry) => {
    setIndustryState(next);
    setRoleState((r) => {
      persist({ role: r, industry: next, schema });
      return r;
    });
  }, [schema]);

  const setSchemaState = useCallback((group: SchemaGroup, state: SchemaState) => {
    setSchema((prev) => {
      const next = { ...prev, [group]: state };
      persist({ role, industry, schema: next });
      return next;
    });
  }, [role, industry]);

  const workspace = useMemo(
    () => deriveWorkspace({ role, industry, schema }),
    [role, industry, schema],
  );

  const value = useMemo<SpineContextValue>(() => ({
    userName: MOCK_USER.user_metadata.full_name || "Demo User",
    role,
    industry,
    schema,
    connectedApps: workspace.profile.connectors,
    workspace,
    setRole,
    setIndustry,
    setSchemaState,
  }), [role, industry, schema, workspace, setRole, setIndustry, setSchemaState]);

  return <SpineContext.Provider value={value}>{children}</SpineContext.Provider>;
}

export function useSpine(): SpineContextValue {
  const ctx = useContext(SpineContext);
  if (!ctx) throw new Error("useSpine must be used within a SpineProvider");
  return ctx;
}

export { INDUSTRIES };
