/**
 * Customer Success Data Hooks
 * React Query hooks for CS domain data fetching and mutations
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CSSectionId, RoleLens, SuccessPageProjection } from "@integratewise/types";
import {
  csApi,
  csQueryKeys,
  type Account,
  type Contact,
  type Task,
  type Risk,
  type Renewal,
  type HealthMetric,
  type Insight,
} from "../lib/api-cs";

// ─── Account Hooks ─────────────────────────────────────────────────────────────

export function useAccounts() {
  return useQuery({
    queryKey: csQueryKeys.accounts,
    queryFn: () => csApi.accounts.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: csQueryKeys.account(id),
    queryFn: () => csApi.accounts.get(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Account> }) =>
      csApi.accounts.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.account(id) });
      queryClient.invalidateQueries({ queryKey: csQueryKeys.accounts });
    },
  });
}

// ─── Contact Hooks ─────────────────────────────────────────────────────────────

export function useContacts(accountId?: string) {
  return useQuery({
    queryKey: csQueryKeys.contacts(accountId),
    queryFn: () => csApi.contacts.list(accountId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: csQueryKeys.contact(id),
    queryFn: () => csApi.contacts.get(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Contact, "id">) => csApi.contacts.create(data),
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.contacts(newContact.accountId) });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) =>
      csApi.contacts.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.contact(id) });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => csApi.contacts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.contacts() });
    },
  });
}

// ─── Task Hooks ────────────────────────────────────────────────────────────────

export function useTasks(filters?: { accountId?: string; status?: string; owner?: string }) {
  return useQuery({
    queryKey: csQueryKeys.tasks(filters),
    queryFn: () => csApi.tasks.list(filters),
    staleTime: 1 * 60 * 1000, // 1 minute (tasks change frequently)
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: csQueryKeys.task(id),
    queryFn: () => csApi.tasks.get(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Task, "id">) => csApi.tasks.create(data),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.tasks() });
      queryClient.invalidateQueries({
        queryKey: csQueryKeys.tasks({ accountId: newTask.accountId }),
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => csApi.tasks.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.task(id) });
      queryClient.invalidateQueries({ queryKey: csQueryKeys.tasks() });
    },
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task["status"] }) =>
      csApi.tasks.move(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.task(id) });
      queryClient.invalidateQueries({ queryKey: csQueryKeys.tasks() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => csApi.tasks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.tasks() });
    },
  });
}

// ─── Risk Hooks ────────────────────────────────────────────────────────────────

export function useRisks(filters?: { accountId?: string; status?: string }) {
  return useQuery({
    queryKey: csQueryKeys.risks(filters),
    queryFn: () => csApi.risks.list(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRisk(id: string) {
  return useQuery({
    queryKey: csQueryKeys.risk(id),
    queryFn: () => csApi.risks.get(id),
    enabled: !!id,
  });
}

export function useCreateRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Risk, "id">) => csApi.risks.create(data),
    onSuccess: (newRisk) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.risks() });
      queryClient.invalidateQueries({
        queryKey: csQueryKeys.risks({ accountId: newRisk.accountId }),
      });
    },
  });
}

export function useUpdateRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Risk> }) => csApi.risks.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.risk(id) });
      queryClient.invalidateQueries({ queryKey: csQueryKeys.risks() });
    },
  });
}

export function useMitigateRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) => csApi.risks.mitigate(id, plan),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.risk(id) });
      queryClient.invalidateQueries({ queryKey: csQueryKeys.risks() });
    },
  });
}

// ─── Renewal Hooks ─────────────────────────────────────────────────────────────

export function useRenewals(filters?: { status?: string; timeframe?: string }) {
  return useQuery({
    queryKey: csQueryKeys.renewals(filters),
    queryFn: () => csApi.renewals.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRenewal(id: string) {
  return useQuery({
    queryKey: csQueryKeys.renewal(id),
    queryFn: () => csApi.renewals.get(id),
    enabled: !!id,
  });
}

export function useUpdateRenewalConfidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, confidence }: { id: string; confidence: number }) =>
      csApi.renewals.updateConfidence(id, confidence),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.renewal(id) });
      queryClient.invalidateQueries({ queryKey: csQueryKeys.renewals() });
    },
  });
}

// ─── Health Hooks ──────────────────────────────────────────────────────────────

export function useHealth(accountId: string) {
  return useQuery({
    queryKey: csQueryKeys.health(accountId),
    queryFn: () => csApi.health.get(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecalculateHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => csApi.health.recalculate(accountId),
    onSuccess: (_, accountId) => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.health(accountId) });
    },
  });
}

// ─── Insight Hooks ─────────────────────────────────────────────────────────────

export function useInsights(accountId?: string) {
  return useQuery({
    queryKey: csQueryKeys.insights(accountId),
    queryFn: () => csApi.insights.list(accountId),
    staleTime: 1 * 60 * 1000,
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => csApi.insights.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.insights() });
    },
  });
}

export function useActOnInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => csApi.insights.act(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: csQueryKeys.insights() });
    },
  });
}

// ─── Dashboard Hooks ─────────────────────────────────────────────────────────

export function useExecutiveDashboard() {
  return useQuery({
    queryKey: csQueryKeys.dashboard,
    queryFn: () => csApi.dashboard.executive(),
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Success Projection Hooks ───────────────────────────────────────────────

export function useSuccessPage(
  pageId: CSSectionId,
  options?: { lens?: RoleLens; accountId?: string }
) {
  return useQuery({
    queryKey: csQueryKeys.successPage(pageId, options?.lens, options?.accountId),
    queryFn: () => csApi.success.page(pageId, options),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSuccessCSPage(pageId: CSSectionId, accountId?: string) {
  return useQuery({
    queryKey: csQueryKeys.successPage(pageId, "account_success", accountId),
    queryFn: () => csApi.success.csPage(pageId, accountId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSuccessTAMPage(pageId: CSSectionId, accountId?: string) {
  return useQuery({
    queryKey: csQueryKeys.successPage(pageId, "tam", accountId),
    queryFn: () => csApi.success.tamPage(pageId, accountId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSuccessPageSection<T>(
  pageId: CSSectionId,
  sectionKey: string,
  options?: { lens?: RoleLens; accountId?: string }
) {
  const query = useSuccessPage(pageId, options);

  return {
    ...query,
    section:
      (query.data?.sections?.[sectionKey] as SuccessPageProjection["sections"][string] & {
        data: T;
      }) || null,
  };
}
