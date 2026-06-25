import { createContext, useContext, useState, ReactNode } from "react";

interface WorldScopeContextType {
  worldScope: string;
  setWorldScope: (scope: string) => void;
  scopeFilters: Record<string, any>;
  scope: string;
  setScope: (s: string) => void;
  department: string;
  accountId: string | null;
  accountRole: string | null;
}

const WorldScopeContext = createContext<WorldScopeContextType>({
  worldScope: "global",
  setWorldScope: () => {},
  scopeFilters: {},
  scope: "global",
  setScope: () => {},
  department: "",
  accountId: null,
  accountRole: null,
});

export function WorldScopeProvider({ children }: { children: ReactNode }) {
  const [worldScope, setWorldScope] = useState("global");
  const [department, setDepartment] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountRole, setAccountRole] = useState<string | null>(null);

  const setScope = (s: string) => setWorldScope(s);

  return (
    <WorldScopeContext.Provider
      value={{
        worldScope,
        setWorldScope,
        scopeFilters: {},
        scope: worldScope,
        setScope,
        department,
        accountId,
        accountRole,
      }}
    >
      {children}
    </WorldScopeContext.Provider>
  );
}

export function useWorldScope() {
  return useContext(WorldScopeContext);
}

export default WorldScopeContext;
