/**
 * use-action-realtime.ts — Supabase Realtime subscription on `actions` table
 *
 * Subscribes to Postgres Changes (INSERT/UPDATE) on the `actions` table.
 * On status changes (executed, execution_failed, approved, rejected):
 *   1. Fires a Sonner toast with the action status
 *   2. Invalidates the React Query `execution-status` cache for live L1 updates
 *
 * This hook should be mounted ONCE in the workspace stage (AppShell/WorkspaceApp).
 *
 * Architecture: Supabase Realtime → frontend push (no polling needed for status changes).
 * The useExecutionStatus hook still polls as a fallback for missed events.
 *
 * Note: In gateway-proxy mode, realtime subscriptions are handled via SSE, not Supabase channels.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { spineClient } from "@/utils/spine/client";

// Generic channel type compatible with both Supabase and gateway-proxy modes
type RealtimeChannel = any;

type ActionRow = {
  id: string;
  title?: string;
  status?: string;
  action_type?: string;
  type?: string;
  parameters?: Record<string, any>;
  payload?: Record<string, any>;
};

export function useActionRealtime() {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = (spineClient.channel("actions-status") as any)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "actions",
        },
        (payload: any) => {
          const row = payload.new as ActionRow;
          const oldRow = payload.old as Partial<ActionRow>;

          // Only react to status transitions
          if (!row.status || row.status === oldRow.status) return;

          const title = row.title || row.action_type || row.type || "Action";
          const params = row.parameters || row.payload || {};
          const entityName = params.entity_name || params.entity_id?.slice(0, 8) || "";

          switch (row.status) {
            case "executed":
              toast.success(`${title} completed`, {
                description: entityName
                  ? `Action on ${entityName} executed successfully.`
                  : "Action executed successfully.",
                duration: 6000,
              });
              break;

            case "execution_failed":
              toast.error(`${title} failed`, {
                description: params.error_message
                  ? `Error: ${params.error_message}`
                  : entityName
                    ? `Action on ${entityName} failed. Check execution log.`
                    : "Execution failed. Check the execution log for details.",
                duration: 10000,
              });
              break;

            case "approved":
              toast.info(`${title} approved`, {
                description: entityName
                  ? `Action on ${entityName} approved — queued for execution.`
                  : "Action approved and queued for execution.",
                duration: 5000,
              });
              break;

            case "rejected":
              toast.warning(`${title} rejected`, {
                description: "Action was rejected and will not execute.",
                duration: 5000,
              });
              break;
          }

          // Invalidate execution status cache so L1 cards refresh immediately
          queryClient.invalidateQueries({ queryKey: ["execution-status"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "actions",
        },
        (payload: any) => {
          const row = payload.new as ActionRow;
          if (row.status === "proposed" || row.status === "pending_approval") {
            const title = row.title || row.action_type || row.type || "New action";
            toast.info(`New action proposed: ${title}`, {
              description: "Review in the Pending Actions queue.",
              duration: 5000,
            });
          }
          // Invalidate execution status + HITL queue caches
          queryClient.invalidateQueries({ queryKey: ["execution-status"] });
          queryClient.invalidateQueries({ queryKey: ["l2-recommendations"] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        spineClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);
}
