import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchSpineStatus, type SpineStatus } from "./spine-client";

/**
 * Live Spine connection status, probed through the relay. Shared across the app
 * via a stable query key so the topbar pill and the Twin tools view dedupe.
 */
export function useSpineStatus(): UseQueryResult<SpineStatus> {
  return useQuery<SpineStatus>({
    queryKey: ["spine", "status"],
    queryFn: ({ signal }) => fetchSpineStatus(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}
