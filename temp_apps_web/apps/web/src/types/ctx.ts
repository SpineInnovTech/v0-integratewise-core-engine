export type ViewContext =
  | "CTX_CS"
  | "CTX_SALES"
  | "CTX_REVOPS"
  | "CTX_MARKETING"
  | "CTX_PRODUCT"
  | "CTX_PERSONAL";

export type CTXEnum = ViewContext;

export interface CtxState {
  currentCtx: ViewContext;
  domainLabel: string;
  viewId: string;
}

export const CTX_MAP: Record<ViewContext, string> = {
  CTX_CS: "Customer Success",
  CTX_SALES: "Sales",
  CTX_REVOPS: "Revenue Operations",
  CTX_MARKETING: "Marketing",
  CTX_PRODUCT: "Product",
  CTX_PERSONAL: "Personal",
};

export const CTX_CONFIG: Record<ViewContext, { label: string; icon: string; color: string }> = {
  CTX_CS: { label: "Customer Success", icon: "users", color: "blue" },
  CTX_SALES: { label: "Sales", icon: "dollar-sign", color: "green" },
  CTX_REVOPS: { label: "Revenue Operations", icon: "trending-up", color: "purple" },
  CTX_MARKETING: { label: "Marketing", icon: "megaphone", color: "orange" },
  CTX_PRODUCT: { label: "Product", icon: "package", color: "pink" },
  CTX_PERSONAL: { label: "Personal", icon: "user", color: "gray" },
};

export interface L2Component {
  id: string;
  name: string;
  description: string;
  ctx: ViewContext;
  enabled: boolean;
}

export interface L1Module {
  id: string;
  label: string;
  icon: string;
  path: string;
  enabled: boolean;
}

export const MODULE_ROUTES: Record<string, string> = {
  inbox: "/workspace/inbox",
  today: "/workspace/today",
  accounts: "/workspace/accounts",
  contacts: "/workspace/contacts",
  deals: "/workspace/deals",
  tasks: "/workspace/tasks",
  connectors: "/workspace/connectors",
  knowledge: "/workspace/knowledge",
  brainstorm: "/workspace/brainstorm",
  goals: "/workspace/goals",
  accelerators: "/workspace/accelerators",
  reports: "/workspace/reports",
  workflows: "/workspace/workflows",
  admin: "/workspace/admin",
  integrations: "/workspace/integrations",
};
