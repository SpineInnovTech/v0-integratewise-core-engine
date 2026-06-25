/**
 * Customer Success API Layer
 * Domain-specific API routes and React Query hooks for CS operations
 */
import type { CSSectionId, RoleLens, SuccessPageProjection } from "@integratewise/types";
import { apiFetch } from "./api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  name: string;
  industry: string;
  arr: number;
  healthScore: number;
  renewalDate: string;
  renewalConfidence: number;
  growth: string;
  assignedCSM: string;
  lastInteraction: string;
  status: "active" | "atRisk" | "churned";
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  isChampion: boolean;
  accountId: string;
  lastActivity: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "todo" | "inProgress" | "review" | "done";
  category: "engagement" | "risk" | "expansion" | "technical" | "renewal";
  owner: string;
  accountId?: string;
  accountName?: string;
  dueDate: string;
  dueDays?: number;
  effort?: string;
  impact?: string;
}

export interface Risk {
  id: string;
  name: string;
  description: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  category: "financial" | "operational" | "technical" | "strategic" | "compliance";
  status: "active" | "mitigating" | "resolved";
  mitigationPlan?: string;
  owner: string;
  accountId: string;
  detectedAt: string;
}

export interface Renewal {
  id: string;
  accountId: string;
  accountName: string;
  arr: number;
  renewalDate: string;
  daysUntilRenewal: number;
  healthScore: number;
  confidence: number;
  status: "onTrack" | "atRisk" | "critical" | "closedWon" | "closedLost";
  expansionPotential: number;
  lastInteraction: string;
  assignedCSM: string;
}

export interface HealthMetric {
  accountId: string;
  score: number;
  factors: {
    name: string;
    score: number;
    weight: number;
  }[];
  trend: "up" | "down" | "stable";
  calculatedAt: string;
}

export interface Insight {
  id: string;
  type: "expansion" | "risk" | "engagement" | "positive" | "renewal";
  title: string;
  description: string;
  confidence: number;
  sources: string[];
  accountId?: string;
  suggestedAction?: string;
  detectedAt: string;
}

// ─── API Routes ───────────────────────────────────────────────────────────────

