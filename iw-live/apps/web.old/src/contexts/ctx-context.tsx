import { createContext, useContext, useState, ReactNode } from "react";

export type ViewContext =
  | "CTX_CS"
  | "CTX_SALES"
  | "CTX_REVOPS"
  | "CTX_MARKETING"
  | "CTX_PRODUCT"
  | "CTX_PERSONAL"
  | string;

interface CtxContextType {
  currentCtx: ViewContext;
  domainLabel: string;
  activeCtx: ViewContext;
  switchCtx: (ctx: ViewContext) => void;
  availableModules: string[];
}

const CtxContext = createContext<CtxContextType>({
  currentCtx: "CTX_PERSONAL",
  domainLabel: "Personal",
  activeCtx: "CTX_PERSONAL",
  switchCtx: () => {},
  availableModules: [],
});

export function CtxProvider({ children }: { children: ReactNode }) {
  const [currentCtx, setCurrentCtx] = useState<ViewContext>("CTX_PERSONAL");
  const domainLabel = currentCtx.replace("CTX_", "").toLowerCase();
  const availableModules = ["brainstorm", "connectors", "knowledge", "goals", "workflows"];

  const switchCtx = (ctx: ViewContext) => setCurrentCtx(ctx);

  return (
    <CtxContext.Provider
      value={{
        currentCtx,
        domainLabel,
        activeCtx: currentCtx,
        switchCtx,
        availableModules,
      }}
    >
      {children}
    </CtxContext.Provider>
  );
}

export function useCTX() {
  return useContext(CtxContext);
}

export function useCtx() {
  return useContext(CtxContext);
}

export default CtxContext;
