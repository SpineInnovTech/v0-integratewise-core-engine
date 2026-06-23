/**
 * Custom TanStack Query hooks wrapping GatewayHttpClient
 *
 * useGatewayQuery — wraps useQuery + gatewayClient.get()
 * useGatewayMutation — wraps useMutation + gatewayClient.post/patch/delete()
 *
 * These hooks provide typed, cache-managed data fetching through the CF Gateway
 * without any direct Supabase dependency.
 *
 * Requirements: R5 (All Workspace API Calls Route Through CF Gateway),
 *               R7 (Returning User Fast Hydration)
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { gatewayClient, type GatewayRequestError } from "@/lib/gateway-client";

// ─── useGatewayQuery ─────────────────────────────────────────────────────────

export interface UseGatewayQueryOptions<TData> extends Omit<
  UseQueryOptions<TData, GatewayRequestError, TData, QueryKey>,
  "queryKey" | "queryFn"
> {
  /** Additional query options to override defaults */
  enabled?: boolean;
}

/**
 * Custom hook wrapping useQuery + GatewayHttpClient.get().
 *
 * @param key - TanStack Query cache key (use queryKeys factory for consistency)
 * @param path - CF Gateway API path (e.g. "/api/v1/pipeline/entities")
 * @param params - Optional query string parameters
 * @param options - Additional useQuery options (enabled, staleTime, etc.)
 *
 * @example
 * ```ts
 * const { data, isLoading } = useGatewayQuery(
 *   queryKeys.entities.byType("account"),
 *   "/api/v1/pipeline/entities",
 *   { type: "account" }
 * );
 * ```
 */
export function useGatewayQuery<TData = unknown>(
  key: QueryKey,
  path: string,
  params?: Record<string, string>,
  options?: UseGatewayQueryOptions<TData>
) {
  return useQuery<TData, GatewayRequestError, TData, QueryKey>({
    queryKey: key,
    queryFn: () => gatewayClient.get<TData>(path, params),
    ...options,
  });
}

// ─── useGatewayMutation ──────────────────────────────────────────────────────

type HttpMethod = "POST" | "PATCH" | "DELETE";

export interface UseGatewayMutationOptions<TData, TVariables> extends Omit<
  UseMutationOptions<TData, GatewayRequestError, TVariables>,
  "mutationFn"
> {
  /** Query keys to invalidate on successful mutation */
  invalidateKeys?: QueryKey[];
}

/**
 * Custom hook wrapping useMutation + GatewayHttpClient.post/patch/delete().
 *
 * @param path - CF Gateway API path (e.g. "/api/v1/workspace/initialize")
 * @param method - HTTP method: "POST" (default), "PATCH", or "DELETE"
 * @param options - Additional useMutation options (onSuccess, invalidateKeys, etc.)
 *
 * @example
 * ```ts
 * const mutation = useGatewayMutation<WorkspaceResponse, InitPayload>(
 *   "/api/v1/workspace/initialize",
 *   "POST",
 *   { invalidateKeys: [queryKeys.dashboard.all] }
 * );
 * mutation.mutate({ domain: "cs", user_metadata: {...} });
 * ```
 */
export function useGatewayMutation<TData = unknown, TVariables = unknown>(
  path: string,
  method: HttpMethod = "POST",
  options?: UseGatewayMutationOptions<TData, TVariables>
) {
  const queryClientInstance = useQueryClient();
  const { invalidateKeys, ...mutationOptions } = options ?? {};

  return useMutation<TData, GatewayRequestError, TVariables>({
    mutationFn: (variables: TVariables) => {
      switch (method) {
        case "POST":
          return gatewayClient.post<TData>(path, variables);
        case "PATCH":
          return gatewayClient.patch<TData>(path, variables);
        case "DELETE":
          return gatewayClient.delete<TData>(path);
      }
    },
    ...mutationOptions,
    onSuccess: (...args) => {
      // Invalidate specified query keys on success
      if (invalidateKeys?.length) {
        for (const key of invalidateKeys) {
          queryClientInstance.invalidateQueries({ queryKey: key });
        }
      }
      // Forward to user-provided onSuccess
      options?.onSuccess?.(...args);
    },
  });
}