export const csApi = {
  // Accounts
  accounts: {
    list: () => apiFetch<Account[]>("/api/v1/workspace/cs/accounts", {}, "CS.Accounts.List"),
    get: (id: string) =>
      apiFetch<Account>(`/api/v1/workspace/cs/accounts/${id}`, {}, `CS.Accounts.Get(${id})`),
    update: (id: string, data: Partial<Account>) =>
      apiFetch<Account>(
        `/api/v1/workspace/cs/accounts/${id}`,
        { method: "PATCH", body: data },
        `CS.Accounts.Update(${id})`
      ),
  },

  // Contacts
  contacts: {
    list: (accountId?: string) =>
      apiFetch<Contact[]>(
        `/api/v1/workspace/cs/contacts${accountId ? `?accountId=${accountId}` : ""}`,
        {},
        "CS.Contacts.List"
      ),
    get: (id: string) =>
      apiFetch<Contact>(`/api/v1/workspace/cs/contacts/${id}`, {}, `CS.Contacts.Get(${id})`),
    create: (data: Omit<Contact, "id">) =>
      apiFetch<Contact>(
        "/api/v1/workspace/cs/contacts",
        { method: "POST", body: data },
        "CS.Contacts.Create"
      ),
    update: (id: string, data: Partial<Contact>) =>
      apiFetch<Contact>(
        `/api/v1/workspace/cs/contacts/${id}`,
        { method: "PATCH", body: data },
        `CS.Contacts.Update(${id})`
      ),
    delete: (id: string) =>
      apiFetch<void>(
        `/api/v1/workspace/cs/contacts/${id}`,
        { method: "DELETE" },
        `CS.Contacts.Delete(${id})`
      ),
  },

  // Tasks
  tasks: {
    list: (filters?: { accountId?: string; status?: string; owner?: string }) => {
      const params = new URLSearchParams();
      if (filters?.accountId) params.append("accountId", filters.accountId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.owner) params.append("owner", filters.owner);
      return apiFetch<Task[]>(
        `/api/v1/workspace/cs/tasks?${params.toString()}`,
        {},
        "CS.Tasks.List"
      );
    },
    get: (id: string) =>
      apiFetch<Task>(`/api/v1/workspace/cs/tasks/${id}`, {}, `CS.Tasks.Get(${id})`),
    create: (data: Omit<Task, "id">) =>
      apiFetch<Task>(
        "/api/v1/workspace/cs/tasks",
        { method: "POST", body: data },
        "CS.Tasks.Create"
      ),
    update: (id: string, data: Partial<Task>) =>
      apiFetch<Task>(
        `/api/v1/workspace/cs/tasks/${id}`,
        { method: "PATCH", body: data },
        `CS.Tasks.Update(${id})`
      ),
    delete: (id: string) =>
      apiFetch<void>(
        `/api/v1/workspace/cs/tasks/${id}`,
        { method: "DELETE" },
        `CS.Tasks.Delete(${id})`
      ),
    move: (id: string, status: Task["status"]) =>
      apiFetch<Task>(
        `/api/v1/workspace/cs/tasks/${id}/move`,
        { method: "POST", body: { status } },
        `CS.Tasks.Move(${id})`
      ),
  },

  // Risks
  risks: {
    list: (filters?: { accountId?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.accountId) params.append("accountId", filters.accountId);
      if (filters?.status) params.append("status", filters.status);
      return apiFetch<Risk[]>(
        `/api/v1/workspace/cs/risks?${params.toString()}`,
        {},
        "CS.Risks.List"
      );
    },
    get: (id: string) =>
      apiFetch<Risk>(`/api/v1/workspace/cs/risks/${id}`, {}, `CS.Risks.Get(${id})`),
    create: (data: Omit<Risk, "id">) =>
      apiFetch<Risk>(
        "/api/v1/workspace/cs/risks",
        { method: "POST", body: data },
        "CS.Risks.Create"
      ),
    update: (id: string, data: Partial<Risk>) =>
      apiFetch<Risk>(
        `/api/v1/workspace/cs/risks/${id}`,
        { method: "PATCH", body: data },
        `CS.Risks.Update(${id})`
      ),
    mitigate: (id: string, plan: string) =>
      apiFetch<Risk>(
        `/api/v1/workspace/cs/risks/${id}/mitigate`,
        { method: "POST", body: { plan } },
        `CS.Risks.Mitigate(${id})`
      ),
  },

  // Renewals
  renewals: {
    list: (filters?: { status?: string; timeframe?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.timeframe) params.append("timeframe", filters.timeframe);
      return apiFetch<Renewal[]>(
        `/api/v1/workspace/cs/renewals?${params.toString()}`,
        {},
        "CS.Renewals.List"
      );
    },
    get: (id: string) =>
      apiFetch<Renewal>(`/api/v1/workspace/cs/renewals/${id}`, {}, `CS.Renewals.Get(${id})`),
    updateConfidence: (id: string, confidence: number) =>
      apiFetch<Renewal>(
        `/api/v1/workspace/cs/renewals/${id}/confidence`,
        { method: "POST", body: { confidence } },
        `CS.Renewals.Confidence(${id})`
      ),
  },

  // Health
  health: {
    get: (accountId: string) =>
      apiFetch<HealthMetric>(
        `/api/v1/workspace/cs/health/${accountId}`,
        {},
        `CS.Health.Get(${accountId})`
      ),
    recalculate: (accountId: string) =>
      apiFetch<HealthMetric>(
        `/api/v1/workspace/cs/health/${accountId}/recalculate`,
        { method: "POST" },
        `CS.Health.Recalculate(${accountId})`
      ),
  },

  // Insights
  insights: {
    list: (accountId?: string) =>
      apiFetch<Insight[]>(
        `/api/v1/workspace/cs/insights${accountId ? `?accountId=${accountId}` : ""}`,
        {},
        "CS.Insights.List"
      ),
    dismiss: (id: string) =>
      apiFetch<void>(
        `/api/v1/workspace/cs/insights/${id}/dismiss`,
        { method: "POST" },
        `CS.Insights.Dismiss(${id})`
      ),
    act: (id: string, action: string) =>
      apiFetch<void>(
        `/api/v1/workspace/cs/insights/${id}/act`,
        { method: "POST", body: { action } },
        `CS.Insights.Act(${id})`
      ),
  },

  // Dashboard
  dashboard: {
    executive: () =>
      apiFetch<{
        accounts: Account[];
        metrics: {
          totalARR: number;
          atRiskARR: number;
          expansionPotential: number;
          avgHealth: number;
        };
        upcomingRenewals: Renewal[];
        recentInsights: Insight[];
        tasksDue: Task[];
        proof?: Array<{
          source: string;
          spine_entities: number;
          recommendations: number;
          role: string;
        }>;
      }>("/api/v1/workspace/cs/dashboard/executive", {}, "CS.Dashboard.Executive"),
  },

  success: {
    page: (pageId: CSSectionId, options?: { lens?: RoleLens; accountId?: string }) => {
      const params = new URLSearchParams();
      if (options?.lens) params.append("lens", options.lens);
      if (options?.accountId) params.append("accountId", options.accountId);
      const query = params.toString();
      return apiFetch<SuccessPageProjection>(
        `/api/v1/workspace/success/page/${pageId}${query ? `?${query}` : ""}`,
        {},
        `CS.Success.Page(${pageId})`
      );
    },
    csPage: (pageId: CSSectionId, accountId?: string) =>
      apiFetch<SuccessPageProjection>(
        `/api/v1/workspace/cs/page/${pageId}${
          accountId ? `?accountId=${encodeURIComponent(accountId)}` : ""
        }`,
        {},
        `CS.Success.CSPage(${pageId})`
      ),
    tamPage: (pageId: CSSectionId, accountId?: string) =>
      apiFetch<SuccessPageProjection>(
        `/api/v1/workspace/tam/page/${pageId}${
          accountId ? `?accountId=${encodeURIComponent(accountId)}` : ""
        }`,
        {},
        `CS.Success.TAMPage(${pageId})`
      ),
  },
};

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const csQueryKeys = {
  accounts: ["cs", "accounts"] as const,
  account: (id: string) => ["cs", "accounts", id] as const,
  contacts: (accountId?: string) => ["cs", "contacts", accountId] as const,
  contact: (id: string) => ["cs", "contacts", id] as const,
  tasks: (filters?: { accountId?: string; status?: string; owner?: string }) =>
    ["cs", "tasks", filters] as const,
  task: (id: string) => ["cs", "tasks", id] as const,
  risks: (filters?: { accountId?: string; status?: string }) => ["cs", "risks", filters] as const,
  risk: (id: string) => ["cs", "risks", id] as const,
  renewals: (filters?: { status?: string; timeframe?: string }) =>
    ["cs", "renewals", filters] as const,
  renewal: (id: string) => ["cs", "renewals", id] as const,
  health: (accountId: string) => ["cs", "health", accountId] as const,
  insights: (accountId?: string) => ["cs", "insights", accountId] as const,
  dashboard: ["cs", "dashboard"] as const,
  successPage: (pageId: CSSectionId, lens?: RoleLens, accountId?: string) =>
    ["cs", "success-page", pageId, lens, accountId] as const,
};
